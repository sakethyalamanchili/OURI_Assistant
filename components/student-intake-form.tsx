"use client"

import { useState } from "react"
import type { StudentProfile } from "@/lib/types"
import { ChevronDown, ChevronUp, ArrowRight, UserPlus } from "lucide-react"

type StudentIntakeFormProps = {
  onSubmit: (profile: StudentProfile) => void
  disabled: boolean
}

const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Post-Baccalaureate",
]

export function StudentIntakeForm({
  onSubmit,
  disabled,
}: StudentIntakeFormProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [errors, setErrors] = useState<
    Partial<Record<keyof StudentProfile, string>>
  >({})
  const [form, setForm] = useState<StudentProfile>({
    name: "",
    major: "",
    year: "",
    interests: "",
    favoriteClasses: "",
    researchGoals: "",
    additionalNotes: "",
  })

  function updateField(field: keyof StudentProfile, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof StudentProfile, string>> = {}
    if (!form.major.trim()) newErrors.major = "Required"
    if (!form.year) newErrors.year = "Required"
    if (!form.interests.trim()) newErrors.interests = "Required"
    if (!form.favoriteClasses.trim()) newErrors.favoriteClasses = "Required"
    if (!form.researchGoals.trim()) newErrors.researchGoals = "Required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
    setCollapsed(true)
  }

  const filledFields = [
    form.major,
    form.year,
    form.interests,
    form.favoriteClasses,
    form.researchGoals,
  ].filter((v) => v.trim()).length

  return (
    <div className="border-b border-border bg-card">
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
          {collapsed && filledFields > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {filledFields}/5 filled
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
        <form onSubmit={handleSubmit} className="px-4 pb-5 md:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="intake-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Name{" "}
                <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <input
                id="intake-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Student name"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Major */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="intake-major"
                className="text-xs font-medium text-muted-foreground"
              >
                Major <span className="text-destructive">*</span>
              </label>
              <input
                id="intake-major"
                type="text"
                value={form.major}
                onChange={(e) => updateField("major", e.target.value)}
                placeholder="e.g. Biology, Computer Science"
                className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
                  errors.major
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                }`}
              />
              {errors.major && (
                <p className="text-[11px] text-destructive">{errors.major}</p>
              )}
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="intake-year"
                className="text-xs font-medium text-muted-foreground"
              >
                Year <span className="text-destructive">*</span>
              </label>
              <select
                id="intake-year"
                value={form.year}
                onChange={(e) => updateField("year", e.target.value)}
                className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
                  errors.year
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                } ${!form.year ? "text-muted-foreground/50" : ""}`}
              >
                <option value="" disabled>
                  Select year
                </option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {errors.year && (
                <p className="text-[11px] text-destructive">{errors.year}</p>
              )}
            </div>

            {/* Key Interests */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="intake-interests"
                className="text-xs font-medium text-muted-foreground"
              >
                Key Research Interests{" "}
                <span className="text-destructive">*</span>
              </label>
              <input
                id="intake-interests"
                type="text"
                value={form.interests}
                onChange={(e) => updateField("interests", e.target.value)}
                placeholder="e.g. marine biology, coral reef ecology, climate change impacts"
                className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
                  errors.interests
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                }`}
              />
              {errors.interests && (
                <p className="text-[11px] text-destructive">
                  {errors.interests}
                </p>
              )}
            </div>

            {/* Favorite Classes */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="intake-classes"
                className="text-xs font-medium text-muted-foreground"
              >
                Favorite Classes <span className="text-destructive">*</span>
              </label>
              <input
                id="intake-classes"
                type="text"
                value={form.favoriteClasses}
                onChange={(e) =>
                  updateField("favoriteClasses", e.target.value)
                }
                placeholder="e.g. Marine Ecosystems, Organic Chemistry, Data Analysis"
                className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
                  errors.favoriteClasses
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                }`}
              />
              {errors.favoriteClasses && (
                <p className="text-[11px] text-destructive">
                  {errors.favoriteClasses}
                </p>
              )}
            </div>

            {/* Research Goals */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="intake-goals"
                className="text-xs font-medium text-muted-foreground"
              >
                Research Goals <span className="text-destructive">*</span>
              </label>
              <textarea
                id="intake-goals"
                value={form.researchGoals}
                onChange={(e) =>
                  updateField("researchGoals", e.target.value)
                }
                placeholder="What does the student hope to achieve? (e.g. gain lab experience, publish a paper, prepare for grad school)"
                rows={2}
                className={`resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors ${
                  errors.researchGoals
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                }`}
              />
              {errors.researchGoals && (
                <p className="text-[11px] text-destructive">
                  {errors.researchGoals}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="intake-notes"
                className="text-xs font-medium text-muted-foreground"
              >
                Additional Notes{" "}
                <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <textarea
                id="intake-notes"
                value={form.additionalNotes}
                onChange={(e) =>
                  updateField("additionalNotes", e.target.value)
                }
                placeholder="Any other relevant info (skills, previous research, specific faculty, etc.)"
                rows={2}
                className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
              />
            </div>
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
              Find Matches
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
