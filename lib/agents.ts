import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Agent {
  slug: string
  name: string
  description: string
  role: string
  tags: string[]
  version: string
  author: string
  capabilities: string[]
  skills: string[]
  type: string
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
  return Array.isArray(val) ? val : []
}

function parseAgent(slug: string): Agent | null {
  const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { data } = matter(raw)

  return {
    slug,
    name: data.name ?? slug,
    description: data.description ?? "",
    role: data.role ?? slug,
    tags: parseCsvArray(data.tags),
    version: data.version ?? "1.0.0",
    author: data.author ?? "agent-skills",
    capabilities: parseCsvArray(data.capabilities),
    skills: parseCsvArray(data.skills),
    type: data.type ?? "agent",
  }
}

export function getAllAgents(): Agent[] {
  if (!fs.existsSync(AGENTS_DIR)) return []

  return fs
    .readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => parseAgent(d.name))
    .filter((a): a is Agent => a !== null)
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

export function getAgentContent(slug: string): string | null {
  const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { content } = matter(raw)
  return content
}
