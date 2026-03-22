import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getAllSkills, getSkillBySlug } from "@/lib/skills"
import { renderSkillContent } from "@/lib/markdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function generateStaticParams() {
  return getAllSkills().map((skill) => ({ slug: skill.slug }))
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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Button
        render={<Link href="/skills" />}
        variant="ghost"
        size="sm"
        className="mb-6"
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        Back to Skills
      </Button>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
          <p className="text-lg text-muted-foreground">{skill.description}</p>

          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetaItem label="Version" value={skill.version} />
          <MetaItem label="Author" value={skill.author} />
          <MetaItem label="Category" value={skill.category} />
          <MetaItem label="Tags" value={skill.tags.length.toString()} />
        </div>

        {/* MDX content */}
        {mdxContent && (
          <>
            <Separator />
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              {mdxContent}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
