import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { generatePassword, hashPassword } from "@/lib/portal-auth";
import { del, list } from "@vercel/blob";

const CreateLinkSchema = z.object({
  label: z.string().max(200).optional().default(""),
  expiresAt: z.string().datetime().optional(),
});

const UpdateLinkSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, "Name darf nicht leer sein").max(200).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  password: z
    .union([z.string().min(8, "Mindestens 8 Zeichen"), z.literal("")])
    .optional(),
  client_email: z
    .union([z.string().email("Ungueltige E-Mail-Adresse"), z.literal(""), z.null()])
    .optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { data: links, error } = await supabase
    .from("portal_links")
    .select("*, portal_submissions(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (links || []).map((link) => ({
    id: link.id,
    token: link.token,
    label: link.label,
    is_active: link.is_active,
    is_locked: link.is_locked ?? false,
    expires_at: link.expires_at,
    created_at: link.created_at,
    submission_count: link.portal_submissions?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ links: result });
}

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

  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const token = randomBytes(32).toString("base64url");

  // Generate password for the new link
  const plainPassword = generatePassword();
  const { hash, salt } = await hashPassword(plainPassword);

  const { data: link, error } = await supabase
    .from("portal_links")
    .insert({
      user_id: user.id,
      token,
      label: parsed.data.label,
      expires_at: parsed.data.expiresAt || null,
      password_hash: hash,
      password_salt: salt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link, password: plainPassword }, { status: 201 });
}

export async function PATCH(request: Request) {
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

  const parsed = UpdateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (parsed.data.label !== undefined) updateData.label = parsed.data.label;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.is_active !== undefined)
    updateData.is_active = parsed.data.is_active;
  if (parsed.data.client_email !== undefined) {
    // Empty string or null clears the email
    updateData.client_email =
      parsed.data.client_email === "" ? null : parsed.data.client_email;
  }

  // Handle password: non-empty string = set new password, empty string = no change
  if (parsed.data.password && parsed.data.password.length > 0) {
    const { hash, salt } = await hashPassword(parsed.data.password);
    updateData.password_hash = hash;
    updateData.password_salt = salt;
    updateData.failed_attempts = 0;
    updateData.is_locked = false;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Keine Aenderungen" }, { status: 400 });
  }

  // Use admin client if password is being set (to bypass RLS for password columns)
  const client = updateData.password_hash
    ? createAdminClient() || supabase
    : supabase;

  const { data: link, error } = await client
    .from("portal_links")
    .update(updateData)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id Parameter fehlt" }, { status: 400 });
  }

  // Verify ownership
  const { data: link, error: linkError } = await supabase
    .from("portal_links")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link nicht gefunden" }, { status: 404 });
  }

  // Delete all blob files under portal/{linkId}/
  try {
    const prefix = `portal/${link.id}/`;
    let cursor: string | undefined;
    do {
      const result = await list({ prefix, cursor });
      if (result.blobs.length > 0) {
        await del(result.blobs.map((b) => b.url));
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  } catch {
    // Continue even if blob cleanup fails
  }

  // Delete portal link (submissions cascade via DB)
  const admin = createAdminClient();
  const client = admin || supabase;

  const { error: deleteError } = await client
    .from("portal_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
