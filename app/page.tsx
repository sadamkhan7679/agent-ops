import type { Metadata } from "next"

import { JsonLd } from "@/components/seo/json-ld"
import { Separator } from "@/components/ui/separator"
import { HomeFeaturedAgents } from "@/components/views/home-featured-agents"
import { HomeFeaturedSkills } from "@/components/views/home-featured-skills"
import { HomeHero } from "@/components/views/home-hero"
import { HomeStats } from "@/components/views/home-stats"
import { APP_DATA } from "@/data/app.data"
import { groupAgentsByTeam } from "@/lib/agent-groups"
import { getAllAgents } from "@/lib/agents"
import { absoluteUrl, createMetadata } from "@/lib/seo"
import { getAllSkills } from "@/lib/skills"

export const metadata: Metadata = createMetadata({
  description:
    "Browse installable AI skills and specialized agents for Claude-style workflows, with searchable catalogs, rich detail pages, and copy-ready install commands.",
  keywords: [
    "AI skills registry",
    "AI agent catalog",
    "Claude agents",
    "Claude Code skills",
  ],
})

export default function Page() {
  const skills = getAllSkills()
  const agents = getAllAgents()
  const featuredSkills = skills.slice(0, 3)
  const featuredAgentGroups = groupAgentsByTeam(agents).slice(0, 3)

  const stats = [
    { label: "Skills", value: skills.length },
    { label: "Agents", value: agents.length },
    { label: "Teams", value: new Set(agents.map((agent) => agent.team)).size },
    { label: "Roles", value: new Set(agents.map((agent) => agent.role)).size },
  ]

  return (
    <div className="flex flex-col">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: APP_DATA.appName,
            url: absoluteUrl("/"),
            description: APP_DATA.appDescription,
            inLanguage: "en-US",
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: APP_DATA.appName,
            url: absoluteUrl("/"),
            sameAs: [APP_DATA.repoUrl],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Featured AI Skills and Agents",
            itemListElement: [
              ...featuredSkills.map((skill, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: absoluteUrl(`/skills/${skill.slug}`),
                name: skill.name,
              })),
              ...featuredAgentGroups.flatMap((group, groupIndex) =>
                group.agents.map((agent, agentIndex) => ({
                  "@type": "ListItem",
                  position:
                    featuredSkills.length +
                    groupIndex * group.agents.length +
                    agentIndex +
                    1,
                  url: absoluteUrl(`/agents/${agent.slug}`),
                  name: agent.name,
                }))
              ),
            ],
          },
        ]}
      />
      <HomeHero
        title={APP_DATA.appName}
        description="Discover, explore, and integrate reusable skills and intelligent agents built for Claude and beyond."
      />

      <Separator />
      <HomeStats stats={stats} />

      <Separator />
      <HomeFeaturedSkills skills={featuredSkills} />

      <Separator />
      <HomeFeaturedAgents groups={featuredAgentGroups} />
    </div>
  )
}
