import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

// Password validation rules (same as PROJ-1 registration)
const passwordRules = [
  { test: (pw: string) => pw.length >= 8 },
  { test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { test: (pw: string) => /\d/.test(pw) },
];

function validatePassword(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

const AcceptSchema = z.object({
  token: z.string().min(1, "Token ist erforderlich"),
  firstName: z.string().min(1, "Vorname ist erforderlich").max(100, "Vorname darf maximal 100 Zeichen lang sein"),
  lastName: z.string().min(1, "Nachname ist erforderlich").max(100, "Nachname darf maximal 100 Zeichen lang sein"),
  password: z.string().refine(validatePassword, "Passwort erfuellt nicht alle Anforderungen"),
});

// This endpoint is PUBLIC - no authentication required
// It creates a new user account for the invited email

export async function POST(request: Request) {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { token, firstName, lastName, password } = parsed.data;

  // Get admin client (required for creating users)
  const adminClient = createAdminClient();

  if (!adminClient) {
    console.error("Admin client not available - SUPABASE_SERVICE_ROLE_KEY not set");
    return NextResponse.json(
      { error: "Server-Konfigurationsfehler" },
      { status: 500 }
    );
  }

  // First, verify the invitation using the security-definer function
  const { data: verifyData, error: verifyError } = await adminClient.rpc(
    "verify_team_invitation",
    { lookup_token: token }
  );

  if (verifyError) {
    console.error("Failed to verify invitation:", verifyError);
    return NextResponse.json(
      { error: "Einladung konnte nicht geprueft werden" },
      { status: 500 }
    );
  }

  if (!verifyData || verifyData.length === 0) {
    return NextResponse.json(
      { error: "Diese Einladung ist ungueltig" },
      { status: 404 }
    );
  }

  const invitation = verifyData[0];

  // Check if invitation has already been used
  if (invitation.status === "accepted") {
    return NextResponse.json(
      { error: "Diese Einladung wurde bereits verwendet" },
      { status: 410 }
    );
  }

  // Check if invitation is expired
  if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Diese Einladung ist abgelaufen. Bitte fordern Sie eine neue Einladung an." },
      { status: 410 }
    );
  }

  // Get owner_id from the invitation
  const { data: invitationData, error: invitationError } = await adminClient
    .from("team_invitations")
    .select("id, owner_id, email")
    .eq("token", token)
    .single();

  if (invitationError || !invitationData) {
    console.error("Failed to get invitation data:", invitationError);
    return NextResponse.json(
      { error: "Einladung konnte nicht geladen werden" },
      { status: 500 }
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();

  // Create user via Supabase Admin Auth
  // email_confirm: true sets email_confirmed_at automatically
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invitation.email,
    password: password,
    email_confirm: true, // Auto-confirm email since they were invited
    user_metadata: {
      name: fullName,
    },
  });

  if (authError) {
    console.error("Failed to create user:", authError);

    if (authError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Benutzer konnte nicht erstellt werden" },
      { status: 500 }
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "Benutzer konnte nicht erstellt werden" },
      { status: 500 }
    );
  }

  const newUserId = authData.user.id;

  // Update profile with correct is_owner flag and name
  // The trigger creates the profile, but we need to update it
  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      name: fullName,
      is_owner: false,
    })
    .eq("id", newUserId);

  if (profileUpdateError) {
    console.error("Failed to update profile:", profileUpdateError);
    // Don't fail the request - profile was created by trigger
  }

  // Create team_members entry
  const { error: teamMemberError } = await adminClient
    .from("team_members")
    .insert({
      owner_id: invitationData.owner_id,
      member_id: newUserId,
    });

  if (teamMemberError) {
    console.error("Failed to create team member:", teamMemberError);
    // This is critical - delete the user and fail
    await adminClient.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { error: "Team-Mitgliedschaft konnte nicht erstellt werden" },
      { status: 500 }
    );
  }

  // Mark invitation as accepted
  const { error: acceptError } = await adminClient
    .from("team_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitationData.id);

  if (acceptError) {
    console.error("Failed to mark invitation as accepted:", acceptError);
    // Don't fail - user was created successfully
  }

  return NextResponse.json({
    success: true,
    redirectUrl: "/dashboard",
  });
}
