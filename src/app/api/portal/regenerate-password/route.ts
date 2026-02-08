import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePassword, hashPassword } from "@/lib/portal-auth";

const RegenerateSchema = z.object({
  linkId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const parsed = RegenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  // Verify ownership
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id")
    .eq("id", parsed.data.linkId)
    .eq("user_id", user.id)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Generate new password
  const plainPassword = generatePassword();
  const { hash, salt } = await hashPassword(plainPassword);

  // Update in DB (use admin client for reliable writes)
  const db = createAdminClient() || supabase;
  const { error: updateError } = await db
    .from("portal_links")
    .update({
      password_hash: hash,
      password_salt: salt,
      failed_attempts: 0,
      is_locked: false,
    })
    .eq("id", link.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Passwort konnte nicht aktualisiert werden" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, password: plainPassword });
}
