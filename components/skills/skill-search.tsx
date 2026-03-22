"use client"

import { useState, useMemo } from "react"
import type { Skill } from "@/lib/skills"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SkillGrid } from "./skill-grid"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface SkillSearchProps {
  skills: Skill[]
  allTags: string[]
}

export function SkillSearch({ skills, allTags }: SkillSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = skills

    if (selectedTag) {
      result = result.filter((s) => s.tags.includes(selectedTag))
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [skills, query, selectedTag])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className="cursor-pointer"
        >
          <Badge
            variant={selectedTag === null ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              selectedTag === null && "ring-1 ring-primary/30"
            )}
          >
            All
          </Badge>
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() =>
              setSelectedTag(selectedTag === tag ? null : tag)
            }
            className="cursor-pointer"
          >
            <Badge
              variant={selectedTag === tag ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {tag}
            </Badge>
          </button>
        ))}
      </div>

      <SkillGrid skills={filtered} />
    </div>
  )
}
