"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex items-center px-2 py-1 text-small text-fg-muted transition-colors hover:text-fg"
    >
      <SignOut className="size-4 sm:hidden" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
