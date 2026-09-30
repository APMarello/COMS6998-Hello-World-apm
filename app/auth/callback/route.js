import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(new URL("/movies", origin));
  }

  return NextResponse.redirect(new URL("/login?error=oauth", origin));
}
