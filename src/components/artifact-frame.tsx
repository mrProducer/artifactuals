/**
 * The only way artifacts are ever embedded. `sandbox="allow-scripts"`
 * deliberately omits allow-same-origin so artifact JS runs in an opaque
 * origin with no access to the parent page (handoff §3).
 *
 * `scroll` defaults to true (the full viewer). Set it to false for static
 * previews/thumbnails: the artifact is cross-origin so we can't style its
 * scrollbar from here, but `scrolling="no"` suppresses it and the taller
 * content is simply clipped by the fixed-ratio frame — the intended crop.
 */
export function ArtifactFrame({
  src,
  title,
  className,
  scroll = true,
}: {
  src: string;
  title: string;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <iframe
      src={src}
      title={title}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading="lazy"
      scrolling={scroll ? undefined : "no"}
      className={className ?? "h-full w-full border-0"}
    />
  );
}
