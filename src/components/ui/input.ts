/**
 * Shared field treatment (DESIGN.md §8.2). One source of truth for the
 * three previously-duplicated inputClass strings (login, compose, comments).
 * Sharp corners, token-driven, placeholder in --fg-subtle, focus border →
 * accent (the global focus ring in globals.css supplies the visible ring).
 */
export const inputClass =
  "w-full bg-surface border border-border px-3 py-2.5 text-body text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent";
