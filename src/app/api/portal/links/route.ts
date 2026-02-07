import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";

const CreateLinkSchema = z.object({
  label: z.string().max(200).optional().default(""),
  expiresAt: z.string().datetime().optional(),
});

const UpdateLinkSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
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

  const { data: link, error } = await supabase
    .from("portal_links")
    .insert({
      user_id: user.id,
      token,
      label: parsed.data.label,
      expires_at: parsed.data.expiresAt || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link }, { status: 201 });
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

  const { data: link, error } = await supabase
    .from("portal_links")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!link) {
    return NextResponse.json(
      { error: "Link nicht gefunden" },
      { status: 404 },
    );
  }

  return NextResponse.json({ link });
}
