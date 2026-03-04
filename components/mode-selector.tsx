"use client"

import type { ChatMode } from "@/lib/types"
import { Zap, UserCheck } from "lucide-react"

type ModeSelectorProps = {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
      <button
        onClick={() => onModeChange("quick-lookup")}
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-all ${
          mode === "quick-lookup"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground"
        }`}
        aria-label="Quick Lookup mode"
      >
        <Zap className="size-3" />
        Quick
      </button>
      <button
        onClick={() => onModeChange("personalized")}
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-all ${
          mode === "personalized"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground"
        }`}
        aria-label="Student Session mode"
      >
        <UserCheck className="size-3" />
        Session
      </button>
    </div>
  )
}