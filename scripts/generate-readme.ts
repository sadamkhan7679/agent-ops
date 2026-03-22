import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

type ReadmeSkill = {
  slug: string
  name: string
  description: string
  tags: string[]
  category: string
}

type ReadmeAgent = {
  slug: string
  shortSlug: string
  team: string
  teamLabel: string
  name: string
  description: string
  role: string
  capabilities: string[]
}

type AgentGroup = {
  team: string
  teamLabel: string
  agents: ReadmeAgent[]
}

const ROOT = process.cwd()
const TEMPLATE_PATH = path.join(ROOT, "templates", "README.md")
const OUTPUT_PATH = path.join(ROOT, "README.md")
const SKILLS_DIR = path.join(ROOT, "content", "skills")
const AGENTS_DIR = path.join(ROOT, "content", "agents")

function readDirectories(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) return []

  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function parseFrontmatter(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8")
  return matter(source).data
}

function parseCsvArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string") {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseAgentSlug(slug: string) {
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
    teamLabel: formatLabel(team),
    shortSlug: rest.join("-"),
  }
}

function loadSkills(): ReadmeSkill[] {
  return readDirectories(SKILLS_DIR).map((slug) => {
    const filePath = path.join(SKILLS_DIR, slug, "SKILL.md")
    const data = parseFrontmatter(filePath)

    return {
      slug,
      name: String(data.name ?? slug),
      description: String(data.description ?? ""),
      tags: parseCsvArray(data.tags),
      category: String(data.category ?? "General"),
    }
  })
}

function loadAgents(): ReadmeAgent[] {
  return readDirectories(AGENTS_DIR)
    .map((slug) => {
      const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
      const data = parseFrontmatter(filePath)
      const teamMeta = parseAgentSlug(slug)

      return {
        slug,
        shortSlug: teamMeta.shortSlug,
        team: teamMeta.team,
        teamLabel: teamMeta.teamLabel,
        name: String(data.name ?? formatLabel(teamMeta.shortSlug)),
        description: String(data.description ?? ""),
        role: String(data.role ?? teamMeta.shortSlug),
        capabilities: parseCsvArray(data.capabilities),
      }
    })
    .sort((a, b) => {
      const teamOrder = a.teamLabel.localeCompare(b.teamLabel)
      if (teamOrder !== 0) return teamOrder
      return a.name.localeCompare(b.name)
    })
}

function groupAgentsByTeam(agents: ReadmeAgent[]): AgentGroup[] {
  const grouped = new Map<string, AgentGroup>()

  for (const agent of agents) {
    const existing = grouped.get(agent.team)

    if (existing) {
      existing.agents.push(agent)
      continue
    }

    grouped.set(agent.team, {
      team: agent.team,
      teamLabel: agent.teamLabel,
      agents: [agent],
    })
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.teamLabel.localeCompare(b.teamLabel)
  )
}

function makeStats(skills: ReadmeSkill[], agents: ReadmeAgent[]): string {
  const skillTags = new Set(skills.flatMap((skill) => skill.tags))
  const agentRoles = new Set(agents.map((agent) => agent.role))
  const agentTeams = new Set(agents.map((agent) => agent.team))

  return [
    `- **${skills.length} skills** available locally`,
    `- **${agents.length} agents** available locally`,
    `- **${agentTeams.size} teams** represented`,
    `- **${skillTags.size} unique skill tags**`,
    `- **${agentRoles.size} unique agent roles**`,
  ].join("\n")
}

function makeTeamStats(groups: AgentGroup[]): string {
  return groups
    .map((group) => {
      const noun = group.agents.length === 1 ? "agent" : "agents"
      return `- **${group.teamLabel}**: ${group.agents.length} ${noun}`
    })
    .join("\n")
}

function escapeCell(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ")
}

function makeSkillsTable(skills: ReadmeSkill[]): string {
  const rows = skills.map((skill) => {
    return `| ${escapeCell(skill.name)} | \`${skill.slug}\` | ${escapeCell(
      skill.category
    )} | ${escapeCell(skill.description)} |`
  })

  return [
    "| Skill | Slug | Category | Description |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n")
}

function makeAgentsByTeam(groups: AgentGroup[]): string {
  return groups
    .map((group) => {
      const rows = group.agents.map((agent) => {
        return `| ${escapeCell(agent.name)} | \`${agent.slug}\` | ${escapeCell(
          agent.role
        )} | ${escapeCell(agent.description)} |`
      })

      return [
        `### ${group.teamLabel}`,
        "",
        "| Agent | Slug | Role | Description |",
        "| --- | --- | --- | --- |",
        ...rows,
      ].join("\n")
    })
    .join("\n\n")
}

function generateReadme() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8")
  const skills = loadSkills()
  const agents = loadAgents()
  const groupedAgents = groupAgentsByTeam(agents)

  const output = template
    .replace("{{STATS}}", makeStats(skills, agents))
    .replace("{{TEAM_STATS}}", makeTeamStats(groupedAgents))
    .replace("{{SKILLS_TABLE}}", makeSkillsTable(skills))
    .replace("{{AGENTS_BY_TEAM}}", makeAgentsByTeam(groupedAgents))

  fs.writeFileSync(OUTPUT_PATH, output)
}

generateReadme()
