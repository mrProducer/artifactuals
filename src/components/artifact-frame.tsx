/**
 * The only way artifacts are ever embedded. `sandbox="allow-scripts"`
 * deliberately omits allow-same-origin so artifact JS runs in an opaque
 * origin with no access to the parent page (handoff §3).
 */
export function ArtifactFrame({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      src={src}
      title={title}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className ?? "h-full w-full border-0"}
    />
  );
}
