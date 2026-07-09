import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "selected" | "pinned";

const base =
  "inline-flex items-center gap-1 px-2.5 py-0.5 font-mono text-meta uppercase";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-fg-muted",
  selected: "bg-accent text-accent-fg",
  // Semantic highlight (DESIGN.md §8.3) — amber tint, still monochrome chrome.
  pinned: "bg-highlight/15 text-highlight",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${base} ${variants[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
