import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getAllAgents, getAgentBySlug } from "@/lib/agents"
import { getSkillBySlug } from "@/lib/skills"
import { renderAgentContent } from "@/lib/markdown"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { APP_DATA } from "@/data/app.data"
import { absoluteUrl, createMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return getAllAgents().map((agent) => ({ slug: agent.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const agent = getAgentBySlug(slug)

  if (!agent) {
    return createMetadata({
      title: "Agent Not Found",
      description: APP_DATA.appDescription,
      path: `/agents/${slug}`,
    })
  }

  return createMetadata({
    title: agent.name,
    description: agent.description,
    path: `/agents/${agent.slug}`,
    keywords: [...agent.tags, agent.role, agent.teamLabel, "AI agent"],
  })
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = getAgentBySlug(slug)

  if (!agent) {
    notFound()
  }

  const mdxContent = await renderAgentContent(slug)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: agent.name,
          description: agent.description,
          url: absoluteUrl(`/agents/${agent.slug}`),
          keywords: agent.tags,
          author: {
            "@type": "Organization",
            name: agent.author,
          },
        }}
      />
      <Button
        render={<Link href="/agents" />}
        variant="ghost"
        size="sm"
        className="mb-6"
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        Back to Agents
      </Button>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant="secondary" className="mt-1.5 shrink-0">
              {agent.teamLabel}
            </Badge>
            <Badge variant="outline" className="mt-1.5 shrink-0">
              {agent.role}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">{agent.description}</p>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <MetaItem label="Version" value={agent.version} />
          <MetaItem label="Author" value={agent.author} />
          <MetaItem label="Team" value={agent.teamLabel} />
          <MetaItem label="Role" value={agent.role} />
          <MetaItem
            label="Capabilities"
            value={agent.capabilities.length.toString()}
          />
        </div>

        {/* Capabilities */}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Capabilities
          </h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <Badge key={cap} variant="secondary">
                {cap}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Associated Skills */}
        {agent.skills.length > 0 && (() => {
          const localSkills = agent.skills
            .map((s) => ({ slug: s, data: getSkillBySlug(s) }))
            .filter((s) => s.data !== null)
          const externalSkills = agent.skills.filter(
            (s) => getSkillBySlug(s) === null
          )

          return (
            <>
              <Separator />
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Associated Skills ({agent.skills.length})
                </h2>

                {/* Local skills — from this repo */}
                {localSkills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">
                      Included in this repo
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {localSkills.map(({ slug: skillSlug, data: skill }) => (
                        <Link
                          key={skillSlug}
                          href={`/skills/${skillSlug}`}
                          className="group block"
                        >
                          <Card className="h-full transition-shadow duration-200 group-hover:ring-2 group-hover:ring-primary/20 group-hover:shadow-md">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">
                                {skill!.name}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 text-xs">
                                {skill!.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <code className="block rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                                claude install-skill content/skills/{skillSlug}
                              </code>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* External skills — from skills.sh registry */}
                {externalSkills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">
                      From skills.sh registry
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {externalSkills.map((skillSlug) => (
                        <Card key={skillSlug}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              {skillSlug
                                .split("-")
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <code className="block rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                              /install-skill {skillSlug}
                            </code>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )
        })()}

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
