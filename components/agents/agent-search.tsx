"use client"

import { useState, useMemo } from "react"
import type { Agent } from "@/lib/agents"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AgentGrid } from "./agent-grid"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface AgentSearchProps {
  agents: Agent[]
  allRoles: string[]
}

export function AgentSearch({ agents, allRoles }: AgentSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = agents

    if (selectedRole) {
      result = result.filter((a) => a.role === selectedRole)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.capabilities.some((c) => c.toLowerCase().includes(q))
      )
    }

    return result
  }, [agents, query, selectedRole])

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
          onClick={() => setSelectedRole(null)}
          className="cursor-pointer"
        >
          <Badge
            variant={selectedRole === null ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              selectedRole === null && "ring-1 ring-primary/30"
            )}
          >
            All Roles
          </Badge>
        </button>
        {allRoles.map((role) => (
          <button
            key={role}
            onClick={() =>
              setSelectedRole(selectedRole === role ? null : role)
            }
            className="cursor-pointer"
          >
            <Badge
              variant={selectedRole === role ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {role}
            </Badge>
          </button>
        ))}
      </div>

      <AgentGrid agents={filtered} />
    </div>
  )
}
