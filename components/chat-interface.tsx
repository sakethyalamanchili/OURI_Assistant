"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import type { UIMessage } from "ai"
import type { ChatMode } from "@/lib/types"
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
  Zap,
  UserCheck,
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
  mode: ChatMode
  intakeSubmitted?: boolean
  onGenerateSummary?: () => void
  summaryGenerated?: boolean
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  mode,
  intakeSubmitted,
  onGenerateSummary,
  summaryGenerated,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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

  const showQuickStarters = mode === "quick-lookup" && messages.length === 0
  const showPersonalizedWaiting = mode === "personalized" && !intakeSubmitted && messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {showQuickStarters ? (
          /* Quick Lookup empty state */
          <div className="flex h-full flex-col items-center justify-center px-4 py-12 md:px-8">
            <div className="mb-10 text-center">
              <div className="relative mx-auto mb-5">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  <Zap className="size-7" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground text-balance">
                Quick Lookup
              </h2>
              <p className="mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed text-balance">
                Ask any question about FAU faculty, research opportunities, or OURI programs. 
                Each question is answered independently with real-time search.
              </p>
            </div>

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
          </div>
        ) : showPersonalizedWaiting ? (
          /* Personalized mode - waiting for intake form */
          <div className="flex h-full flex-col items-center justify-center px-4 py-12 md:px-8">
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserCheck className="size-7" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground text-balance">
                Student Session
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed text-balance">
                Fill in the intake form above to start a personalized session. The AI will remember 
                context throughout the conversation and provide tailored recommendations.
              </p>
            </div>
          </div>
        ) : (
          /* Chat messages */
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

            {/* Generate summary button for personalized mode */}
            {mode === "personalized" &&
              messages.length >= 2 &&
              !isLoading &&
              !summaryGenerated &&
              onGenerateSummary && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={onGenerateSummary}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:shadow-md"
                  >
                    <FileText className="size-3.5" />
                    Generate Session Summary
                  </button>
                </div>
              )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area - always visible when chat is active */}
      {(mode === "quick-lookup" || intakeSubmitted) && (
        <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur-sm md:px-8">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="relative flex items-end rounded-xl border border-input bg-background shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/30">
              <textarea
                ref={inputRef}
                data-chat-input
                value={input}
                onChange={handleInputChange}
                placeholder={
                  mode === "quick-lookup"
                    ? "Ask about FAU faculty, research, or OURI programs..."
                    : "Ask a follow-up question about this student's options..."
                }
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
      )}
    </div>
  )
}