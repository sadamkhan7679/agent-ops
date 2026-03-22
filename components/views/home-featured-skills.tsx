import Link from "next/link"
import { ArrowRight, Blocks } from "lucide-react"

import type { Skill } from "@/lib/skills"
import { SkillCard } from "@/components/skills/skill-card"

interface HomeFeaturedSkillsProps {
  skills: Skill[]
}

export function HomeFeaturedSkills({ skills }: HomeFeaturedSkillsProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blocks className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Skills</h2>
        </div>
        <Link
          href="/skills"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} />
        ))}
      </div>
    </section>
  )
}
