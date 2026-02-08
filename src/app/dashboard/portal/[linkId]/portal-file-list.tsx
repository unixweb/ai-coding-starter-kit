"use client";

import { useState } from "react";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface FlatFile {
  submissionId: string;
  submitterName: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  uploadedAt: string;
  key: string; // submissionId/filename
}

interface PortalFileListProps {
  files: FlatFile[];
  linkId: string;
  onFilesChanged: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalFileList({
  files,
  linkId,
  onFilesChanged,
}: PortalFileListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<FlatFile | null>(null);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const allSelected = files.length > 0 && selected.size === files.length;

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.key)));
    }
  }

  async function handleDownload(submissionId: string, filename: string) {
    const res = await fetch(
      `/api/portal/download?submissionId=${encodeURIComponent(submissionId)}&filename=${encodeURIComponent(filename)}`,
    );
    if (!res.ok) {
      toast.error("Download fehlgeschlagen");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadAll() {
    setIsDownloadingAll(true);
    try {
      const res = await fetch(
        `/api/portal/download-all?linkId=${encodeURIComponent(linkId)}`,
      );
      if (!res.ok) {
        toast.error("Download fehlgeschlagen");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dateien.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download fehlgeschlagen");
    } finally {
      setIsDownloadingAll(false);
    }
  }

  async function deleteFiles(targets: FlatFile[]) {
    setIsDeleting(true);
    let successCount = 0;

    for (const file of targets) {
      try {
        const res = await fetch("/api/portal/files", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: file.submissionId,
            filename: file.filename,
          }),
        });
        if (res.ok) successCount++;
      } catch {
        // continue with next file
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "Datei geloescht"
          : `${successCount} Dateien geloescht`,
      );
      setSelected(new Set());
      onFilesChanged();
    } else {
      toast.error("Loeschen fehlgeschlagen");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
    setShowBatchDelete(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploads ({files.length})</CardTitle>
              <CardDescription>
                Hochgeladene Dateien in diesem Portal
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={files.length === 0 || isDownloadingAll}
            >
              {isDownloadingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Alle herunterladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3" />
              <p className="text-sm">Noch keine Dateien hochgeladen</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Alle auswaehlen
                  </span>
                </div>
                {selected.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBatchDelete(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {selected.size} loeschen
                  </Button>
                )}
              </div>

              {/* File rows */}
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.key}
                    className="flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selected.has(file.key)}
                      onCheckedChange={() => toggleSelect(file.key)}
                    />
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.sizeFormatted} - {formatDateTime(file.uploadedAt)}
                        <span className="ml-1">
                          von {file.submitterName}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleDownload(file.submissionId, file.filename)
                        }
                        title="Herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(file)}
                        title="Loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Single file delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.filename}&quot; wird unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteFiles([deleteTarget])}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete dialog */}
      <AlertDialog
        open={showBatchDelete}
        onOpenChange={(open) => {
          if (!open) setShowBatchDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selected.size} Dateien loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die ausgewaehlten Dateien werden unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteFiles(files.filter((f) => selected.has(f.key)))
              }
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {selected.size} Dateien loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
