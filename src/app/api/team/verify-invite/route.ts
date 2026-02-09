import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This endpoint is PUBLIC - no authentication required
// It uses a security-definer function to safely look up invitations by token

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token Parameter fehlt" },
      { status: 400 }
    );
  }

  // Use admin client to call security-definer function
  // This bypasses RLS to allow public token lookup
  const adminClient = createAdminClient();

  if (!adminClient) {
    // Fallback: create anonymous client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.rpc("verify_team_invitation", {
      lookup_token: token,
    });

    if (error) {
      console.error("Failed to verify invitation:", error);
      return NextResponse.json(
        { error: "Einladung konnte nicht geprueft werden" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Diese Einladung ist ungueltig" },
        { status: 404 }
      );
    }

    const invitation = data[0];

    // Check if invitation has already been used
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { valid: false, error: "Diese Einladung wurde bereits verwendet" },
        { status: 410 }
      );
    }

    // Check if invitation is expired
    if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Diese Einladung ist abgelaufen. Bitte fordern Sie eine neue Einladung an." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      firstName: invitation.first_name || "",
      lastName: invitation.last_name || "",
      ownerName: invitation.owner_name || "",
    });
  }

  // Use admin client
  const { data, error } = await adminClient.rpc("verify_team_invitation", {
    lookup_token: token,
  });

  if (error) {
    console.error("Failed to verify invitation:", error);
    return NextResponse.json(
      { error: "Einladung konnte nicht geprueft werden" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { valid: false, error: "Diese Einladung ist ungueltig" },
      { status: 404 }
    );
  }

  const invitation = data[0];

  // Check if invitation has already been used
  if (invitation.status === "accepted") {
    return NextResponse.json(
      { valid: false, error: "Diese Einladung wurde bereits verwendet" },
      { status: 410 }
    );
  }

  // Check if invitation is expired
  if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: "Diese Einladung ist abgelaufen. Bitte fordern Sie eine neue Einladung an." },
      { status: 410 }
    );
  }

  return NextResponse.json({
    valid: true,
    email: invitation.email,
    firstName: invitation.first_name || "",
    lastName: invitation.last_name || "",
    ownerName: invitation.owner_name || "",
  });
}
