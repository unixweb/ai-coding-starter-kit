import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { z } from "zod";
import {
  blobNameFromPathname,
  formatFileSize,
  getFileTypeLabel,
} from "@/lib/files";

// Query params validation
const QuerySchema = z.object({
  tab: z.enum(["current", "archive"]).optional().default("current"),
  search: z.string().optional(),
  portalId: z.string().uuid().optional(),
  timeRange: z.enum(["today", "7days", "30days", "year", "all"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Delete request body validation
const DeleteSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1, "Mindestens eine Datei-ID erforderlich"),
});

interface FileWithStatus {
  id: string;
  filename: string;
  fileUrl: string;
  size: number;
  sizeFormatted: string;
  type: string;
  status: "new" | "in_progress" | "done" | "archived";
  createdAt: string;
  updatedAt: string;
  portalId: string;
  portalLabel: string;
  submissionId: string;
  submitterName: string;
  submitterEmail: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const queryData = {
    tab: searchParams.get("tab") || undefined,
    search: searchParams.get("search") || undefined,
    portalId: searchParams.get("portalId") || undefined,
    timeRange: searchParams.get("timeRange") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  };

  const parsed = QuerySchema.safeParse(queryData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Parameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tab, search, portalId, timeRange, page, limit } = parsed.data;

  // Check if user is a team member to determine the owner
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .single();

  const ownerId = membership?.owner_id || user.id;

  // Get all portal links for the user (or their owner if team member)
  const { data: links, error: linksError } = await supabase
    .from("portal_links")
    .select("id, label")
    .eq("user_id", ownerId);

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  if (!links || links.length === 0) {
    return NextResponse.json({
      files: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      portals: [],
    });
  }

  const linkIds = links.map((l) => l.id);
  const linkMap = new Map(links.map((l) => [l.id, l.label]));

  // Get all submissions for these links
  let submissionQuery = supabase
    .from("portal_submissions")
    .select("id, link_id, name, email, created_at")
    .in("link_id", linkIds);

  // Apply portal filter
  if (portalId) {
    submissionQuery = submissionQuery.eq("link_id", portalId);
  }

  // Apply time range filter
  const now = new Date();
  if (timeRange === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    submissionQuery = submissionQuery.gte("created_at", startOfDay);
  } else if (timeRange === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    submissionQuery = submissionQuery.gte("created_at", sevenDaysAgo);
  } else if (timeRange === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    submissionQuery = submissionQuery.gte("created_at", thirtyDaysAgo);
  } else if (timeRange === "year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    submissionQuery = submissionQuery.gte("created_at", startOfYear);
  }

  const { data: submissions, error: subError } = await submissionQuery.order("created_at", { ascending: false });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({
      files: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      portals: links.map((l) => ({ id: l.id, label: l.label })),
    });
  }

  // Get existing file statuses
  const { data: existingStatuses } = await supabase
    .from("portal_file_status")
    .select("*")
    .in("link_id", linkIds);

  const statusMap = new Map(
    (existingStatuses || []).map((s) => [s.file_url, s])
  );

  // Collect all files from blob storage
  const allFiles: FileWithStatus[] = [];
  const newFileStatuses: Array<{
    link_id: string;
    submission_id: string;
    file_url: string;
    filename: string;
    file_size: number;
    status: "new";
    created_at: string;
  }> = [];

  for (const sub of submissions) {
    const prefix = `portal/${sub.link_id}/${sub.id}/`;

    try {
      let cursor: string | undefined;
      do {
        const result = await list({ prefix, cursor });
        for (const blob of result.blobs) {
          const filename = blobNameFromPathname(blob.pathname, prefix);
          const fileUrl = blob.url;

          // Get existing status or create new one
          let statusRecord = statusMap.get(fileUrl);
          let status: "new" | "in_progress" | "done" | "archived" = "new";
          let statusId = "";
          let updatedAt = sub.created_at;

          if (statusRecord) {
            status = statusRecord.status;
            statusId = statusRecord.id;
            updatedAt = statusRecord.updated_at;
          } else {
            // Queue for insertion
            newFileStatuses.push({
              link_id: sub.link_id,
              submission_id: sub.id,
              file_url: fileUrl,
              filename,
              file_size: blob.size,
              status: "new",
              created_at: sub.created_at,
            });
          }

          // Apply search filter
          if (search && !filename.toLowerCase().includes(search.toLowerCase())) {
            continue;
          }

          // Apply tab filter (current = new/in_progress/done, archive = archived)
          if (tab === "current" && status === "archived") {
            continue;
          }
          if (tab === "archive" && status !== "archived") {
            continue;
          }

          allFiles.push({
            id: statusId || `pending-${fileUrl}`,
            filename,
            fileUrl,
            size: blob.size,
            sizeFormatted: formatFileSize(blob.size),
            type: getFileTypeLabel(filename),
            status,
            createdAt: sub.created_at,
            updatedAt,
            portalId: sub.link_id,
            portalLabel: linkMap.get(sub.link_id) || "[Geloescht]",
            submissionId: sub.id,
            submitterName: sub.name,
            submitterEmail: sub.email,
          });
        }
        cursor = result.hasMore ? result.cursor : undefined;
      } while (cursor);
    } catch {
      // If blob listing fails for a submission, continue with others
    }
  }

  // Insert new file statuses
  if (newFileStatuses.length > 0) {
    const client = createAdminClient() || supabase;
    // Upsert to handle race conditions
    try {
      await client
        .from("portal_file_status")
        .upsert(newFileStatuses, { onConflict: "file_url", ignoreDuplicates: true });
    } catch {
      // Silent fail - files will be created on next request
    }
  }

  // Sort by createdAt descending
  allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const total = allFiles.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedFiles = allFiles.slice(offset, offset + limit);

  // Re-query to get the actual IDs for pending files
  if (paginatedFiles.some((f) => f.id.startsWith("pending-"))) {
    const pendingUrls = paginatedFiles
      .filter((f) => f.id.startsWith("pending-"))
      .map((f) => f.fileUrl);

    if (pendingUrls.length > 0) {
      const { data: insertedStatuses } = await supabase
        .from("portal_file_status")
        .select("id, file_url")
        .in("file_url", pendingUrls);

      if (insertedStatuses) {
        for (const inserted of insertedStatuses) {
          const file = paginatedFiles.find((f) => f.fileUrl === inserted.file_url);
          if (file) {
            file.id = inserted.id;
          }
        }
      }
    }
  }

  return NextResponse.json({
    files: paginatedFiles,
    pagination: { page, limit, total, totalPages },
    portals: links.map((l) => ({ id: l.id, label: l.label })),
  });
}

export async function DELETE(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fileIds } = parsed.data;

  // Get file status records to verify ownership and get file URLs
  const { data: fileStatuses, error: statusError } = await supabase
    .from("portal_file_status")
    .select("id, file_url, link_id, submission_id")
    .in("id", fileIds);

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  if (!fileStatuses || fileStatuses.length === 0) {
    return NextResponse.json({ error: "Keine Dateien gefunden" }, { status: 404 });
  }

  // Get portal links to verify ownership
  const linkIds = [...new Set(fileStatuses.map((f) => f.link_id))];
  const { data: links } = await supabase
    .from("portal_links")
    .select("id, user_id")
    .in("id", linkIds);

  const linkOwnerMap = new Map((links || []).map((l) => [l.id, l.user_id]));

  // Verify all files belong to the user or their owner (for team members)
  const unauthorizedFiles = fileStatuses.filter((f) => {
    const linkOwnerId = linkOwnerMap.get(f.link_id);
    return linkOwnerId !== ownerId;
  });

  if (unauthorizedFiles.length > 0) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Delete files from blob storage
  const fileUrls = fileStatuses.map((f) => f.file_url);
  try {
    await del(fileUrls);
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Loeschen der Dateien" },
      { status: 500 }
    );
  }

  // Delete file status records
  const admin = createAdminClient();
  const client = admin || supabase;

  const { error: deleteError } = await client
    .from("portal_file_status")
    .delete()
    .in("id", fileIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Update file_count in portal_submissions
  const submissionCounts = new Map<string, number>();
  for (const f of fileStatuses) {
    const count = submissionCounts.get(f.submission_id) || 0;
    submissionCounts.set(f.submission_id, count + 1);
  }

  for (const [submissionId, deletedCount] of submissionCounts) {
    const { data: submission } = await client
      .from("portal_submissions")
      .select("file_count")
      .eq("id", submissionId)
      .single();

    if (submission) {
      const newCount = Math.max(0, (submission.file_count || 0) - deletedCount);
      await client
        .from("portal_submissions")
        .update({ file_count: newCount })
        .eq("id", submissionId);
    }
  }

  return NextResponse.json({
    success: true,
    deletedCount: fileStatuses.length,
  });
}
