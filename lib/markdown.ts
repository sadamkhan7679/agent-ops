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
 * Compile a raw markdown string into a React element using MDX.
 */
export async function renderMdx(source: string) {
  const { content } = matter(source)

  const { content: mdxContent } = await compileMDX({
    source: content,
    components: mdxComponents,
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
  return renderMdx(raw)
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
