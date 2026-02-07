const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILENAME_LENGTH = 200;

/**
 * Maps allowed file extensions to their valid MIME types.
 * Used to cross-check that the file extension matches the declared MIME type.
 */
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(EXTENSION_MIME_MAP));

export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILENAME_LENGTH,
  EXTENSION_MIME_MAP,
  ALLOWED_EXTENSIONS,
};

/**
 * Returns the Vercel Blob prefix for a specific user's files.
 */
export function getUserBlobPrefix(userId: string): string {
  const safeId = sanitizePathSegment(userId);
  return `${safeId}/`;
}

/**
 * Sanitizes a string to be safe as a path segment (no traversal).
 */
export function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Sanitizes a filename: removes path separators, trims length, keeps extension.
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory components
  let safe = filename.split(/[/\\]/).pop() || filename;
  // Remove any null bytes
  safe = safe.replace(/\0/g, "");
  // Replace problematic characters but keep dots, spaces, hyphens, underscores, parens
  safe = safe.replace(/[^\w\s.\-()äöüÄÖÜß]/g, "_");
  // Trim to max length (keep extension)
  if (safe.length > MAX_FILENAME_LENGTH) {
    const dotIdx = safe.lastIndexOf(".");
    const ext = dotIdx >= 0 ? safe.slice(dotIdx) : "";
    const name = safe.slice(0, MAX_FILENAME_LENGTH - ext.length);
    safe = name + ext;
  }
  return safe || "unnamed";
}

/**
 * Given a set of existing filenames and a desired filename, returns a unique name
 * by appending (1), (2), etc. if needed.
 */
export function getUniqueBlobName(
  existingNames: Set<string>,
  filename: string,
): string {
  if (!existingNames.has(filename)) return filename;

  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx >= 0 ? filename.slice(dotIdx) : "";
  const base = dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;

  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }
  return candidate;
}

/**
 * Extract the filename from a blob pathname (strip the user prefix).
 */
export function blobNameFromPathname(pathname: string, prefix: string): string {
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
}

/**
 * Get the file extension from a filename (lowercase, with dot).
 */
export function getExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf(".");
  return dotIdx >= 0 ? filename.slice(dotIdx).toLowerCase() : "";
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension label for display.
 */
export function getFileTypeLabel(filename: string): string {
  const ext = getExtension(filename).replace(".", "");
  const labels: Record<string, string> = {
    pdf: "PDF",
    jpg: "JPG",
    jpeg: "JPG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    doc: "DOC",
    docx: "DOCX",
    xls: "XLS",
    xlsx: "XLSX",
  };
  return labels[ext] || ext.toUpperCase();
}
