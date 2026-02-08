"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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

interface PortalSettingsProps {
  linkId: string;
  label: string;
  description: string;
  isActive: boolean;
  hasPassword: boolean;
  onSaved: () => void;
}

export function PortalSettings({
  linkId,
  label: initialLabel,
  description: initialDescription,
  isActive: initialIsActive,
  hasPassword,
  onSaved,
}: PortalSettingsProps) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState(initialDescription);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    if (!label.trim()) {
      toast.error("Name darf nicht leer sein");
      return;
    }
    if (password && password.length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen haben");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/portal/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: linkId,
          label: label.trim(),
          description: description.trim(),
          is_active: isActive,
          password: password || "",
        }),
      });

      if (res.ok) {
        toast.success("Einstellungen gespeichert");
        setPassword("");
        onSaved();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/portal/links?id=${encodeURIComponent(linkId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Portal geloescht");
        router.push("/dashboard/portal");
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Loeschen");
        setIsDeleting(false);
      }
    } catch {
      toast.error("Verbindungsfehler");
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal-Einstellungen</CardTitle>
        <CardDescription>
          Grundlegende Einstellungen des Portals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Name</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Mueller GmbH & Co KG"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung"
            rows={2}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Neues Passwort</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leer lassen um beizubehalten"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="is_active">Portal aktiv</Label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Speichern
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Loeschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Portal loeschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Das Portal wird unwiderruflich geloescht. Alle Einreichungen
                  und Dateien werden entfernt. Diese Aktion kann nicht
                  rueckgaengig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Endgueltig loeschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
