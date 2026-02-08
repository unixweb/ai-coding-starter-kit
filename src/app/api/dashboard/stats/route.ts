import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getFileTypeLabel, formatFileSize } from "@/lib/files";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Fetch files from Vercel Blob
  const prefix = `user/${user.id}/`;
  const allFiles: {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  }[] = [];

  try {
    let cursor: string | undefined;
    do {
      const result = await list({ prefix, cursor });
      for (const blob of result.blobs) {
        const name = blob.pathname.replace(prefix, "");
        allFiles.push({
          name,
          size: blob.size,
          type: getFileTypeLabel(name),
          uploadedAt: blob.uploadedAt.toISOString(),
        });
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  } catch {
    // If blob listing fails, continue with empty files
  }

  // Sort by date descending
  allFiles.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );

  // Calculate uploads today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const uploadsToday = allFiles.filter(
    (f) => new Date(f.uploadedAt) >= todayStart,
  ).length;

  // Calculate uploads this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const uploadsThisWeek = allFiles.filter(
    (f) => new Date(f.uploadedAt) >= weekStart,
  ).length;

  // Last activity
  const lastActivity = allFiles.length > 0 ? allFiles[0].uploadedAt : null;

  // Recent files (top 5)
  const recentFiles = allFiles.slice(0, 5).map((f) => ({
    name: f.name,
    size: formatFileSize(f.size),
    uploadedAt: f.uploadedAt,
  }));

  // Fetch portal links with submission counts
  const { data: links } = await supabase
    .from("portal_links")
    .select("*, portal_submissions(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const portalLinks = links || [];
  const activePortals = portalLinks.filter(
    (l) =>
      l.is_active &&
      !l.is_locked &&
      (!l.expires_at || new Date(l.expires_at) >= new Date()),
  ).length;

  const inactivePortals = portalLinks.length - activePortals;

  // Total submissions across all portals
  const totalSubmissions = portalLinks.reduce(
    (sum, l) => sum + (l.portal_submissions?.[0]?.count ?? 0),
    0,
  );

  // Active portal links for display (top 3 active)
  const activePortalLinks = portalLinks
    .filter(
      (l) =>
        l.is_active &&
        !l.is_locked &&
        (!l.expires_at || new Date(l.expires_at) >= new Date()),
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
    totalUploads: allFiles.length,
    totalSubmissions,
    lastActivity,
    recentFiles,
    activePortalLinks,
  });
}
