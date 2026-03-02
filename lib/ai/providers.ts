import type { Domain } from "@/types/product"

export interface AIProvider {
  name: string
  models: string[]
  requiresApiKey: boolean
  enhance(request: AIEnhancementRequest, apiKey?: string): Promise<AIEnhancementResult>
}

export interface AIEnhancementRequest {
  product: {
    name: string
    description: string
    features: string[]
    domain?: Domain
    source?: string
  }
  tasks: ("summarize" | "highlights" | "features" | "domains")[]
}

export interface AIEnhancementResult {
  summary?: string
  originalLanguage?: string
  highlights?: string[]
  features?: string[]
  suggestedDomain?: Domain
}

export class OpenAIProvider implements AIProvider {
  name = "OpenAI"
  models = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
  requiresApiKey = true

  async enhance(request: AIEnhancementRequest, apiKey: string): Promise<AIEnhancementResult> {
  const { product, tasks } = request
    const result: AIEnhancementResult = {}

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that enhances product information. Given a product, you can:
- Summarize: Create a concise, compelling 1-2 sentence summary in English. If the original description is in another language, translate it to English and include "originalLanguage" field with the detected language name.
- Highlights: Extract 2-5 key feature highlights (concise feature descriptions)
- Domain: Suggest ONLY 1 most relevant domain from: AIE, Code, DevOps, DevSecOps, Product, Quality Assurance, Orchestration

CRITICAL: 
- For highlights, provide 2-5 concise features
- For domain, respond with the single most relevant value in a "suggestedDomain" field.
- If description is not in English, translate it and set originalLanguage field.

Respond in JSON format only.`,
            },
            {
              role: "user",
              content: `Product: ${product.name}
Description: ${product.description}
Current Domain: ${product.domain || "Unknown"}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements. 
IMPORTANT: 
- Provide 2-5 concise feature highlights
- Provide exactly one suggestedDomain value using the allowed taxonomy
- If description is not in English, translate to English and include "originalLanguage" field`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content) {
        // Extract JSON from markdown code blocks if present
        const extractJson = (text: string): string => {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
          return jsonMatch ? jsonMatch[1].trim() : text.trim()
        }

        const cleanContent = extractJson(content)
        const parsed = JSON.parse(cleanContent)
        if (tasks.includes("summarize")) {
          result.summary = parsed.summary
          result.originalLanguage = parsed.originalLanguage
        }
        if (tasks.includes("highlights") && parsed.highlights) {
          // Ensure 2-5 highlights
          const highlights = parsed.highlights.slice(0, 5)
          result.highlights = highlights.length >= 2 ? highlights : parsed.highlights.slice(0, 2)
        }
        if (tasks.includes("features")) result.features = parsed.features
        if (tasks.includes("domains")) {
          if (parsed.suggestedDomain) {
            result.suggestedDomain = parsed.suggestedDomain as Domain
          } else if (parsed.suggestedDomains?.length) {
            result.suggestedDomain = parsed.suggestedDomains[0] as Domain
          }
        }
      }
    } catch (error) {
      console.error("OpenAI enhancement error:", error)
      throw error
    }

    return result
  }
}

export class AnthropicProvider implements AIProvider {
  name = "Anthropic"
  models = ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]
  requiresApiKey = true

  async enhance(request: AIEnhancementRequest, apiKey: string): Promise<AIEnhancementResult> {
    const { product, tasks } = request
    const result: AIEnhancementResult = {}

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          system: `You are an AI assistant that enhances product information. Given a product, you can:
- Summarize: Create a concise, compelling 1-2 sentence summary
- Highlights: Extract 2-3 key feature highlights (each MUST be exactly 7-10 words)
- Domain: Suggest ONLY 1 most relevant domain from: AIE, Code, DevOps, DevSecOps, Product, Quality Assurance, Orchestration

CRITICAL: 
- For highlights, each feature MUST be between 7-10 words. No more, no less.
- For domain, respond with a single value using "suggestedDomain".
- Respond in JSON format only.`,
          messages: [
            {
              role: "user",
              content: `Product: ${product.name}
Description: ${product.description}
Current Domain: ${product.domain || "Unknown"}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements. Remember: Each highlight MUST be 7-10 words, and only 1 domain value in "suggestedDomain".`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.content[0]?.text

      if (content) {
        // Extract JSON from markdown code blocks if present
        const extractJson = (text: string): string => {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
          return jsonMatch ? jsonMatch[1].trim() : text.trim()
        }

        const cleanContent = extractJson(content)
        const parsed = JSON.parse(cleanContent)
        if (tasks.includes("summarize")) result.summary = parsed.summary
        if (tasks.includes("highlights") && parsed.highlights) {
          // Ensure exactly 2-3 highlights
          const highlights = parsed.highlights.slice(0, 3)
          result.highlights = highlights.length >= 2 ? highlights : parsed.highlights.slice(0, 2)
        }
        if (tasks.includes("features")) result.features = parsed.features
        if (tasks.includes("domains")) {
          if (parsed.suggestedDomain) {
            result.suggestedDomain = parsed.suggestedDomain as Domain
          } else if (parsed.suggestedDomains?.length) {
            result.suggestedDomain = parsed.suggestedDomains[0] as Domain
          }
        }
      }
    } catch (error) {
      console.error("Anthropic enhancement error:", error)
      throw error
    }

    return result
  }
}

export class GroqProvider implements AIProvider {
  name = "Groq"
  models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"]
  requiresApiKey = false // Free option

  async enhance(request: AIEnhancementRequest, apiKey?: string): Promise<AIEnhancementResult> {
    const { product, tasks } = request
    const result: AIEnhancementResult = {}

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that enhances product information. Given a product, you can:
- Summarize: Create a concise, compelling 1-2 sentence summary
- Highlights: Extract 2-3 key feature highlights (each MUST be exactly 7-10 words)
- Domain: Suggest ONLY 1 most relevant domain from: AIE, Code, DevOps, DevSecOps, Product, Quality Assurance, Orchestration

CRITICAL: 
- For highlights, each feature MUST be between 7-10 words. No more, no less.
- For domain, return a single value via "suggestedDomain".

Respond in JSON format only.`,
            },
            {
              role: "user",
              content: `Product: ${product.name}
Description: ${product.description}
Current Domain: ${product.domain || "Unknown"}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements. Remember: Each highlight MUST be 7-10 words, and only 1 domain via "suggestedDomain".`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content) {
        // Extract JSON from markdown code blocks if present
        const extractJson = (text: string): string => {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
          return jsonMatch ? jsonMatch[1].trim() : text.trim()
        }

        const cleanContent = extractJson(content)
        const parsed = JSON.parse(cleanContent)
        if (tasks.includes("summarize")) result.summary = parsed.summary
        if (tasks.includes("highlights") && parsed.highlights) {
          // Ensure exactly 2-3 highlights
          const highlights = parsed.highlights.slice(0, 3)
          result.highlights = highlights.length >= 2 ? highlights : parsed.highlights.slice(0, 2)
        }
        if (tasks.includes("features")) result.features = parsed.features
        if (tasks.includes("domains")) {
          if (parsed.suggestedDomain) {
            result.suggestedDomain = parsed.suggestedDomain as Domain
          } else if (parsed.suggestedDomains?.length) {
            result.suggestedDomain = parsed.suggestedDomains[0] as Domain
          }
        }
      }
    } catch (error) {
      console.error("Groq enhancement error:", error)
      throw error
    }

    return result
  }
}

export class GeminiProvider implements AIProvider {
  name = "Gemini"
  models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]
  requiresApiKey = false // Free option

  async enhance(request: AIEnhancementRequest, apiKey?: string): Promise<AIEnhancementResult> {
    const { product, tasks } = request
    const result: AIEnhancementResult = {}

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          apiKey || process.env.GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI assistant that enhances product information. Given a product, you can:
- Summarize: Create a concise, compelling 1-2 sentence summary
- Highlights: Extract 2-3 key feature highlights (each MUST be exactly 7-10 words)
- Domain: Suggest ONLY 1 most relevant domain from: AIE, Code, DevOps, DevSecOps, Product, Quality Assurance, Orchestration

CRITICAL: 
- For highlights, each feature MUST be between 7-10 words. No more, no less.
- For domain, return a single value using "suggestedDomain".

Product: ${product.name}
Description: ${product.description}
Current Domain: ${product.domain || "Unknown"}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements. Remember: Each highlight MUST be 7-10 words, and only 1 domain via "suggestedDomain".`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.candidates[0]?.content?.parts[0]?.text

      if (content) {
        // Extract JSON from markdown code blocks if present
        const extractJson = (text: string): string => {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
          return jsonMatch ? jsonMatch[1].trim() : text.trim()
        }

        const cleanContent = extractJson(content)
        const parsed = JSON.parse(cleanContent)
        if (tasks.includes("summarize")) result.summary = parsed.summary
        if (tasks.includes("highlights") && parsed.highlights) {
          // Ensure exactly 2-3 highlights
          const highlights = parsed.highlights.slice(0, 3)
          result.highlights = highlights.length >= 2 ? highlights : parsed.highlights.slice(0, 2)
        }
        if (tasks.includes("features")) result.features = parsed.features
        if (tasks.includes("domains")) {
          if (parsed.suggestedDomain) {
            result.suggestedDomain = parsed.suggestedDomain as Domain
          } else if (parsed.suggestedDomains?.length) {
            result.suggestedDomain = parsed.suggestedDomains[0] as Domain
          }
        }
      }
    } catch (error) {
      console.error("Gemini enhancement error:", error)
      throw error
    }

    return result
  }
}
export const AI_PROVIDERS = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  groq: new GroqProvider(),
  gemini: new GeminiProvider(),
}
