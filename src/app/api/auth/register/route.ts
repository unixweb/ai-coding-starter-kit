import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8),
  emailRedirectTo: z.string().url(),
});

export async function POST(request: Request) {
  // Server-side check: is registration enabled?
  if (process.env.NEXT_PUBLIC_REGISTRATION_ENABLED === "false") {
    return NextResponse.json(
      { error: "Registrierung ist deaktiviert" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request Body" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingaben", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password, emailRedirectTo } = parsed.data;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo,
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return NextResponse.json(
        { error: "Email bereits verwendet" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // BUG-1 Fix: Supabase returns user with empty identities when email
  // already exists and email confirmations are enabled
  if (authData.user && authData.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "Email bereits verwendet" },
      { status: 409 },
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen" },
      { status: 500 },
    );
  }

  return NextResponse.json({ user: { id: authData.user.id } }, { status: 201 });
}
