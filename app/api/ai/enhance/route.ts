import { type NextRequest, NextResponse } from "next/server"
import { AI_PROVIDERS } from "@/lib/ai/providers"
import type { AIEnhancementRequest } from "@/lib/ai/providers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, product, tasks, apiKey } = body

    if (!provider || !AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]) {
      return NextResponse.json({ error: "Invalid AI provider" }, { status: 400 })
    }

    if (!product || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const aiProvider = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]

    // Check if API key is required
    if (aiProvider.requiresApiKey && !apiKey) {
      return NextResponse.json({ error: "API key required for this provider" }, { status: 400 })
    }

    const enhancementRequest: AIEnhancementRequest = {
      product,
      tasks,
    }

    const result = await aiProvider.enhance(enhancementRequest, apiKey)

    return NextResponse.json({
      success: true,
      enhancements: result,
      provider: aiProvider.name,
    })
  } catch (error) {
    console.error("AI enhancement API error:", error)
    return NextResponse.json(
      {
        error: "AI enhancement failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
