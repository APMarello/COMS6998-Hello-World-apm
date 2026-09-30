"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";

export default function SignOutButton({ className = "sign-out" }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return <button className={className} type="button" onClick={signOut}>Sign out</button>;
}
