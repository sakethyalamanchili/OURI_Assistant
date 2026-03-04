"use client"

import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Check, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function MessageBubble({ message }: { message: UIMessage }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const text = getMessageText(message)

  if (!text) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          OURI
        </div>
      )}

      <div
        className={cn(
          "group relative max-w-[85%] lg:max-w-[75%]",
          isUser ? "order-first" : ""
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-user-bubble text-user-bubble-foreground rounded-br-md"
              : "bg-card text-card-foreground shadow-sm ring-1 ring-border rounded-tl-md"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          ) : (
            <div className="prose-sm max-w-none text-card-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0 text-sm leading-relaxed text-card-foreground">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 ml-1 list-none flex flex-col gap-1.5 last:mb-0">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal pl-4 flex flex-col gap-1.5 last:mb-0">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed text-card-foreground pl-1 relative before:absolute before:left-[-8px] before:top-[10px] before:size-1 before:rounded-full before:bg-primary/40 [ol_&]:before:hidden">
                      {children}
                    </li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
                    >
                      {children}
                      <ExternalLink className="size-3 inline-block shrink-0" />
                    </a>
                  ),
                  h1: ({ children }) => (
                    <h3 className="mb-2 mt-4 text-base font-bold text-foreground first:mt-0 pb-1 border-b border-border">
                      {children}
                    </h3>
                  ),
                  h2: ({ children }) => (
                    <h4 className="mb-2 mt-3 text-sm font-bold text-foreground first:mt-0">
                      {children}
                    </h4>
                  ),
                  h3: ({ children }) => (
                    <h5 className="mb-1.5 mt-2.5 text-sm font-semibold text-foreground first:mt-0">
                      {children}
                    </h5>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/60">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-t border-border px-3 py-2 text-sm text-card-foreground">
                      {children}
                    </td>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                        {children}
                      </code>
                    ) : (
                      <code className="block overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono leading-relaxed">
                        {children}
                      </code>
                    )
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-primary/30 pl-3 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-3 border-border" />,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy button -- assistant only */}
        {!isUser && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="size-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          You
        </div>
      )}
    </div>
  )
}
