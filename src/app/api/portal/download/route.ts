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

  // Verify the submission belongs to a link owned by the authenticated user
  const { data: submission, error: subError } = await supabase
    .from("portal_submissions")
    .select("id, link_id, portal_links!inner(id, user_id)")
    .eq("id", submissionId)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Einreichung nicht gefunden" },
      { status: 404 },
    );
  }

  // RLS already ensures user can only see their own submissions,
  // but double-check ownership
  const linkData = submission.portal_links as unknown as { id: string; user_id: string };
  if (linkData.user_id !== user.id) {
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
