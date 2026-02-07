import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, reason: "Token fehlt" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Use security-definer function to look up token (SEC-1 fix)
  // This avoids needing a broad anonymous SELECT policy on portal_links
  const { data: link, error } = await supabase
    .rpc("verify_portal_token", { lookup_token: token })
    .single<{
      id: string;
      is_active: boolean;
      expires_at: string | null;
      label: string;
    }>();

  if (error || !link) {
    return NextResponse.json(
      { valid: false, reason: "Dieser Link ist ungueltig" },
      { status: 404 },
    );
  }

  if (!link.is_active) {
    return NextResponse.json(
      { valid: false, reason: "Dieser Link ist nicht mehr gueltig" },
      { status: 410 },
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, reason: "Dieser Link ist abgelaufen" },
      { status: 410 },
    );
  }

  return NextResponse.json({
    valid: true,
    label: link.label || undefined,
  });
}
