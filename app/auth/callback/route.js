import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const POST_LOGIN_PATH = "/home";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  // This route has one job: exchange the one-time PKCE code and carry the
  // resulting session cookies on a redirect to the protected home page.
  const response = NextResponse.redirect(new URL(POST_LOGIN_PATH, origin));
  response.headers.set("Cache-Control", "private, no-store");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  return response;
}
