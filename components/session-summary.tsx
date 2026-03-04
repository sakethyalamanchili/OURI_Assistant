"use client"

import { useState } from "react"
import type { UIMessage } from "ai"
import type { SessionData } from "@/lib/types"
import { X, Copy, Check, Download, FileText, Mail } from "lucide-react"
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
  sessionData: SessionData | null
  onClose: () => void
}

export function SessionSummary({ messages, sessionData, onClose }: SessionSummaryProps) {
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
    const header = sessionData
      ? `OURI Session Summary\n${"=".repeat(40)}\nDate: ${new Date(sessionData.startTime).toLocaleDateString()}\n${sessionData.studentName ? `Student: ${sessionData.studentName}\n` : ""}${sessionData.major ? `Major: ${sessionData.major}\n` : ""}${sessionData.year ? `Year: ${sessionData.year}\n` : ""}\n${"=".repeat(40)}\n\n`
      : ""

    const blob = new Blob([header + summaryContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const studentPart = sessionData?.studentName
      ? `-${sessionData.studentName.replace(/\s+/g, "-").toLowerCase()}`
      : ""
    a.download = `ouri-session-summary${studentPart}-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleCopyForEmail() {
    const subject = sessionData?.studentName
      ? `OURI Research Matchmaking — Summary for ${sessionData.studentName}`
      : "OURI Research Matchmaking — Session Summary"

    const emailContent = `Subject: ${subject}\n\n${summaryContent}`
    navigator.clipboard.writeText(emailContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            {sessionData?.studentName && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {sessionData.studentName}
              </span>
            )}
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
              onClick={handleCopyForEmail}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Copy for email"
            >
              <Mail className="size-3" />
              Copy for Email
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
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground leading-relaxed shadow-sm max-h-[40vh] overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summaryContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}