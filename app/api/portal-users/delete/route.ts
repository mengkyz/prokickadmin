import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Nullify FK references so the delete doesn't violate constraints
  await adminSupabase.from("portal_users").update({ invited_by: null }).eq("invited_by", userId);
  await adminSupabase.from("payment_settings").update({ updated_by: null }).eq("updated_by", userId);

  // Delete from portal_users table
  const { error: dbError } = await adminSupabase.from("portal_users").delete().eq("id", userId);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Delete from Supabase auth (revokes all access)
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
