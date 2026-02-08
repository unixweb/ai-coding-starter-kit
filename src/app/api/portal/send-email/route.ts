import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sendBrevoEmail,
  buildPortalEmailHtml,
  buildPortalEmailText,
  buildPortalEmailSubject,
} from "@/lib/email";
import { generatePassword, hashPassword } from "@/lib/portal-auth";

const SendEmailSchema = z.object({
  linkId: z.string().uuid(),
  recipientEmail: z.string().email("Ungueltige E-Mail-Adresse"),
});

export async function POST(request: Request) {
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

  const parsed = SendEmailSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  // Load link and verify ownership
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id, token, label, is_active, expires_at")
    .eq("id", parsed.data.linkId)
    .eq("user_id", user.id)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  if (!link.is_active) {
    return NextResponse.json(
      {
        error: "Dieser Link ist deaktiviert. Bitte aktivieren Sie ihn zuerst.",
      },
      { status: 400 },
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Dieser Link ist abgelaufen." },
      { status: 400 },
    );
  }

  // Generate a new password for this link
  const plainPassword = generatePassword();
  const { hash, salt } = await hashPassword(plainPassword);

  // Update password in DB (reset failed attempts and lock)
  const db = createAdminClient() || supabase;
  const { error: updateError } = await db
    .from("portal_links")
    .update({
      password_hash: hash,
      password_salt: salt,
      failed_attempts: 0,
      is_locked: false,
    })
    .eq("id", link.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Passwort konnte nicht aktualisiert werden" },
      { status: 500 },
    );
  }

  // Build upload URL from ENV to prevent Host header injection
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const baseUrl =
    appUrl ||
    (vercelUrl ? `https://${vercelUrl}` : null) ||
    request.headers.get("origin") ||
    `https://${request.headers.get("host") || "localhost:3000"}`;
  const uploadUrl = `${baseUrl}/p/${link.token}`;

  // Build email (includes password)
  const emailData = {
    uploadUrl,
    label: link.label || undefined,
    expiresAt: link.expires_at,
    password: plainPassword,
  };

  const subject = buildPortalEmailSubject(link.label || undefined);
  const htmlContent = buildPortalEmailHtml(emailData);
  const textContent = buildPortalEmailText(emailData);

  try {
    await sendBrevoEmail({
      to: parsed.data.recipientEmail,
      subject,
      htmlContent,
      textContent,
      replyTo: {
        email: user.email!,
        name: user.user_metadata?.name || undefined,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "E-Mail konnte nicht versendet werden";
    if (message === "E-Mail-Versand ist nicht konfiguriert") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json(
      {
        error:
          "E-Mail konnte nicht versendet werden. Bitte versuchen Sie es spaeter erneut.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
