import type { Agent, AgentTeamGroup } from "@/lib/agents"

export function formatTeamLabel(team: string) {
  return team
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function groupAgentsByTeam(agents: Agent[]): AgentTeamGroup[] {
  const groups = new Map<string, AgentTeamGroup>()

  for (const agent of agents) {
    const group = groups.get(agent.team)

    if (group) {
      group.agents.push(agent)
      continue
    }

    groups.set(agent.team, {
      team: agent.team,
      teamLabel: agent.teamLabel,
      agents: [agent],
    })
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.teamLabel.localeCompare(b.teamLabel)
  )
}
