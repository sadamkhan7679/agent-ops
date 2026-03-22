import type { Metadata } from "next"
import { Blocks } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { getAllSkills, getAllTags } from "@/lib/skills"
import { absoluteUrl, createMetadata } from "@/lib/seo"
import { SkillSearch } from "@/components/skills/skill-search"

export const metadata: Metadata = createMetadata({
  title: "Skills Catalog",
  description:
    "Browse all available AI skills for Claude-style workflows, including React, forms, shadcn/ui, and project structure guidance.",
  path: "/skills",
  keywords: ["skills catalog", "Claude skills", "AI workflow skills"],
})

export default function SkillsPage() {
  const skills = getAllSkills()
  const allTags = getAllTags()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Skills Catalog",
          url: absoluteUrl("/skills"),
          description:
            "Searchable catalog of reusable AI skills for Claude-style workflows.",
        }}
      />
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
