"use client";

import { useState, useRef } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Send,
  Loader2,
  FileUp,
  CloudUpload,
  X,
  FileText,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PortalLinkCardProps {
  token: string;
  isActive: boolean;
  linkId: string;
  clientEmail?: string | null;
  onFilesUploaded?: () => void;
}

export function PortalLinkCard({
  token,
  isActive,
  linkId,
  clientEmail,
  onFilesUploaded,
}: PortalLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Send Files Dialog State
  const [showSendFilesDialog, setShowSendFilesDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSendingFiles, setIsSendingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${token}`
      : `/p/${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  }

  function handleOpen() {
    window.open(portalUrl, "_blank");
  }

  async function handleSendEmail() {
    if (!email.trim()) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/portal/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, recipientEmail: email.trim() }),
      });

      if (res.ok) {
        toast.success("Zugangsdaten gesendet");
        setShowEmailDialog(false);
        setEmail("");
      } else {
        const data = await res.json();
        toast.error(data.error || "E-Mail konnte nicht gesendet werden");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setIsSending(false);
    }
  }

  // File handling functions
  function addFiles(newFiles: FileList | File[]) {
    const fileArray = Array.from(newFiles);
    setFileError(null);

    // Check file sizes
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`Datei "${file.name}" ist zu gross (max. 10 MB)`);
        return;
      }
    }

    setSelectedFiles((prev) => {
      const combined = [...prev, ...fileArray];
      if (combined.length > MAX_FILES) {
        setFileError(`Maximal ${MAX_FILES} Dateien erlaubt`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
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
      addFiles(e.dataTransfer.files);
    }
  }

  function resetSendFilesDialog() {
    setSelectedFiles([]);
    setNote("");
    setExpiresAt("");
    setFileError(null);
    setShowSendFilesDialog(false);
  }

  async function handleSendFiles() {
    if (selectedFiles.length === 0) {
      setFileError("Bitte mindestens eine Datei auswaehlen");
      return;
    }
    if (!note.trim()) {
      setFileError("Bitte eine Notiz fuer den Mandanten eingeben");
      return;
    }

    setIsSendingFiles(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append("linkId", linkId);
      formData.append("note", note.trim());
      if (expiresAt) {
        formData.append("expiresAt", new Date(expiresAt).toISOString());
      }
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const res = await fetch("/api/portal/outgoing", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emailSent) {
          toast.success("Dateien bereitgestellt und E-Mail gesendet");
        } else {
          toast.success("Dateien bereitgestellt (keine E-Mail gesendet)");
        }
        resetSendFilesDialog();
        onFilesUploaded?.();
      } else {
        const data = await res.json();
        setFileError(data.error || "Fehler beim Bereitstellen der Dateien");
      }
    } catch {
      setFileError("Verbindungsfehler");
    } finally {
      setIsSendingFiles(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portal-Link</CardTitle>
          <CardDescription>
            Teilen Sie diesen Link mit Ihren Kunden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-muted/50 p-3 text-sm font-mono break-all">
            {portalUrl}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Kopieren
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpen}>
              <ExternalLink className="h-4 w-4" />
              Oeffnen
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowEmailDialog(true)}
              disabled={!isActive}
            >
              <Send className="h-4 w-4" />
              Zugangsdaten
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSendFilesDialog(true)}
              disabled={!isActive}
            >
              <FileUp className="h-4 w-4" />
              Dateien senden
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showEmailDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEmailDialog(false);
            setEmail("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zugangsdaten senden</DialogTitle>
            <DialogDescription>
              Der Empfaenger erhaelt den Portal-Link und ein neues Passwort per
              E-Mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="recipient-email">E-Mail-Adresse</Label>
            <Input
              id="recipient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mandant@beispiel.de"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendEmail();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSending}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Files Dialog */}
      <Dialog
        open={showSendFilesDialog}
        onOpenChange={(open) => {
          if (!open && !isSendingFiles) {
            resetSendFilesDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dateien an Mandanten senden</DialogTitle>
            <DialogDescription>
              Stellen Sie Dokumente fuer den Mandanten im Portal bereit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Warning if no client email */}
            {!clientEmail && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Keine E-Mail-Adresse hinterlegt</p>
                  <p className="text-xs mt-0.5">
                    Der Mandant wird keine Benachrichtigung erhalten. Sie
                    koennen die E-Mail in den Portal-Einstellungen hinterlegen.
                  </p>
                </div>
              </div>
            )}

            {/* Client email display */}
            {clientEmail && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Benachrichtigung an:{" "}
                </span>
                <span className="font-medium">{clientEmail}</span>
              </div>
            )}

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Dateien</Label>
              <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                } ${isSendingFiles ? "pointer-events-none opacity-50" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload
                  className={`h-6 w-6 mb-1 ${isDragOver ? "text-blue-500" : "text-muted-foreground"}`}
                />
                <p className="text-sm font-medium">
                  Dateien hier ablegen oder klicken
                </p>
                <p className="text-xs text-muted-foreground">
                  Max. {MAX_FILES} Dateien, max. 10 MB pro Datei
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                  disabled={isSendingFiles}
                />
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-md border px-2 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        disabled={isSendingFiles}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="send-files-note">
                Notiz an den Mandanten <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="send-files-note"
                placeholder="z.B. Bitte unterschreiben und zuruecksenden..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={isSendingFiles}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="send-files-expires">
                Ablaufdatum (optional)
              </Label>
              <Input
                id="send-files-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                disabled={isSendingFiles}
              />
              <p className="text-xs text-muted-foreground">
                Nach diesem Datum sind die Dateien nicht mehr abrufbar
              </p>
            </div>

            {/* Error */}
            {fileError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {fileError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetSendFilesDialog}
              disabled={isSendingFiles}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSendFiles}
              disabled={isSendingFiles || selectedFiles.length === 0}
            >
              {isSendingFiles && <Loader2 className="h-4 w-4 animate-spin" />}
              Bereitstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
