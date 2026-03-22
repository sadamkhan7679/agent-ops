import { Bot } from "lucide-react"

import { getAllAgents, getAllTeams } from "@/lib/agents"
import { AgentSearch } from "@/components/agents/agent-search"
import { APP_DATA } from "@/data/app.data"

export const metadata = {
  title: `Agents Catalog - ${APP_DATA.appName}`,
  description: "Browse all available intelligent agents.",
}

export default function AgentsPage() {
  const agents = getAllAgents()
  const allTeams = getAllTeams()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
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
