import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const ROOT = process.cwd()
const TEMPLATE_PATH = path.join(ROOT, "templates", "README.md")
const OUTPUT_PATH = path.join(ROOT, "README.md")
const SKILLS_DIR = path.join(ROOT, "content", "skills")
const AGENTS_DIR = path.join(ROOT, "content", "agents")

function readDirectories(baseDir) {
  if (!fs.existsSync(baseDir)) return []

  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function parseFrontmatter(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  return matter(source).data
}

function parseCsvArray(value) {
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

function loadSkills() {
  return readDirectories(SKILLS_DIR).map((slug) => {
    const filePath = path.join(SKILLS_DIR, slug, "SKILL.md")
    const data = parseFrontmatter(filePath)

    return {
      slug,
      name: data.name ?? slug,
      description: data.description ?? "",
      tags: parseCsvArray(data.tags),
      category: data.category ?? "General",
    }
  })
}

function loadAgents() {
  return readDirectories(AGENTS_DIR).map((slug) => {
    const filePath = path.join(AGENTS_DIR, slug, "AGENT.md")
    const data = parseFrontmatter(filePath)

    return {
      slug,
      name: data.name ?? slug,
      description: data.description ?? "",
      role: data.role ?? slug,
      capabilities: parseCsvArray(data.capabilities),
    }
  })
}

function makeStats(skills, agents) {
  const skillTags = new Set(skills.flatMap((skill) => skill.tags))
  const agentRoles = new Set(agents.map((agent) => agent.role))

  return [
    `- **${skills.length} skills** available locally`,
    `- **${agents.length} agents** available locally`,
    `- **${skillTags.size} unique skill tags**`,
    `- **${agentRoles.size} unique agent roles**`,
  ].join("\n")
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ")
}

function makeSkillsTable(skills) {
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

function makeAgentsTable(agents) {
  const rows = agents.map((agent) => {
    return `| ${escapeCell(agent.name)} | \`${agent.slug}\` | ${escapeCell(
      agent.role
    )} | ${escapeCell(agent.description)} |`
  })

  return [
    "| Agent | Slug | Role | Description |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n")
}

function generateReadme() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8")
  const skills = loadSkills()
  const agents = loadAgents()

  const output = template
    .replace("{{STATS}}", makeStats(skills, agents))
    .replace("{{SKILLS_TABLE}}", makeSkillsTable(skills))
    .replace("{{AGENTS_TABLE}}", makeAgentsTable(agents))

  fs.writeFileSync(OUTPUT_PATH, output)
}

generateReadme()
