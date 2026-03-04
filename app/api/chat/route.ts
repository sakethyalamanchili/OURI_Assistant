import {
  generateText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type UIMessage,
} from "ai"
import { SYSTEM_PROMPT } from "@/lib/system-prompt"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 60

function getProviderConfig() {
  const provider = process.env.AI_PROVIDER?.toLowerCase()

  if (provider === "claude" || provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    return {
      model: anthropic("claude-sonnet-4-20250514"),
      tools: {} as Record<string, any>,
      isGemini: false,
    }
  }

  if (provider === "openai" || provider === "gpt") {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return {
      model: openai("gpt-4o"),
      tools: {} as Record<string, any>,
      isGemini: false,
    }
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
  return {
    model: google("gemini-2.5-flash"),
    tools: { google_search: google.tools.googleSearch({}) },
    isGemini: true,
  }
}

// ──────────────────────────────────────────────
// URL Helpers
// ──────────────────────────────────────────────

async function resolveRedirectUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res.headers.get("location") || url
  } catch {
    return url
  }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", "") }
  catch { return "" }
}

function categorizeUrl(url: string): {
  emoji: string
  label: string
  category: string // used for dedup — one link per category per faculty
  priority: number // lower = show first
  quality: number  // 0 = filter out, 1 = low, 2 = normal, 3 = high
} {
  const domain = getDomain(url)
  const path = url.toLowerCase()

  // ── Google Scholar ──
  if (domain.startsWith("scholar.google"))
    return { emoji: "🎓", label: "Google Scholar", category: "scholar", priority: 1, quality: 3 }

  // ── DBLP ──
  if (domain === "dblp.org")
    return { emoji: "📚", label: "DBLP Publications", category: "dblp", priority: 4, quality: 2 }

  // ── ResearchGate ──
  if (domain === "researchgate.net")
    return { emoji: "🔬", label: "ResearchGate", category: "researchgate", priority: 5, quality: 2 }

  // ── PubMed ──
  if (domain === "pubmed.ncbi.nlm.nih.gov")
    return { emoji: "📚", label: "PubMed", category: "pubmed", priority: 6, quality: 2 }

  // ── Filter out low-quality external sources ──
  if (
    domain === "sciprofiles.com" ||
    domain === "igi-global.com" ||
    domain === "expertnet.org" ||
    domain === "expertfile.com" ||
    domain === "accenius.ai" ||
    domain === "purchase.edu" ||
    domain === "lsc.ieee.org" ||
    domain === "adscientificindex.com" ||
    domain === "iscturkiye.com" ||
    domain === "research.com" ||
    domain === "knowledgespeak.com" ||
    domain === "cbmi2017.micc.unifi.it" ||
    domain === "scopus.com" ||
    domain === "semanticscholar.org" ||
    domain === "webofscience.com" ||
    domain === "inspirehep.net" ||
    domain === "mathscinet.ams.org" ||
    domain === "zbmath.org" ||
    domain === "wikicfp.com" ||
    // ── Discovered from testing ──
    domain === "upressonline.com" ||       // local news
    domain === "rdworldonline.com" ||      // news site
    domain === "stacks.cdc.gov" ||         // CDC doc archive
    domain.includes("wikipedia.org") ||    // Wikipedia
    domain.includes("hpccsystems.com") ||
    domain.includes("eurekalert.org") ||
    domain.includes("sigmaxi.org") ||
    domain.includes("signalprocessingsociety") ||
    domain.includes("springer.com") ||     // publisher pages, not profiles
    domain.includes("wiley.com") ||        // publisher pages
    domain.includes("elsevier.com") ||     // publisher pages
    path.includes("/speaker/") ||          // conference speaker pages
    path.includes("/award_recipients/") || // generic award listings
    (path.endsWith(".pdf") && !path.includes("publication"))
  )
    return { emoji: "🔗", label: domain, category: "external-low", priority: 99, quality: 0 }

  // ── Generic department/listing pages (NOT individual profiles) ──
  // These should go to Additional Resources, not under specific faculty
  if (
    path.match(/\/eecs\/research\/?$/) ||              // /engineering/eecs/research/
    path.match(/\/ai\/research\/ai-researchers\/?$/) || // AI researchers listing
    path.match(/\/biomedical\/directory\/?$/) ||        // department directory listing
    path.match(/\/eecs\/research\/research-interests\/?$/) || // research interests listing
    path.match(/\/engineering\/eecs\/?$/) ||            // department homepage
    path.match(/\/i-health\/.*\/faculty\/?$/)           // i-health faculty listing
  )
    return { emoji: "🏛️", label: "FAU Department Page", category: "dept-listing", priority: 9, quality: 1 }

  // ── FAU: Faculty directory profile (highest value FAU link) ──
  if (path.includes("/directory/faculty/"))
    return { emoji: "📄", label: "FAU Faculty Profile", category: "fau-profile", priority: 2, quality: 3 }

  // ── FAU: Old-style faculty page (eng.fau.edu or cse.fau.edu) ──
  if (domain === "faculty.eng.fau.edu" || domain === "cse.fau.edu")
    return { emoji: "📄", label: "FAU Faculty Page", category: "fau-profile-alt", priority: 3, quality: 2 }

  // ── FAU: Lab / research center pages ──
  if (path.includes("/labs/") || path.includes("/aidl/") || path.includes("/research/aidl"))
    return { emoji: "🔬", label: "Research Lab", category: "lab", priority: 3, quality: 3 }

  // ── FAU: I-SENSE ──
  if (path.includes("/isense/"))
    return { emoji: "🏛️", label: "I-SENSE Profile", category: "isense", priority: 5, quality: 2 }

  // ── FAU: News articles about faculty ──
  if (path.includes("/news") || path.includes("/newsdesk/"))
    return { emoji: "📰", label: "FAU News", category: "news", priority: 7, quality: 2 }

  // ── FAU: AI initiative pages ──
  if (path.includes("/ai/research"))
    return { emoji: "🤖", label: "FAU AI Research", category: "ai-research", priority: 6, quality: 2 }
  if (path.includes("/ai/"))
    return { emoji: "🤖", label: "FAU AI Page", category: "ai-page", priority: 7, quality: 2 }

  // ── FAU: Department research overview ──
  if (path.includes("/eecs/research"))
    return { emoji: "🏛️", label: "EECS Research", category: "dept-research", priority: 6, quality: 2 }

  // ── FAU: Graduate programs ──
  if (path.includes("/graduate/"))
    return { emoji: "🎓", label: "Graduate Program", category: "grad-program", priority: 8, quality: 2 }

  // ── FAU: E-learning / Digital Lab ──
  if (path.includes("/elearning/"))
    return { emoji: "💻", label: "FAU eLearning", category: "elearning", priority: 7, quality: 2 }

  // ── Signal Processing Society, IEEE, etc. ──
  if (domain.includes("signalprocessingsociety") || domain.includes("ieee.org"))
    return { emoji: "📰", label: "IEEE/Professional Profile", category: "professional", priority: 8, quality: 1 }

  // ── Research Park awards ──
  if (domain.includes("researchparkfau"))
    return { emoji: "🏆", label: "Research Park Award", category: "award", priority: 8, quality: 1 }

  // ── Generic FAU page ──
  if (domain.includes("fau.edu"))
    return { emoji: "📄", label: "FAU Page", category: "fau-other", priority: 8, quality: 2 }

  // ── Any other external ──
  return { emoji: "🔗", label: domain, category: "external", priority: 9, quality: 1 }
}

function labelFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace("www.", "")
    const parts = parsed.pathname.split("/").filter(Boolean)
    if (parts.length > 0) {
      const last = parts[parts.length - 1]
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, "")
      if (last.length > 3 && last.length < 80) {
        return `${host} — ${last.replace(/\b\w/g, (c) => c.toUpperCase())}`
      }
    }
    return host
  } catch { return "Source" }
}

// ──────────────────────────────────────────────
// Build organized sources section from grounding
// metadata, grouped by faculty member
// ──────────────────────────────────────────────

async function buildOrganizedSources(
  responseText: string,
  providerMetadata: any
): Promise<string> {
  try {
    const groundingMeta = providerMetadata?.google?.groundingMetadata
    if (!groundingMeta) return ""

    const chunks: any[] = groundingMeta.groundingChunks || []
    const supports: any[] = groundingMeta.groundingSupports || []
    if (chunks.length === 0) return ""

    // ── Step 1: Resolve redirect URLs (max 25, with timeouts) ──
    const uriToChunkIndices = new Map<string, number[]>()
    chunks.forEach((c: any, idx: number) => {
      const uri = c?.web?.uri
      if (uri) {
        if (!uriToChunkIndices.has(uri)) uriToChunkIndices.set(uri, [])
        uriToChunkIndices.get(uri)!.push(idx)
      }
    })

    const uniqueRedirects = [...uriToChunkIndices.keys()].slice(0, 25)
    const resolvedResults = await Promise.all(
      uniqueRedirects.map(resolveRedirectUrl)
    )

    // chunkIndex → resolvedUrl
    const chunkResolved: string[] = new Array(chunks.length).fill("")
    uniqueRedirects.forEach((redirect, i) => {
      const resolved = resolvedResults[i]
      uriToChunkIndices.get(redirect)!.forEach((idx) => {
        chunkResolved[idx] = resolved
      })
    })

    const allResolved = [...new Set(chunkResolved)].filter(
      (u) => u && !u.includes("vertexaisearch.cloud.google.com")
    )

    if (allResolved.length === 0) return ""

    // ── Step 2: Extract faculty names and their text positions ──
    const facultyEntries: { displayName: string; lastName: string; pos: number }[] = []
    // Match patterns like "**1. Dr. Xingquan (Hill) Zhu**, Professor" or "**Dr. Taghi M. Khoshgoftaar**, Motorola Professor"
    const nameRegex = /\*\*(?:\d+\.\s*)?(?:Dr\.?\s*)?([^*]+?)\*\*\s*,?\s*(?:Professor|Associate|Assistant|Motorola|I-SENSE|Eminent|Chair|Director)/gi
    let nameMatch: RegExpExecArray | null
    while ((nameMatch = nameRegex.exec(responseText)) !== null) {
      const fullName = nameMatch[1].trim()
      // Get last name: remove parenthetical nicknames, take last word
      const cleaned = fullName.replace(/\([^)]*\)/g, "").trim()
      const words = cleaned.split(/\s+/)
      const lastName = words[words.length - 1].toLowerCase()
      facultyEntries.push({
        displayName: fullName.replace(/\s+/g, " "),
        lastName,
        pos: nameMatch.index,
      })
    }

    // ── Step 3: Map URLs to faculty using groundingSupports ──
    // Each support: { segment: { startIndex, endIndex, text }, groundingChunkIndices: [n, ...] }
    const facultyUrlMap = new Map<string, Set<string>>() // displayName → Set<url>
    const mappedUrls = new Set<string>()

    // Track which Scholar user IDs have been assigned to which faculty
    const scholarAssignments = new Map<string, string>() // scholarUserId → displayName

    /** Extract Google Scholar user ID from URL */
    function getScholarUserId(url: string): string | null {
      try {
        const parsed = new URL(url)
        if (!parsed.hostname.startsWith("scholar.google")) return null
        return parsed.searchParams.get("user")
      } catch { return null }
    }

    /** Check if a URL "belongs to" a specific faculty by checking if their
     *  name (or parts of it) appears in the URL path/params. Returns the
     *  displayName of the matching faculty, or null if no match. */
    function urlBelongsToFaculty(url: string): string | null {
      const urlLower = url.toLowerCase()
      for (const entry of facultyEntries) {
        // Check last name (min 3 chars to avoid false positives)
        if (entry.lastName.length > 2 && urlLower.includes(entry.lastName)) {
          return entry.displayName
        }
        // Also check first name from display name
        const firstName = entry.displayName
          .replace(/\([^)]*\)/g, "")
          .trim()
          .split(/\s+/)[0]
          .toLowerCase()
        if (firstName.length > 3 && urlLower.includes(firstName)) {
          return entry.displayName
        }
      }
      return null
    }

    for (const support of supports) {
      const segStart = support.segment?.startIndex ?? 0
      const chunkIndices: number[] = support.groundingChunkIndices || []

      // Find nearest faculty name ABOVE this segment position
      let nearestFaculty: typeof facultyEntries[0] | null = null
      for (let i = facultyEntries.length - 1; i >= 0; i--) {
        if (facultyEntries[i].pos <= segStart) {
          nearestFaculty = facultyEntries[i]
          break
        }
      }

      for (const idx of chunkIndices) {
        const resolved = chunkResolved[idx]
        if (!resolved || resolved.includes("vertexaisearch.cloud.google.com")) continue

        // Quality filter: skip low-quality URLs entirely
        const cat = categorizeUrl(resolved)
        if (cat.quality === 0) continue

        // ── NAME VALIDATION: check if URL contains a specific faculty name ──
        // If the URL contains faculty X's name but we're assigning to faculty Y,
        // assign to X instead (fixes misassignment from position-based mapping)
        const urlOwner = urlBelongsToFaculty(resolved)
        let assignTo: string | null = null

        if (urlOwner) {
          // URL clearly belongs to a specific faculty — assign to them
          assignTo = urlOwner
        } else if (nearestFaculty) {
          // Generic URL (no name in path) — only assign by position if
          // it's a high-quality, faculty-specific link type (profile, lab, etc.)
          // Generic department listings (quality <= 1) go to Additional Resources
          if (cat.quality >= 2) {
            assignTo = nearestFaculty.displayName
          }
        }

        if (assignTo) {
          // Scholar dedup: if this Scholar user ID was already assigned to
          // a DIFFERENT faculty, don't re-assign it
          const scholarId = getScholarUserId(resolved)
          if (scholarId) {
            const existing = scholarAssignments.get(scholarId)
            if (existing && existing !== assignTo) continue
            scholarAssignments.set(scholarId, assignTo)
          }

          if (!facultyUrlMap.has(assignTo)) facultyUrlMap.set(assignTo, new Set())
          facultyUrlMap.get(assignTo)!.add(resolved)
          mappedUrls.add(resolved)
        }
      }
    }

    // ── Step 4: Map remaining URLs by name-in-path matching ──
    for (const url of allResolved) {
      if (mappedUrls.has(url)) continue
      const cat = categorizeUrl(url)
      if (cat.quality === 0) continue

      const owner = urlBelongsToFaculty(url)
      if (owner) {
        const scholarId = getScholarUserId(url)
        if (scholarId) {
          const existing = scholarAssignments.get(scholarId)
          if (existing && existing !== owner) continue
          scholarAssignments.set(scholarId, owner)
        }

        if (!facultyUrlMap.has(owner)) facultyUrlMap.set(owner, new Set())
        facultyUrlMap.get(owner)!.add(url)
        mappedUrls.add(url)
      }
    }

    // ── Step 5: Deduplicate per faculty — keep best link per category, max 4 ──
    type CategorizedLink = {
      url: string
      emoji: string
      label: string
      category: string
      priority: number
      quality: number
    }

    const MAX_LINKS_PER_FACULTY = 4
    const facultyLinks = new Map<string, CategorizedLink[]>()

    for (const [displayName, urls] of facultyUrlMap) {
      const categorized: CategorizedLink[] = []

      for (const url of urls) {
        const cat = categorizeUrl(url)
        if (cat.quality === 0) continue
        categorized.push({ url, ...cat })
      }

      // Deduplicate: keep only the BEST URL per category
      // "Best" = highest quality, then shortest URL (more specific)
      const bestPerCategory = new Map<string, CategorizedLink>()
      for (const link of categorized) {
        const existing = bestPerCategory.get(link.category)
        if (
          !existing ||
          link.quality > existing.quality ||
          (link.quality === existing.quality && link.url.length < existing.url.length)
        ) {
          bestPerCategory.set(link.category, link)
        }
      }

      // Sort by priority (lower = first) and cap at MAX_LINKS_PER_FACULTY
      const deduped = [...bestPerCategory.values()]
        .sort((a, b) => a.priority - b.priority)
        .slice(0, MAX_LINKS_PER_FACULTY)

      if (deduped.length > 0) {
        facultyLinks.set(displayName, deduped)
      }
    }

    // ── Step 6: Build the organized section ──
    if (facultyLinks.size === 0 && allResolved.length === 0) return ""

    let section = "\n\n---\n\n### 🔗 Verified Links\n\n"
    section += "_Real links from Google Search, organized by faculty:_\n\n"

    for (const [displayName, links] of facultyLinks) {
      section += `**${displayName}:**\n`
      for (const link of links) {
        section += `- ${link.emoji} [${link.label}](${link.url})\n`
      }
      section += "\n"
    }

    // Unmapped URLs → Additional Resources (deduped and filtered)
    const unmapped = allResolved.filter((u) => {
      if (mappedUrls.has(u)) return false
      const cat = categorizeUrl(u)
      if (cat.quality === 0) return false
      // Filter out Scholar variants from Additional Resources
      // (scholar.google.fi, scholar.google.cl etc. without a specific user)
      if (getDomain(u).startsWith("scholar.google")) return false
      return true
    })
    if (unmapped.length > 0) {
      section += "**📎 Additional Resources:**\n"
      // Dedup unmapped by category too
      const unmappedBest = new Map<string, { url: string; label: string }>()
      for (const url of unmapped) {
        const cat = categorizeUrl(url)
        if (!unmappedBest.has(cat.category)) {
          unmappedBest.set(cat.category, { url, label: labelFromUrl(url) })
        }
      }
      for (const { url, label } of unmappedBest.values()) {
        section += `- [${label}](${url})\n`
      }
      section += "\n"
    }

    return section
  } catch (error) {
    console.error("Error building organized sources:", error)
    return ""
  }
}

// ──────────────────────────────────────────────
// API Route
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Helper: stream text in paragraph-sized chunks
// Sends ~20-30 writes instead of 500+ word writes
// ──────────────────────────────────────────────

async function streamChunked(
  writer: any,
  textId: string,
  text: string,
  chunkDelayMs: number = 60
) {
  // Split into paragraphs (double newline) for natural pacing
  const paragraphs = text.split(/(\n\n+)/)

  for (let i = 0; i < paragraphs.length; i++) {
    const chunk = paragraphs[i]
    if (!chunk) continue

    // Write entire paragraph in one go
    writer.write({ type: "text-delta", id: textId, delta: chunk })

    // Delay between paragraphs (skip delay for whitespace-only chunks)
    if (chunk.trim().length > 0 && i < paragraphs.length - 1) {
      await new Promise((r) => setTimeout(r, chunkDelayMs))
    }
  }
}

// ──────────────────────────────────────────────
// API Route
// ──────────────────────────────────────────────

export async function POST(req: Request) {
  const {
    messages,
    mode,
  }: {
    messages: UIMessage[]
    mode?: string
  } = await req.json()

  let systemSuffix = ""

  if (mode === "student-intake") {
    systemSuffix = `

## Personalized Session Mode

The user is an OURI staff member conducting a personalized student consultation.

**Important behaviors in this mode:**
- Remember ALL context from the entire conversation — this is a continuous session about ONE student.
- Provide thorough, personalized faculty recommendations using the Rich Faculty Profile format.
- **Search for EACH faculty member individually** — do not rely on a single broad search. Search "[Name] FAU" and "[Name] Google Scholar" for each person.
- **DO NOT include any URLs, links, or web addresses in your response.** The system will automatically append verified links.
- **DO NOT write placeholder text** like "(Searching for...)" or "(not available)". If you can't find something, just omit it.
- Include office location, room number, phone, and email as plain text when you find them.
- Be proactive: suggest how the student should approach each faculty member.
- When generating a session summary, create a comprehensive, email-ready document.`
  } else {
    systemSuffix = `

## Quick Lookup Mode

The user is an OURI staff member doing quick lookups. Answer directly and concisely. **DO NOT include any URLs** — the system automatically appends verified links. Include office/room/phone/email as plain text.`
  }

  const { model, tools, isGemini } = getProviderConfig()

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // ── Phase 1: Show immediate "searching" message ──
      // This appears instantly so the user sees the response bubble
      const searchId = generateId()
      writer.write({ type: "text-start", id: searchId })
      writer.write({
        type: "text-delta",
        id: searchId,
        delta: "🔍 _Searching FAU faculty databases, Google Scholar, and research directories. This may take 15-20 seconds for thorough results..._\n\n",
      })

      try {
        // ── Phase 2: Generate response (10-20s for Gemini + Search) ──
        // Send progress dots every 3s so user sees activity
        let dotCount = 0
        const keepalive = setInterval(() => {
          try {
            dotCount++
            if (dotCount <= 6) {
              // Show dots: . .. ... .... ..... ......
              writer.write({ type: "text-delta", id: searchId, delta: "." })
            }
          } catch {
            // Writer may be closed if an error occurred
          }
        }, 2500)

        let result
        try {
          result = await generateText({
            model,
            system: SYSTEM_PROMPT + systemSuffix,
            messages: await convertToModelMessages(messages),
            tools,
            maxOutputTokens: 8192,
            temperature: 0.7,
          })
        } finally {
          clearInterval(keepalive)
        }

        // ── Phase 3: End "searching" message, start real response ──
        // Add newlines after dots so response text starts cleanly
        writer.write({ type: "text-delta", id: searchId, delta: "\n\n" })
        writer.write({ type: "text-end", id: searchId })

        // Stream the actual response word-by-word
        const responseId = generateId()
        writer.write({ type: "text-start", id: responseId })
        await streamChunked(writer, responseId, result.text, 60)
        writer.write({ type: "text-end", id: responseId })

        // ── Phase 4: Build and stream verified links section ──
        if (isGemini) {
          try {
            const sourcesSection = await buildOrganizedSources(
              result.text,
              result.providerMetadata
            )

            if (sourcesSection) {
              await new Promise((r) => setTimeout(r, 200))

              const srcId = generateId()
              writer.write({ type: "text-start", id: srcId })
              await streamChunked(writer, srcId, sourcesSection, 40)
              writer.write({ type: "text-end", id: srcId })
            }
          } catch (sourceErr) {
            console.error("Error building sources (non-fatal):", sourceErr)
          }
        }
      } catch (error: any) {
        console.error("Chat API error:", error)
        // End the searching message if still open
        writer.write({ type: "text-end", id: searchId })

        const errorId = generateId()
        writer.write({ type: "text-start", id: errorId })
        writer.write({
          type: "text-delta",
          id: errorId,
          delta: `I encountered an error while searching. ${error?.message || "Please try again."}\n\nIf this persists, the API quota may be exhausted.`,
        })
        writer.write({ type: "text-end", id: errorId })
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}