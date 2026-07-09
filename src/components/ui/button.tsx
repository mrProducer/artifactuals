import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-[background-color,border-color,color,transform] duration-[120ms] ease-out select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const sizes: Record<ButtonSize, string> = {
  // Hit target ≥ 40px (DESIGN.md §10).
  sm: "h-9 px-3 text-small",
  md: "h-10 px-5 text-small",
};

const variants: Record<ButtonVariant, string> = {
  // Ink-filled plate that inverts to paper on dark (tokens handle the flip).
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary:
    "bg-surface text-fg border border-border hover:border-border-strong",
  ghost: "bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg",
  danger: "bg-transparent text-fg-muted hover:bg-surface-muted hover:text-danger",
};

/**
 * Shared button treatment as a class string, so `<button>` and `<Link>`
 * (used heavily as buttons in this app) render identically.
 */
export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}
