import { Separator } from "@/components/ui/separator"
import { HomeFeaturedAgents } from "@/components/views/home-featured-agents"
import { HomeFeaturedSkills } from "@/components/views/home-featured-skills"
import { HomeHero } from "@/components/views/home-hero"
import { HomeStats } from "@/components/views/home-stats"
import { APP_DATA } from "@/data/app.data"
import { groupAgentsByTeam } from "@/lib/agent-groups"
import { getAllAgents } from "@/lib/agents"
import { getAllSkills } from "@/lib/skills"

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
