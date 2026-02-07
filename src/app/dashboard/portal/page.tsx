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
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
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

interface PortalLink {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
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
  variant: "default" | "secondary" | "destructive";
} {
  if (!link.is_active) {
    return { label: "Deaktiviert", variant: "secondary" };
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { label: "Abgelaufen", variant: "destructive" };
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
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Created link dialog
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    async function checkAuthAndLoad() {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) {
        window.location.href = "/login";
        return;
      }
      setUserName(user.user_metadata?.name ?? user.email ?? null);
      setAuthChecked(true);
      loadLinks();
    }
    checkAuthAndLoad();
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
        setCreatedLink(getFullUrl(data.link.token));
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

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                      <TableHead className="w-32 text-right">
                        Aktionen
                      </TableHead>
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
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(link.created_at)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {link.expires_at
                              ? formatDate(link.expires_at)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {link.submission_count}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggle(link)}
                                disabled={togglingId === link.id}
                                title={
                                  link.is_active
                                    ? "Deaktivieren"
                                    : "Aktivieren"
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
      </main>

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
          if (!open) setCreatedLink(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link erfolgreich erstellt</DialogTitle>
            <DialogDescription>
              Teilen Sie diesen Link mit Ihrem Mandanten. Ueber diesen Link
              koennen Dokumente sicher hochgeladen werden.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={createdLink || ""}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => createdLink && handleCopy(createdLink)}
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
          <DialogFooter>
            <Button onClick={() => setCreatedLink(null)}>Schliessen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
