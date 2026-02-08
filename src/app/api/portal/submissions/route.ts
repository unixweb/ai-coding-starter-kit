import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import {
  blobNameFromPathname,
  formatFileSize,
  getFileTypeLabel,
} from "@/lib/files";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.json(
      { error: "linkId Parameter fehlt" },
      { status: 400 },
    );
  }

  // Verify the link belongs to the authenticated user
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select(
      "id, token, label, description, is_active, expires_at, created_at, is_locked, failed_attempts, password_hash",
    )
    .eq("id", linkId)
    .eq("user_id", user.id)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Get all submissions for this link
  const { data: submissions, error: subError } = await supabase
    .from("portal_submissions")
    .select("*")
    .eq("link_id", linkId)
    .order("created_at", { ascending: false });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  // For each submission, list the files from Vercel Blob
  const submissionsWithFiles = await Promise.all(
    (submissions || []).map(async (sub) => {
      const prefix = `portal/${link.id}/${sub.id}/`;
      const files: { name: string; size: number; type: string }[] = [];

      try {
        let cursor: string | undefined;
        do {
          const result = await list({ prefix, cursor });
          for (const blob of result.blobs) {
            const name = blobNameFromPathname(blob.pathname, prefix);
            files.push({
              name,
              size: blob.size,
              type: getFileTypeLabel(name),
            });
          }
          cursor = result.hasMore ? result.cursor : undefined;
        } while (cursor);
      } catch {
        // If blob listing fails, return empty files
      }

      return {
        id: sub.id,
        name: sub.name,
        email: sub.email,
        note: sub.note,
        file_count: sub.file_count,
        created_at: sub.created_at,
        files: files.map((f) => ({
          ...f,
          sizeFormatted: formatFileSize(f.size),
        })),
      };
    }),
  );

  // Transform link to include has_password instead of password_hash
  const linkResponse = {
    id: link.id,
    token: link.token,
    label: link.label,
    description: link.description ?? "",
    is_active: link.is_active,
    expires_at: link.expires_at,
    created_at: link.created_at,
    is_locked: link.is_locked ?? false,
    failed_attempts: link.failed_attempts ?? 0,
    has_password: link.password_hash != null,
  };

  return NextResponse.json({
    link: linkResponse,
    submissions: submissionsWithFiles,
  });
}
