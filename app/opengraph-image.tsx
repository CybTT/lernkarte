import { ImageResponse } from "next/og";

// The link preview shown when the site is shared (in English, for any audience).
export const alt = "LernKarte — Write a sentence with every German word you learn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#100f0d";
const PAPER = "#efe9de";
const RED = "#e2462c";

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
          background: INK,
          color: PAPER,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: RED }} />
          <div style={{ fontSize: 40, fontWeight: 700 }}>LernKarte</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.08, maxWidth: 980 }}>
            Write a sentence with every German word you learn.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#9c968b" }}>
            Spaced repetition, and feedback that explains every mistake.
          </div>
        </div>

        <div style={{ display: "flex", height: 4, background: RED, width: 160 }} />
      </div>
    ),
    size
  );
}
