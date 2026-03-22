import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { APP_DATA } from "@/data/app.data"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {year} {APP_DATA.appName}. Built with Next.js and shadcn/ui.
          </p>
          <nav className="flex items-center gap-4">
            <Link
              href="/skills"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skills
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link
              href="/agents"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Agents
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
