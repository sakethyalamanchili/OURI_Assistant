"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { ChatMode } from "@/lib/types"
import { QUICK_ACTIONS } from "@/lib/types"
import { ChatInterface } from "@/components/chat-interface"
import { StudentIntakeForm } from "@/components/student-intake-form"
import { SessionSummary } from "@/components/session-summary"
import {
  Search,
  User,
  Building2,
  CalendarDays,
  Sparkles,
  FileText,
  Menu,
  X,
  RotateCcw,
  GraduationCap,
  MessageSquare,
  Keyboard,
  ChevronRight,
} from "lucide-react"

const ACTION_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="size-4" />,
  user: <User className="size-4" />,
  building: <Building2 className="size-4" />,
  calendar: <CalendarDays className="size-4" />,
  sparkles: <Sparkles className="size-4" />,
  "file-text": <FileText className="size-4" />,
}

const ACTION_SHORTCUTS: Record<string, string> = {
  "faculty-search": "1",
  "faculty-profile": "2",
  "department-overview": "3",
  "ouri-programs": "4",
  "student-match": "5",
  "session-summary": "6",
}

const transport = new DefaultChatTransport({ api: "/api/chat" })

export default function HomePage() {
  const [mode, setMode] = useState<ChatMode>("quick-lookup")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    body: { mode },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSendMessage = useCallback(
    (text: string) => {
      setSidebarOpen(false)
      sendMessage({ text })
    },
    [sendMessage]
  )

  const handleQuickAction = useCallback(
    (actionId: string) => {
      const action = QUICK_ACTIONS.find((a) => a.id === actionId)
      if (!action) return

      if (actionId === "session-summary") {
        if (messages.length > 0) {
          setShowSummary(true)
          sendMessage({
            text: "Please generate a summary of our conversation so far.",
          })
        }
      } else {
        handleSendMessage(action.prompt)
      }
    },
    [messages.length, sendMessage, handleSendMessage]
  )

  const handleNewSession = useCallback(() => {
    setMessages([])
    setShowSummary(false)
  }, [setMessages])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable

      if (isTyping) return

      // Ctrl/Cmd + K = focus search input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const input = document.querySelector<HTMLTextAreaElement>(
          "[data-chat-input]"
        )
        input?.focus()
        return
      }

      // Ctrl/Cmd + Shift + N = new session
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault()
        handleNewSession()
        return
      }

      // Number keys for quick actions (when not typing)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const actionEntry = Object.entries(ACTION_SHORTCUTS).find(
          ([, key]) => key === e.key
        )
        if (actionEntry && !isLoading) {
          e.preventDefault()
          handleQuickAction(actionEntry[0])
          return
        }
      }

      // Escape to close sidebar
      if (e.key === "Escape") {
        if (sidebarOpen) setSidebarOpen(false)
        if (showShortcuts) setShowShortcuts(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNewSession, handleQuickAction, isLoading, sidebarOpen, showShortcuts])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar text-sidebar-foreground
          transition-transform duration-200 ease-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary font-sans text-sm font-bold text-sidebar-primary-foreground">
            OR
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              OURI Assistant
            </h1>
            <p className="truncate text-[11px] text-sidebar-foreground/50">
              Research Matchmaking
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Mode toggle */}
        <div className="px-4 pt-4 pb-1">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
            Mode
          </p>
          <div className="flex rounded-lg bg-sidebar-accent/60 p-0.5">
            <button
              onClick={() => setMode("quick-lookup")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 ${
                mode === "quick-lookup"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              }`}
            >
              <MessageSquare className="size-3" />
              Quick Lookup
            </button>
            <button
              onClick={() => setMode("student-intake")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 ${
                mode === "student-intake"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              }`}
            >
              <GraduationCap className="size-3" />
              Student Intake
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
            Quick Actions
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Quick actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={isLoading}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-sidebar-foreground/70 transition-all duration-100 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent/70 text-sidebar-foreground/50 transition-colors group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground">
                  {ACTION_ICONS[action.icon]}
                </span>
                <span className="flex-1 truncate">{action.label}</span>
                <kbd className="hidden rounded bg-sidebar-accent/60 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/30 lg:inline">
                  {ACTION_SHORTCUTS[action.id]}
                </kbd>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          >
            <Keyboard className="size-3.5" />
            <span>Keyboard shortcuts</span>
            <ChevronRight
              className={`ml-auto size-3 transition-transform ${showShortcuts ? "rotate-90" : ""}`}
            />
          </button>
          {showShortcuts && (
            <div className="hidden rounded-lg bg-sidebar-accent/50 p-3 lg:block">
              <div className="flex flex-col gap-1.5 text-[11px] text-sidebar-foreground/60">
                <div className="flex items-center justify-between">
                  <span>Focus chat</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">
                    {"Ctrl+K"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>New session</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">
                    {"Ctrl+Shift+N"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quick actions</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">
                    {"1-6"}
                  </kbd>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-4 py-2.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 active:scale-[0.98]"
          >
            <RotateCcw className="size-3.5" />
            New Session
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
              OR
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                OURI Assistant
              </h1>
            </div>
          </div>
          <button
            onClick={handleNewSession}
            className="ml-auto flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="New session"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </header>

        {/* Desktop header bar */}
        <header className="hidden shrink-0 items-center justify-between border-b border-border bg-card px-6 py-2.5 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1">
              <div
                className={`size-1.5 rounded-full ${isLoading ? "animate-pulse bg-chart-2" : "bg-green-500"}`}
              />
              <span className="text-[11px] font-medium text-accent-foreground">
                {isLoading ? "Searching FAU resources..." : "Ready"}
              </span>
            </div>
            {mode === "student-intake" && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                <GraduationCap className="size-3 text-primary" />
                <span className="text-[11px] font-medium text-primary">
                  Student Intake Mode
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{messages.length} messages</span>
            <span className="text-border">|</span>
            <span className="capitalize">
              {(process.env.NEXT_PUBLIC_AI_PROVIDER || "gemini").toLowerCase()}
            </span>
          </div>
        </header>

        {/* Student intake form (only in student-intake mode) */}
        {mode === "student-intake" && (
          <StudentIntakeForm
            onSubmit={(profile) => {
              const profileText = [
                "I have a student who needs research matchmaking help. Here is their profile:",
                profile.name ? `- **Name**: ${profile.name}` : null,
                `- **Major**: ${profile.major}`,
                `- **Year**: ${profile.year}`,
                `- **Key Interests**: ${profile.interests}`,
                `- **Favorite Classes**: ${profile.favoriteClasses}`,
                `- **Research Goals**: ${profile.researchGoals}`,
                profile.additionalNotes
                  ? `- **Additional Notes**: ${profile.additionalNotes}`
                  : null,
                "",
                "Based on this profile, please recommend the best faculty mentors and OURI programs for this student.",
              ]
                .filter(Boolean)
                .join("\n")

              handleSendMessage(profileText)
            }}
            disabled={isLoading}
          />
        )}

        {/* Session summary overlay */}
        {showSummary && messages.length > 0 && (
          <SessionSummary
            messages={messages}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Chat */}
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  )
}
