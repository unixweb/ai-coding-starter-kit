"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
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
  PasswordStrengthIndicator,
  validatePassword,
} from "@/components/password-strength-indicator";

interface InvitationData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  owner_name: string;
}

type PageState = "loading" | "valid" | "invalid" | "expired" | "used" | "success";

export default function InviteAcceptPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(
          `/api/team/verify-invite?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (res.ok && data.valid) {
          setInvitation(data);
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPageState("valid");
        } else {
          if (data.reason === "expired") {
            setPageState("expired");
            setErrorMessage(
              "Diese Einladung ist abgelaufen. Bitte fordern Sie eine neue Einladung an."
            );
          } else if (data.reason === "used") {
            setPageState("used");
            setErrorMessage(
              "Diese Einladung wurde bereits verwendet. Bitte melden Sie sich an."
            );
          } else {
            setPageState("invalid");
            setErrorMessage("Diese Einladung ist ungueltig.");
          }
        }
      } catch {
        setPageState("invalid");
        setErrorMessage("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!firstName.trim()) {
      setFormError("Vorname ist erforderlich");
      return;
    }
    if (!lastName.trim()) {
      setFormError("Nachname ist erforderlich");
      return;
    }
    if (!validatePassword(password)) {
      setFormError("Passwort erfuellt nicht alle Anforderungen");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwoerter stimmen nicht ueberein");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });

      if (res.ok) {
        setPageState("success");
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        const data = await res.json();
        setFormError(data.error || "Registrierung fehlgeschlagen");
      }
    } catch {
      setFormError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Einladung wird geprueft...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Account aktiviert!</h2>
            <p className="text-muted-foreground text-center">
              Weiterleitung zum Dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states (invalid, expired, used)
  if (pageState !== "valid") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {pageState === "expired"
                ? "Einladung abgelaufen"
                : pageState === "used"
                  ? "Einladung bereits verwendet"
                  : "Ungueltige Einladung"}
            </h2>
            <p className="text-muted-foreground text-center">{errorMessage}</p>
            {pageState === "used" && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => (window.location.href = "/login")}
              >
                Zum Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show registration form
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img
              src="/favicon.svg"
              alt="SafeDocs Portal"
              className="h-12 w-12"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Willkommen bei SafeDocs Portal
          </CardTitle>
          <CardDescription>
            Sie wurden von <strong>{invitation?.owner_name}</strong> eingeladen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Max"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                autoComplete="given-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Mustermann"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                autoComplete="family-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestaetigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Passwort verbergen"
                      : "Passwort anzeigen"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">
                  Passwoerter stimmen nicht ueberein
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Account aktivieren
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
