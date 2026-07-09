import { ImageResponse } from "next/og";

export const alt = "Artifactuals — a home for the things you build with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site-wide default share image. Sharp, monochrome, matches the app chrome.
// Pages with their own opengraph-image (e.g. artifacts) override this.
export default function Image() {
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
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>
          Artifactuals
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            The things you build with AI deserve a home.
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa", maxWidth: 820 }}>
            Publish interactive artifacts, live and running. Build a portfolio
            under your own name.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            color: "#71717a",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#fafafa",
            }}
          />
          artifactuals.com
        </div>
      </div>
    ),
    { ...size }
  );
}
