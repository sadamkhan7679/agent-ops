import Link from "next/link"
import type { Skill } from "@/lib/skills"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SkillCardProps {
  skill: Skill
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skills/${skill.slug}`} className="group block">
      <Card className="h-full transition-shadow duration-200 group-hover:ring-2 group-hover:ring-primary/20 group-hover:shadow-md">
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
  )
}
