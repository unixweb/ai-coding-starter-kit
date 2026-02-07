import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserUploadDir, isPathInside, sanitizeFilename } from "@/lib/files";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(request: NextRequest) {
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
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
