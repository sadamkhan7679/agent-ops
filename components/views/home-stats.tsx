import { Card, CardContent } from "@/components/ui/card"

interface HomeStatsProps {
  stats: Array<{
    label: string
    value: number
  }>
}

export function HomeStats({ stats }: HomeStatsProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center gap-1 py-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
