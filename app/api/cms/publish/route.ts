import { type NextRequest, NextResponse } from "next/server"
import { CMS_PROVIDERS } from "@/lib/cms/providers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, products, config } = body

    if (!provider || !CMS_PROVIDERS[provider as keyof typeof CMS_PROVIDERS]) {
      return NextResponse.json({ error: "Invalid CMS provider" }, { status: 400 })
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 })
    }

    if (!config) {
      return NextResponse.json({ error: "CMS configuration required" }, { status: 400 })
    }

    const cmsProvider = CMS_PROVIDERS[provider as keyof typeof CMS_PROVIDERS]
    const results = []

    // Test connection first
    const connectionTest = await cmsProvider.test(config)
    if (!connectionTest) {
      return NextResponse.json({ error: "Failed to connect to CMS" }, { status: 400 })
    }

    // Publish each product
    for (const product of products) {
      try {
        const result = await cmsProvider.publish(product, config)
        results.push({
          productId: product.id,
          productName: product.name,
          ...result,
        })
      } catch (error) {
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: failureCount === 0,
      published: successCount,
      failed: failureCount,
      results,
      provider: cmsProvider.name,
    })
  } catch (error) {
    console.error("CMS publish API error:", error)
    return NextResponse.json(
      {
        error: "CMS publishing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
