import type { MetadataRoute } from "next"

import { getAllAgents } from "@/lib/agents"
import { absoluteUrl } from "@/lib/seo"
import { getAllSkills } from "@/lib/skills"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/skills"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/agents"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]

  const skillRoutes = getAllSkills().map((skill) => ({
    url: absoluteUrl(`/skills/${skill.slug}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  const agentRoutes = getAllAgents().map((agent) => ({
    url: absoluteUrl(`/agents/${agent.slug}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...skillRoutes, ...agentRoutes]
}
