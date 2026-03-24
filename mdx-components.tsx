import type { MDXComponents } from "mdx/types"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { cn } from "@/lib/utils"

type HeadingProps = ComponentPropsWithoutRef<"h1">
type ParagraphProps = ComponentPropsWithoutRef<"p">
type ListProps = ComponentPropsWithoutRef<"ul">
type ListItemProps = ComponentPropsWithoutRef<"li">
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">
type CodeProps = ComponentPropsWithoutRef<"code">
type PreProps = ComponentPropsWithoutRef<"pre">
type AnchorProps = ComponentPropsWithoutRef<"a">
type HRProps = ComponentPropsWithoutRef<"hr">
type TableProps = ComponentPropsWithoutRef<"table">
type MdxNode =
  | ReactNode
  | { props?: { children?: MdxNode } }

function hasChildrenProps(
  node: MdxNode
): node is { props: { children?: MdxNode } } {
  return (
    typeof node === "object" &&
    node !== null &&
    "props" in node &&
    typeof node.props === "object" &&
    node.props !== null
  )
}

const extractText = (node: MdxNode): string => {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (typeof node === "bigint") return String(node)
  if (typeof node === "boolean") return ""
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (hasChildrenProps(node) && node.props.children) {
    return extractText(node.props.children)
  }
  return ""
}

const generateId = (node: MdxNode): string | undefined => {
  const text = extractText(node)
  return text
    ? text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : undefined
}

export const mdxComponents = {
  h1: ({ className, ...props }: HeadingProps) => (
    <h1
      className={cn(
        "mt-8 mb-4 text-2xl leading-tight font-black text-foreground",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    />
  ),

  h2: ({ className, children, ...props }: HeadingProps) => (
    <h2
      id={generateId(children)}
      className={cn(
        "mt-7 mb-3 scroll-mt-24 border-b border-white/5 pb-2 text-lg font-bold text-foreground",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    >
      {children}
    </h2>
  ),

  h3: ({ className, children, ...props }: HeadingProps) => (
    <h3
      id={generateId(children)}
      className={cn(
        "mt-5 mb-2 scroll-mt-24 text-base font-bold text-[var(--gold)]",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  ),

  h4: ({ className, ...props }: HeadingProps) => (
    <h4
      className={cn(
        "mt-4 mb-1.5 text-sm font-bold tracking-wider text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  ),

  p: ({ className, ...props }: ParagraphProps) => (
    <p
      className={cn(
        "mb-3 text-sm leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  ),

  ul: ({ className, ...props }: ListProps) => (
    <ul
      className={cn("my-3 ml-4 list-none space-y-1.5", className)}
      {...props}
    />
  ),

  ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol
      className={cn(
        "my-3 ml-4 list-inside list-decimal space-y-1.5",
        className
      )}
      {...props}
    />
  ),

  li: ({ className, children, ...props }: ListItemProps) => (
    <li
      className={cn(
        "flex gap-2 text-sm leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0 text-[var(--gold)]">{">"}</span>
      <span>{children}</span>
    </li>
  ),

  blockquote: ({ className, ...props }: BlockquoteProps) => (
    <blockquote
      className={cn(
        "my-4 rounded-r-lg border-l-2 border-[var(--gold)] bg-[color-mix(in_oklch,var(--gold)_6%,transparent)] py-3 pr-3 pl-4",
        className
      )}
      {...props}
    />
  ),

  code: ({ className, ...props }: CodeProps) => {
    const isBlock =
      "data-language" in props ||
      (typeof className === "string" && className.includes("language-"))

    if (isBlock) {
      return (
        <code
          className={cn(
            "grid min-w-full border-0 bg-transparent p-0 text-[13px] text-white/90 break-words",
            className
          )}
          {...props}
        />
      )
    }

    return (
      <code
        className={cn(
          "rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-nowrap text-white/90",
          className
        )}
        {...props}
      />
    )
  },

  pre: (props: PreProps) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CodeBlockWrapper } = require("@/components/shared/code-block-wrapper")
    return <CodeBlockWrapper {...props} />
  },

  a: ({ className, href, ...props }: AnchorProps) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      className={cn(
        "text-sm text-[var(--blue)] underline decoration-[var(--blue)]/40 underline-offset-2 transition-all hover:text-[var(--blue)] hover:decoration-[var(--blue)]",
        className
      )}
      {...props}
    />
  ),

  hr: ({ className, ...props }: HRProps) => (
    <hr className={cn("my-6 border-border", className)} {...props} />
  ),

  table: ({ className, ...props }: TableProps) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  ),

  thead: ({ className, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead
      className={cn("border-b border-border bg-muted", className)}
      {...props}
    />
  ),

  th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-xs font-bold tracking-wider text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  ),

  td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td
      className={cn(
        "border-t border-border px-4 py-2.5 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  ),

  // Custom callout - use with > [!NOTE], > [!TIP], > [!WARNING] etc.
  // Rendered via blockquote override above
  strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className={cn("font-bold text-foreground", className)} {...props} />
  ),

  em: ({ className, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className={cn("text-muted-foreground italic", className)} {...props} />
  ),
} satisfies MDXComponents

// This file is required by @next/mdx - it provides component overrides
// for all MDX files across the project.
export function useMDXComponents(): MDXComponents {
  return mdxComponents
}
