"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin", label: "Reports" },
  { href: "/admin/users", label: "Users" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  const tabClass = (selected: boolean) =>
    `-mb-px border-b-2 px-1 pb-2.5 text-small font-semibold transition-colors ${
      selected
        ? "border-accent text-fg"
        : "border-transparent text-fg-subtle hover:text-fg"
    }`;

  return (
    <div className="mb-6 flex items-end gap-6 border-b border-border">
      {SECTIONS.map((s) => {
        const selected =
          s.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(s.href);
        return (
          <Link key={s.href} href={s.href} className={tabClass(selected)}>
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
