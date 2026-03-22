---
name: nextjs-seo-optimization
description: Comprehensive SEO optimization for Next.js App Router projects. Use this whenever the user asks about Next.js SEO, metadata, generateMetadata, canonical URLs, sitemap.xml, robots.txt, JSON-LD, Open Graph, Twitter cards, indexing, crawlability, structured data, AI visibility, AEO, GEO, or why a Next.js page is not ranking or not appearing in AI-generated answers.
version: 1.0.0
type: skill
tags: [nextjs, seo, geo, aeo, ai-visibility, metadata, json-ld]
category: Next.js
author: agent-skills
---

# Next.js SEO Optimization

Use this skill for **Next.js App Router** codebases when the goal is to improve:

- search engine visibility
- crawlability and indexation
- structured data coverage
- social metadata quality
- AI visibility across Google AI Overviews, ChatGPT, Perplexity, Claude, and Copilot

This skill is **implementation-first**. It is not only an SEO checklist. It is a build-and-audit guide for real Next.js projects.

## When To Use

Use this skill when the user asks any variation of:

- "How do I optimize this Next.js app for SEO?"
- "How do I use `generateMetadata` correctly?"
- "How do I add sitemap and robots to App Router?"
- "How do I add structured data / JSON-LD to Next.js?"
- "Why is this page not ranking?"
- "Why is this page not indexed?"
- "How do I improve AI visibility for my Next.js site?"
- "How do I add Open Graph or Twitter images?"
- "How should I handle canonical URLs for dynamic routes?"

Use it even if the user only says:

- "my Next.js SEO is bad"
- "help with indexing"
- "add metadata"
- "improve AI search visibility"

## Core Workflow

When applying this skill, follow this order:

1. audit current SEO state
2. fix metadata foundations
3. fix crawlability and indexation
4. fix canonical handling
5. add or correct structured data
6. improve social preview metadata
7. review rendering strategy and performance risks
8. improve AI extractability and citation readiness
9. improve internal linking and content architecture where needed

Do not start with minor meta-tag tweaks if the app is missing sitemap, robots, canonical handling, or route-specific metadata.

## SEO Priorities For Next.js App Router

Prioritize in this order:

### 1. Metadata correctness

Every indexable page needs:

- a useful title
- a meaningful description
- a canonical URL
- correct robots policy

### 2. Crawlability and indexation

Make sure search engines and AI crawlers can actually access the pages:

- `robots.txt`
- `sitemap.xml`
- canonical consistency
- indexable rendering paths

### 3. Structured data

Use schema to improve machine understanding:

- site-level schema
- collection page schema
- article or tech article schema
- FAQ schema where justified

### 4. Rendering strategy

Do not rely on client-only rendering for pages that should rank.

### 5. AI visibility

Make content easier to extract, summarize, and cite:

- answer-first structure
- clear headings
- statistics and citations
- factual density
- structured content blocks

## App Router Metadata Implementation

### Root metadata in `app/layout.tsx`

The root layout should define:

- `metadataBase`
- title template
- default description
- Open Graph defaults
- Twitter defaults
- robots defaults
- viewport export

Use the App Router Metadata API, not legacy SEO libraries designed for Pages Router.

**Example:**

```tsx
import type { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c111d" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "AgentOps",
    template: "%s | AgentOps",
  },
  description: "Discover reusable AI skills and specialized agents.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "AgentOps",
    title: "AgentOps",
    description: "Discover reusable AI skills and specialized agents.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentOps",
    description: "Discover reusable AI skills and specialized agents.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

### Route-level metadata

Use static `metadata` when the page is fixed.

Use `generateMetadata` when:

- the page is dynamic
- the title depends on fetched content
- the canonical depends on `params`
- the description should be item-specific

### Dynamic metadata with `generateMetadata`

**Example:**

```tsx
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
  }
}
```

### Canonical URLs

Every unique ranking page should have a self-referencing canonical unless there is a deliberate canonical target elsewhere.

Use canonicals to avoid:

- duplicate dynamic pages
- trailing slash inconsistencies
- parameter duplication
- accidental alternate URLs competing with the main version

## Sitemap And Robots

### `app/sitemap.ts`

Create a sitemap that includes:

- home page
- collection pages
- important static pages
- dynamic detail pages

Only include canonical, indexable URLs.

**Example:**

```tsx
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://example.com"
  const lastModified = new Date()

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]
}
```

### `app/robots.ts`

Create a valid robots policy with:

- general allow rules
- explicit disallow for internal-only paths
- sitemap reference
- host

Do not block assets needed for rendering.

**Example:**

```tsx
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://example.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
```

### AI bot access

If AI visibility matters, review robots access for:

- `GPTBot`
- `ChatGPT-User`
- `PerplexityBot`
- `ClaudeBot`
- `Bingbot`
- `Googlebot`

Be careful: blocking AI bots can protect against training in some cases, but it can also reduce or eliminate citation opportunities.

## Structured Data / JSON-LD

Structured data helps search engines and AI systems understand the page more reliably.

Use schema that matches page purpose. Do not add schema just to say you did.

### Recommended schema types

#### `WebSite`

Use on the homepage for the site identity.

#### `Organization`

Use for site or company identity, often on the homepage.

#### `CollectionPage`

Use on catalog and listing pages such as:

- `/skills`
- `/agents`
- `/blog`

#### `Article` / `TechArticle`

Use on detailed educational or documentation-like pages.

#### `FAQPage`

Use only when the page actually contains real FAQ content visible to users.

#### `BreadcrumbList`

Use when breadcrumb navigation exists or when hierarchical navigation matters.

#### `SoftwareApplication`

Use for actual tools/apps, not every content site by default.

### Reusable JSON-LD component

**Example:**

```tsx
interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}
```

### `CollectionPage` example

```tsx
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Skills Catalog",
    url: "https://example.com/skills",
    description: "Searchable catalog of reusable AI skills.",
  }}
/>
```

### `TechArticle` example

```tsx
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.description,
    url: `https://example.com/blog/${article.slug}`,
    author: {
      "@type": "Organization",
      name: "AgentOps",
    },
  }}
/>
```

## Social Metadata And Preview Images

Every important indexable page should have:

- Open Graph metadata
- Twitter card metadata
- a valid preview image

### OG and Twitter image routes

Use generated image routes when possible for consistency.

**Example:**

```tsx
import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      SEO-ready Next.js preview
    </div>,
    size
  )
}
```

Use a reliable sitewide fallback image even if you do not yet have per-page image generation.

## Rendering Strategy For SEO

Choose rendering based on indexability needs.

### Best for SEO pages

- static generation
- ISR
- server-rendered pages that return complete HTML

### Avoid for ranking pages

- client-only rendering
- heavy content that only appears after hydration

Use CSR for:

- dashboards
- authenticated tools
- user-private app surfaces

Do not use CSR as the default for public ranking pages.

## AEO / GEO / AI Visibility

AI systems cite pages they can understand, extract, and trust.

### Make pages easier to cite

- lead with the answer early
- use headings that reflect real user questions
- include statistics and attributed claims
- keep content fresh
- make key passages self-contained
- use comparison tables and FAQ blocks when relevant

### Content structure patterns that help

- answer-first introductions
- short factual paragraphs
- bullet lists
- numbered steps
- comparison tables
- FAQ sections with visible questions and answers

### AI visibility checklist

- AI bots are not unintentionally blocked
- page has useful metadata
- page has structured data where appropriate
- page has factual density, not vague marketing filler
- page is recent enough to be trustworthy
- page is easy to quote without surrounding context

## Content Planning Guidance

This skill is not a full content strategy framework, but it should guide page architecture where it affects SEO.

### Map page types to intent

- homepage: broad value proposition and entity clarity
- collection pages: category and discovery intent
- detail pages: specific intent and deep relevance
- FAQ pages: question-answer intent
- comparison pages: evaluation intent
- tutorial pages: how-to intent

### Avoid cannibalization

Do not create many pages that target the same intent with only slight wording differences.

Make it clear which page is the main ranking asset for a topic.

### Internal linking

Build clear paths between:

- collection pages and detail pages
- pillar pages and supporting content
- related FAQs and tutorials
- comparisons and product/service pages

### Topic clusters

Use lightweight cluster thinking:

- broad hub page
- supporting detail pages
- related FAQs
- linked comparison/tutorial content

## Audit Checklist

Run this checklist on Next.js projects:

1. root metadata exists
2. `metadataBase` is set
3. title template is configured
4. route-level metadata is specific and useful
5. dynamic routes use `generateMetadata` where needed
6. canonical URLs are correct
7. `robots.txt` exists
8. `sitemap.xml` exists
9. structured data is present where appropriate
10. OG/Twitter metadata exists
11. indexable pages are not CSR-only
12. important pages are linked internally
13. content structure supports AI extractability
14. obvious Core Web Vitals risks are identified

## Examples

### Example 1: Root metadata

Use root metadata for:

- defaults
- templates
- social defaults
- robots defaults

Do not repeat sitewide defaults in every route file.

### Example 2: Dynamic route metadata

Use `generateMetadata` when content is slug-specific and canonical URLs are dynamic.

### Example 3: Noindex route

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
```

Use this for:

- admin pages
- internal tools
- temporary test routes
- thin pages you do not want indexed

### Example 4: Catalog page schema

Use `CollectionPage` schema and meaningful descriptive metadata.

### Example 5: Detail page schema

Use `Article` or `TechArticle` when the page is instructional or documentation-like.

## Anti-Patterns

Avoid these:

### Mixing old SEO tooling with App Router Metadata API

Use App Router metadata patterns consistently.

### Missing `metadataBase`

Without it, relative metadata can resolve incorrectly.

### Duplicate metadata across dynamic pages

Every important detail page should have content-aware metadata.

### Missing canonicals

Dynamic content without canonical control is a duplication risk.

### CSR for important ranking pages

This weakens indexability and often hurts discoverability.

### Schema with no page-purpose alignment

Do not add `FAQPage` if the page is not actually an FAQ page.

### Thin indexable pages

Do not push weak, duplicate, or low-value pages into the sitemap.

### AI visibility without technical foundations

Do not optimize for citations before crawlability, metadata, canonicals, and content structure are in place.

## Output Expectations

When applying this skill, produce:

- an SEO audit of the current Next.js implementation
- a concrete implementation plan
- the necessary App Router code changes
- route-specific metadata decisions
- structured data additions where justified
- notes on AEO/GEO improvements where relevant
- any content architecture recommendations that directly support SEO
