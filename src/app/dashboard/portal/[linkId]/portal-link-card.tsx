"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Send, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PortalLinkCardProps {
  token: string;
  isActive: boolean;
  linkId: string;
}

export function PortalLinkCard({ token, isActive, linkId }: PortalLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

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

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setShowEmailDialog(true)}
            disabled={!isActive}
          >
            <Send className="h-4 w-4" />
            Zugangsdaten senden
          </Button>
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
    </>
  );
}
