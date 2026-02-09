import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { head } from "@vercel/blob";
import { sanitizeFilename } from "@/lib/files";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const submissionId = request.nextUrl.searchParams.get("submissionId");
  const filename = request.nextUrl.searchParams.get("filename");

  if (!submissionId || !filename) {
    return NextResponse.json(
      { error: "submissionId und filename Parameter erforderlich" },
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

  // Verify the submission belongs to a link owned by the user or their owner
  const { data: submission, error: subError } = await supabase
    .from("portal_submissions")
    .select("id, link_id")
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
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 403 },
    );
  }

  const safeName = sanitizeFilename(filename);
  const blobPath = `portal/${submission.link_id}/${submission.id}/${safeName}`;

  try {
    const blobMeta = await head(blobPath);

    const blobResponse = await fetch(blobMeta.url);
    if (!blobResponse.ok || !blobResponse.body) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 },
      );
    }

    const contentType = blobMeta.contentType || "application/octet-stream";

    return new NextResponse(blobResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`,
        "Content-Length": blobMeta.size.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
