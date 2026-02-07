import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  getUserUploadDir,
  isPathInside,
  sanitizeFilename,
  getUniqueFilename,
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
    return NextResponse.json(
      { error: "Ungueltige Eingaben" },
      { status: 400 },
    );
  }

  const { oldName, newName } = parsed.data;
  const userDir = await getUserUploadDir(user.id);

  const safeOldName = sanitizeFilename(oldName);
  const oldPath = path.join(userDir, safeOldName);

  if (!isPathInside(oldPath, userDir)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  // Keep the original extension
  const oldExt = path.extname(safeOldName);
  const newBaseName = newName.replace(/\.[^.]+$/, ""); // strip any extension from new name
  const safeNewName = sanitizeFilename(newBaseName + oldExt);
  const uniqueNewName = await getUniqueFilename(userDir, safeNewName);
  const newPath = path.join(userDir, uniqueNewName);

  if (!isPathInside(newPath, userDir)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  try {
    await fs.access(oldPath);
    await fs.rename(oldPath, newPath);
    return NextResponse.json({ name: uniqueNewName });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
