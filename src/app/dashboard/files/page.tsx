"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Download,
  Pencil,
  Trash2,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FileEntry {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(t))
    return <FileImage className="h-4 w-4 text-blue-500" />;
  if (["xls", "xlsx"].includes(t))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (["doc", "docx"].includes(t))
    return <FileText className="h-4 w-4 text-blue-700" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Rename dialog state
  const [renameFile, setRenameFile] = useState<FileEntry | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete dialog state
  const [deleteFile, setDeleteFile] = useState<FileEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
    // Get user name from supabase for the header
    async function getUser() {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name ?? user.email ?? null);
      }
    }
    getUser();
  }, [loadFiles]);

  async function handleUpload(selectedFiles: FileList | File[]) {
    const fileArray = Array.from(selectedFiles);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(10);

    const formData = new FormData();
    for (const file of fileArray) {
      formData.append("files", file);
    }

    try {
      setUploadProgress(30);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload fehlgeschlagen");
      } else {
        const count = data.uploaded?.length || 0;
        if (count > 0) {
          setSuccess(
            `${count} Datei${count > 1 ? "en" : ""} erfolgreich hochgeladen`,
          );
        }
        if (data.errors?.length > 0) {
          setError(data.errors.join(", "));
        }
        await loadFiles();
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  async function handleDownload(name: string) {
    const res = await fetch(`/api/files/download?name=${encodeURIComponent(name)}`);
    if (!res.ok) {
      setError("Download fehlgeschlagen");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRename() {
    if (!renameFile || !newName.trim()) return;
    setIsRenaming(true);
    try {
      const res = await fetch("/api/files/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: renameFile.name, newName: newName.trim() }),
      });
      if (res.ok) {
        setRenameFile(null);
        setNewName("");
        await loadFiles();
      } else {
        const data = await res.json();
        setError(data.error || "Umbenennen fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleDelete() {
    if (!deleteFile) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/files?name=${encodeURIComponent(deleteFile.name)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setDeleteFile(null);
        await loadFiles();
      } else {
        const data = await res.json();
        setError(data.error || "Loeschen fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsDeleting(false);
    }
  }

  function openRenameDialog(file: FileEntry) {
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    setNewName(nameWithoutExt);
    setRenameFile(file);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Meine Dateien</h1>
          <p className="mt-1 text-muted-foreground">
            Dateien hochladen und verwalten
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload
                className={`h-10 w-10 mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
              />
              <p className="text-sm font-medium">
                Dateien hier ablegen oder klicken
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, Bilder, Word, Excel - max. 10 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUpload(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Wird hochgeladen...</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hochgeladene Dateien</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Upload className="h-10 w-10 mb-3" />
                <p className="text-sm">Noch keine Dateien hochgeladen</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-20">Typ</TableHead>
                      <TableHead className="w-24">Groesse</TableHead>
                      <TableHead className="w-40">Datum</TableHead>
                      <TableHead className="w-32 text-right">
                        Aktionen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-xs">
                              {file.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {file.type}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatSize(file.size)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(file.uploadedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(file.name)}
                              title="Herunterladen"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openRenameDialog(file)}
                              title="Umbenennen"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteFile(file)}
                              title="Loeschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Rename Dialog */}
      <Dialog
        open={renameFile !== null}
        onOpenChange={(open) => {
          if (!open) setRenameFile(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datei umbenennen</DialogTitle>
            <DialogDescription>
              Gib einen neuen Namen ein. Die Dateiendung bleibt erhalten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="newName">Neuer Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              maxLength={200}
            />
            {renameFile && (
              <p className="text-xs text-muted-foreground">
                Dateiendung: {renameFile.name.match(/\.[^.]+$/)?.[0] || ""}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFile(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteFile !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFile(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei loeschen</AlertDialogTitle>
            <AlertDialogDescription>
              Moechtest du &quot;{deleteFile?.name}&quot; wirklich loeschen?
              Diese Aktion kann nicht rueckgaengig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
