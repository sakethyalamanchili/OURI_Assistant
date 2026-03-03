import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"
import { SYSTEM_PROMPT } from "@/lib/system-prompt"

export const maxDuration = 60

function getModel(): string {
  const provider = process.env.AI_PROVIDER?.toLowerCase()
  if (provider === "claude" || provider === "anthropic")
    return "anthropic/claude-sonnet-4-20250514"
  if (provider === "openai" || provider === "gpt") return "openai/gpt-4o"
  return "google/gemini-2.0-flash"
}

export async function POST(req: Request) {
  const {
    messages,
    mode,
  }: {
    messages: UIMessage[]
    mode?: string
  } = await req.json()

  const systemSuffix =
    mode === "student-intake"
      ? "\n\nThe user is in Student Intake mode. They will provide structured student profile data. Focus on delivering personalized faculty matches and OURI program recommendations based on the profile."
      : ""

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT + systemSuffix,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    maxOutputTokens: 4096,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
