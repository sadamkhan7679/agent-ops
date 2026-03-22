import type { Metadata } from "next"

import { APP_DATA } from "@/data/app.data"

const DEFAULT_OG_IMAGE = "/opengraph-image"

export function getSiteUrl() {
  return APP_DATA.siteUrl
}

export function createMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  type = "website",
}: {
  title?: string
  description?: string
  path?: string
  keywords?: string[]
  type?: "website" | "article"
} = {}): Metadata {
  const siteUrl = getSiteUrl()
  const resolvedDescription = description ?? APP_DATA.appDescription
  const resolvedTitle = title ?? APP_DATA.appName
  const canonical =
    path === "/" ? siteUrl : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`

  return {
    metadataBase: new URL(siteUrl),
    applicationName: APP_DATA.appName,
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: [...APP_DATA.defaultKeywords, ...keywords],
    category: "technology",
    creator: APP_DATA.companyName,
    publisher: APP_DATA.companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      locale: APP_DATA.locale,
      url: canonical,
      siteName: APP_DATA.appName,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${APP_DATA.appName} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [DEFAULT_OG_IMAGE],
    },
    authors: [
      {
        name: APP_DATA.companyName,
        url: APP_DATA.repoUrl,
      },
    ],
  }
}

export function absoluteUrl(path = "/") {
  return path === "/"
    ? getSiteUrl()
    : `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
