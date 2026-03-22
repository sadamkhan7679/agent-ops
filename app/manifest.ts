import type { MetadataRoute } from "next"

import { APP_DATA } from "@/data/app.data"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_DATA.appName,
    short_name: APP_DATA.appName,
    description: APP_DATA.appDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c111d",
    lang: "en-US",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
