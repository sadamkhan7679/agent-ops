import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { formatTeamLabel, groupAgentsByTeam } from "@/lib/agent-groups"

export interface Agent {
  slug: string
  shortSlug: string
  name: string
  description: string
  role: string
  tags: string[]
  version: string
  author: string
  capabilities: string[]
  skills: string[]
  type: string
  team: string
  teamLabel: string
}

export interface AgentTeamGroup {
  team: string
  teamLabel: string
  agents: Agent[]
}

const AGENTS_DIR = path.join(process.cwd(), "content", "agents")

function parseCsvArray(val: unknown): string[] {
  if (typeof val === "string") {
    return val
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean)
  }
  return Array.isArray(val) ? val.map(String) : []
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseTeamSlug(slug: string) {
  const [team, ...rest] = slug.split("-")

  if (!team || rest.length === 0) {
    return {
      team: "general",
      teamLabel: "General",
      shortSlug: slug,
    }
  }

  return {
    team,
    teamLabel: formatTeamLabel(team),
    shortSlug: rest.join("-"),
  }
}

function parseAgent(slug: string): Agent | null {
  const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { data } = matter(raw)
  const teamMeta = parseTeamSlug(slug)

  return {
    slug,
    shortSlug: teamMeta.shortSlug,
    name: data.name ?? formatLabel(teamMeta.shortSlug),
    description: data.description ?? "",
    role: data.role ?? teamMeta.shortSlug,
    tags: parseCsvArray(data.tags),
    version: data.version ?? "1.0.0",
    author: data.author ?? "agent-skills",
    capabilities: parseCsvArray(data.capabilities),
    skills: parseCsvArray(data.skills),
    type: data.type ?? "agent",
    team: teamMeta.team,
    teamLabel: teamMeta.teamLabel,
  }
}

export function getAllAgents(): Agent[] {
  if (!fs.existsSync(AGENTS_DIR)) return []

  return fs
    .readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => parseAgent(d.name))
    .filter((a): a is Agent => a !== null)
    .sort((a, b) => {
      const teamOrder = a.teamLabel.localeCompare(b.teamLabel)
      if (teamOrder !== 0) return teamOrder
      return a.name.localeCompare(b.name)
    })
}

export function getAgentBySlug(slug: string): Agent | null {
  return parseAgent(slug)
}

export function getAgentsByRole(role: string): Agent[] {
  return getAllAgents().filter((a) => a.role === role)
}

export function getAllRoles(): string[] {
  const roleSet = new Set<string>()
  for (const agent of getAllAgents()) {
    roleSet.add(agent.role)
  }
  return Array.from(roleSet).sort()
}

export function getAllTeams(): string[] {
  const teamSet = new Set<string>()
  for (const agent of getAllAgents()) {
    teamSet.add(agent.team)
  }
  return Array.from(teamSet).sort()
}

export function getAllAgentsGroupedByTeam(): AgentTeamGroup[] {
  return groupAgentsByTeam(getAllAgents())
}

export function getAgentContent(slug: string): string | null {
  const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { content } = matter(raw)
  return content
}
