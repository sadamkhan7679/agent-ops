"use client"

import { useState, useMemo } from "react"
import type { Agent } from "@/lib/agents"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AgentGrid } from "./agent-grid"
import { cn } from "@/lib/utils"
import { formatTeamLabel } from "@/lib/agent-groups"
import { Search } from "lucide-react"

interface AgentSearchProps {
  agents: Agent[]
  allTeams: string[]
}

export function AgentSearch({ agents, allTeams }: AgentSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = agents

    if (selectedTeam) {
      result = result.filter((a) => a.team === selectedTeam)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.teamLabel.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.shortSlug.toLowerCase().includes(q) ||
          a.capabilities.some((c) => c.toLowerCase().includes(q))
      )
    }

    return result
  }, [agents, query, selectedTeam])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTeam(null)}
          className="cursor-pointer"
        >
          <Badge
            variant={selectedTeam === null ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              selectedTeam === null && "ring-1 ring-primary/30"
            )}
          >
            All Teams
          </Badge>
        </button>
        {allTeams.map((team) => (
          <button
            key={team}
            onClick={() =>
              setSelectedTeam(selectedTeam === team ? null : team)
            }
            className="cursor-pointer"
          >
            <Badge
              variant={selectedTeam === team ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {formatTeamLabel(team)}
            </Badge>
          </button>
        ))}
      </div>

      <AgentGrid agents={filtered} />
    </div>
  )
}
