"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  Loader2,
  LinkIcon,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PortalLink {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  is_locked: boolean;
  expires_at: string | null;
  created_at: string;
  submission_count: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getLinkStatus(link: PortalLink): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (link.is_locked) {
    return { label: "Gesperrt", variant: "destructive" };
  }
  if (!link.is_active) {
    return { label: "Deaktiviert", variant: "secondary" };
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { label: "Abgelaufen", variant: "outline" };
  }
  return { label: "Aktiv", variant: "default" };
}

function getFullUrl(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/p/${token}`;
}

export default function PortalPage() {
  const [links, setLinks] = useState<PortalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Created link dialog
  const [createdLink, setCreatedLink] = useState<{
    url: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Email dialog
  const [emailLink, setEmailLink] = useState<PortalLink | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/links");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);

    try {
      const body: Record<string, string> = {};
      if (newLabel.trim()) body.label = newLabel.trim();
      if (newExpiresAt) body.expiresAt = new Date(newExpiresAt).toISOString();

      const res = await fetch("/api/portal/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateDialog(false);
        setNewLabel("");
        setNewExpiresAt("");
        setCreatedLink({
          url: getFullUrl(data.link.token),
          password: data.password,
        });
        await loadLinks();
      } else {
        const data = await res.json();
        setError(data.error || "Link konnte nicht erstellt werden");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggle(link: PortalLink) {
    setTogglingId(link.id);
    try {
      const res = await fetch("/api/portal/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
      });
      if (res.ok) {
        await loadLinks();
      }
    } catch {
      // silently fail
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  function openEmailDialog(link: PortalLink) {
    setEmailLink(link);
    setRecipientEmail("");
    setSendError(null);
    setSendSuccess(false);
  }

  async function handleSendEmail() {
    if (!emailLink || !recipientEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      setSendError("Bitte geben Sie eine gueltige E-Mail-Adresse ein.");
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const res = await fetch("/api/portal/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId: emailLink.id,
          recipientEmail: recipientEmail.trim(),
        }),
      });

      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => {
          setEmailLink(null);
          setSendSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setSendError(data.error || "E-Mail konnte nicht versendet werden.");
      }
    } catch {
      setSendError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mandanten-Portal
          </h1>
          <p className="mt-1 text-muted-foreground">
            Einladungslinks erstellen und Einreichungen verwalten
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Neuen Link erstellen
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Einladungslinks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <LinkIcon className="h-10 w-10 mb-3" />
              <p className="text-sm">Noch keine Einladungslinks erstellt</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Ersten Link erstellen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28">Erstellt</TableHead>
                    <TableHead className="w-28">Ablauf</TableHead>
                    <TableHead className="w-24 text-center">
                      Einreichungen
                    </TableHead>
                    <TableHead className="w-40 text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => {
                    const status = getLinkStatus(link);
                    const fullUrl = getFullUrl(link.token);
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">
                          {link.label || (
                            <span className="text-muted-foreground italic">
                              Kein Name
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                              /p/{link.token.slice(0, 12)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopy(fullUrl)}
                              title="Link kopieren"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(link.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {link.expires_at ? formatDate(link.expires_at) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {link.submission_count}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEmailDialog(link)}
                                      disabled={status.label !== "Aktiv"}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {status.label === "Aktiv"
                                    ? "Zugangslink senden"
                                    : status.label === "Deaktiviert"
                                      ? "Link ist deaktiviert"
                                      : "Link ist abgelaufen"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggle(link)}
                              disabled={togglingId === link.id}
                              title={
                                link.is_active ? "Deaktivieren" : "Aktivieren"
                              }
                            >
                              {togglingId === link.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : link.is_active ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Link href={`/dashboard/portal/${link.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Einreichungen ansehen"
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Einladungslink erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen sicheren Link, ueber den Mandanten Dokumente
              hochladen koennen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkLabel">Bezeichnung (optional)</Label>
              <Input
                id="linkLabel"
                placeholder="z.B. Herr Mueller Steuerdoku 2025"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Ablaufdatum (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Created Success Dialog */}
      <Dialog
        open={createdLink !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedLink(null);
            setPasswordCopied(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link erfolgreich erstellt</DialogTitle>
            <DialogDescription>
              Teilen Sie diesen Link und das Passwort mit Ihrem Mandanten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdLink?.url || ""}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => createdLink && handleCopy(createdLink.url)}
                  title="Link kopieren"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Passwort
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdLink?.password || ""}
                  className="font-mono text-sm tracking-wider"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    if (createdLink) {
                      try {
                        await navigator.clipboard.writeText(
                          createdLink.password,
                        );
                        setPasswordCopied(true);
                        setTimeout(() => setPasswordCopied(false), 2000);
                      } catch {}
                    }
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
                Speichern Sie das Passwort jetzt — es kann spaeter nicht mehr
                angezeigt werden.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setCreatedLink(null);
                setPasswordCopied(false);
              }}
            >
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Send Dialog */}
      <Dialog
        open={emailLink !== null}
        onOpenChange={(open) => {
          if (!open && !isSending) {
            setEmailLink(null);
            setSendSuccess(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zugangslink senden</DialogTitle>
            <DialogDescription>
              {emailLink?.label
                ? `Link "${emailLink.label}" per E-Mail versenden.`
                : "Zugangslink per E-Mail an den Mandanten versenden."}
            </DialogDescription>
          </DialogHeader>
          {sendSuccess ? (
            <div className="flex flex-col items-center py-6 text-green-600">
              <Check className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">
                E-Mail erfolgreich versendet!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  Beim Senden wird ein neues Passwort fuer diesen Link generiert
                  und in der E-Mail mitgesendet.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Empfaenger-E-Mail</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="mandant@beispiel.de"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      if (sendError) setSendError(null);
                    }}
                  />
                </div>
                {sendError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {sendError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEmailLink(null)}
                  disabled={isSending}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !recipientEmail.trim()}
                >
                  {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Senden
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
