import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  EXTENSION_MIME_MAP,
  MAX_FILE_SIZE,
  getUserUploadDir,
  sanitizeFilename,
  getUniqueFilename,
} from "@/lib/files";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Keine Dateien ausgewaehlt" },
      { status: 400 },
    );
  }

  const userDir = await getUserUploadDir(user.id);
  const uploaded: { name: string; size: number }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      errors.push("Ungueltiges Dateiformat in der Anfrage");
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Datei zu gross (max. 10 MB)`);
      continue;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push(`${file.name}: Dateityp nicht unterstuetzt`);
      continue;
    }

    // Cross-check: file extension must match the declared MIME type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(`${file.name}: Dateiendung nicht erlaubt`);
      continue;
    }
    const allowedMimesForExt = EXTENSION_MIME_MAP[ext];
    if (!allowedMimesForExt || !allowedMimesForExt.includes(file.type)) {
      errors.push(
        `${file.name}: Dateityp stimmt nicht mit Dateiendung ueberein`,
      );
      continue;
    }

    const safeName = sanitizeFilename(file.name);
    const uniqueName = await getUniqueFilename(userDir, safeName);
    const filePath = path.join(userDir, uniqueName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      uploaded.push({ name: uniqueName, size: file.size });
    } catch {
      errors.push(`${file.name}: Upload fehlgeschlagen`);
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  return NextResponse.json({ uploaded, errors }, { status: 201 });
}
