import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Keep this response instance while exchanging the OAuth code. Supabase
    // writes the session cookies during the exchange, and they must be present
    // on the redirect that sends the user to the protected page.
    const response = NextResponse.redirect(new URL("/home", origin));
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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let accessError = "whitelist";
      if (data.user?.email) {
        const domain = data.user.email.split("@").pop()?.toLowerCase();
        const { data: allowedDomain } = await supabase
          .from("allowed_email_domains")
          .select("id")
          .eq("domain", domain)
          .eq("is_active", true)
          .maybeSingle();
        if (allowedDomain) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_whitelisted")
            .eq("id", data.user.id)
            .maybeSingle();
          if (profile?.is_whitelisted) return response;
        } else {
          accessError = "domain";
        }
      }

      await supabase.auth.signOut();
      const deniedResponse = NextResponse.redirect(new URL(`/login?error=${accessError}`, origin));
      response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
      return deniedResponse;
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", origin));
}
