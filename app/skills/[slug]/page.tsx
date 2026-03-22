import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getAllSkills, getSkillBySlug } from "@/lib/skills"
import { renderSkillContent } from "@/lib/markdown"
import { CopyButton } from "@/components/shared/copy-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_DATA } from "@/data/app.data"

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
  const installCommand = `npx skills add ${APP_DATA.repoUrl} --skill ${skill.slug}`

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

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Install Skill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
              <CopyButton text={installCommand} />
              <pre className="overflow-x-auto px-4 py-4 pr-14 font-mono text-[13px] leading-relaxed text-white/90">
                <code>{installCommand}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

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
