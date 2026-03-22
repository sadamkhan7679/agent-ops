import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Skill {
  slug: string
  name: string
  description: string
  tags: string[]
  version: string
  author: string
  category: string
  type: string
}

const SKILLS_DIR = path.join(process.cwd(), "content", "skills")

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

function parseSkill(slug: string): Skill | null {
  const filePath = path.join(SKILLS_DIR, slug, "SKILL.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { data } = matter(raw)

  return {
    slug,
    name: data.name ?? slug,
    description: data.description ?? "",
    tags: parseCsvArray(data.tags),
    version: data.version ?? "1.0.0",
    author: data.author ?? "agent-skills",
    category: data.category ?? "General",
    type: data.type ?? "skill",
  }
}

export function getAllSkills(): Skill[] {
  if (!fs.existsSync(SKILLS_DIR)) return []

  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => parseSkill(d.name))
    .filter((s): s is Skill => s !== null)
}

export function getSkillBySlug(slug: string): Skill | null {
  return parseSkill(slug)
}

export function getSkillsByTag(tag: string): Skill[] {
  return getAllSkills().filter((s) => s.tags.includes(tag))
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>()
  for (const skill of getAllSkills()) {
    for (const tag of skill.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

export function getSkillContent(slug: string): string | null {
  const filePath = path.join(SKILLS_DIR, slug, "SKILL.md")
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { content } = matter(raw)
  return content
}
