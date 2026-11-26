import { ImageResponse } from "next/og";

// The link preview shown when the site is shared (in English, for any audience).
export const alt = "LernKarte — Learn German vocabulary, then use it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(255,204,0,0.16), transparent 60%), radial-gradient(circle at 10% 90%, rgba(221,0,0,0.14), transparent 50%), #07080a",
          color: "#f3f4f6",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "linear-gradient(90deg, #ef4444, #fbbf24)",
              }}
            />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>LernKarte</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Learn German words.</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, color: "#fbbf24" }}>
            Then actually use them.
          </div>
          <div style={{ marginTop: 24, fontSize: 30, color: "#a3a3a3", fontFamily: "sans-serif" }}>
            Spaced repetition · AI-enriched words · Explained sentence feedback
          </div>
        </div>

        <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#262626" }} />
          <div style={{ flex: 1, background: "#dd0000" }} />
          <div style={{ flex: 1, background: "#ffcc00" }} />
        </div>
      </div>
    ),
    size
  );
}
