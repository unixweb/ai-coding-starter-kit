import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get user profile with is_owner flag
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist or is_owner column doesn't exist yet,
      // assume user is owner (existing users before team feature)
      return NextResponse.json({ isOwner: true });
    }

    return NextResponse.json({ isOwner: profile.is_owner ?? true });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
