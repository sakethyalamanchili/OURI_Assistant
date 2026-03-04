"use client"

import { useState, useCallback } from "react"
import type { HelpType, IntakeFormData } from "@/lib/types"
import { HELP_TYPE_OPTIONS, YEAR_OPTIONS, PROGRAM_INTEREST_OPTIONS } from "@/lib/types"
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserPlus,
  Search,
  User,
  Building2,
  CalendarDays,
  Sparkles,
  MessageCircle,
  CheckCircle2,
} from "lucide-react"

const HELP_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="size-4" />,
  user: <User className="size-4" />,
  building: <Building2 className="size-4" />,
  calendar: <CalendarDays className="size-4" />,
  sparkles: <Sparkles className="size-4" />,
  "message-circle": <MessageCircle className="size-4" />,
}

type StudentIntakeFormProps = {
  onSubmit: (data: IntakeFormData) => void
  disabled: boolean
}

export function StudentIntakeForm({ onSubmit, disabled }: StudentIntakeFormProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [step, setStep] = useState<"select-help" | "fill-form">("select-help")
  const [helpType, setHelpType] = useState<HelpType | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Record<string, string>>({})

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }, [errors])

  const handleHelpTypeSelect = useCallback((type: HelpType) => {
    setHelpType(type)
    setStep("fill-form")
    setFormData({})
    setErrors({})
  }, [])

  const handleBack = useCallback(() => {
    setStep("select-help")
    setHelpType(null)
    setFormData({})
    setErrors({})
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    const requiredFields = getRequiredFields(helpType!)

    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        newErrors[field] = "Required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [helpType, formData])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!helpType || !validate()) return

      const data = buildFormData(helpType, formData)
      onSubmit(data)
      setCollapsed(true)
    },
    [helpType, formData, validate, onSubmit]
  )

  const selectedOption = helpType
    ? HELP_TYPE_OPTIONS.find((o) => o.id === helpType)
    : null

  return (
    <div className="border-b border-border bg-card">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-accent/30 md:px-6"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Student Intake Form
          </span>
          {collapsed && selectedOption && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
              <CheckCircle2 className="size-3" />
              {selectedOption.label}
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="size-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-5 md:px-6">
          {step === "select-help" ? (
            /* Step 1: Select help type */
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                What does the student need help with today?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {HELP_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleHelpTypeSelect(option.id)}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition-all duration-150 hover:border-primary/30 hover:bg-accent hover:shadow-sm active:scale-[0.98]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      {HELP_ICONS[option.icon]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Step 2: Dynamic form based on help type */
            <form onSubmit={handleSubmit}>
              {/* Back button and selected help type */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronDown className="size-3 rotate-90" />
                  Back
                </button>
                {selectedOption && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5">
                    <span className="flex size-5 items-center justify-center text-primary">
                      {HELP_ICONS[selectedOption.icon]}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      {selectedOption.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Common base fields */}
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Student Name"
                  hint="optional"
                  value={formData.studentName || ""}
                  onChange={(v) => updateField("studentName", v)}
                  placeholder="Student name"
                  error={errors.studentName}
                />
                <FormField
                  label="Major"
                  required
                  value={formData.major || ""}
                  onChange={(v) => updateField("major", v)}
                  placeholder="e.g. Biology, Computer Science"
                  error={errors.major}
                />
                <FormSelect
                  label="Year"
                  required
                  value={formData.year || ""}
                  onChange={(v) => updateField("year", v)}
                  options={YEAR_OPTIONS}
                  placeholder="Select year"
                  error={errors.year}
                />

                {/* Dynamic fields based on help type */}
                {helpType === "faculty-search" && (
                  <>
                    <FormField
                      label="Research Interests"
                      required
                      value={formData.researchInterests || ""}
                      onChange={(v) => updateField("researchInterests", v)}
                      placeholder="e.g. marine biology, coral reef ecology, AI/ML"
                      error={errors.researchInterests}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormField
                      label="Preferred Department"
                      hint="optional"
                      value={formData.preferredDepartment || ""}
                      onChange={(v) => updateField("preferredDepartment", v)}
                      placeholder="e.g. Biology, Computer Science"
                      error={errors.preferredDepartment}
                    />
                    <FormField
                      label="Research Experience"
                      hint="optional"
                      value={formData.researchExperience || ""}
                      onChange={(v) => updateField("researchExperience", v)}
                      placeholder="e.g. lab work, independent study, none"
                      error={errors.researchExperience}
                      className="sm:col-span-1 lg:col-span-2"
                    />
                  </>
                )}

                {helpType === "faculty-profile" && (
                  <>
                    <FormField
                      label="Faculty Name"
                      required
                      value={formData.facultyName || ""}
                      onChange={(v) => updateField("facultyName", v)}
                      placeholder="e.g. Dr. Jane Smith"
                      error={errors.facultyName}
                      className="sm:col-span-2"
                    />
                    <FormField
                      label="Department"
                      hint="if known"
                      value={formData.department || ""}
                      onChange={(v) => updateField("department", v)}
                      placeholder="e.g. Physics"
                      error={errors.department}
                    />
                    <FormTextarea
                      label="Why are they looking up this professor?"
                      hint="optional"
                      value={formData.reasonForLookup || ""}
                      onChange={(v) => updateField("reasonForLookup", v)}
                      placeholder="e.g. interested in their lab, recommended by advisor, saw their publication"
                      error={errors.reasonForLookup}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </>
                )}

                {helpType === "department-overview" && (
                  <>
                    <FormField
                      label="Department Name"
                      required
                      value={formData.departmentName || ""}
                      onChange={(v) => updateField("departmentName", v)}
                      placeholder="e.g. College of Engineering, Biology"
                      error={errors.departmentName}
                      className="sm:col-span-2"
                    />
                    <FormTextarea
                      label="Specific Areas of Interest"
                      hint="optional"
                      value={formData.specificAreas || ""}
                      onChange={(v) => updateField("specificAreas", v)}
                      placeholder="e.g. neuroscience research, sustainability projects"
                      error={errors.specificAreas}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </>
                )}

                {helpType === "ouri-programs" && (
                  <>
                    <FormSelect
                      label="Type of Program Interest"
                      required
                      value={formData.programInterestType || ""}
                      onChange={(v) => updateField("programInterestType", v)}
                      options={PROGRAM_INTEREST_OPTIONS}
                      placeholder="Select program type"
                      error={errors.programInterestType}
                      className="sm:col-span-2"
                    />
                    <FormField
                      label="Timeline"
                      hint="optional"
                      value={formData.timeline || ""}
                      onChange={(v) => updateField("timeline", v)}
                      placeholder="e.g. this semester, next fall, summer 2025"
                      error={errors.timeline}
                    />
                    <FormTextarea
                      label="Eligibility Concerns"
                      hint="optional"
                      value={formData.eligibilityConcerns || ""}
                      onChange={(v) => updateField("eligibilityConcerns", v)}
                      placeholder="e.g. transfer student, first-year, international student"
                      error={errors.eligibilityConcerns}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </>
                )}

                {helpType === "student-match" && (
                  <>
                    <FormField
                      label="Research Interests"
                      required
                      value={formData.researchInterests || ""}
                      onChange={(v) => updateField("researchInterests", v)}
                      placeholder="e.g. marine biology, coral reef ecology, climate change"
                      error={errors.researchInterests}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormField
                      label="Favorite Classes"
                      required
                      value={formData.favoriteClasses || ""}
                      onChange={(v) => updateField("favoriteClasses", v)}
                      placeholder="e.g. Marine Ecosystems, Organic Chemistry, Data Analysis"
                      error={errors.favoriteClasses}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormTextarea
                      label="Research Goals"
                      required
                      value={formData.researchGoals || ""}
                      onChange={(v) => updateField("researchGoals", v)}
                      placeholder="e.g. gain lab experience, publish a paper, prepare for grad school"
                      error={errors.researchGoals}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormField
                      label="Skills"
                      hint="optional"
                      value={formData.skills || ""}
                      onChange={(v) => updateField("skills", v)}
                      placeholder="e.g. Python, lab techniques, data analysis, writing"
                      error={errors.skills}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormTextarea
                      label="Previous Research Experience"
                      hint="optional"
                      value={formData.previousResearch || ""}
                      onChange={(v) => updateField("previousResearch", v)}
                      placeholder="e.g. worked in Dr. Smith's lab for 1 semester on coral reef studies"
                      error={errors.previousResearch}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <FormTextarea
                      label="Additional Notes"
                      hint="optional"
                      value={formData.additionalNotes || ""}
                      onChange={(v) => updateField("additionalNotes", v)}
                      placeholder="Anything else relevant — specific faculty they mentioned, constraints, etc."
                      error={errors.additionalNotes}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </>
                )}

                {helpType === "other" && (
                  <FormTextarea
                    label="Describe what the student needs"
                    required
                    value={formData.description || ""}
                    onChange={(v) => updateField("description", v)}
                    placeholder="Describe the student's question or what they're looking for..."
                    error={errors.description}
                    className="sm:col-span-2 lg:col-span-3"
                    rows={3}
                  />
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-destructive">*</span> Required fields
                </p>
                <button
                  type="submit"
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  Start Session
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// Helper components

function FormField({
  label,
  required,
  hint,
  value,
  onChange,
  placeholder,
  error,
  className,
}: {
  label: string
  required?: boolean
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
        {hint && <span className="text-muted-foreground/50">({hint})</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
          error ? "border-destructive ring-1 ring-destructive/20" : "border-input"
        }`}
      />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

function FormTextarea({
  label,
  required,
  hint,
  value,
  onChange,
  placeholder,
  error,
  className,
  rows = 2,
}: {
  label: string
  required?: boolean
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  className?: string
  rows?: number
}) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
        {hint && <span className="text-muted-foreground/50">({hint})</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
          error ? "border-destructive ring-1 ring-destructive/20" : "border-input"
        }`}
      />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

function FormSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  error,
  className,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  error?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
          error ? "border-destructive ring-1 ring-destructive/20" : "border-input"
        } ${!value ? "text-muted-foreground/50" : ""}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

// Helper functions

function getRequiredFields(helpType: HelpType): string[] {
  const base = ["major", "year"]

  switch (helpType) {
    case "faculty-search":
      return [...base, "researchInterests"]
    case "faculty-profile":
      return [...base, "facultyName"]
    case "department-overview":
      return [...base, "departmentName"]
    case "ouri-programs":
      return [...base, "programInterestType"]
    case "student-match":
      return [...base, "researchInterests", "favoriteClasses", "researchGoals"]
    case "other":
      return [...base, "description"]
    default:
      return base
  }
}

function buildFormData(helpType: HelpType, data: Record<string, string>): IntakeFormData {
  const base = {
    studentName: data.studentName || undefined,
    major: data.major,
    year: data.year,
  }

  switch (helpType) {
    case "faculty-search":
      return {
        helpType,
        fields: {
          ...base,
          researchInterests: data.researchInterests,
          preferredDepartment: data.preferredDepartment || undefined,
          researchExperience: data.researchExperience || undefined,
        },
      }
    case "faculty-profile":
      return {
        helpType,
        fields: {
          ...base,
          facultyName: data.facultyName,
          department: data.department || undefined,
          reasonForLookup: data.reasonForLookup || undefined,
        },
      }
    case "department-overview":
      return {
        helpType,
        fields: {
          ...base,
          departmentName: data.departmentName,
          specificAreas: data.specificAreas || undefined,
        },
      }
    case "ouri-programs":
      return {
        helpType,
        fields: {
          ...base,
          programInterestType: data.programInterestType,
          eligibilityConcerns: data.eligibilityConcerns || undefined,
          timeline: data.timeline || undefined,
        },
      }
    case "student-match":
      return {
        helpType,
        fields: {
          ...base,
          researchInterests: data.researchInterests,
          favoriteClasses: data.favoriteClasses,
          researchGoals: data.researchGoals,
          skills: data.skills || undefined,
          previousResearch: data.previousResearch || undefined,
          additionalNotes: data.additionalNotes || undefined,
        },
      }
    case "other":
      return {
        helpType,
        fields: {
          ...base,
          description: data.description,
        },
      }
  }
}