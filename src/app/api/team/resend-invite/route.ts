import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendTeamInviteEmail } from "@/lib/email";

const ResendSchema = z.object({
  invitationId: z.string().uuid("Ungueltige Einladungs-ID"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth check: logged in and email verified
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Check if user is owner
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_owner, name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  if (!profile.is_owner) {
    return NextResponse.json(
      { error: "Nur Inhaber koennen Einladungen erneut senden" },
      { status: 403 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const parsed = ResendSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { invitationId } = parsed.data;

  // Get the existing invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("team_invitations")
    .select("id, email, first_name, last_name, status")
    .eq("id", invitationId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !invitation) {
    return NextResponse.json(
      { error: "Einladung nicht gefunden" },
      { status: 404 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Diese Einladung kann nicht erneut gesendet werden" },
      { status: 400 }
    );
  }

  // Generate new token
  const newToken = randomBytes(32).toString("base64url");

  // Calculate new expiration date (7 days from now)
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  // Update invitation with new token and expiration
  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({
      token: newToken,
      expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", invitationId);

  if (updateError) {
    console.error("Failed to update invitation:", updateError);
    return NextResponse.json(
      { error: "Einladung konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }

  // Build invite URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const baseUrl =
    appUrl ||
    (vercelUrl ? `https://${vercelUrl}` : null) ||
    request.headers.get("origin") ||
    `https://${request.headers.get("host") || "localhost:3000"}`;
  const inviteUrl = `${baseUrl}/invite/${newToken}`;

  // Send invitation email
  try {
    await sendTeamInviteEmail({
      to: invitation.email,
      inviteUrl,
      ownerName: profile.name || user.email || "Ein Benutzer",
      firstName: invitation.first_name || undefined,
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
        error: "E-Mail konnte nicht versendet werden. Bitte versuchen Sie es spaeter erneut.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    expiresAt: newExpiresAt.toISOString(),
  });
}
