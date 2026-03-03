"use client"

import { useState } from "react"
import type { UIMessage } from "ai"
import { X, Copy, Check, Download, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

type SessionSummaryProps = {
  messages: UIMessage[]
  onClose: () => void
}

export function SessionSummary({ messages, onClose }: SessionSummaryProps) {
  const [copied, setCopied] = useState(false)

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")

  const summaryContent = lastAssistantMessage
    ? getMessageText(lastAssistantMessage)
    : "No summary available yet."

  async function handleCopy() {
    await navigator.clipboard.writeText(summaryContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([summaryContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ouri-session-summary-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border-b border-border bg-accent/20 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Session Summary
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Copy summary"
            >
              {copied ? (
                <>
                  <Check className="size-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Download summary"
            >
              <Download className="size-3" />
              Download
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close summary"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground leading-relaxed shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summaryContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
