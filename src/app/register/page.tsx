"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
import {
    PasswordStrengthIndicator,
    validatePassword,
} from "@/components/password-strength-indicator";

const registerSchema = z
    .object({
        name: z
            .string()
            .min(1, "Name ist erforderlich")
            .max(100, "Name darf maximal 100 Zeichen lang sein"),
        email: z
            .string()
            .email("Bitte gib eine gültige Email-Adresse ein")
            .max(255, "Email darf maximal 255 Zeichen lang sein"),
        password: z
            .string()
            .refine(
                validatePassword,
                "Passwort erfüllt nicht alle Anforderungen",
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwörter stimmen nicht überein",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch("password", "");

    async function onSubmit(data: RegisterFormData) {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: authData, error: authError } =
                await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: {
                            name: data.name,
                        },
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    setError("Email bereits verwendet");
                } else {
                    setError(authError.message);
                }
                return;
            }

            // BUG-1 Fix: Supabase returns a user with empty identities when email
            // already exists and email confirmations are enabled
            if (authData.user && authData.user.identities?.length === 0) {
                setError("Email bereits verwendet");
                return;
            }

            if (authData.user) {
                window.location.href = "/verify-email";
            } else {
                setError(
                    "Registrierung fehlgeschlagen. Bitte versuche es erneut.",
                );
            }
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
                        Account erstellen
                    </CardTitle>
                    <CardDescription>
                        Erstelle deinen Account, um loszulegen
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Max Mustermann"
                                autoComplete="name"
                                maxLength={100}
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="max@beispiel.de"
                                autoComplete="email"
                                maxLength={255}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Passwort</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    className="pr-10"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Passwort verbergen"
                                            : "Passwort anzeigen"
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
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Passwort bestätigen
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    autoComplete="new-password"
                                    className="pr-10"
                                    {...register("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
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
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {errors.confirmPassword.message}
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
                            Registrieren
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Bereits registriert?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Hier einloggen
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
