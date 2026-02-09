import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { sanitizeFilename } from "@/lib/files";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const { submissionId, filename } = body as {
    submissionId?: string;
    filename?: string;
  };

  if (!submissionId || !filename) {
    return NextResponse.json(
      { error: "submissionId und filename erforderlich" },
      { status: 400 },
    );
  }

  // Check if user is a team member to determine the owner
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerId = membership?.owner_id || user.id;

  // Verify ownership: submission -> link -> user
  const { data: submission, error: subError } = await supabase
    .from("portal_submissions")
    .select("id, link_id, file_count")
    .eq("id", submissionId)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Einreichung nicht gefunden" },
      { status: 404 },
    );
  }

  // Verify link ownership
  const { data: link } = await supabase
    .from("portal_links")
    .select("id, user_id")
    .eq("id", submission.link_id)
    .single();

  if (!link || link.user_id !== ownerId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Delete file from blob storage
  const safeName = sanitizeFilename(filename);
  const blobPath = `portal/${link.id}/${submission.id}/${safeName}`;

  try {
    // Find the blob URL by listing with prefix
    const result = await list({ prefix: blobPath });
    if (result.blobs.length > 0) {
      await del(result.blobs.map((b) => b.url));
    }
  } catch {
    return NextResponse.json(
      { error: "Datei konnte nicht geloescht werden" },
      { status: 500 },
    );
  }

  // Update file_count in portal_submissions
  const admin = createAdminClient();
  const client = admin || supabase;

  const newCount = Math.max(0, (submission.file_count || 0) - 1);
  await client
    .from("portal_submissions")
    .update({ file_count: newCount })
    .eq("id", submissionId);

  return NextResponse.json({ success: true });
}
