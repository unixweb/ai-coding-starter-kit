"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  User,
  FileText,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  LinkIcon,
  KeyRound,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubmissionFile {
  name: string;
  size: number;
  type: string;
  sizeFormatted: string;
}

interface Submission {
  id: string;
  name: string;
  email: string;
  note: string;
  file_count: number;
  created_at: string;
  files: SubmissionFile[];
}

interface LinkInfo {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  is_locked: boolean;
  failed_attempts: number;
  has_password: boolean;
  expires_at: string | null;
  created_at: string;
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

function getLinkStatusBadge(link: LinkInfo) {
  if (link.is_locked) {
    return <Badge variant="destructive">Gesperrt</Badge>;
  }
  if (!link.is_active) {
    return <Badge variant="secondary">Deaktiviert</Badge>;
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return <Badge variant="outline">Abgelaufen</Badge>;
  }
  return <Badge variant="default">Aktiv</Badge>;
}

export default function SubmissionsPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [link, setLink] = useState<LinkInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password regeneration state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/portal/submissions?linkId=${encodeURIComponent(linkId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLink(data.link);
        setSubmissions(data.submissions);
      } else {
        setError("Einreichungen konnten nicht geladen werden");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDownload(submissionId: string, filename: string) {
    const res = await fetch(
      `/api/portal/download?submissionId=${encodeURIComponent(submissionId)}&filename=${encodeURIComponent(filename)}`,
    );
    if (!res.ok) {
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

  async function handleRegeneratePassword() {
    setIsRegenerating(true);
    setRegenerateError(null);

    try {
      const res = await fetch("/api/portal/regenerate-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNewPassword(data.password);
        // Refresh link data to update is_locked and failed_attempts
        await loadSubmissions();
      } else {
        setRegenerateError(
          data.error || "Passwort konnte nicht generiert werden",
        );
      }
    } catch {
      setRegenerateError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleCopyLink() {
    if (!link) return;
    const fullUrl = `${window.location.origin}/p/${link.token}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zur Uebersicht
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : link ? (
        <>
          {/* Link Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {link.label || "Einladungslink"}
                  </CardTitle>
                  <CardDescription>
                    Erstellt am {formatDate(link.created_at)}
                    {link.expires_at &&
                      ` · Ablauf: ${formatDate(link.expires_at)}`}
                  </CardDescription>
                </div>
                {getLinkStatusBadge(link)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${link.token}`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Link kopieren"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* Password & Security Section */}
              {link.has_password && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Passwortschutz aktiv
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {link.failed_attempts} von 5 Fehlversuchen
                        </span>
                        {link.is_locked && (
                          <Badge variant="destructive" className="text-xs">
                            Gesperrt
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordDialog(true);
                        setNewPassword(null);
                        setRegenerateError(null);
                        setPasswordCopied(false);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Neues Passwort
                    </Button>
                  </div>
                </div>
              )}

              <p className="mt-3 text-sm text-muted-foreground">
                {submissions.length} Einreichung
                {submissions.length !== 1 ? "en" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Submissions */}
          <h2 className="text-lg font-semibold mb-4">Einreichungen</h2>

          {submissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mb-3" />
                <p className="text-sm">
                  Noch keine Einreichungen fuer diesen Link
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const isExpanded = expandedIds.has(sub.id);
                return (
                  <Card key={sub.id}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(sub.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 font-medium">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {sub.name}
                              </span>
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {sub.email}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(sub.created_at)} · {sub.file_count}{" "}
                              Datei
                              {sub.file_count !== 1 ? "en" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent>
                        {sub.note && (
                          <div className="mb-4 rounded-md bg-muted p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Notiz
                            </p>
                            <p className="text-sm">{sub.note}</p>
                          </div>
                        )}

                        <Separator className="mb-4" />

                        <p className="text-sm font-medium mb-3">Dateien</p>
                        <div className="space-y-2">
                          {sub.files.map((file) => (
                            <div
                              key={file.name}
                              className="flex items-center justify-between rounded-md border px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate max-w-xs">
                                  {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {file.sizeFormatted}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleDownload(sub.id, file.name)
                                }
                                title="Herunterladen"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Password Regeneration Dialog */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowPasswordDialog(false);
            setNewPassword(null);
            setRegenerateError(null);
            setPasswordCopied(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Passwort generieren</DialogTitle>
            <DialogDescription>
              {newPassword
                ? "Das neue Passwort wurde generiert. Fehlversuche und Sperrung wurden zurueckgesetzt."
                : "Ein neues Passwort wird generiert. Das alte Passwort wird ungueltig. Der Mandant muss das neue Passwort erhalten."}
            </DialogDescription>
          </DialogHeader>

          {newPassword ? (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Neues Passwort
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={newPassword}
                    className="font-mono text-sm tracking-wider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(newPassword);
                        setPasswordCopied(true);
                        setTimeout(() => setPasswordCopied(false), 2000);
                      } catch {}
                    }}
                    title="Passwort kopieren"
                  >
                    {passwordCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Das neue Passwort muss dem Mandanten erneut mitgeteilt werden.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {regenerateError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
                  {regenerateError}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {newPassword ? (
              <Button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setNewPassword(null);
                  setPasswordCopied(false);
                }}
              >
                Schliessen
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordDialog(false)}
                  disabled={isRegenerating}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleRegeneratePassword}
                  disabled={isRegenerating}
                >
                  {isRegenerating && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Generieren
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
