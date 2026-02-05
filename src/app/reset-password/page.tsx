"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetSchema = z.object({
    email: z.string().email("Bitte gib eine gültige Email-Adresse ein"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    async function onSubmit(data: ResetFormData) {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(data.email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
                });

            if (resetError) {
                setError(
                    "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
                );
                return;
            }

            setIsSent(true);
        } catch {
            setError(
                "Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        Passwort zurücksetzen
                    </CardTitle>
                    <CardDescription>
                        Gib deine Email ein, wir senden dir einen Reset-Link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSent ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Falls ein Account mit dieser Email existiert,
                                wurde eine Email mit einem Reset-Link gesendet.
                                Bitte prüfe auch deinen Spam-Ordner.
                            </p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="max@beispiel.de"
                                    autoComplete="email"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Reset-Link senden
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Zurück zum Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
