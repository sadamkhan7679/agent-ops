import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = absoluteUrl("/")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot"],
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
