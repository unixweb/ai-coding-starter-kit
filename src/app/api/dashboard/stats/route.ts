import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { formatFileSize } from "@/lib/files";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Check if user is a team member to determine the owner
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerId = membership?.owner_id || user.id;

  // Fetch portal links with submission counts (for user or their owner)
  const { data: links } = await supabase
    .from("portal_links")
    .select("id, label, is_active, is_locked, expires_at, portal_submissions(count)")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });

  const portalLinks = links || [];
  const linkIds = portalLinks.map((l) => l.id);

  // Fetch recent files from portal_file_status
  let recentFiles: { name: string; size: string; uploadedAt: string }[] = [];
  let totalUploads = 0;
  let uploadsToday = 0;
  let uploadsThisWeek = 0;
  let lastActivity: string | null = null;

  if (linkIds.length > 0) {
    // Get file statuses with submission info
    const { data: fileStatuses } = await supabase
      .from("portal_file_status")
      .select("id, filename, file_size, created_at, submission_id")
      .in("link_id", linkIds)
      .order("created_at", { ascending: false });

    if (fileStatuses && fileStatuses.length > 0) {
      totalUploads = fileStatuses.length;
      lastActivity = fileStatuses[0].created_at;

      // Calculate time-based stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      for (const f of fileStatuses) {
        const createdAt = new Date(f.created_at);
        if (createdAt >= todayStart) uploadsToday++;
        if (createdAt >= weekStart) uploadsThisWeek++;
      }

      // Recent files (top 5)
      recentFiles = fileStatuses.slice(0, 5).map((f) => ({
        name: f.filename,
        size: formatFileSize(f.file_size),
        uploadedAt: f.created_at,
      }));
    }
  }

  const activePortals = portalLinks.filter(
    (l) =>
      l.is_active &&
      !l.is_locked &&
      (!l.expires_at || new Date(l.expires_at) >= new Date())
  ).length;

  const inactivePortals = portalLinks.length - activePortals;

  // Total submissions across all portals
  const totalSubmissions = portalLinks.reduce(
    (sum, l) => sum + (l.portal_submissions?.[0]?.count ?? 0),
    0
  );

  // Active portal links for display (top 3 active)
  const activePortalLinks = portalLinks
    .filter(
      (l) =>
        l.is_active &&
        !l.is_locked &&
        (!l.expires_at || new Date(l.expires_at) >= new Date())
    )
    .slice(0, 3)
    .map((l) => ({
      id: l.id,
      label: l.label || "Kein Name",
      submission_count: l.portal_submissions?.[0]?.count ?? 0,
      is_active: true,
    }));

  return NextResponse.json({
    userName: user.user_metadata?.name ?? user.email ?? "",
    uploadsToday,
    uploadsThisWeek,
    activePortals,
    inactivePortals,
    totalUploads,
    totalSubmissions,
    lastActivity,
    recentFiles,
    activePortalLinks,
  });
}
