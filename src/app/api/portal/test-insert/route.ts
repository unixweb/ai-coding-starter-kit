import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Step 1: Test RPC
    const { data: link, error: rpcError } = await supabase
      .rpc("verify_portal_token", {
        lookup_token: "YnwnVj8l4tA8Ql1i_3Jx8ycg6e7ddkmgR4QSIgdla_s",
      })
      .single<{
        id: string;
        is_active: boolean;
        expires_at: string | null;
        label: string;
      }>();

    if (rpcError) {
      return NextResponse.json({ step: "rpc", error: rpcError });
    }

    // Step 2: Test INSERT
    const { data: submission, error: insertError } = await supabase
      .from("portal_submissions")
      .insert({
        link_id: link.id,
        name: "Debug Test",
        email: "debug@test.com",
        note: "",
        file_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ step: "insert", error: insertError });
    }

    // Step 3: Cleanup - delete test submission
    await supabase.from("portal_submissions").delete().eq("id", submission.id);

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (err) {
    return NextResponse.json({ step: "catch", error: String(err) });
  }
}
