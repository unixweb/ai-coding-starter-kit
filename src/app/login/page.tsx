"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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

const loginSchema = z.object({
    email: z.string().email("Bitte gib eine gültige Email-Adresse ein"),
    password: z.string().min(1, "Passwort ist erforderlich"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    const callbackError = searchParams.get("error");
    const resetSuccess = searchParams.get("reset") === "success";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginFormData) {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

        if (authError) {
            setError("Email oder Passwort falsch");
            setIsLoading(false);
            return;
        }

        if (authData.session) {
            window.location.href = "/dashboard";
        } else {
            setError("Login fehlgeschlagen. Bitte versuche es erneut.");
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    Willkommen zurück
                </CardTitle>
                <CardDescription>
                    Melde dich mit deinem Account an
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {callbackError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            Authentifizierung fehlgeschlagen. Bitte versuche es
                            erneut.
                        </div>
                    )}

                    {resetSuccess && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                            Passwort erfolgreich zurückgesetzt. Du kannst dich
                            jetzt einloggen.
                        </div>
                    )}

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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Passwort</Label>
                            <Link
                                href="/reset-password"
                                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                                Passwort vergessen?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">
                                {errors.password.message}
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
                        Einloggen
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Noch kein Account?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Hier registrieren
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Suspense>
                <LoginForm />
            </Suspense>
        </div>
    );
}
