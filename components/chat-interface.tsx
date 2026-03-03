"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import type { UIMessage } from "ai"
import { QUICK_ACTIONS } from "@/lib/types"
import { MessageBubble } from "@/components/message-bubble"
import {
  Search,
  User,
  Building2,
  CalendarDays,
  Sparkles,
  FileText,
  ArrowUp,
  Loader2,
  GraduationCap,
} from "lucide-react"

const ACTION_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="size-4" />,
  user: <User className="size-4" />,
  building: <Building2 className="size-4" />,
  calendar: <CalendarDays className="size-4" />,
  sparkles: <Sparkles className="size-4" />,
  "file-text": <FileText className="size-4" />,
}

const STARTER_SUGGESTIONS = QUICK_ACTIONS.filter(
  (a) => a.id !== "session-summary"
)

type ChatInterfaceProps = {
  messages: UIMessage[]
  isLoading: boolean
  onSendMessage: (content: string) => void
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    },
    []
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = input.trim()
    if (!value || isLoading) return
    onSendMessage(value)
    setInput("")
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const showStarters = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {showStarters ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-12 md:px-8">
            {/* Welcome hero */}
            <div className="mb-10 text-center">
              <div className="relative mx-auto mb-5">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  OR
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground text-balance">
                OURI Research Matchmaking
              </h2>
              <p className="mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed text-balance">
                Find faculty mentors, match students to research opportunities,
                and explore OURI programs -- powered by real-time search of FAU
                resources.
              </p>
            </div>

            {/* Starter grid */}
            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {STARTER_SUGGESTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onSendMessage(action.prompt)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-primary/30 hover:bg-accent hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    {ACTION_ICONS[action.icon]}
                  </span>
                  <span className="text-xs font-medium text-card-foreground leading-snug">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode hint */}
            <div className="mt-8 flex items-center gap-2 rounded-full bg-accent/50 px-4 py-2">
              <GraduationCap className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Switch to{" "}
                <span className="font-medium text-foreground">
                  Student Intake
                </span>{" "}
                mode in the sidebar for structured matchmaking
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6 md:px-8">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex items-start gap-3 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    OR
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md bg-card px-4 py-3 shadow-sm ring-1 ring-border">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Searching FAU resources...
                    </span>
                  </div>
                </div>
              )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur-sm md:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl"
        >
          <div className="relative flex items-end rounded-xl border border-input bg-background shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/30">
            <textarea
              ref={inputRef}
              data-chat-input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about FAU faculty, research, or OURI programs..."
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[11px] text-muted-foreground/60">
              Information retrieved from FAU public resources in real time.
              Always verify critical details.
            </p>
            <p className="hidden text-[11px] text-muted-foreground/40 lg:block">
              <kbd className="rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to send,{" "}
              <kbd className="rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[10px]">
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
