import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getAllSkills, getSkillBySlug } from "@/lib/skills"
import { renderSkillContent } from "@/lib/markdown"
import { APP_DATA } from "@/data/app.data"
import { createMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return getAllSkills().map((skill) => ({ slug: skill.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const skill = getSkillBySlug(slug)

  if (!skill) {
    return createMetadata({
      title: "Skill Not Found",
      description: APP_DATA.appDescription,
      path: `/skills/${slug}`,
    })
  }

  return createMetadata({
    title: skill.name,
    description: skill.description,
    path: `/skills/${skill.slug}`,
    keywords: [...skill.tags, skill.category, "AI skill"],
    type: "article",
  })
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = getSkillBySlug(slug)

  if (!skill) {
    notFound()
  }

  const mdxContent = await renderSkillContent(slug)

  return (
    <>
      {mdxContent && (
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          {mdxContent}
        </div>
      )}
    </>
  )
}
