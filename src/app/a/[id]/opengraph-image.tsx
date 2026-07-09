import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "An interactive artifact on Artifactuals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-artifact share image. When a real screenshot exists we serve it; until
// then we render a branded, artifact-specific card so LinkedIn/X never fall
// back to an unrelated image (e.g. the author's avatar) on the page.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: artifact } = await supabase
    .from("artifacts")
    .select(
      "title, description, preview_image_url, profiles:owner_id (username)"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  // Real screenshot available → use it directly as the card.
  if (artifact?.preview_image_url) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artifact.preview_image_url}
            alt={artifact.title}
            width={size.width}
            height={size.height}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ),
      { ...size }
    );
  }

  const title = artifact?.title ?? "Artifactuals";
  const description =
    artifact?.description ?? "An interactive artifact you can run live.";
  const handle = artifact?.profiles?.username;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "#fafafa",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: -0.5,
          }}
        >
          <div style={{ width: 34, height: 34, background: "#fafafa" }} />
          artifactuals
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: 900,
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#71717a" }}>
          {handle ? `@${handle} · artifactuals.com` : "artifactuals.com"}
        </div>
      </div>
    ),
    { ...size }
  );
}
