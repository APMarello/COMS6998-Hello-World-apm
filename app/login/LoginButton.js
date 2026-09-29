"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function LoginButton() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.url) window.location.assign(data.url);
  }

  return (
    <>
      <button className="google-login" type="button" onClick={signInWithGoogle} disabled={loading}>
        <span aria-hidden="true">G</span>
        {loading ? "Taking you to Google…" : "Continue with Google"}
      </button>
      {error && <p className="login-error" role="alert">Unable to sign in: {error}</p>}
    </>
  );
}
