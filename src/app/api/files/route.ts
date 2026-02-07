import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { list, del, head } from "@vercel/blob";
import {
  getUserBlobPrefix,
  getFileTypeLabel,
  sanitizeFilename,
  blobNameFromPathname,
} from "@/lib/files";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const prefix = getUserBlobPrefix(user.id);

  const files: {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  }[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor });
    for (const blob of result.blobs) {
      const name = blobNameFromPathname(blob.pathname, prefix);
      files.push({
        name,
        size: blob.size,
        type: getFileTypeLabel(name),
        uploadedAt: blob.uploadedAt.toISOString(),
      });
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  // Sort by upload date, newest first
  files.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );

  return NextResponse.json({ files });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const name = request.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Dateiname fehlt" }, { status: 400 });
  }

  const prefix = getUserBlobPrefix(user.id);
  const safeName = sanitizeFilename(name);
  const blobPathname = `${prefix}${safeName}`;

  try {
    await head(blobPathname);
    await del(blobPathname);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
