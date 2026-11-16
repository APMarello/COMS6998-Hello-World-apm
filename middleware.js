import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // The callback must reach its route handler untouched so its one-time PKCE
  // code is exchanged exactly once and its session cookies are preserved.
  if (pathname.startsWith("/auth/")) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    let accessError = "whitelist";
    const domain = user.email?.split("@").pop()?.toLowerCase();
    const { data: allowedDomain } = await supabase
      .from("allowed_email_domains")
      .select("id")
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();
    let profile;
    let profileError;
    if (allowedDomain) {
      ({ data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_whitelisted")
        .eq("id", user.id)
        .maybeSingle());
    } else {
      accessError = "domain";
    }
    // A new user can legitimately reach this request before their profile is
    // visible. The onboarding UI creates that profile; only an explicit admin
    // revocation should deny a user from an allowed domain.
    if (!allowedDomain || profileError || profile?.is_whitelisted === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", accessError);
      const deniedResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
      return deniedResponse;
    }
  }

  if (!user && pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
