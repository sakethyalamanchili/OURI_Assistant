"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { ChatMode, HelpType, IntakeFormData, SessionData } from "@/lib/types"
import { QUICK_ACTIONS } from "@/lib/types"
import { ChatInterface } from "@/components/chat-interface"
import { StudentIntakeForm } from "@/components/student-intake-form"
import { SessionSummary } from "@/components/session-summary"
import { ModeSelector } from "@/components/mode-selector"
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
  MessageSquare,
  Keyboard,
  ChevronRight,
  Zap,
  UserCheck,
  MessageCircle,
} from "lucide-react"

const ACTION_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="size-4" />,
  user: <User className="size-4" />,
  building: <Building2 className="size-4" />,
  calendar: <CalendarDays className="size-4" />,
  sparkles: <Sparkles className="size-4" />,
  "file-text": <FileText className="size-4" />,
  "message-circle": <MessageCircle className="size-4" />,
}

const ACTION_SHORTCUTS: Record<string, string> = {
  "faculty-search": "1",
  "faculty-profile": "2",
  "department-overview": "3",
  "ouri-programs": "4",
  "student-match": "5",
}

const quickTransport = new DefaultChatTransport({ api: "/api/chat" })
const personalizedTransport = new DefaultChatTransport({ api: "/api/chat" })

export default function HomePage() {
  const [mode, setMode] = useState<ChatMode>("quick-lookup")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [intakeSubmitted, setIntakeSubmitted] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  // Separate chat instances for each mode
  const quickChat = useChat({
    transport: quickTransport,
    body: { mode: "quick-lookup" },
    experimental_throttle: 50,
  })

  const personalizedChat = useChat({
    transport: personalizedTransport,
    body: { mode: "student-intake" },
    experimental_throttle: 50,
  })

  const activeChat = mode === "quick-lookup" ? quickChat : personalizedChat
  const { messages, sendMessage, setMessages, status } = activeChat
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
      handleSendMessage(action.prompt)
    },
    [handleSendMessage]
  )

  const handleIntakeSubmit = useCallback(
    (data: IntakeFormData) => {
      setIntakeSubmitted(true)

      // Build the session data
      setSessionData({
        helpType: data.helpType,
        studentName: data.fields.studentName,
        major: data.fields.major,
        year: data.fields.year,
        startTime: new Date().toISOString(),
        messageCount: 0,
      })

      // Build the prompt based on help type
      const prompt = buildIntakePrompt(data)
      handleSendMessage(prompt)
    },
    [handleSendMessage]
  )

  const handleGenerateSummary = useCallback(() => {
    if (messages.length > 0) {
      setShowSummary(true)
      sendMessage({
        text: "Please generate a detailed session summary of our entire conversation. Include all faculty discussed, programs mentioned, recommendations made, useful links, and clear next steps. Format it so it can be easily copied into an email to send to the student.",
      })
    }
  }, [messages.length, sendMessage])

  const handleNewSession = useCallback(() => {
    setMessages([])
    setShowSummary(false)
    setIntakeSubmitted(false)
    setSessionData(null)
  }, [setMessages])

  const handleModeSwitch = useCallback(
    (newMode: ChatMode) => {
      setMode(newMode)
      setSidebarOpen(false)
    },
    []
  )

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

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const input = document.querySelector<HTMLTextAreaElement>(
          "[data-chat-input]"
        )
        input?.focus()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault()
        handleNewSession()
        return
      }

      if (mode === "quick-lookup" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const actionEntry = Object.entries(ACTION_SHORTCUTS).find(
          ([, key]) => key === e.key
        )
        if (actionEntry && !isLoading) {
          e.preventDefault()
          handleQuickAction(actionEntry[0])
          return
        }
      }

      if (e.key === "Escape") {
        if (sidebarOpen) setSidebarOpen(false)
        if (showShortcuts) setShowShortcuts(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNewSession, handleQuickAction, isLoading, sidebarOpen, showShortcuts, mode])

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

      {/* Sidebar — always fixed position, never participates in document flow */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col overflow-hidden bg-sidebar text-sidebar-foreground
          transition-transform duration-200 ease-out
          ${sidebarOpen ? "z-50 translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo area */}
        <div className="relative shrink-0 px-4 pt-5 pb-4">
          <img
            src="/logoouricolor.png"
            alt="FAU Office of Undergraduate Research and Inquiry"
            className="mx-auto w-full max-w-[200px] object-contain"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mx-4 h-px shrink-0 bg-sidebar-border" />

        {/* Mode selector */}
        <div className="shrink-0 px-4 pt-4 pb-1">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
            Workflow
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleModeSwitch("quick-lookup")}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                mode === "quick-lookup"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Zap className="size-4" />
              <div>
                <div className="text-xs font-medium">Quick Lookup</div>
                <div className={`text-[10px] ${mode === "quick-lookup" ? "text-sidebar-primary-foreground/70" : "text-sidebar-foreground/40"}`}>
                  Fast Q&A — no context needed
                </div>
              </div>
            </button>
            <button
              onClick={() => handleModeSwitch("personalized")}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                mode === "personalized"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <UserCheck className="size-4" />
              <div>
                <div className="text-xs font-medium">Student Session</div>
                <div className={`text-[10px] ${mode === "personalized" ? "text-sidebar-primary-foreground/70" : "text-sidebar-foreground/40"}`}>
                  Intake form + personalized help
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Quick actions (only in quick-lookup mode) */}
        {mode === "quick-lookup" && (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-2">
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
        )}

        {/* Session info (only in personalized mode) */}
        {mode === "personalized" && (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-2">
            {sessionData ? (
              <div className="rounded-lg bg-sidebar-accent/40 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                  Active Session
                </p>
                <div className="flex flex-col gap-1.5 text-[12px] text-sidebar-foreground/70">
                  {sessionData.studentName && (
                    <div><span className="text-sidebar-foreground/40">Student:</span> {sessionData.studentName}</div>
                  )}
                  {sessionData.major && (
                    <div><span className="text-sidebar-foreground/40">Major:</span> {sessionData.major}</div>
                  )}
                  {sessionData.year && (
                    <div><span className="text-sidebar-foreground/40">Year:</span> {sessionData.year}</div>
                  )}
                  <div><span className="text-sidebar-foreground/40">Messages:</span> {messages.length}</div>
                </div>

                {messages.length > 0 && !showSummary && (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-sidebar-primary/20 px-3 py-2 text-[11px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-primary/30 disabled:opacity-40"
                  >
                    <FileText className="size-3" />
                    Generate Session Summary
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-sidebar-accent/30 p-4 text-center">
                <UserCheck className="mx-auto mb-2 size-6 text-sidebar-foreground/30" />
                <p className="text-[12px] text-sidebar-foreground/50">
                  Fill in the Student Intake Form to begin a personalized session
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-sidebar-border p-3">
          {mode === "quick-lookup" && (
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
          )}
          {showShortcuts && mode === "quick-lookup" && (
            <div className="hidden rounded-lg bg-sidebar-accent/50 p-3 lg:block">
              <div className="flex flex-col gap-1.5 text-[11px] text-sidebar-foreground/60">
                <div className="flex items-center justify-between">
                  <span>Focus chat</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>New session</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Shift+N</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quick actions</span>
                  <kbd className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px]">1-5</kbd>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-4 py-2.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 active:scale-[0.98]"
          >
            <RotateCcw className="size-3.5" />
            {mode === "personalized" ? "New Student Session" : "Clear Chat"}
          </button>
        </div>
      </aside>

      {/* Main content — offset on desktop for fixed sidebar */}
      <main className="flex min-w-0 flex-1 flex-col lg:ml-[280px]">
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
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <img src="/logo-sidebar-sm.png" alt="OURI" className="size-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                OURI Assistant
              </h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ModeSelector mode={mode} onModeChange={handleModeSwitch} />
            <button
              onClick={handleNewSession}
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="New session"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
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
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              {mode === "quick-lookup" ? (
                <Zap className="size-3 text-primary" />
              ) : (
                <UserCheck className="size-3 text-primary" />
              )}
              <span className="text-[11px] font-medium text-primary">
                {mode === "quick-lookup" ? "Quick Lookup" : "Student Session"}
              </span>
            </div>
            {sessionData?.studentName && mode === "personalized" && (
              <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1">
                <User className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-accent-foreground">
                  {sessionData.studentName}
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

        {/* Student intake form (only in personalized mode, before submission) */}
        {mode === "personalized" && !intakeSubmitted && (
          <StudentIntakeForm
            onSubmit={handleIntakeSubmit}
            disabled={isLoading}
          />
        )}

        {/* Session summary overlay */}
        {showSummary && messages.length > 0 && (
          <SessionSummary
            messages={messages}
            sessionData={sessionData}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Chat */}
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          mode={mode}
          intakeSubmitted={intakeSubmitted}
          onGenerateSummary={handleGenerateSummary}
          summaryGenerated={showSummary}
        />
      </main>
    </div>
  )
}

function buildIntakePrompt(data: IntakeFormData): string {
  const { helpType, fields } = data
  const base = fields

  let intro = "I have a student here who needs help. Here is their information:\n"

  if (base.studentName) intro += `- Student Name: ${base.studentName}\n`
  if (base.major) intro += `- Major: ${base.major}\n`
  if (base.year) intro += `- Year: ${base.year}\n`

  switch (helpType) {
    case "faculty-search": {
      const f = fields as IntakeFormData extends { helpType: "faculty-search"; fields: infer F } ? F : never
      intro += `- Research Interests: ${(f as any).researchInterests}\n`
      if ((f as any).preferredDepartment) intro += `- Preferred Department: ${(f as any).preferredDepartment}\n`
      if ((f as any).researchExperience) intro += `- Research Experience: ${(f as any).researchExperience}\n`
      intro += "\nPlease search for FAU faculty whose research aligns with this student's interests. Provide a ranked list of 3-5 faculty members with profile links."
      break
    }
    case "faculty-profile": {
      const f = data.fields as any
      intro += `- Looking up professor: ${f.facultyName}\n`
      if (f.department) intro += `- Department: ${f.department}\n`
      if (f.reasonForLookup) intro += `- Reason: ${f.reasonForLookup}\n`
      intro += "\nPlease look up this FAU faculty member and provide their detailed research profile, including research areas, recent work, contact info, and profile links."
      break
    }
    case "department-overview": {
      const f = data.fields as any
      intro += `- Department of interest: ${f.departmentName}\n`
      if (f.specificAreas) intro += `- Specific areas of interest: ${f.specificAreas}\n`
      intro += "\nPlease provide an overview of research opportunities in this FAU department, including notable faculty, research themes, and relevant links."
      break
    }
    case "ouri-programs": {
      const f = data.fields as any
      intro += `- Program interest: ${f.programInterestType}\n`
      if (f.eligibilityConcerns) intro += `- Eligibility concerns: ${f.eligibilityConcerns}\n`
      if (f.timeline) intro += `- Timeline: ${f.timeline}\n`
      intro += "\nPlease search for OURI programs that match this student's interests and eligibility. Include program details, deadlines, and application links."
      break
    }
    case "student-match": {
      const f = data.fields as any
      intro += `- Research Interests: ${f.researchInterests}\n`
      intro += `- Favorite Classes: ${f.favoriteClasses}\n`
      intro += `- Research Goals: ${f.researchGoals}\n`
      if (f.skills) intro += `- Skills: ${f.skills}\n`
      if (f.previousResearch) intro += `- Previous Research: ${f.previousResearch}\n`
      if (f.additionalNotes) intro += `- Additional Notes: ${f.additionalNotes}\n`
      intro += "\nBased on this comprehensive profile, please recommend the best faculty mentors and OURI programs for this student. Include profile links and explain why each is a good match."
      break
    }
    case "other": {
      const f = data.fields as any
      intro += `- Request: ${f.description}\n`
      intro += "\nPlease help with this student's request using FAU's public resources. Provide relevant information and links."
      break
    }
  }

  return intro
}