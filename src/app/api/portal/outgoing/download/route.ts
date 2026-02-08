import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { head } from "@vercel/blob";
import { verifySessionToken } from "@/lib/portal-auth";

/**
 * GET /api/portal/outgoing/download?fileId=xxx[&token=xxx]
 * Download an outgoing file.
 *
 * Two modes of access:
 * 1. Authenticated (Dashboard): fileId only, user must own the link
 * 2. Public (Portal): fileId + token, token must be valid
 *    For password-protected portals, also requires X-Portal-Session header.
 */
export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("fileId");
  const token = request.nextUrl.searchParams.get("token");

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId Parameter fehlt" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check if this is an authenticated request (Dashboard)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email_confirmed_at && !token) {
    // Authenticated mode: verify ownership through the link
    const { data: file, error: fileError } = await supabase
      .from("portal_outgoing_files")
      .select("id, filename, blob_url, link_id, expires_at, portal_links!inner(id, user_id)")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify ownership
    const linkData = file.portal_links as unknown as { id: string; user_id: string };
    if (linkData.user_id !== user.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Stream the blob
    return streamBlob(file.blob_url, file.filename);
  }

  // Public mode: requires token
  if (!token) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  // Verify portal token using security-definer function
  const { data: link, error: linkError } = await supabase
    .rpc("verify_portal_token", { lookup_token: token })
    .single<{
      id: string;
      is_active: boolean;
      expires_at: string | null;
      is_locked: boolean;
      has_password: boolean;
    }>();

  if (linkError || !link) {
    return NextResponse.json(
      { error: "Dieser Link ist ungueltig" },
      { status: 404 }
    );
  }

  if (link.is_locked) {
    return NextResponse.json(
      { error: "Dieser Zugang wurde gesperrt" },
      { status: 423 }
    );
  }

  if (!link.is_active) {
    return NextResponse.json(
      { error: "Dieser Link ist nicht mehr gueltig" },
      { status: 410 }
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Dieser Link ist abgelaufen" },
      { status: 410 }
    );
  }

  // Session token check (only for links with password)
  if (link.has_password) {
    const sessionHeader = request.headers.get("X-Portal-Session");
    if (!sessionHeader) {
      return NextResponse.json(
        { error: "Bitte Passwort eingeben" },
        { status: 401 }
      );
    }
    const session = verifySessionToken(sessionHeader);
    if (!session || session.linkId !== link.id) {
      return NextResponse.json(
        { error: "Sitzung abgelaufen. Bitte Passwort erneut eingeben." },
        { status: 401 }
      );
    }
  }

  // Fetch the outgoing file
  const { data: file, error: fileError } = await supabase
    .from("portal_outgoing_files")
    .select("id, filename, blob_url, link_id, expires_at")
    .eq("id", fileId)
    .eq("link_id", link.id)
    .single();

  if (fileError || !file) {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 }
    );
  }

  // Check if file is expired
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Diese Datei ist abgelaufen" },
      { status: 410 }
    );
  }

  // Stream the blob
  return streamBlob(file.blob_url, file.filename);
}

/**
 * Helper function to stream a blob file as a download response.
 */
async function streamBlob(
  blobUrl: string,
  filename: string
): Promise<NextResponse> {
  try {
    const blobMeta = await head(blobUrl);

    const blobResponse = await fetch(blobMeta.url);
    if (!blobResponse.ok || !blobResponse.body) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    const contentType = blobMeta.contentType || "application/octet-stream";

    return new NextResponse(blobResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": blobMeta.size.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 }
    );
  }
}
