import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  getUserUploadDir,
  isPathInside,
  getFileTypeLabel,
  sanitizeFilename,
} from "@/lib/files";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userDir = await getUserUploadDir(user.id);

  let entries: string[];
  try {
    entries = await fs.readdir(userDir);
  } catch {
    return NextResponse.json({ files: [] });
  }

  const files = [];
  for (const entry of entries) {
    const filePath = path.join(userDir, entry);
    try {
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        files.push({
          name: entry,
          size: stat.size,
          type: getFileTypeLabel(entry),
          uploadedAt: stat.birthtime.toISOString(),
        });
      }
    } catch {
      // Skip files we can't stat
    }
  }

  // Sort by upload date, newest first
  files.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
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
    return NextResponse.json(
      { error: "Dateiname fehlt" },
      { status: 400 },
    );
  }

  const userDir = await getUserUploadDir(user.id);
  const safeName = sanitizeFilename(name);
  const filePath = path.join(userDir, safeName);

  if (!isPathInside(filePath, userDir)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
