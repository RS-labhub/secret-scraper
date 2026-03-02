import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { provider, apiKey } = await request.json()

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    let testEndpoint = ""
    let testPayload: Record<string, unknown> = {}
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    switch (provider) {
      case "openai":
        testEndpoint = "https://api.openai.com/v1/chat/completions"
        headers["Authorization"] = `Bearer ${apiKey}`
        testPayload = {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }
        break

      case "anthropic":
        testEndpoint = "https://api.anthropic.com/v1/messages"
        headers["x-api-key"] = apiKey
        headers["anthropic-version"] = "2023-06-01"
        testPayload = {
          model: "claude-3-haiku-20240307",
          max_tokens: 5,
          messages: [{ role: "user", content: "Say OK" }],
        }
        break

      case "groq":
        testEndpoint = "https://api.groq.com/openai/v1/chat/completions"
        headers["Authorization"] = `Bearer ${apiKey}`
        testPayload = {
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }
        break

      case "gemini":
        testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
        testPayload = {
          contents: [{ parts: [{ text: "Say OK" }] }],
        }
        break

      default:
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    const response = await fetch(testEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorData = await response.json().catch(() => ({}))
      let errorMessage = "UPLINK_FAILED"

      if (response.status === 401) {
        errorMessage = "ERR_401: UNAUTHORIZED. INVALID_TOKEN."
      } else if (response.status === 429) {
        errorMessage = "ERR_429: RATE_LIMIT_EXCEEDED."
      } else if (response.status === 403) {
        errorMessage = "ERR_403: ACCESS_DENIED. CHECK_PERMISSIONS."
      } else if (errorData.error?.message) {
        errorMessage = `ERR_RESPONSE: ${errorData.error.message}`
      } else {
        errorMessage = `ERR_${response.status}: ${response.statusText}`
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 200 })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `ERR_NETWORK: ${error instanceof Error ? error.message : "UNKNOWN_ERROR"}` },
      { status: 500 }
    )
  }
}
