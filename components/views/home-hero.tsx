import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HomeHeroProps {
  title: string
  description: string
}

export function HomeHero({ title, description }: HomeHeroProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
      <Badge variant="secondary" className="px-3 py-1">
        Open-source skills and agents
      </Badge>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-lg text-lg text-muted-foreground">{description}</p>
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
  )
}
