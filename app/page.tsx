import Link from "next/link"
import { ArrowRight, Blocks, Bot } from "lucide-react"

import { getAllSkills } from "@/lib/skills"
import { getAllAgents } from "@/lib/agents"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function Page() {
  const skills = getAllSkills()
  const agents = getAllAgents()
  const featuredSkills = skills.slice(0, 3)
  const featuredAgents = agents.slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <Badge variant="secondary" className="px-3 py-1">
          Open-source skills and agents
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Agent Skills Hub
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Discover, explore, and integrate reusable skills and intelligent
          agents built for Claude and beyond.
        </p>
        <div className="flex gap-3">
          <Button render={<Link href="/skills" />} size="lg">
            Browse Skills
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <Button render={<Link href="/agents" />} variant="outline" size="lg">
            Browse Agents
          </Button>
        </div>
      </section>

      <Separator />

      {/* Stats */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <StatCard label="Skills" value={skills.length} />
          <StatCard label="Agents" value={agents.length} />
          <StatCard
            label="Tags"
            value={new Set(skills.flatMap((s) => s.tags)).size}
          />
          <StatCard
            label="Roles"
            value={new Set(agents.map((a) => a.role)).size}
          />
        </div>
      </section>

      <Separator />

      {/* Featured Skills */}
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
          {featuredSkills.map((skill) => (
            <Link
              key={skill.slug}
              href={`/skills/${skill.slug}`}
              className="group block"
            >
              <Card className="h-full transition-shadow duration-200 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
                <CardHeader>
                  <CardTitle>{skill.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {skill.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* Featured Agents */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Agents</h2>
          </div>
          <Link
            href="/agents"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredAgents.map((agent) => (
            <Link
              key={agent.slug}
              href={`/agents/${agent.slug}`}
              className="group block"
            >
              <Card className="h-full transition-shadow duration-200 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{agent.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {agent.role}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Badge key={cap} variant="secondary">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
