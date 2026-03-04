export type ChatMode = "quick-lookup" | "personalized"

export type HelpType =
  | "faculty-search"
  | "faculty-profile"
  | "department-overview"
  | "ouri-programs"
  | "student-match"
  | "other"

export type HelpTypeOption = {
  id: HelpType
  label: string
  description: string
  icon: string
}

export const HELP_TYPE_OPTIONS: HelpTypeOption[] = [
  {
    id: "faculty-search",
    label: "Find Faculty by Interest",
    description: "Search for FAU professors working in a specific research area",
    icon: "search",
  },
  {
    id: "faculty-profile",
    label: "Look Up a Faculty Member",
    description: "Get a detailed research profile for a specific professor",
    icon: "user",
  },
  {
    id: "department-overview",
    label: "Department Research Overview",
    description: "Explore what research is happening in a department",
    icon: "building",
  },
  {
    id: "ouri-programs",
    label: "OURI Programs & Deadlines",
    description: "Current programs, grants, and upcoming deadlines",
    icon: "calendar",
  },
  {
    id: "student-match",
    label: "Match Student to Opportunities",
    description: "Get personalized faculty and program recommendations",
    icon: "sparkles",
  },
  {
    id: "other",
    label: "Other / Custom Request",
    description: "Describe what the student needs help with",
    icon: "message-circle",
  },
]

// Base fields always collected
export type BaseStudentInfo = {
  studentName?: string
  major: string
  year: string
}

// Dynamic fields per help type
export type FacultySearchFields = BaseStudentInfo & {
  researchInterests: string
  preferredDepartment?: string
  researchExperience?: string
}

export type FacultyProfileFields = BaseStudentInfo & {
  facultyName: string
  department?: string
  reasonForLookup?: string
}

export type DepartmentOverviewFields = BaseStudentInfo & {
  departmentName: string
  specificAreas?: string
}

export type OuriProgramFields = BaseStudentInfo & {
  programInterestType: string // grant, mentorship, summer program, etc.
  eligibilityConcerns?: string
  timeline?: string
}

export type StudentMatchFields = BaseStudentInfo & {
  researchInterests: string
  favoriteClasses: string
  researchGoals: string
  skills?: string
  previousResearch?: string
  additionalNotes?: string
}

export type OtherFields = BaseStudentInfo & {
  description: string
}

export type IntakeFormData =
  | { helpType: "faculty-search"; fields: FacultySearchFields }
  | { helpType: "faculty-profile"; fields: FacultyProfileFields }
  | { helpType: "department-overview"; fields: DepartmentOverviewFields }
  | { helpType: "ouri-programs"; fields: OuriProgramFields }
  | { helpType: "student-match"; fields: StudentMatchFields }
  | { helpType: "other"; fields: OtherFields }

export type SessionData = {
  helpType: HelpType
  studentName?: string
  major?: string
  year?: string
  startTime: string
  messageCount: number
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
]

export const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Post-Baccalaureate",
  "Graduate",
]

export const PROGRAM_INTEREST_OPTIONS = [
  "Vertically Integrated Projects (VIP)",
  "Research Grant / Funding",
  "Faculty Mentorship",
  "Summer Research Program (SURF)",
  "Prestigious Fellowships",
  "Peer Mentor Program",
  "Undergraduate Research Symposium",
  "Undergraduate Research Journal (FAURJ)",
  "Directed Independent Research (DIR)",
  "Honors Thesis Support",
  "Conference Travel Support",
  "Not Sure — Explore Options",
]