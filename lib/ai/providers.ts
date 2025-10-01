export interface AIProvider {
  name: string
  models: string[]
  requiresApiKey: boolean
  enhance(product: any, apiKey?: string): Promise<any>
  classifyDomains?(product: any, apiKey?: string): Promise<string[]>
}

export interface AIEnhancementRequest {
  product: {
    name: string
    description: string
    tags: string[]
    features: string[]
    source?: string
    pricing?: any
  }
  tasks: ("summarize" | "highlights" | "tags" | "features" | "domains" | "categories")[]
}

export interface AIEnhancementResult {
  summary?: string
  highlights?: string[]
  suggestedTags?: string[]
  features?: string[]
  suggestedDomains?: string[]
  suggestedCategories?: string[]
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
- Summarize: Create a concise, compelling 1-2 sentence summary
- Highlights: Extract 3-5 key feature highlights
- Tags: Suggest relevant tags/categories

Respond in JSON format only.`,
            },
            {
              role: "user",
              content: `Product: ${product.name}
Description: ${product.description}
Current Tags: ${product.tags.join(", ")}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements.`,
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
        if (tasks.includes("summarize")) result.summary = parsed.summary
        if (tasks.includes("highlights")) result.highlights = parsed.highlights
        if (tasks.includes("tags")) result.suggestedTags = parsed.suggestedTags
        if (tasks.includes("features")) result.features = parsed.features
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
          messages: [
            {
              role: "user",
              content: `You are an AI assistant that enhances product information. Given a product, you can:
- Summarize: Create a concise, compelling 1-2 sentence summary
- Highlights: Extract 3-5 key feature highlights  
- Tags: Suggest relevant tags/categories

Product: ${product.name}
Description: ${product.description}
Current Tags: ${product.tags.join(", ")}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements.`,
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
        if (tasks.includes("highlights")) result.highlights = parsed.highlights
        if (tasks.includes("tags")) result.suggestedTags = parsed.suggestedTags
        if (tasks.includes("features")) result.features = parsed.features
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
- Highlights: Extract 3-5 key feature highlights
- Tags: Suggest relevant tags/categories

Respond in JSON format only.`,
            },
            {
              role: "user",
              content: `Product: ${product.name}
Description: ${product.description}
Current Tags: ${product.tags.join(", ")}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements.`,
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
        if (tasks.includes("highlights")) result.highlights = parsed.highlights
        if (tasks.includes("tags")) result.suggestedTags = parsed.suggestedTags
        if (tasks.includes("features")) result.features = parsed.features
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
  models = ["gemini-1.5-flash", "gemini-1.5-pro"]
  requiresApiKey = false // Free option

  async enhance(request: AIEnhancementRequest, apiKey?: string): Promise<AIEnhancementResult> {
    const { product, tasks } = request
    const result: AIEnhancementResult = {}

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
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
- Highlights: Extract 3-5 key feature highlights
- Tags: Suggest relevant tags/categories

Product: ${product.name}
Description: ${product.description}
Current Tags: ${product.tags.join(", ")}
Current Features: ${product.features.join(", ")}

Tasks requested: ${tasks.join(", ")}

Please provide a JSON response with the requested enhancements.`,
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
        if (tasks.includes("highlights")) result.highlights = parsed.highlights
        if (tasks.includes("tags")) result.suggestedTags = parsed.suggestedTags
        if (tasks.includes("features")) result.features = parsed.features
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
