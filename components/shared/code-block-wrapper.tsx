import { CopyButton } from "./copy-button"

interface CodeBlockWrapperProps {
  children: React.ReactNode
  className?: string
  // rehype-pretty-code passes data-language on the <pre>
  "data-language"?: string
}

/**
 * Server component that wraps `<pre>` code blocks with a copy button.
 * Extracts the text content from the code element for clipboard.
 */
export const CodeBlockWrapper = ({
  children,
  className,
  ...props
}: CodeBlockWrapperProps) => {
  // Extract raw text from the code children for the copy button
  const extractRawText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node
    if (typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(extractRawText).join("")
    if (node && typeof node === "object" && "props" in node) {
      const el = node as React.ReactElement<{ children?: React.ReactNode }>
      return extractRawText(el.props.children)
    }
    return ""
  }

  const rawText = extractRawText(children).replace(/\n$/, "")
  const lang = props["data-language"]

  return (
    <div className="group relative my-6">
      {/* Language label */}
      {lang && (
        <div className="absolute top-0 left-4 z-10 rounded-b-lg border-x border-b border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-widest text-white/30 uppercase">
          {lang}
        </div>
      )}

      <CopyButton text={rawText} />

      <pre
        className={`overflow-x-auto rounded-xl border border-white/10 bg-[#0d1117] py-4 ${lang ? "pt-9" : ""} font-mono text-[13px] leading-relaxed shadow-2xl [&_span[data-line]]:min-h-6 [&>code]:block [&>code]:min-w-full [&>code]:px-4 ${className ?? ""}`}
      >
        {children}
      </pre>
    </div>
  )
}
