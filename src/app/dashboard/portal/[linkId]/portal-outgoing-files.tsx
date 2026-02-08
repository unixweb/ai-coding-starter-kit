"use client";

import { useState } from "react";
import {
  Download,
  Trash2,
  Loader2,
  FileText,
  Clock,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface OutgoingFile {
  id: string;
  filename: string;
  file_size: number;
  note: string;
  expires_at: string | null;
  created_at: string;
  is_expired: boolean;
}

interface PortalOutgoingFilesProps {
  files: OutgoingFile[];
  linkId: string;
  onFilesChanged: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalOutgoingFiles({
  files,
  linkId,
  onFilesChanged,
}: PortalOutgoingFilesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      const res = await fetch(
        `/api/portal/outgoing?fileId=${encodeURIComponent(fileId)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        toast.success("Datei geloescht");
        onFilesChanged();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Loeschen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    setDownloadingId(fileId);
    try {
      const res = await fetch(
        `/api/portal/outgoing/download?fileId=${encodeURIComponent(fileId)}`
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Download");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bereitgestellte Dokumente
        </CardTitle>
        <CardDescription>
          Dokumente, die Sie fuer den Mandanten bereitgestellt haben
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-3" />
            <p className="text-sm">Noch keine Dokumente bereitgestellt</p>
            <p className="text-xs mt-1">
              Nutzen Sie &quot;Dateien senden&quot; um Dokumente bereitzustellen
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dateiname</TableHead>
                  <TableHead className="w-24">Groesse</TableHead>
                  <TableHead className="w-32">Bereitgestellt</TableHead>
                  <TableHead className="w-32">Ablauf</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{file.filename}</p>
                          {file.note && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {file.note}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{file.note}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.expires_at ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(file.expires_at)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {file.is_expired ? (
                        <Badge variant="secondary">Abgelaufen</Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-600 text-white">
                          Aktiv
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(file.id, file.filename)}
                          disabled={downloadingId === file.id}
                          title="Herunterladen"
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={deletingId === file.id}
                              title="Loeschen"
                            >
                              {deletingId === file.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Datei loeschen?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Die Datei &quot;{file.filename}&quot; wird
                                unwiderruflich geloescht und ist nicht mehr fuer
                                den Mandanten abrufbar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(file.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Loeschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
  );
}
