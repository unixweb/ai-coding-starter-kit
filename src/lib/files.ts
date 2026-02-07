import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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

export { UPLOAD_DIR, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILENAME_LENGTH };

/**
 * Returns the upload directory for a specific user and ensures it exists.
 */
export async function getUserUploadDir(userId: string): Promise<string> {
  const safeId = sanitizePathSegment(userId);
  const userDir = path.join(UPLOAD_DIR, safeId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
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
  let safe = path.basename(filename);
  // Remove any null bytes
  safe = safe.replace(/\0/g, "");
  // Replace problematic characters but keep dots, spaces, hyphens, underscores, parens
  safe = safe.replace(/[^\w\s.\-()äöüÄÖÜß]/g, "_");
  // Trim to max length (keep extension)
  if (safe.length > MAX_FILENAME_LENGTH) {
    const ext = path.extname(safe);
    const name = safe.slice(0, MAX_FILENAME_LENGTH - ext.length);
    safe = name + ext;
  }
  return safe || "unnamed";
}

/**
 * If a file with the same name exists, append (1), (2), etc.
 */
export async function getUniqueFilename(
  dir: string,
  filename: string,
): Promise<string> {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let counter = 1;

  while (true) {
    try {
      await fs.access(path.join(dir, candidate));
      // File exists, try next number
      candidate = `${base} (${counter})${ext}`;
      counter++;
    } catch {
      // File does not exist, we can use this name
      return candidate;
    }
  }
}

/**
 * Validates that a resolved path is inside the expected directory (prevents traversal).
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const resolved = path.resolve(childPath);
  const parent = path.resolve(parentPath);
  return resolved.startsWith(parent + path.sep) || resolved === parent;
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
  const ext = path.extname(filename).toLowerCase().replace(".", "");
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
