import Link from "next/link"
import type { Agent } from "@/lib/agents"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
  agent: Agent
  showTeamBadge?: boolean
}

export function AgentCard({ agent, showTeamBadge = true }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.slug}`} className="group block">
      <Card className="h-full transition-shadow duration-200 group-hover:ring-2 group-hover:ring-primary/20 group-hover:shadow-md">
        <CardHeader>
          {showTeamBadge ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{agent.teamLabel}</Badge>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{agent.name}</CardTitle>
            <Badge variant="outline" className="shrink-0">
              {agent.role}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {agent.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.slice(0, 4).map((cap) => (
              <Badge key={cap} variant="secondary">
                {cap}
              </Badge>
            ))}
            {agent.capabilities.length > 4 && (
              <Badge variant="ghost">
                +{agent.capabilities.length - 4} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
