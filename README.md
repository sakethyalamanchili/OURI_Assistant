# OURI Research Matchmaking Assistant

An AI-powered internal tool for FAU's **Office of Undergraduate Research and Inquiry (OURI)** that helps staff match students with faculty mentors, research programs, and opportunities in real time.

Built with Next.js, Vercel AI SDK, and Google Gemini (with optional Claude/GPT support).

---

## Features

### Dual-Mode Workflow

**Quick Lookup** — A fast, stateless chatbot. Staff type a question and get an instant answer with real-time search results and faculty profile links. Each question is independent with no session memory. Includes quick-action buttons for common queries like finding faculty, exploring departments, or checking OURI program details.

**Student Session** — A personalized, context-aware flow designed for walk-in appointments:

1. **Help Type Selection** — Staff choose from six intake categories: Find Faculty by Interest, Look Up a Professor, Department Overview, OURI Programs, Match Student to Opportunities, or Other/Custom.

2. **Dynamic Intake Form** — Fields adapt based on the selected help type. For example, "Faculty Search" asks for research interests and preferred department, while "Student Match" captures interests, favorite classes, goals, skills, and prior experience.

3. **Conversational Memory** — The AI remembers all student context throughout the session, enabling natural follow-up questions without re-entering information.

4. **Session Summary** — Generates an email-ready summary with all faculty discussed, programs recommended, links, and next steps. Includes "Copy for Email" and "Download as .txt" so staff can immediately forward it to the student.

### AI-Powered Search

The assistant uses Google Gemini with grounded search to query FAU's public resources in real time, returning faculty profiles, Google Scholar pages, lab websites, and program details with verified links extracted from search metadata.

### Known OURI Programs

The system prompt includes detailed reference information for all OURI programs so the AI can provide accurate, specific guidance:

- **VIP (Vertically Integrated Projects)** — Multi-semester, cross-disciplinary research teams with AI/data science integration
- **SURF** — Summer Undergraduate Research Fellowship ($4,000 stipend)
- **LEARN** — Leveraging Exploration and Achievement in Research Networking
- **FAURJ** — Florida Atlantic Undergraduate Research Journal
- **Undergraduate Research Symposium** — Annual showcase event
- **Prestigious Fellowships** — Goldwater, Fulbright, NSF GRFP support
- **DIR** — Directed Independent Research designation

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **AI**: Vercel AI SDK with multi-provider support
- **Default Model**: Google Gemini 2.5 Flash (with Google Search grounding)
- **Alternative Models**: Anthropic Claude Sonnet, OpenAI GPT-4o
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript

---

## Project Structure

```
ouri-redesign/
├── app/
│   ├── api/chat/
│   │   └── route.ts              # AI chat endpoint with streaming
│   ├── favicon.ico               # Browser tab icon
│   ├── icon.png                  # Fallback favicon (PNG)
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main page: sidebar, chat, intake orchestration
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── chat-interface.tsx        # Chat messages, input, quick actions
│   ├── message-bubble.tsx        # Individual message rendering with markdown
│   ├── mode-selector.tsx         # Quick Lookup / Student Session toggle
│   ├── session-summary.tsx       # Email-ready summary with copy/download
│   ├── student-intake-form.tsx   # Dynamic 2-step intake form
│   └── theme-provider.tsx        # Dark/light theme support
│
├── lib/
│   ├── system-prompt.ts          # AI system prompt with OURI program knowledge
│   ├── types.ts                  # TypeScript types, help types, program options
│   └── utils.ts                  # Utility functions
│
├── public/
│   ├── logoouricolor.png         # Full OURI logo (sidebar header)
│   ├── logo-sidebar.png          # Square icon (sidebar, 80px)
│   ├── logo-sidebar-sm.png       # Small square icon (chat header, 56px)
│   ├── logo-avatar.png           # Bot avatar for chat messages (64px)
│   ├── apple-touch-icon.png      # iOS bookmark icon (180px)
│   └── icon-192.png              # PWA icon (192px)
│
└── .env.local                    # Environment variables (not committed)
```

---

## Setup

### Prerequisites

- Node.js 18+
- A Google AI API key (for Gemini) — or Anthropic/OpenAI key for alternative providers

### Installation

```bash
git clone <repository-url>
cd OURI_ASSISTANT
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: Choose your AI provider
AI_PROVIDER=gemini                          # Options: gemini (default), claude, openai

# Google Gemini (default, recommended — includes Google Search grounding)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Alternative: Anthropic Claude
# ANTHROPIC_API_KEY=your_key_here

# Alternative: OpenAI GPT-4o
# OPENAI_API_KEY=your_key_here
```

Google Gemini is recommended as the default provider because it includes built-in Google Search grounding, which enables real-time faculty and program lookups with verified source links.

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

### Chat Flow

1. Staff selects **Quick Lookup** or **Student Session** mode
2. In Student Session, staff fills out the dynamic intake form
3. The intake data is formatted into a structured prompt and sent to the AI
4. The AI searches FAU's public resources via Google Search grounding
5. Responses stream in with inline faculty profile links, Google Scholar pages, and program details
6. Source links are extracted from Gemini's grounding metadata and deduplicated
7. After 2+ messages, staff can generate an email-ready session summary

### Streaming Architecture

The API route uses paragraph-chunked streaming for smooth UI updates. Instead of streaming word-by-word (which caused browser freezes with large responses), text is split by paragraph breaks and sent in ~25 chunks with 60ms delays between them.

### Link Extraction

Faculty profile links are extracted from Gemini's `groundingSupports` metadata, which provides exact position data for inline citations. Links are filtered to remove junk domains and capped at 4 per faculty member. Generic department pages are prevented from being assigned to individual professors.

---

## Customization

### Adding New Programs

Edit `lib/system-prompt.ts` to add program details in the "Known OURI Programs & Opportunities" section. The AI references this information when advising students.

Edit `lib/types.ts` to add new options to `PROGRAM_INTEREST_OPTIONS` for the intake form dropdown.

### Changing the AI Provider

Set `AI_PROVIDER` in `.env.local` to `gemini`, `claude`, or `openai`. Note that only Gemini includes built-in Google Search grounding — other providers will rely on their training knowledge without real-time search.

### Branding

Replace images in `public/` to update the logo and icons. The sidebar header uses `logoouricolor.png`, chat messages use `logo-avatar.png`, and the browser tab uses `app/favicon.ico` and `app/icon.png`.

---

## Key Files to Modify

| What to change | File |
|---|---|
| AI behavior and knowledge | `lib/system-prompt.ts` |
| Intake form fields and options | `lib/types.ts`, `components/student-intake-form.tsx` |
| Chat UI and message display | `components/chat-interface.tsx`, `components/message-bubble.tsx` |
| API routing and streaming | `app/api/chat/route.ts` |
| Layout, sidebar, session logic | `app/page.tsx` |
| Session summary format | `components/session-summary.tsx` |
| Styling and theme colors | `globals.css` |

---

## Deployment

This is a standard Next.js application and can be deployed to Vercel, AWS, or any Node.js hosting platform.

```bash
npm run build
npm start
```

Ensure all environment variables are set in your hosting provider's dashboard.