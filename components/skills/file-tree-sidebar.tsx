"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Folder,
  Menu,
} from "lucide-react"

import type { SkillFileTree, TreeNode } from "@/lib/skill-tree"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface FileTreeSidebarProps {
  tree: SkillFileTree
  slug: string
}

function getHref(slug: string, nodePath: string) {
  return nodePath ? `/skills/${slug}/${nodePath}` : `/skills/${slug}`
}

function TreeFileItem({
  node,
  slug,
  activePath,
  depth,
  onNavigate,
}: {
  node: TreeNode
  slug: string
  activePath: string
  depth: number
  onNavigate?: () => void
}) {
  const href = getHref(slug, node.path)
  const isActive = activePath === node.path

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <FileText className="size-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
      {node.impact && (
        <Badge variant="outline" className="ml-auto shrink-0 text-[10px] px-1 py-0">
          {node.impact}
        </Badge>
      )}
    </Link>
  )
}

function TreeSectionItem({
  node,
  slug,
  activePath,
  depth,
  onNavigate,
}: {
  node: TreeNode
  slug: string
  activePath: string
  depth: number
  onNavigate?: () => void
}) {
  const hasActiveChild = node.children?.some((c) => c.path === activePath)
  const [isOpen, setIsOpen] = useState(hasActiveChild ?? false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          "text-foreground/80 hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        {isOpen ? (
          <FolderOpen className="size-3.5 shrink-0" />
        ) : (
          <Folder className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {node.impact && (
          <Badge
            variant="secondary"
            className="ml-auto shrink-0 text-[10px] px-1 py-0"
          >
            {node.impact}
          </Badge>
        )}
      </button>
      {isOpen && node.children && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              slug={slug}
              activePath={activePath}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeNodeItem({
  node,
  slug,
  activePath,
  depth,
  onNavigate,
}: {
  node: TreeNode
  slug: string
  activePath: string
  depth: number
  onNavigate?: () => void
}) {
  if (node.type === "section") {
    return (
      <TreeSectionItem
        node={node}
        slug={slug}
        activePath={activePath}
        depth={depth}
        onNavigate={onNavigate}
      />
    )
  }
  return (
    <TreeFileItem
      node={node}
      slug={slug}
      activePath={activePath}
      depth={depth}
      onNavigate={onNavigate}
    />
  )
}

function resolveActivePath(pathname: string, slug: string): string {
  const prefix = `/skills/${slug}`
  if (pathname === prefix || pathname === `${prefix}/`) return ""
  const rest = pathname.slice(prefix.length + 1)
  return rest
}

function TreeContent({
  tree,
  slug,
  activePath,
  onNavigate,
}: {
  tree: SkillFileTree
  slug: string
  activePath: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-0.5 py-2">
      {tree.nodes.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          slug={slug}
          activePath={activePath}
          depth={0}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

export function FileTreeSidebar({ tree, slug }: FileTreeSidebarProps) {
  const pathname = usePathname()
  const activePath = resolveActivePath(pathname, slug)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-border">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <h3 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Files
          </h3>
          <TreeContent tree={tree} slug={slug} activePath={activePath} />
        </div>
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="lg:hidden mb-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" />}
          >
            <Menu className="size-4" data-icon="inline-start" />
            Browse Files
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4">
            <SheetHeader>
              <SheetTitle>Files</SheetTitle>
            </SheetHeader>
            <TreeContent
              tree={tree}
              slug={slug}
              activePath={activePath}
              onNavigate={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
