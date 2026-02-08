import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/portal-auth";

/**
 * GET /api/portal/outgoing/list?token=xxx
 * List outgoing files for a portal (public, requires valid portal token).
 * For password-protected portals, also requires X-Portal-Session header.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "token Parameter fehlt" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

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

  // Fetch outgoing files using the security-definer function
  const { data: files, error: filesError } = await supabase.rpc(
    "get_outgoing_files_by_token",
    { lookup_token: token }
  );

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  return NextResponse.json({ files: files || [] });
}
