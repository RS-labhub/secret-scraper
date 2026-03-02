import { type NextRequest, NextResponse } from "next/server"
import { ProductHuntScraper } from "@/lib/scrapers/producthunt-scraper"
import type { Product } from "@/types/product"

/**
 * Deep scrape endpoint - scrapes individual Product Hunt product pages
 * to extract website URLs, social links, and additional details.
 * 
 * Accepts an array of products and a Firecrawl API key.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, firecrawlApiKey }: { products: Product[]; firecrawlApiKey: string } = body

    if (!firecrawlApiKey) {
      return NextResponse.json({ 
        error: "Firecrawl API key is required for deep scraping." 
      }, { status: 400 })
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        error: "At least one product is required for deep scraping." 
      }, { status: 400 })
    }

    const scraper = new ProductHuntScraper(firecrawlApiKey)
    const enhancedProducts: Product[] = []

    console.log(`🔬 Starting deep scrape for ${products.length} products...`)

    // Process in batches of 3 to avoid rate limits
    const batchSize = 3
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (product) => {
          try {
            const enhanced = await scraper.enhanceProductData({ ...product })
            return enhanced
          } catch (err) {
            console.error(`Failed to deep scrape ${product.name}:`, err)
            return product // Return original on failure
          }
        })
      )
      enhancedProducts.push(...results)

      // Small delay between batches
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`✅ Deep scrape completed for ${enhancedProducts.length} products`)

    return NextResponse.json({
      products: enhancedProducts,
      totalProcessed: enhancedProducts.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Deep scrape API error:", error)
    return NextResponse.json({ 
      error: `Deep scrape failed: ${error instanceof Error ? error.message : "Unknown error"}` 
    }, { status: 500 })
  }
}
