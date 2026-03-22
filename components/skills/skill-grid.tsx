import type { Skill } from "@/lib/skills"
import { SkillCard } from "./skill-card"

interface SkillGridProps {
  skills: Skill[]
}

export function SkillGrid({ skills }: SkillGridProps) {
  if (skills.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No skills found matching your criteria.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard key={skill.slug} skill={skill} />
      ))}
    </div>
  )
}
