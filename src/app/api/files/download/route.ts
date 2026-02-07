import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { head } from "@vercel/blob";
import { getUserBlobPrefix, sanitizeFilename } from "@/lib/files";

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
    return NextResponse.json({ error: "Dateiname fehlt" }, { status: 400 });
  }

  const prefix = getUserBlobPrefix(user.id);
  const safeName = sanitizeFilename(name);

  try {
    const blobMeta = await head(`${prefix}${safeName}`);

    const blobResponse = await fetch(blobMeta.url);
    if (!blobResponse.ok || !blobResponse.body) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 },
      );
    }

    const contentType = blobMeta.contentType || "application/octet-stream";

    return new NextResponse(blobResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`,
        "Content-Length": blobMeta.size.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }
}
