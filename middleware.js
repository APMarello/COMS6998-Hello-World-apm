import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
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
  const { pathname } = request.nextUrl;

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
    if (allowedDomain) {
      ({ data: profile } = await supabase
        .from("profiles")
        .select("is_whitelisted")
        .eq("id", user.id)
        .maybeSingle());
    } else {
      accessError = "domain";
    }
    if (!allowedDomain || !profile?.is_whitelisted) {
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
