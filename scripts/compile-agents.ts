import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const ROOT = process.cwd()
const SKILLS_DIR = path.join(ROOT, "content", "skills")

interface Section {
  order: number
  name: string
  prefix: string
  description: string
}

interface Guide {
  filename: string
  title: string
  content: string
}

function parseSections(raw: string): Section[] {
  const sections: Section[] = []
  const regex =
    /##\s+(\d+)\.\s+(.+?)\s+\(([^)]+)\)\s*\n+(?:\*\*Impact:\*\*\s*\S+\s*\n+)?\*\*Description:\*\*\s*(.+)/g
  let match
  while ((match = regex.exec(raw)) !== null) {
    sections.push({
      order: parseInt(match[1], 10),
      name: match[2].trim(),
      prefix: match[3].trim(),
      description: match[4].trim(),
    })
  }

  // Fallback: try without Description field (some _sections.md only have Impact)
  if (sections.length === 0) {
    const fallbackRegex =
      /##\s+(\d+)\.\s+(.+?)\s+\(([^)]+)\)\s*\n+\*\*(?:Impact|Description):\*\*\s*(.+)/g
    while ((match = fallbackRegex.exec(raw)) !== null) {
      sections.push({
        order: parseInt(match[1], 10),
        name: match[2].trim(),
        prefix: match[3].trim(),
        description: match[4].trim(),
      })
    }
  }

  return sections.sort((a, b) => a.order - b.order)
}

function getFilePrefix(filename: string): string {
  const name = filename.replace(/\.md$/, "")
  const idx = name.indexOf("-")
  return idx > 0 ? name.slice(0, idx) : name
}

/**
 * Match a filename against known section prefixes.
 * Handles multi-word prefixes like "rate-limiting", "app-directory".
 */
function matchSectionPrefix(
  filename: string,
  sectionPrefixes: string[]
): string | null {
  const name = filename.replace(/\.md$/, "")
  // Sort prefixes longest-first so "rate-limiting" matches before "rate"
  const sorted = [...sectionPrefixes].sort((a, b) => b.length - a.length)
  for (const prefix of sorted) {
    if (name === prefix || name.startsWith(`${prefix}-`)) {
      return prefix
    }
  }
  return null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function compileSkillAgents(skillSlug: string): string | null {
  const skillDir = path.join(SKILLS_DIR, skillSlug)
  const guidesDir = path.join(skillDir, "guides")

  if (!fs.existsSync(guidesDir)) return null

  // Read SKILL.md frontmatter
  const skillPath = path.join(skillDir, "SKILL.md")
  if (!fs.existsSync(skillPath)) return null

  const skillRaw = fs.readFileSync(skillPath, "utf-8")
  const { data: skillData } = matter(skillRaw)
  const skillName = (skillData.name as string) ?? skillSlug
  const skillDescription = (skillData.description as string) ?? ""
  const skillVersion = (skillData.version as string) ?? "1.0.0"

  // Read _sections.md
  const sectionsPath = path.join(guidesDir, "_sections.md")
  let sections: Section[] = []
  if (fs.existsSync(sectionsPath)) {
    const raw = fs.readFileSync(sectionsPath, "utf-8")
    sections = parseSections(raw)
  }

  // Read all guide files
  const guideFiles = fs
    .readdirSync(guidesDir)
    .filter((f) => f.endsWith(".md") && f !== "_sections.md")
    .sort()

  if (guideFiles.length === 0) return null

  // Parse each guide
  const guides: Guide[] = guideFiles.map((filename) => {
    const filePath = path.join(guidesDir, filename)
    const raw = fs.readFileSync(filePath, "utf-8")
    const { data, content } = matter(raw)
    const title =
      (data.title as string) ??
      filename
        .replace(/\.md$/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")

    return { filename, title, content: content.trim() }
  })

  // Group guides by section
  const groupedGuides = new Map<string, Guide[]>()
  const ungrouped: Guide[] = []

  if (sections.length > 0) {
    const sectionPrefixes = sections.map((s) => s.prefix)
    for (const section of sections) {
      groupedGuides.set(section.prefix, [])
    }
    for (const guide of guides) {
      const matched = matchSectionPrefix(guide.filename, sectionPrefixes)
      if (matched && groupedGuides.has(matched)) {
        groupedGuides.get(matched)!.push(guide)
      } else {
        ungrouped.push(guide)
      }
    }
  } else {
    // No sections — all guides are ungrouped
    ungrouped.push(...guides)
  }

  // Build the document
  const lines: string[] = []

  // Title
  const displayName = skillName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  lines.push(`# ${displayName} — Compiled Guide`)
  lines.push("")
  lines.push(`**Version:** ${skillVersion}`)
  lines.push("")
  lines.push(
    `> This file is auto-generated from the individual guide files in \`guides/\`. Do not edit directly.`
  )
  lines.push("")

  if (skillDescription) {
    lines.push(`## Overview`)
    lines.push("")
    lines.push(skillDescription)
    lines.push("")
  }

  // Table of Contents
  let guideNumber = 0
  const tocEntries: string[] = []

  if (sections.length > 0) {
    for (const section of sections) {
      const sectionGuides = groupedGuides.get(section.prefix) ?? []
      for (const guide of sectionGuides) {
        guideNumber++
        const anchor = slugify(`${guideNumber}-${guide.title}`)
        tocEntries.push(
          `${guideNumber}. [${section.name}: ${guide.title}](#${anchor})`
        )
      }
    }
  }

  for (const guide of ungrouped) {
    guideNumber++
    const anchor = slugify(`${guideNumber}-${guide.title}`)
    tocEntries.push(`${guideNumber}. [${guide.title}](#${anchor})`)
  }

  if (tocEntries.length > 0) {
    lines.push(`## Table of Contents`)
    lines.push("")
    lines.push(...tocEntries)
    lines.push("")
    lines.push("---")
    lines.push("")
  }

  // Guide content
  guideNumber = 0

  if (sections.length > 0) {
    for (const section of sections) {
      const sectionGuides = groupedGuides.get(section.prefix) ?? []
      for (const guide of sectionGuides) {
        guideNumber++
        lines.push(`## ${guideNumber}. ${guide.title}`)
        lines.push("")
        // Strip the first h2 heading if it matches the title (avoid duplicate)
        let content = guide.content
        const h2Match = content.match(/^##\s+.+[\r\n]+/)
        if (h2Match) {
          content = content.slice(h2Match[0].length)
        }
        lines.push(content)
        lines.push("")
        lines.push("---")
        lines.push("")
      }
    }
  }

  for (const guide of ungrouped) {
    guideNumber++
    lines.push(`## ${guideNumber}. ${guide.title}`)
    lines.push("")
    let content = guide.content
    const h2Match = content.match(/^##\s+.+[\r\n]+/)
    if (h2Match) {
      content = content.slice(h2Match[0].length)
    }
    lines.push(content)
    lines.push("")
    lines.push("---")
    lines.push("")
  }

  return lines.join("\n")
}

function main() {
  const skillDirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  let compiled = 0

  for (const slug of skillDirs) {
    const guidesDir = path.join(SKILLS_DIR, slug, "guides")
    if (!fs.existsSync(guidesDir)) continue

    const guideFiles = fs
      .readdirSync(guidesDir)
      .filter((f) => f.endsWith(".md") && f !== "_sections.md")

    if (guideFiles.length === 0) continue

    const output = compileSkillAgents(slug)
    if (!output) continue

    const outputPath = path.join(SKILLS_DIR, slug, "AGENTS.md")
    fs.writeFileSync(outputPath, output)
    compiled++
    console.log(`  Compiled ${slug}/AGENTS.md (${guideFiles.length} guides)`)
  }

  console.log(`\nCompiled ${compiled} AGENTS.md files.`)
}

main()
