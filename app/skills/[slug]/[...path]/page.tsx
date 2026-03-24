import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getAllSkills, getSkillBySlug } from "@/lib/skills"
import { renderSkillFile, getSkillFileFrontmatter } from "@/lib/markdown"
import { getSkillFilePaths } from "@/lib/skill-tree"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { APP_DATA } from "@/data/app.data"
import { createMetadata } from "@/lib/seo"

export function generateStaticParams() {
  const skills = getAllSkills()
  const params: { slug: string; path: string[] }[] = []

  for (const skill of skills) {
    const filePaths = getSkillFilePaths(skill.slug)
    for (const fp of filePaths) {
      params.push({ slug: skill.slug, path: fp })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; path: string[] }>
}): Promise<Metadata> {
  const { slug, path: pathSegments } = await params
  const skill = getSkillBySlug(slug)
  const relativePath = pathSegments.join("/")

  if (!skill) {
    return createMetadata({
      title: "Not Found",
      description: APP_DATA.appDescription,
      path: `/skills/${slug}/${relativePath}`,
    })
  }

  const frontmatter = getSkillFileFrontmatter(slug, relativePath)
  const title = (frontmatter?.title as string) ?? (frontmatter?.name as string) ?? pathSegments[pathSegments.length - 1]
  const description =
    (frontmatter?.description as string) ?? skill.description

  return createMetadata({
    title: `${title} - ${skill.name}`,
    description,
    path: `/skills/${slug}/${relativePath}`,
    keywords: [...skill.tags, skill.category, "AI skill"],
    type: "article",
  })
}

export default async function SkillFilePage({
  params,
}: {
  params: Promise<{ slug: string; path: string[] }>
}) {
  const { slug, path: pathSegments } = await params
  const skill = getSkillBySlug(slug)

  if (!skill) {
    notFound()
  }

  const relativePath = pathSegments.join("/")
  const mdxContent = await renderSkillFile(slug, relativePath)

  if (!mdxContent) {
    notFound()
  }

  const frontmatter = getSkillFileFrontmatter(slug, relativePath)
  const title = (frontmatter?.title as string) ?? null
  const impact = (frontmatter?.impact as string) ?? null
  const tags = frontmatter?.tags
    ? typeof frontmatter.tags === "string"
      ? (frontmatter.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(frontmatter.tags)
        ? (frontmatter.tags as string[])
        : []
    : []

  return (
    <>
      {/* Guide file header */}
      {(title || impact || tags.length > 0) && (
        <div className="flex flex-col gap-3 pb-2">
          {title && (
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              {impact && (
                <Badge variant="secondary" className="shrink-0">
                  {impact}
                </Badge>
              )}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <Separator />
        </div>
      )}

      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {mdxContent}
      </div>
    </>
  )
}
