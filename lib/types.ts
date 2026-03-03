export type ChatMode = "quick-lookup" | "student-intake"

export type StudentProfile = {
  name?: string
  major: string
  year: string
  interests: string
  favoriteClasses: string
  researchGoals: string
  additionalNotes?: string
}

export type QuickAction = {
  id: string
  label: string
  icon: string
  prompt: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "faculty-search",
    label: "Find Faculty by Interest",
    icon: "search",
    prompt:
      "Help me find FAU faculty whose research aligns with a specific topic. What research area should I search for?",
  },
  {
    id: "faculty-profile",
    label: "Look Up a Faculty Member",
    icon: "user",
    prompt:
      "I'd like to look up a specific FAU faculty member's research profile. Which professor should I search for?",
  },
  {
    id: "department-overview",
    label: "Department Research Overview",
    icon: "building",
    prompt:
      "Give me an overview of research opportunities in a specific FAU department. Which department are you interested in?",
  },
  {
    id: "ouri-programs",
    label: "OURI Programs & Deadlines",
    icon: "calendar",
    prompt:
      "What OURI programs, grants, and upcoming deadlines should students know about right now?",
  },
  {
    id: "student-match",
    label: "Match Student to Opportunities",
    icon: "sparkles",
    prompt:
      "I'd like to match a student to research opportunities. Let me share their profile so you can suggest the best faculty and program matches.",
  },
  {
    id: "session-summary",
    label: "Generate Session Summary",
    icon: "file-text",
    prompt: "Please generate a summary of our conversation so far.",
  },
]
