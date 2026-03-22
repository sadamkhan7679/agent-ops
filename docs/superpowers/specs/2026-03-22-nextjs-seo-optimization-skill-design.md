# Next.js SEO Optimization Skill Design

## Summary

Create a new skill named `nextjs-seo-optimization` for Next.js App Router projects. The skill should combine practical App Router SEO implementation, technical audit discipline, structured data guidance, AI visibility/AEO/GEO considerations, and a limited content-planning layer that directly supports search performance.

## Goals

- Create a production-grade SEO skill specifically for Next.js App Router codebases.
- Prioritize implementation guidance over high-level SEO theory.
- Cover metadata, canonicals, robots, sitemaps, structured data, social previews, rendering strategy, crawlability, and dynamic route metadata.
- Include AI visibility guidance relevant to AEO/GEO/LLM citation without turning the skill into a generic content marketing playbook.
- Include a lightweight content architecture section for intent mapping, internal linking, and page-type planning.

## Non-Goals

- Replace the broader `seo-audit`, `seo-geo`, `ai-seo`, or `content-strategy` skills entirely.
- Provide a framework-agnostic SEO guide.
- Dive deeply into backlink outreach or full editorial planning.

## Skill Identity

- **Slug**: `nextjs-seo-optimization`
- **Name**: `Next.js SEO Optimization`
- **Category**: `Next.js`
- **Audience**: developers working in Next.js App Router apps
- **Tone**: practical, technical, implementation-focused

## Triggering Intent

The skill should trigger when the user asks about:

- Next.js SEO
- App Router metadata
- `generateMetadata`
- canonical tags
- sitemap
- robots.txt
- JSON-LD
- Open Graph
- Twitter cards
- indexing
- crawlability
- AI visibility for a Next.js site
- why a Next.js page is not ranking or not showing in AI answers

The description should deliberately capture near-miss phrasing such as:

- "my Next.js SEO is bad"
- "how do I optimize this Next.js app for Google"
- "how do I add schema to App Router"
- "how do I improve AI visibility in a Next.js site"

## Recommended Scope

The skill should be **implementation-first**, with a smaller content-planning layer only where it directly affects SEO outcomes.

This means:

- **primary focus**: code, metadata, crawlability, rendering, structured data, and route architecture
- **secondary focus**: search intent mapping, internal linking, topic clusters, and page-type planning

## Core Workflow

The skill should define a clear workflow:

1. audit the current SEO state
2. fix foundational metadata
3. fix crawlability and indexation
4. fix canonical and dynamic route handling
5. add structured data
6. improve social metadata and preview images
7. review rendering strategy and performance
8. refine page structure for AEO/GEO/AI extractability
9. improve internal linking and content architecture where needed

## Required Sections

The skill should include these major sections:

1. **When to Use**
2. **SEO Priorities for Next.js App Router**
3. **App Router Metadata Implementation**
4. **Sitemap and Robots**
5. **Structured Data / JSON-LD**
6. **Social Metadata and Preview Images**
7. **Rendering Strategy for SEO**
8. **AEO / GEO / AI Visibility**
9. **Content Planning Guidance**
10. **Audit Checklist**
11. **Examples**
12. **Anti-Patterns**

## App Router Implementation Guidance

This is the heart of the skill.

It should provide explicit guidance for:

- `app/layout.tsx`
- `metadataBase`
- title templates
- route-level metadata
- `generateMetadata` for dynamic pages
- canonical URLs
- Open Graph metadata
- Twitter metadata
- `app/sitemap.ts`
- `app/robots.ts`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- indexable vs non-indexable routes
- `robots` configuration for `noindex`

It should also explain:

- when to use static metadata
- when to use `generateMetadata`
- when a route should be indexable
- how to avoid duplicate metadata across dynamic pages

## Structured Data

The skill should include a detailed structured-data section.

### Schema types to cover

- `WebSite`
- `Organization`
- `CollectionPage`
- `Article`
- `TechArticle`
- `FAQPage`
- `BreadcrumbList`
- `SoftwareApplication`

### Guidance

For each schema, the skill should explain:

- when to use it
- when not to use it
- where it fits in a Next.js App Router codebase
- how to render JSON-LD safely

The skill should strongly note that static HTML inspection alone can mislead schema auditing if the schema is injected client-side, but also steer the user toward server-rendered JSON-LD where possible in App Router.

## AEO / GEO / AI Visibility

The skill should include a focused section on AI search optimization that complements, but does not duplicate, the broader AI SEO skills.

### Required topics

- answer-first content structure
- factual density
- statistics and citations
- freshness signals
- clear heading hierarchy
- FAQ patterns
- structured content blocks
- AI bot access in robots.txt
- pages that are likely to be cited

### Platform-level awareness

The skill can mention:

- Google AI Overviews
- ChatGPT
- Perplexity
- Claude
- Copilot

But it should keep the advice implementation-oriented, not drift into broad platform theory.

## Content Planning Guidance

This section should be intentionally limited.

It should cover:

- mapping page types to search intent
- deciding which pages should be canonical ranking assets
- avoiding keyword cannibalization in route design
- building internal linking between hub pages, collections, and detail pages
- using FAQ or comparison content where relevant
- structuring collection pages so they are useful for both users and crawlers

It should not become a full editorial calendar or full content strategy framework.

## Audit Checklist

The skill should include a concrete audit checklist for Next.js SEO:

- metadata present and unique
- `metadataBase` configured
- canonical URLs correct
- robots.txt exists and is valid
- sitemap exists and is valid
- structured data rendered and appropriate
- OG/Twitter metadata present
- indexable pages are server-rendered or pre-rendered
- non-indexable pages are explicitly marked
- internal links support crawl paths
- page structure supports AI extraction
- obvious Core Web Vitals risks are identified

## Required Examples

The skill should include code examples for:

1. root metadata in `app/layout.tsx`
2. `generateMetadata` on a dynamic route
3. `app/sitemap.ts`
4. `app/robots.ts`
5. reusable JSON-LD component
6. `CollectionPage` JSON-LD
7. `TechArticle` JSON-LD
8. noindex route config
9. canonical handling for dynamic pages
10. OG/Twitter image route implementation

Each example should include:

- code
- short explanation
- why it matters for SEO

## Anti-Patterns

The skill should explicitly reject:

- mixing `next-seo`-style legacy patterns with App Router Metadata API
- missing `metadataBase`
- no canonicals on dynamic pages
- using CSR for important indexable content
- duplicate or boilerplate metadata on many pages
- missing sitemap or robots
- schema types added without matching page purpose
- AI visibility claims without crawlability or content extractability
- over-indexing thin or low-value pages

## Skill Depth Requirements

The skill should be detailed enough to act as a real implementation guide, not a short cheat sheet.

It should:

- explain when to use each implementation pattern
- explain why mistakes matter
- include examples for catalog and detail pages
- include both SEO and AEO/GEO considerations
- include enough audit logic that a developer can use it for both building and reviewing

## Suggested Test Prompts

After drafting the skill, evaluate it with prompts such as:

- "Optimize this Next.js App Router app for SEO and AI visibility."
- "Add sitemap, robots, dynamic metadata, and schema to this Next.js site."
- "Why is my Next.js page not ranking or not showing in AI answers?"
- "Review my App Router metadata setup and tell me what is missing."
- "Add canonical, structured data, and Open Graph support to this dynamic route."
