"use client"

import { useState, useCallback } from "react"
import { Check, Copy } from "lucide-react"

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-HTTPS
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy code"}
      className="absolute top-3 right-3 z-10 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/30 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-white/20 hover:bg-white/10 hover:text-white/70 focus:opacity-100"
    >
      {copied ? (
        <Check size={14} className="text-emerald-400" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  )
}
