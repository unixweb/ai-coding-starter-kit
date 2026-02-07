"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      // If already verified, redirect to dashboard
      if (user?.email_confirmed_at) {
        window.location.href = "/dashboard";
      }
    }
    getUser();
  }, []);

  async function handleResend() {
    if (!userEmail) return;

    setIsResending(true);
    setError(null);
    setResent(false);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(
          "Email konnte nicht gesendet werden. Bitte versuche es später erneut.",
        );
      } else {
        setResent(true);
      }
    } catch {
      setError(
        "Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Bitte bestätige deine Email-Adresse
          </CardTitle>
          <CardDescription>
            Wir haben eine Verifizierungs-Email an{" "}
            <span className="font-medium text-foreground">
              {userEmail ?? "..."}
            </span>{" "}
            gesendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {resent && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              Verifizierungs-Email wurde erneut gesendet.
            </div>
          )}

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Klicke auf den Link in der Email, um deinen Account zu bestätigen.
            </p>
            <p>
              Prüfe auch deinen Spam-Ordner, falls die Email nicht in deinem
              Posteingang ist.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending && <Loader2 className="h-4 w-4 animate-spin" />}
            Neue Verifizierungs-Email senden
          </Button>

          {process.env.NEXT_PUBLIC_REGISTRATION_ENABLED !== "false" && (
            <p className="text-center text-xs text-muted-foreground">
              Falsche Email-Adresse?{" "}
              <a
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Neu registrieren
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
