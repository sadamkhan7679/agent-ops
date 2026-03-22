import { Blocks } from "lucide-react"

import { getAllSkills, getAllTags } from "@/lib/skills"
import { SkillSearch } from "@/components/skills/skill-search"

export const metadata = {
  title: "Skills Catalog - Agent Skills Hub",
  description: "Browse all available skills for Claude agents.",
}

export default function SkillsPage() {
  const skills = getAllSkills()
  const allTags = getAllTags()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Blocks className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Skills Catalog
          </h1>
        </div>
        <p className="text-muted-foreground">
          Browse and discover reusable skills that extend agent capabilities.
        </p>
      </div>

      <SkillSearch skills={skills} allTags={allTags} />
    </div>
  )
}
