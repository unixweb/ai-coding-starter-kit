import { createClient } from "@/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";
import { list, head } from "@vercel/blob";
import { blobNameFromPathname } from "@/lib/files";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const linkId = request.nextUrl.searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.json(
      { error: "linkId Parameter fehlt" },
      { status: 400 },
    );
  }

  // Verify ownership
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id, label, user_id")
    .eq("id", linkId)
    .eq("user_id", user.id)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Get all submissions to know submitter names
  const { data: submissions } = await supabase
    .from("portal_submissions")
    .select("id, name")
    .eq("link_id", linkId);

  const submitterMap = new Map<string, string>();
  for (const sub of submissions || []) {
    submitterMap.set(sub.id, sub.name);
  }

  // List all blobs for this portal
  const prefix = `portal/${link.id}/`;
  const blobs: { url: string; pathname: string; name: string }[] = [];

  try {
    let cursor: string | undefined;
    do {
      const result = await list({ prefix, cursor });
      for (const blob of result.blobs) {
        const relativePath = blobNameFromPathname(blob.pathname, prefix);
        // relativePath format: {submissionId}/{filename}
        const parts = relativePath.split("/");
        const subId = parts[0];
        const filename = parts.slice(1).join("/");
        const submitterName = submitterMap.get(subId) || "Unbekannt";
        blobs.push({
          url: blob.url,
          pathname: blob.pathname,
          name: `${submitterName}/${filename}`,
        });
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  } catch {
    return NextResponse.json(
      { error: "Dateien konnten nicht geladen werden" },
      { status: 500 },
    );
  }

  if (blobs.length === 0) {
    return NextResponse.json(
      { error: "Keine Dateien vorhanden" },
      { status: 404 },
    );
  }

  // Create ZIP archive
  const archive = archiver("zip", { zlib: { level: 5 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Add files to ZIP
  for (const blob of blobs) {
    try {
      const response = await fetch(blob.url);
      if (response.ok && response.body) {
        // Convert web ReadableStream to Node stream
        const reader = response.body.getReader();
        const nodeStream = new PassThrough();
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                nodeStream.end();
                break;
              }
              nodeStream.write(value);
            }
          } catch {
            nodeStream.end();
          }
        })();
        archive.append(nodeStream, { name: blob.name });
      }
    } catch {
      // Skip files that can't be fetched
    }
  }

  archive.finalize();

  // Convert Node stream to web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk) => controller.enqueue(chunk));
      passthrough.on("end", () => controller.close());
      passthrough.on("error", (err) => controller.error(err));
    },
  });

  const safeName = (link.label || "portal").replace(/[^a-zA-Z0-9_\-]/g, "_");

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-dateien.zip"`,
    },
  });
}
