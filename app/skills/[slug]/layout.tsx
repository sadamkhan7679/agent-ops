import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { getSkillBySlug } from "@/lib/skills"
import { getSkillFileTree } from "@/lib/skill-tree"
import { CopyButton } from "@/components/shared/copy-button"
import { FileTreeSidebar } from "@/components/skills/file-tree-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_DATA } from "@/data/app.data"
import { absoluteUrl } from "@/lib/seo"

export default async function SkillDetailLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = getSkillBySlug(slug)

  if (!skill) {
    notFound()
  }

  const tree = getSkillFileTree(slug)
  const installCommand = `npx skills add ${APP_DATA.repoUrl} --skill ${skill.slug}`

  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 ${
        tree.hasTree ? "max-w-7xl" : "max-w-4xl"
      }`}
    >
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: skill.name,
            description: skill.description,
            url: absoluteUrl(`/skills/${skill.slug}`),
            keywords: skill.tags,
            author: {
              "@type": "Organization",
              name: skill.author,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: absoluteUrl("/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Skills",
                item: absoluteUrl("/skills"),
              },
              {
                "@type": "ListItem",
                position: 3,
                name: skill.name,
                item: absoluteUrl(`/skills/${skill.slug}`),
              },
            ],
          },
        ]}
      />

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

        {/* Content area with optional sidebar */}
        {tree.hasTree ? (
          <div className="flex gap-6">
            <FileTreeSidebar tree={tree} slug={slug} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
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
