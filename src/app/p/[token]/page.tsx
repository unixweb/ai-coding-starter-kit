"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Shield,
  Lock,
  Upload,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileText,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

const MAX_FILES = 10;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PageState = "loading" | "password" | "form" | "success" | "error";

export default function PublicUploadPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Password state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate token on mount
  const validateToken = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/portal/verify?token=${encodeURIComponent(token)}`,
      );
      const data = await res.json();

      if (data.valid) {
        if (data.passwordRequired) {
          setPageState("password");
        } else {
          setPageState("form");
        }
      } else {
        setErrorMessage(data.reason || "Dieser Link ist ungueltig");
        setPageState("error");
      }
    } catch {
      setErrorMessage("Verbindungsfehler. Bitte versuchen Sie es spaeter.");
      setPageState("error");
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  function addFiles(newFiles: FileList | File[]) {
    const fileArray = Array.from(newFiles);
    setSelectedFiles((prev) => {
      const combined = [...prev, ...fileArray];
      if (combined.length > MAX_FILES) {
        setFormError(`Maximal ${MAX_FILES} Dateien erlaubt`);
        return combined.slice(0, MAX_FILES);
      }
      setFormError(null);
      return combined;
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFormError(null);
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValue.trim()) return;

    setIsVerifyingPassword(true);
    setPasswordError(null);

    try {
      const res = await fetch("/api/portal/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: passwordValue }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSessionToken(data.sessionToken);
        setPageState("form");
      } else if (data.locked) {
        setErrorMessage(data.error || "Zugang gesperrt");
        setPageState("error");
      } else {
        setPasswordError(data.error || "Falsches Passwort");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch {
      setPasswordError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsVerifyingPassword(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!name.trim()) {
      setFormError("Name ist erforderlich");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Bitte geben Sie eine gueltige E-Mail-Adresse ein");
      return;
    }
    if (selectedFiles.length === 0) {
      setFormError("Bitte waehlen Sie mindestens eine Datei aus");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("note", note.trim());
    for (const file of selectedFiles) {
      formData.append("files", file);
    }

    try {
      setUploadProgress(30);

      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers["X-Portal-Session"] = sessionToken;
      }

      const res = await fetch("/api/portal/submit", {
        method: "POST",
        headers,
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadProgress(100);
        setUploadedCount(data.uploaded?.length || 0);
        // BUG-3 FIX: Show warnings for partially failed uploads
        if (data.errors && data.errors.length > 0) {
          setUploadWarnings(data.errors);
        }
        setTimeout(() => setPageState("success"), 300);
      } else {
        setFormError(data.error || "Upload fehlgeschlagen");
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    } catch {
      setFormError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Simple Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5 text-blue-600" />
            SafeDocs Portal
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Loading State */}
        {pageState === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Password State */}
        {pageState === "password" && (
          <>
            <div className="text-center mb-8">
              <Lock className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold tracking-tight">
                Passwort eingeben
              </h1>
              <p className="mt-2 text-muted-foreground">
                Bitte geben Sie das Passwort ein, das Sie erhalten haben.
              </p>
            </div>

            <Card className="mx-auto max-w-md">
              <CardContent className="pt-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Passwort eingeben"
                      value={passwordValue}
                      onChange={(e) => {
                        setPasswordValue(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      disabled={isVerifyingPassword}
                      autoFocus
                    />
                  </div>

                  {passwordError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {passwordError}
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <span className="block mt-1 font-medium">
                          Noch {remainingAttempts}{" "}
                          {remainingAttempts === 1 ? "Versuch" : "Versuche"}
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifyingPassword || !passwordValue.trim()}
                  >
                    {isVerifyingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wird geprueft...
                      </>
                    ) : (
                      "Weiter"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Passwort nicht erhalten? Kontaktieren Sie Ihren Ansprechpartner.
              </p>
            </div>
          </>
        )}

        {/* Error State */}
        {pageState === "error" && (
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Link nicht verfuegbar
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                {errorMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {pageState === "success" && (
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center py-12">
              {uploadWarnings.length > 0 ? (
                <>
                  <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    Teilweise hochgeladen
                  </h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadedCount} von {selectedFiles.length} Dateien wurden
                    erfolgreich uebermittelt.
                  </p>
                  <div className="mt-4 w-full rounded-md bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Folgende Dateien konnten nicht hochgeladen werden:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-0.5">
                      {uploadWarnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Vielen Dank!</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    Ihre Dokumente wurden erfolgreich uebermittelt.
                  </p>
                </>
              )}
              <p className="text-sm text-muted-foreground text-center mt-2">
                Sie koennen dieses Fenster jetzt schliessen.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Form State */}
        {pageState === "form" && (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <Upload className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold tracking-tight">
                Sicherer Dokumenten-Upload
              </h1>
              <p className="mt-2 text-muted-foreground">
                Laden Sie Ihre Dokumente sicher hoch. Ihre Daten werden
                verschluesselt uebertragen.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Dokumente einreichen</CardTitle>
                <CardDescription>
                  Bitte fuellen Sie das Formular aus und waehlen Sie die Dateien
                  aus, die Sie hochladen moechten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ihr vollstaendiger Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-Mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Notiz (optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Optionale Hinweise zu den Dokumenten..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>
                      Dateien <span className="text-destructive">*</span>
                    </Label>
                    <div
                      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                        isDragOver
                          ? "border-blue-500 bg-blue-50"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      } ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUpload
                        className={`h-8 w-8 mb-2 ${isDragOver ? "text-blue-500" : "text-muted-foreground"}`}
                      />
                      <p className="text-sm font-medium">
                        Dateien hier ablegen oder klicken
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, Bilder, Word, Excel - max. 10 MB, max. {MAX_FILES}{" "}
                        Dateien
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            addFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatSize(file.size)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              disabled={isSubmitting}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          {selectedFiles.length} von {MAX_FILES} Dateien
                          ausgewaehlt
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isSubmitting && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">
                          Dokumente werden hochgeladen...
                        </span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Error */}
                  {formError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {formError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || selectedFiles.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wird hochgeladen...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Dokumente senden
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Trust Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Sichere Uebertragung via SafeDocs Portal
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
