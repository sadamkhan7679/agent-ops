import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface TreeNode {
  name: string
  path: string
  type: "file" | "section"
  impact?: string
  children?: TreeNode[]
}

export interface SkillFileTree {
  slug: string
  hasTree: boolean
  nodes: TreeNode[]
}

interface Section {
  order: number
  name: string
  prefix: string
  impact: string
}

const SKILLS_DIR = path.join(process.cwd(), "content", "skills")

/**
 * Parse _sections.md to extract section metadata.
 * Format: `## N. Section Name (prefix)` followed by `**Impact:** LEVEL`
 */
function parseSections(content: string): Section[] {
  const sections: Section[] = []
  const regex =
    /##\s+(\d+)\.\s+(.+?)\s+\(([^)]+)\)\s*\n+\*\*Impact:\*\*\s*(\S+)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    sections.push({
      order: parseInt(match[1], 10),
      name: match[2].trim(),
      prefix: match[3].trim(),
      impact: match[4].trim(),
    })
  }
  return sections.sort((a, b) => a.order - b.order)
}

/**
 * Extract the prefix from a guide filename (part before the first `-`).
 * e.g. "performance-list-optimization.md" → "performance"
 */
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
  const sorted = [...sectionPrefixes].sort((a, b) => b.length - a.length)
  for (const prefix of sorted) {
    if (name === prefix || name.startsWith(`${prefix}-`)) {
      return prefix
    }
  }
  return null
}

/**
 * Read frontmatter title from a markdown file, falling back to filename.
 */
function getFileTitle(filePath: string, filename: string): string {
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    const { data } = matter(raw)
    if (data.title) return data.title
    if (data.name) return data.name
  } catch {
    // ignore read errors
  }
  return filename
    .replace(/\.md$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * Read frontmatter impact from a guide file.
 */
function getFileImpact(filePath: string): string | undefined {
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    const { data } = matter(raw)
    return data.impact ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Build the file tree for a skill. Returns hasTree=false for flat skills.
 */
export function getSkillFileTree(slug: string): SkillFileTree {
  const skillDir = path.join(SKILLS_DIR, slug)
  if (!fs.existsSync(skillDir)) {
    return { slug, hasTree: false, nodes: [] }
  }

  const entries = fs.readdirSync(skillDir, { withFileTypes: true })
  const hasGuides = entries.some(
    (e) => e.isDirectory() && e.name === "guides"
  )
  // Exclude SKILL.md (rendered as default), AGENTS.md (auto-generated), README.md (internal docs)
  const EXCLUDED_ROOT_FILES = new Set(["SKILL.md", "AGENTS.md", "README.md"])
  const rootFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md") && !EXCLUDED_ROOT_FILES.has(e.name))
    .map((e) => e.name)

  // Flat skill — only SKILL.md (possibly with nothing else meaningful)
  if (!hasGuides && rootFiles.length === 0) {
    return { slug, hasTree: false, nodes: [] }
  }

  const nodes: TreeNode[] = []

  // SKILL.md is always the first entry
  nodes.push({
    name: "Overview",
    path: "",
    type: "file",
  })

  // Root-level markdown files (README.md, AGENTS.md, etc.)
  for (const file of rootFiles) {
    const pathWithoutExt = file.replace(/\.md$/, "")
    nodes.push({
      name: getFileTitle(path.join(skillDir, file), file),
      path: pathWithoutExt,
      type: "file",
    })
  }

  // Guides folder
  if (hasGuides) {
    const guidesDir = path.join(skillDir, "guides")
    const guideFiles = fs
      .readdirSync(guidesDir)
      .filter((f) => f.endsWith(".md") && f !== "_sections.md")
      .sort()

    // Try to parse _sections.md for grouping
    const sectionsPath = path.join(guidesDir, "_sections.md")
    let sections: Section[] = []
    if (fs.existsSync(sectionsPath)) {
      const raw = fs.readFileSync(sectionsPath, "utf-8")
      sections = parseSections(raw)
    }

    if (sections.length > 0) {
      // Group guides by section prefix
      const grouped = new Map<string, TreeNode[]>()
      const ungrouped: TreeNode[] = []
      const sectionPrefixes = sections.map((s) => s.prefix)

      for (const section of sections) {
        grouped.set(section.prefix, [])
      }

      for (const file of guideFiles) {
        const matched = matchSectionPrefix(file, sectionPrefixes)
        const filePath = path.join(guidesDir, file)
        const node: TreeNode = {
          name: getFileTitle(filePath, file),
          path: `guides/${file.replace(/\.md$/, "")}`,
          type: "file",
          impact: getFileImpact(filePath),
        }

        if (matched && grouped.has(matched)) {
          grouped.get(matched)!.push(node)
        } else {
          ungrouped.push(node)
        }
      }

      for (const section of sections) {
        const children = grouped.get(section.prefix) ?? []
        if (children.length > 0) {
          nodes.push({
            name: section.name,
            path: `section-${section.prefix}`,
            type: "section",
            impact: section.impact,
            children,
          })
        }
      }

      // Any guides that didn't match a section
      if (ungrouped.length > 0) {
        nodes.push({
          name: "Other Guides",
          path: "section-other",
          type: "section",
          children: ungrouped,
        })
      }
    } else {
      // No _sections.md — group alphabetically by prefix
      const prefixMap = new Map<string, TreeNode[]>()

      for (const file of guideFiles) {
        const prefix = getFilePrefix(file)
        const filePath = path.join(guidesDir, file)
        const node: TreeNode = {
          name: getFileTitle(filePath, file),
          path: `guides/${file.replace(/\.md$/, "")}`,
          type: "file",
          impact: getFileImpact(filePath),
        }

        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, [])
        }
        prefixMap.get(prefix)!.push(node)
      }

      for (const [prefix, children] of Array.from(prefixMap.entries()).sort(
        (a, b) => a[0].localeCompare(b[0])
      )) {
        if (children.length === 1) {
          // Single file in group — show flat
          nodes.push(children[0])
        } else {
          nodes.push({
            name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
            path: `section-${prefix}`,
            type: "section",
            children,
          })
        }
      }
    }
  }

  return { slug, hasTree: true, nodes }
}

/**
 * Get all sub-file paths for generateStaticParams (excludes SKILL.md which is the base route).
 * Returns paths without .md extension.
 */
export function getSkillFilePaths(slug: string): string[][] {
  const skillDir = path.join(SKILLS_DIR, slug)
  if (!fs.existsSync(skillDir)) return []

  const paths: string[][] = []
  const entries = fs.readdirSync(skillDir, { withFileTypes: true })

  // Root-level .md files (exclude SKILL.md, AGENTS.md, README.md)
  const EXCLUDED_ROOT_FILES = new Set(["SKILL.md", "AGENTS.md", "README.md"])
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md") && !EXCLUDED_ROOT_FILES.has(entry.name)) {
      paths.push([entry.name.replace(/\.md$/, "")])
    }
  }

  // Guides folder
  const guidesDir = path.join(skillDir, "guides")
  if (fs.existsSync(guidesDir)) {
    const guideFiles = fs
      .readdirSync(guidesDir)
      .filter((f) => f.endsWith(".md") && f !== "_sections.md")

    for (const file of guideFiles) {
      paths.push(["guides", file.replace(/\.md$/, "")])
    }
  }

  return paths
}
