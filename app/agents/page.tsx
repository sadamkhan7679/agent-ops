import type { Metadata } from "next"
import { Bot } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { getAllAgents, getAllTeams } from "@/lib/agents"
import { AgentSearch } from "@/components/agents/agent-search"
import { absoluteUrl, createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  title: "Agents Catalog",
  description:
    "Explore specialized AI agents across engineering, design, marketing, product, and quality teams.",
  path: "/agents",
  keywords: ["AI agents", "agent catalog", "specialized AI agents"],
})

export default function AgentsPage() {
  const agents = getAllAgents()
  const allTeams = getAllTeams()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Agents Catalog",
            url: absoluteUrl("/agents"),
            description:
              "Searchable catalog of specialized AI agents grouped by team and role.",
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Agents Catalog",
            itemListElement: agents.map((agent, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/agents/${agent.slug}`),
              name: agent.name,
            })),
          },
        ]}
      />
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Bot className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Agents Catalog
          </h1>
        </div>
        <p className="text-muted-foreground">
          Explore intelligent agents with specialized roles and capabilities.
        </p>
      </div>

      <AgentSearch agents={agents} allTeams={allTeams} />
    </div>
  )
}
