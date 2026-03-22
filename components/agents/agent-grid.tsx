import type { Agent } from "@/lib/agents"
import { groupAgentsByTeam } from "@/lib/agent-groups"
import { Badge } from "@/components/ui/badge"
import { AgentCard } from "./agent-card"

interface AgentGridProps {
  agents: Agent[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No agents found matching your criteria.
      </div>
    )
  }

  const groupedAgents = groupAgentsByTeam(agents)

  return (
    <div className="flex flex-col gap-8">
      {groupedAgents.map((group) => (
        <section key={group.team} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {group.teamLabel}
            </h2>
            <Badge variant="outline">{group.agents.length} agents</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.agents.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} showTeamBadge={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
