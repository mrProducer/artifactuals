"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Header nav link. Active route gets the accent (ink) + a bottom hairline;
 * inactive is fg-muted → fg on hover (DESIGN.md §8.5).
 */
export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-small transition-colors ${
        active
          ? "font-medium text-accent"
          : "text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}
