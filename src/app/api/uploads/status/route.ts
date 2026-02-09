import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";

// Status update request body validation
const UpdateStatusSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1, "Mindestens eine Datei-ID erforderlich"),
  status: z.enum(["new", "in_progress", "done", "archived"]),
});

export async function PATCH(request: Request) {
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

  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fileIds, status } = parsed.data;

  // Check if user is a team member to determine the owner
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerId = membership?.owner_id || user.id;

  // Get file status records
  const { data: fileStatuses, error: statusError } = await supabase
    .from("portal_file_status")
    .select("id, link_id")
    .in("id", fileIds);

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  if (!fileStatuses || fileStatuses.length === 0) {
    return NextResponse.json({ error: "Keine Dateien gefunden" }, { status: 404 });
  }

  // Get portal links to verify ownership
  const linkIds = [...new Set(fileStatuses.map((f) => f.link_id))];
  const { data: links } = await supabase
    .from("portal_links")
    .select("id, user_id")
    .in("id", linkIds);

  const linkOwnerMap = new Map((links || []).map((l) => [l.id, l.user_id]));

  // Verify all files belong to the user or their owner (for team members)
  const unauthorizedFiles = fileStatuses.filter((f) => {
    const linkOwnerId = linkOwnerMap.get(f.link_id);
    return linkOwnerId !== ownerId;
  });

  if (unauthorizedFiles.length > 0) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Update status for all files
  const admin = createAdminClient();
  const client = admin || supabase;

  const { data: updatedFiles, error: updateError } = await client
    .from("portal_file_status")
    .update({ status })
    .in("id", fileIds)
    .select("id, status, updated_at");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    updatedCount: updatedFiles?.length || 0,
    files: updatedFiles,
  });
}
