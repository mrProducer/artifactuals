// Muted swatches (~lightness 0.6) so avatars read as content and sit under
// the monochrome chrome rather than fighting the accent (DESIGN.md §8.4).
const PALETTE = [
  "bg-rose-500/85",
  "bg-orange-500/85",
  "bg-amber-500/85",
  "bg-emerald-500/85",
  "bg-teal-500/85",
  "bg-sky-500/85",
  "bg-indigo-500/85",
  "bg-violet-500/85",
  "bg-fuchsia-500/85",
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-20 text-2xl sm:size-24",
} as const;

export function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  if (imageUrl) {
    return (
      /* User uploads and GitHub avatars come from hosts that vary by
         environment; next/image would need per-host config for each. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ring-1 ring-border`}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const color = PALETTE[hashString(name) % PALETTE.length];

  return (
    <span
      className={`${SIZES[size]} ${color} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-border`}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
