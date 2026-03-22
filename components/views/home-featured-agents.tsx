import Link from "next/link"
import { ArrowRight, Bot } from "lucide-react"

import type { AgentTeamGroup } from "@/lib/agents"
import { Badge } from "@/components/ui/badge"
import { AgentCard } from "@/components/agents/agent-card"

interface HomeFeaturedAgentsProps {
  groups: AgentTeamGroup[]
}

export function HomeFeaturedAgents({ groups }: HomeFeaturedAgentsProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Agents By Team</h2>
        </div>
        <Link
          href="/agents"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.team} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold tracking-tight">
                {group.teamLabel}
              </h3>
              <Badge variant="outline">{group.agents.length} total</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.agents.slice(0, 3).map((agent) => (
                <AgentCard
                  key={agent.slug}
                  agent={agent}
                  showTeamBadge={false}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
