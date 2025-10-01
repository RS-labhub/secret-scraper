import { NextResponse } from "next/server"

// This would typically connect to a database
// For now, we'll use a simple in-memory store
let products: any[] = []

export async function GET() {
  try {
    // Filter only approved products for external API
    const approvedProducts = products.filter((product) => product.status === "approved")

    return NextResponse.json({
      success: true,
      count: approvedProducts.length,
      products: approvedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.aiEnhanced?.summary || product.description,
        tags: product.aiEnhanced?.suggestedTags || product.tags,
        features: product.aiEnhanced?.highlights || product.features,
        source: product.source,
        links: product.links,
        pricing: product.pricing,
        metadata: {
          rating: product.metadata.rating || product.metadata.stars,
          scrapedAt: product.metadata.scrapedAt,
        },
        publishedAt: product.publishedAt || new Date().toISOString(),
      })),
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, products: productData } = body

    if (action === "store") {
      // Store products in memory (in production, this would be a database)
      products = [...products, ...productData]
      return NextResponse.json({ success: true, stored: productData.length })
    }

    if (action === "approve") {
      const { productIds } = body
      products = products.map((product) =>
        productIds.includes(product.id)
          ? { ...product, status: "approved", publishedAt: new Date().toISOString() }
          : product,
      )
      return NextResponse.json({ success: true, approved: productIds.length })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
