"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "invited";
  created_at: string;
  invitation_id?: string;
}

interface ApiMember {
  id: string;
  memberId: string;
  email: string;
  name: string;
  status: "active";
  createdAt: string;
}

interface ApiInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  status: "pending";
  expiresAt: string;
  createdAt: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  // Invite dialog state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resend invite state
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team/members");
      if (res.status === 403) {
        setIsOwner(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // Transform API response to unified format
        const activeMembers: TeamMember[] = (data.members || []).map((m: ApiMember) => {
          const nameParts = m.name.split(" ");
          return {
            id: m.id,
            email: m.email,
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" ") || "",
            status: "active" as const,
            created_at: m.createdAt,
          };
        });
        const invitedMembers: TeamMember[] = (data.invitations || []).map((inv: ApiInvitation) => ({
          id: inv.id,
          email: inv.email,
          first_name: inv.firstName || "",
          last_name: inv.lastName || "",
          status: "invited" as const,
          created_at: inv.createdAt,
          invitation_id: inv.id,
        }));
        setMembers([...activeMembers, ...invitedMembers]);
        setIsOwner(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleInvite() {
    const emailTrimmed = inviteEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setInviteError("E-Mail-Adresse ist erforderlich");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setInviteError("Bitte eine gueltige E-Mail-Adresse eingeben");
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTrimmed,
          firstName: inviteFirstName.trim(),
          lastName: inviteLastName.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Einladung erfolgreich versendet");
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteFirstName("");
        setInviteLastName("");
        await loadMembers();
      } else {
        const data = await res.json();
        setInviteError(data.error || "Einladung konnte nicht gesendet werden");
      }
    } catch {
      setInviteError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const body =
        deleteTarget.status === "invited"
          ? { invitationId: deleteTarget.invitation_id }
          : { memberId: deleteTarget.id };

      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(
          deleteTarget.status === "invited"
            ? "Einladung geloescht"
            : "Benutzer entfernt"
        );
        setDeleteTarget(null);
        await loadMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Loeschen fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleResendInvite(member: TeamMember) {
    if (!member.invitation_id) return;

    setResendingId(member.invitation_id);
    try {
      const res = await fetch("/api/team/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: member.invitation_id }),
      });

      if (res.ok) {
        toast.success("Einladung erneut gesendet");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erneutes Senden fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setResendingId(null);
    }
  }

  function formatName(member: TeamMember): string {
    const name = [member.first_name, member.last_name]
      .filter(Boolean)
      .join(" ");
    return name || "-";
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Not authorized (not owner)
  if (isOwner === false) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zugriff verweigert</h2>
            <p className="text-muted-foreground text-center">
              Sie haben keine Berechtigung, diese Seite anzuzeigen.
              <br />
              Nur Portal-Owner koennen Team-Mitglieder verwalten.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              Zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team-Benutzer</h1>
          <p className="mt-1 text-muted-foreground">
            Verwalten Sie die Benutzer Ihres Teams
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4" />
          Benutzer einladen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team-Mitglieder</CardTitle>
          <CardDescription>
            Alle aktiven und eingeladenen Benutzer Ihres Teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3" />
              <p className="text-sm">Noch keine Team-Mitglieder eingeladen</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="h-4 w-4" />
                Ersten Benutzer einladen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-48 text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.email}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatName(member)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.status === "active" ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          >
                            Eingeladen
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {member.status === "invited" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(member)}
                              disabled={resendingId === member.invitation_id}
                            >
                              {resendingId === member.invitation_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Erneut einladen
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(member)}
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

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer einladen</DialogTitle>
            <DialogDescription>
              Senden Sie eine Einladung an einen neuen Team-Benutzer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                E-Mail-Adresse <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="benutzer@beispiel.de"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-firstname">Vorname (optional)</Label>
              <Input
                id="invite-firstname"
                type="text"
                placeholder="Max"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-lastname">Nachname (optional)</Label>
              <Input
                id="invite-lastname"
                type="text"
                placeholder="Mustermann"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
                maxLength={100}
              />
            </div>
            {inviteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {inviteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                setInviteError(null);
              }}
              disabled={isInviting}
            >
              Abbrechen
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Einladung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.status === "invited"
                ? "Einladung loeschen?"
                : "Benutzer entfernen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === "invited" ? (
                <>
                  Die Einladung fuer <strong>{deleteTarget?.email}</strong> wird
                  geloescht. Der Benutzer kann sich nicht mehr mit diesem Link
                  registrieren.
                </>
              ) : (
                <>
                  <strong>{deleteTarget?.email}</strong> wird aus dem Team
                  entfernt und verliert sofort den Zugriff auf alle Portale.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {deleteTarget?.status === "invited" ? "Loeschen" : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
