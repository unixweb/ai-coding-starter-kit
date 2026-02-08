import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifySessionToken } from "@/lib/portal-auth";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  EXTENSION_MIME_MAP,
  MAX_FILE_SIZE,
  sanitizeFilename,
  getExtension,
} from "@/lib/files";

const MAX_FILES = 10;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const token = formData.get("token");
  const name = formData.get("name");
  const email = formData.get("email");
  const note = formData.get("note") || "";

  // Validate required fields
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token fehlt" }, { status: 400 });
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 },
    );
  }

  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Gueltige E-Mail-Adresse ist erforderlich" },
      { status: 400 },
    );
  }

  if (typeof note !== "string") {
    return NextResponse.json({ error: "Ungueltige Notiz" }, { status: 400 });
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Validate token using security-definer function (SEC-1 fix)
  const { data: link, error: linkError } = await supabase
    .rpc("verify_portal_token", { lookup_token: token })
    .single<{
      id: string;
      is_active: boolean;
      expires_at: string | null;
      label: string;
      is_locked: boolean;
      has_password: boolean;
    }>();

  if (linkError || !link) {
    return NextResponse.json(
      { error: "Dieser Link ist ungueltig" },
      { status: 404 },
    );
  }

  if (link.is_locked) {
    return NextResponse.json(
      { error: "Dieser Zugang wurde gesperrt" },
      { status: 423 },
    );
  }

  if (!link.is_active) {
    return NextResponse.json(
      { error: "Dieser Link ist nicht mehr gueltig" },
      { status: 410 },
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Dieser Link ist abgelaufen" },
      { status: 410 },
    );
  }

  // Session token check (only for links with password)
  if (link.has_password) {
    const sessionHeader = request.headers.get("X-Portal-Session");
    if (!sessionHeader) {
      return NextResponse.json(
        { error: "Bitte Passwort eingeben" },
        { status: 401 },
      );
    }
    const session = verifySessionToken(sessionHeader);
    if (!session || session.linkId !== link.id) {
      return NextResponse.json(
        { error: "Sitzung abgelaufen. Bitte Passwort erneut eingeben." },
        { status: 401 },
      );
    }
  }

  // Get files from form data
  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Mindestens eine Datei ist erforderlich" },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximal ${MAX_FILES} Dateien erlaubt` },
      { status: 400 },
    );
  }

  // Create submission record first to get the submission ID
  const db = supabaseAdmin || supabase;
  const { data: submission, error: submissionError } = await db
    .from("portal_submissions")
    .insert({
      link_id: link.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      note: typeof note === "string" ? note.trim() : "",
      file_count: 0,
    })
    .select()
    .single();

  if (submissionError || !submission) {
    return NextResponse.json(
      { error: "Einreichung konnte nicht erstellt werden" },
      { status: 500 },
    );
  }

  // Upload files to Vercel Blob
  const prefix = `portal/${link.id}/${submission.id}/`;
  const uploaded: { name: string; size: number }[] = [];
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
        `${file.name}: Dateityp stimmt nicht mit Dateiendung ueberein`,
      );
      continue;
    }

    const safeName = sanitizeFilename(file.name);
    const blobPathname = `${prefix}${safeName}`;

    try {
      await put(blobPathname, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });
      uploaded.push({ name: safeName, size: file.size });
    } catch {
      errors.push(`${file.name}: Upload fehlgeschlagen`);
    }
  }

  // Update file count on submission
  if (uploaded.length > 0) {
    await db
      .from("portal_submissions")
      .update({ file_count: uploaded.length })
      .eq("id", submission.id);
  }

  // If no files were uploaded successfully, clean up the submission
  if (uploaded.length === 0) {
    await db.from("portal_submissions").delete().eq("id", submission.id);

    return NextResponse.json(
      { error: errors.join(", ") || "Upload fehlgeschlagen" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { success: true, uploaded, errors },
    { status: 201 },
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
