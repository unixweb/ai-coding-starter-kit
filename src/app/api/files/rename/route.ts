import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { list, copy, del, head } from "@vercel/blob";
import {
  getUserBlobPrefix,
  sanitizeFilename,
  getUniqueBlobName,
  getExtension,
  blobNameFromPathname,
} from "@/lib/files";
import { z } from "zod";

const renameSchema = z.object({
  oldName: z.string().min(1),
  newName: z.string().min(1).max(200),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungueltiger Request Body" },
      { status: 400 },
    );
  }

  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Eingaben" }, { status: 400 });
  }

  const { oldName, newName } = parsed.data;
  const prefix = getUserBlobPrefix(user.id);

  const safeOldName = sanitizeFilename(oldName);
  const oldBlobPathname = `${prefix}${safeOldName}`;

  // Get the old blob metadata
  let oldBlob: Awaited<ReturnType<typeof head>>;
  try {
    oldBlob = await head(oldBlobPathname);
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }

  // Keep the original extension
  const oldExt = getExtension(safeOldName);
  const newBaseName = newName.replace(/\.[^.]+$/, ""); // strip any extension from new name
  const safeNewName = sanitizeFilename(newBaseName + oldExt);

  // Fetch all existing names for deduplication
  const existingNames = new Set<string>();
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor });
    for (const blob of result.blobs) {
      existingNames.add(blobNameFromPathname(blob.pathname, prefix));
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  // Remove old name from set so renaming to the same sanitized name works
  existingNames.delete(safeOldName);

  const uniqueNewName = getUniqueBlobName(existingNames, safeNewName);
  const newBlobPathname = `${prefix}${uniqueNewName}`;

  try {
    await copy(oldBlob.url, newBlobPathname, {
      access: "public",
      contentType: oldBlob.contentType,
    });
    await del(oldBlob.url);
    return NextResponse.json({ name: uniqueNewName });
  } catch {
    return NextResponse.json(
      { error: "Umbenennen fehlgeschlagen" },
      { status: 500 },
    );
  }
}
