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

  // Get file status records to verify ownership
  const { data: fileStatuses, error: statusError } = await supabase
    .from("portal_file_status")
    .select("id, link_id, portal_links!inner(user_id)")
    .in("id", fileIds);

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  if (!fileStatuses || fileStatuses.length === 0) {
    return NextResponse.json({ error: "Keine Dateien gefunden" }, { status: 404 });
  }

  // Verify all files belong to the user
  const unauthorizedFiles = fileStatuses.filter((f) => {
    const linkData = f.portal_links as unknown as { user_id: string };
    return linkData.user_id !== user.id;
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
