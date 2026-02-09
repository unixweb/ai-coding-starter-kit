import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendTeamInviteEmail } from "@/lib/email";

const InviteSchema = z.object({
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  firstName: z.string().max(100).optional().default(""),
  lastName: z.string().max(100).optional().default(""),
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
      { error: "Nur Inhaber koennen Team-Mitglieder einladen" },
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

  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { email, firstName, lastName } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email is already registered
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (existingProfile) {
    return NextResponse.json(
      { error: "Diese E-Mail-Adresse ist bereits registriert" },
      { status: 409 }
    );
  }

  // Check if there's already a pending invitation for this email
  const { data: existingInvitation } = await supabase
    .from("team_invitations")
    .select("id, status")
    .eq("owner_id", user.id)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    return NextResponse.json(
      { error: "Eine Einladung an diese E-Mail-Adresse ist bereits ausstehend. Sie koennen sie erneut senden." },
      { status: 409 }
    );
  }

  // Generate cryptographically secure token (32 bytes, base64url encoded)
  const token = randomBytes(32).toString("base64url");

  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Insert invitation
  const { data: invitation, error: insertError } = await supabase
    .from("team_invitations")
    .insert({
      owner_id: user.id,
      email: normalizedEmail,
      token,
      first_name: firstName,
      last_name: lastName,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id, email, first_name, last_name, status, expires_at, created_at")
    .single();

  if (insertError) {
    console.error("Failed to create invitation:", insertError);
    return NextResponse.json(
      { error: "Einladung konnte nicht erstellt werden" },
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
  const inviteUrl = `${baseUrl}/invite/${token}`;

  // Send invitation email
  try {
    await sendTeamInviteEmail({
      to: normalizedEmail,
      inviteUrl,
      ownerName: profile.name || user.email || "Ein Benutzer",
      firstName: firstName || undefined,
    });
  } catch (err) {
    // Delete the invitation if email sending fails
    await supabase.from("team_invitations").delete().eq("id", invitation.id);

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
    invitation: {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    },
  });
}
