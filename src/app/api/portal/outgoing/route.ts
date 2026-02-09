import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse, type NextRequest } from "next/server";
import { put, del, head } from "@vercel/blob";
import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  EXTENSION_MIME_MAP,
  MAX_FILE_SIZE,
  sanitizeFilename,
  getExtension,
} from "@/lib/files";
import {
  sendBrevoEmail,
  buildOutgoingEmailHtml,
  buildOutgoingEmailText,
  buildOutgoingEmailSubject,
} from "@/lib/email";

const MAX_FILES = 10;

const OutgoingSchema = z.object({
  linkId: z.string().uuid(),
  note: z.string().min(1, "Nachricht ist erforderlich").max(2000),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/portal/outgoing
 * Upload files to be provided to the client for download.
 * Sends email notification if client_email is configured.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const linkId = formData.get("linkId");
  const note = formData.get("note");
  const expiresAt = formData.get("expiresAt");

  // Validate required fields
  const parsed = OutgoingSchema.safeParse({
    linkId,
    note,
    expiresAt: expiresAt || null,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  // Check if user is a team member to determine the owner
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerId = membership?.owner_id || user.id;

  // Verify the link belongs to the user or their owner (for team members)
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id, token, label, client_email, is_active, expires_at")
    .eq("id", parsed.data.linkId)
    .eq("user_id", ownerId)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Get files from form data
  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Mindestens eine Datei ist erforderlich" },
      { status: 400 }
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximal ${MAX_FILES} Dateien erlaubt` },
      { status: 400 }
    );
  }

  // Upload files to Vercel Blob and create database records
  const db = createAdminClient() || supabase;
  const uploaded: { id: string; filename: string; file_size: number }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      errors.push("Ungueltiges Dateiformat in der Anfrage");
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Datei zu gross (max. 10 MB)`);
      continue;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push(`${file.name}: Dateityp nicht unterstuetzt`);
      continue;
    }

    // Cross-check: file extension must match the declared MIME type
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(`${file.name}: Dateiendung nicht erlaubt`);
      continue;
    }
    const allowedMimesForExt = EXTENSION_MIME_MAP[ext];
    if (!allowedMimesForExt || !allowedMimesForExt.includes(file.type)) {
      errors.push(
        `${file.name}: Dateityp stimmt nicht mit Dateiendung ueberein`
      );
      continue;
    }

    const safeName = sanitizeFilename(file.name);

    // Generate unique file ID for blob path
    const fileId = crypto.randomUUID();
    const blobPathname = `portal/${link.id}/outgoing/${fileId}/${safeName}`;

    try {
      const blob = await put(blobPathname, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      // Create database record
      const { data: outgoingFile, error: insertError } = await db
        .from("portal_outgoing_files")
        .insert({
          id: fileId,
          link_id: link.id,
          filename: safeName,
          blob_url: blob.url,
          file_size: file.size,
          note: parsed.data.note,
          expires_at: parsed.data.expiresAt || null,
        })
        .select()
        .single();

      if (insertError || !outgoingFile) {
        // Cleanup blob if DB insert fails
        try {
          await del(blob.url);
        } catch {
          // Ignore cleanup errors
        }
        errors.push(`${file.name}: Datenbankfehler`);
        continue;
      }

      uploaded.push({
        id: outgoingFile.id,
        filename: safeName,
        file_size: file.size,
      });
    } catch {
      errors.push(`${file.name}: Upload fehlgeschlagen`);
    }
  }

  // If no files were uploaded successfully, return error
  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: errors.join(", ") || "Upload fehlgeschlagen" },
      { status: 400 }
    );
  }

  // Send email notification if client_email is configured
  let emailSent = false;
  let emailError: string | null = null;

  if (link.client_email) {
    // Build portal URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const vercelUrl = process.env.VERCEL_URL;
    const baseUrl =
      appUrl ||
      (vercelUrl ? `https://${vercelUrl}` : null) ||
      request.headers.get("origin") ||
      `https://${request.headers.get("host") || "localhost:3000"}`;
    const portalUrl = `${baseUrl}/p/${link.token}`;

    const emailData = {
      portalUrl,
      note: parsed.data.note,
      files: uploaded.map((f) => ({
        filename: f.filename,
        file_size: f.file_size,
      })),
      expiresAt: parsed.data.expiresAt,
      label: link.label || undefined,
    };

    try {
      await sendBrevoEmail({
        to: link.client_email,
        subject: buildOutgoingEmailSubject(),
        htmlContent: buildOutgoingEmailHtml(emailData),
        textContent: buildOutgoingEmailText(emailData),
        replyTo: {
          email: user.email!,
          name: user.user_metadata?.name || undefined,
        },
      });
      emailSent = true;
    } catch (err) {
      emailError =
        err instanceof Error
          ? err.message
          : "E-Mail konnte nicht versendet werden";
    }
  }

  return NextResponse.json(
    {
      success: true,
      uploaded,
      errors: errors.length > 0 ? errors : undefined,
      emailSent,
      emailError,
      clientEmail: link.client_email || null,
    },
    { status: 201 }
  );
}

/**
 * GET /api/portal/outgoing?linkId=xxx
 * List outgoing files for a specific link (authenticated, link owner only).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const linkId = request.nextUrl.searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.json(
      { error: "linkId Parameter fehlt" },
      { status: 400 }
    );
  }

  // Check if user is a team member to determine the owner
  const { data: membershipGet } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerIdGet = membershipGet?.owner_id || user.id;

  // Verify the link belongs to the user or their owner (for team members)
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id")
    .eq("id", linkId)
    .eq("user_id", ownerIdGet)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Fetch outgoing files for this link
  const { data: files, error: filesError } = await supabase
    .from("portal_outgoing_files")
    .select("id, filename, file_size, note, expires_at, created_at")
    .eq("link_id", linkId)
    .order("created_at", { ascending: false });

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  // Add expired status to each file
  const now = new Date();
  const filesWithStatus = (files || []).map((file) => ({
    ...file,
    is_expired: file.expires_at ? new Date(file.expires_at) < now : false,
  }));

  return NextResponse.json({ files: filesWithStatus });
}

/**
 * DELETE /api/portal/outgoing?fileId=xxx
 * Delete an outgoing file (authenticated, link owner only).
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const fileId = request.nextUrl.searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId Parameter fehlt" },
      { status: 400 }
    );
  }

  // Check if user is a team member to determine the owner
  const { data: membershipDel } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerIdDel = membershipDel?.owner_id || user.id;

  // Fetch the file
  const { data: file, error: fileError } = await supabase
    .from("portal_outgoing_files")
    .select("id, blob_url, link_id")
    .eq("id", fileId)
    .single();

  if (fileError || !file) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  // Verify ownership through the link
  const { data: linkForDelete } = await supabase
    .from("portal_links")
    .select("id, user_id")
    .eq("id", file.link_id)
    .single();

  if (!linkForDelete || linkForDelete.user_id !== ownerIdDel) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Delete from Vercel Blob
  try {
    await del(file.blob_url);
  } catch {
    // Continue even if blob deletion fails
  }

  // Delete from database
  const db = createAdminClient() || supabase;
  const { error: deleteError } = await db
    .from("portal_outgoing_files")
    .delete()
    .eq("id", fileId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
