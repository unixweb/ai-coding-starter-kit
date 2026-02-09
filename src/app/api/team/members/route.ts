import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const DeleteSchema = z.object({
  memberId: z.string().uuid().optional(),
  invitationId: z.string().uuid().optional(),
}).refine(
  (data) => data.memberId || data.invitationId,
  { message: "Entweder memberId oder invitationId muss angegeben werden" }
);

export async function GET() {
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
    .select("is_owner")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  if (!profile.is_owner) {
    return NextResponse.json(
      { error: "Nur Inhaber koennen Team-Mitglieder verwalten" },
      { status: 403 }
    );
  }

  // Get all team members
  const { data: teamMembers, error: membersError } = await supabase
    .from("team_members")
    .select("id, member_id, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (membersError) {
    console.error("Failed to fetch team members:", membersError);
    return NextResponse.json(
      { error: "Team-Mitglieder konnten nicht geladen werden" },
      { status: 500 }
    );
  }

  // Fetch profiles for all team members
  const memberIds = (teamMembers || []).map((tm) => tm.member_id);
  let memberProfiles: Record<string, { name: string; email: string }> = {};

  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", memberIds);

    memberProfiles = (profiles || []).reduce(
      (acc, p) => {
        acc[p.id] = { name: p.name || "", email: p.email || "" };
        return acc;
      },
      {} as Record<string, { name: string; email: string }>
    );
  }

  // Get all pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from("team_invitations")
    .select("id, email, first_name, last_name, status, expires_at, created_at")
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invitationsError) {
    console.error("Failed to fetch invitations:", invitationsError);
    return NextResponse.json(
      { error: "Einladungen konnten nicht geladen werden" },
      { status: 500 }
    );
  }

  // Transform data for response
  const members = (teamMembers || []).map((tm) => {
    const profile = memberProfiles[tm.member_id];
    return {
      id: tm.id,
      memberId: tm.member_id,
      email: profile?.email || "",
      name: profile?.name || "",
      status: "active" as const,
      createdAt: tm.created_at,
    };
  });

  const pendingInvitations = (invitations || []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    firstName: inv.first_name,
    lastName: inv.last_name,
    name: [inv.first_name, inv.last_name].filter(Boolean).join(" ") || "",
    status: "pending" as const,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
  }));

  return NextResponse.json({
    members,
    invitations: pendingInvitations,
  });
}

export async function DELETE(request: Request) {
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
    .select("is_owner")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  if (!profile.is_owner) {
    return NextResponse.json(
      { error: "Nur Inhaber koennen Team-Mitglieder verwalten" },
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

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const firstError = issues[0]?.message || "Ungueltige Eingabe";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { memberId, invitationId } = parsed.data;

  if (memberId) {
    // Prevent owner from deleting themselves
    if (memberId === user.id) {
      return NextResponse.json(
        { error: "Sie koennen sich nicht selbst aus dem Team entfernen" },
        { status: 400 }
      );
    }

    // Delete team member
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("owner_id", user.id)
      .eq("member_id", memberId);

    if (deleteError) {
      console.error("Failed to delete team member:", deleteError);
      return NextResponse.json(
        { error: "Team-Mitglied konnte nicht entfernt werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: "member" });
  }

  if (invitationId) {
    // Delete pending invitation
    const { error: deleteError } = await supabase
      .from("team_invitations")
      .delete()
      .eq("owner_id", user.id)
      .eq("id", invitationId)
      .eq("status", "pending");

    if (deleteError) {
      console.error("Failed to delete invitation:", deleteError);
      return NextResponse.json(
        { error: "Einladung konnte nicht entfernt werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: "invitation" });
  }

  return NextResponse.json({ error: "Keine Aktion ausgefuehrt" }, { status: 400 });
}
