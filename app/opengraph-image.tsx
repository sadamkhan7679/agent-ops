import { ImageResponse } from "next/og"

import { APP_DATA } from "@/data/app.data"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, rgb(12,17,29) 0%, rgb(28,43,74) 45%, rgb(228,244,250) 100%)",
          color: "white",
          padding: "56px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {APP_DATA.appName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              maxWidth: 880,
              lineHeight: 1.05,
            }}
          >
            AI Skills and Agents for Production Workflows
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              maxWidth: 860,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Searchable, installable skill and agent registry built with Next.js.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {APP_DATA.repoUrl.replace("https://", "")}
        </div>
      </div>
    ),
    size
  )
}
