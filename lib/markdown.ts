import type { ComponentPropsWithoutRef } from "react"
import fs from "fs"
import path from "path"
import { compileMDX } from "next-mdx-remote/rsc"
import matter from "gray-matter"
import { mdxComponents } from "@/mdx-components"
import remarkGfm from "remark-gfm"
import rehypePrettyCode from "rehype-pretty-code"

type PrettyCodeOptions = {
  theme: string
  keepBackground: boolean
}

/**
 * Check if a URL is relative (not absolute, not http, not anchor-only).
 */
function isRelativeUrl(href: string): boolean {
  return (
    !href.startsWith("http") &&
    !href.startsWith("//") &&
    !href.startsWith("#") &&
    !href.startsWith("/")
  )
}

/**
 * Compile a raw markdown string into a React element using MDX.
 * When `basePath` is provided, relative links are resolved against it.
 */
export async function renderMdx(source: string, basePath?: string) {
  const { content } = matter(source)

  // Merge custom link resolver when basePath is provided
  const components = basePath
    ? {
        ...mdxComponents,
        a: ({
          href,
          ...props
        }: ComponentPropsWithoutRef<"a">) => {
          const resolved =
            href && isRelativeUrl(href) ? `${basePath}/${href}` : href
          return mdxComponents.a({ href: resolved, ...props })
        },
      }
    : mdxComponents

  const { content: mdxContent } = await compileMDX({
    source: content,
    components,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: "github-dark",
              keepBackground: true,
            } satisfies PrettyCodeOptions,
          ],
        ],
      },
    },
  })

  return mdxContent
}

/**
 * Read and compile a skill's SKILL.md into a React element.
 */
export async function renderSkillContent(slug: string) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "skills",
    slug,
    "SKILL.md"
  )
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  return renderMdx(raw, `/skills/${slug}`)
}

/**
 * Read and compile any file within a skill directory into a React element.
 * `relativePath` is without .md extension (e.g., "guides/performance-list-optimization").
 * Pass empty string for SKILL.md.
 */
export async function renderSkillFile(slug: string, relativePath: string) {
  const fileName = relativePath ? `${relativePath}.md` : "SKILL.md"
  const filePath = path.join(process.cwd(), "content", "skills", slug, fileName)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  return renderMdx(raw, `/skills/${slug}`)
}

/**
 * Get frontmatter from any file within a skill directory.
 */
export function getSkillFileFrontmatter(
  slug: string,
  relativePath: string
): Record<string, unknown> | null {
  const fileName = relativePath ? `${relativePath}.md` : "SKILL.md"
  const filePath = path.join(process.cwd(), "content", "skills", slug, fileName)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { data } = matter(raw)
  return data
}

/**
 * Read and compile an agent's AGENT.md into a React element.
 */
export async function renderAgentContent(slug: string) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "agents",
    slug,
    "AGENT.md"
  )
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  return renderMdx(raw)
}
