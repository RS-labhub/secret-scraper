import { type NextRequest, NextResponse } from "next/server"
import { CMS_PROVIDERS } from "@/lib/cms/providers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, config } = body

    if (!provider || !CMS_PROVIDERS[provider as keyof typeof CMS_PROVIDERS]) {
      return NextResponse.json({ error: "Invalid CMS provider" }, { status: 400 })
    }

    if (!config) {
      return NextResponse.json({ error: "CMS configuration required" }, { status: 400 })
    }

    const cmsProvider = CMS_PROVIDERS[provider as keyof typeof CMS_PROVIDERS]
    const isConnected = await cmsProvider.test(config)

    return NextResponse.json({
      success: isConnected,
      provider: cmsProvider.name,
      message: isConnected ? "Connection successful" : "Connection failed",
    })
  } catch (error) {
    console.error("CMS test API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
