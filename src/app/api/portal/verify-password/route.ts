import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, createSessionToken } from "@/lib/portal-auth";

const VerifyPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const parsed = VerifyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const supabase = await createClient();

  // Look up token via security-definer function
  const { data: link, error } = await supabase
    .rpc("verify_portal_password", { lookup_token: parsed.data.token })
    .single<{
      id: string;
      password_hash: string | null;
      password_salt: string | null;
      failed_attempts: number;
      is_locked: boolean;
      is_active: boolean;
      expires_at: string | null;
    }>();

  if (error || !link) {
    return NextResponse.json(
      { error: "Dieser Link ist ungueltig" },
      { status: 404 },
    );
  }

  if (link.is_locked) {
    return NextResponse.json(
      { error: "Dieser Zugang wurde aus Sicherheitsgruenden gesperrt. Bitte kontaktieren Sie Ihren Ansprechpartner.", locked: true },
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

  if (!link.password_hash || !link.password_salt) {
    return NextResponse.json(
      { error: "Kein Passwort fuer diesen Link konfiguriert" },
      { status: 400 },
    );
  }

  // Verify the password
  const isValid = await verifyPassword(parsed.data.password, link.password_hash, link.password_salt);

  if (!isValid) {
    // Increment failed attempts atomically
    const { data: result } = await supabase
      .rpc("increment_failed_attempts", { link_uuid: link.id })
      .single<{ failed_attempts: number; is_locked: boolean }>();

    const newAttempts = result?.failed_attempts ?? (link.failed_attempts + 1);
    const nowLocked = result?.is_locked ?? newAttempts >= 5;
    const remaining = Math.max(0, 5 - newAttempts);

    if (nowLocked) {
      return NextResponse.json(
        { error: "Dieser Zugang wurde aus Sicherheitsgruenden gesperrt. Bitte kontaktieren Sie Ihren Ansprechpartner.", locked: true },
        { status: 423 },
      );
    }

    return NextResponse.json(
      { error: "Falsches Passwort", remainingAttempts: remaining },
      { status: 401 },
    );
  }

  // Password correct - create session token
  const sessionToken = createSessionToken(link.id);

  return NextResponse.json({ success: true, sessionToken });
}
