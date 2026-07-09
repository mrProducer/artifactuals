"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} className="relative hidden sm:block" role="search">
      <MagnifyingGlass
        weight="bold"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
        aria-label="Search users and artifacts"
        className="h-9 w-40 border border-border bg-surface pl-8 pr-2 text-small text-fg placeholder:text-fg-subtle outline-none transition-[width,border-color] focus:w-56 focus:border-accent"
      />
    </form>
  );
}
