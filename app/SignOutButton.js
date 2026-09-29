"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <button className="sign-out" type="button" onClick={signOut}>Sign out</button>;
}
