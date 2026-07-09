/**
 * Flat three-facet triangle mark (DESIGN.md §14). Facet tones are token-driven
 * (fg / fg-muted / fg-subtle) so the mark inverts automatically in dark mode —
 * solid fills, hard edges, no gradients.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Artifactuals"
    >
      <polygon points="32,6 8,52 32,37" className="fill-fg" />
      <polygon points="8,52 56,52 32,37" className="fill-fg-muted" />
      <polygon points="32,6 56,52 32,37" className="fill-fg-subtle" />
    </svg>
  );
}
