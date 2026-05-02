import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { email, display_name, role, invited_by } = await request.json();

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (!["admin", "coach"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  // Derive origin from the incoming request so it works on both localhost and production
  const origin = new URL(request.url).origin;

  // Send invite email via Supabase Auth
  const { data, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  // Insert into portal_users
  const { error: insertError } = await adminSupabase.from("portal_users").insert({
    id: data.user.id,
    email,
    display_name: display_name || null,
    role,
    invited_by: invited_by || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
