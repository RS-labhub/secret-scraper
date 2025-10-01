import { type NextRequest, NextResponse } from "next/server"
import { GitHubScraper } from "@/lib/scrapers/github-scraper"
import { scrapeProductHunt } from "@/lib/scrapers/producthunt-scraper"
import { AI_PROVIDERS } from "@/lib/ai/providers"
import type { ScrapeRequest, ScrapeResult, Product } from "@/types/product"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: ScrapeRequest = await request.json()
    const { source, filters } = body

    // Validate request
    if (!source) {
      return NextResponse.json({ 
        error: 'Source is required. Must be "github" or "producthunt"' 
      }, { status: 400 })
    }

    if (!["github", "producthunt"].includes(source)) {
      return NextResponse.json({ 
        error: 'Invalid source. Must be "github" or "producthunt"' 
      }, { status: 400 })
    }

    // Get AI provider from headers or default to openai
    const aiProvider = request.headers.get("x-ai-provider") || "openai"

    console.log(`🚀 Starting ${source} scraping with time period: ${filters?.timePeriod || 'daily'}`)
    console.log(`🔧 Filters:`, {
      timePeriod: filters?.timePeriod,
      domain: filters?.domain,
      category: filters?.category,
      techStack: filters?.techStack,
      maxLimit: filters?.maxLimit,
      query: filters?.query
    })

    let products: Product[] = []
    const timePeriod = filters?.timePeriod || "daily"

    // Scrape products based on source and time period
    switch (source) {
      case "github":
        try {
          const githubScraper = new GitHubScraper()
          products = await githubScraper.scrapeTrending({
            ...filters,
            timePeriod
          })
        } catch (githubError) {
          console.error("❌ GitHub scraping failed:", githubError)
          return NextResponse.json({ 
            error: `GitHub scraping failed: ${githubError instanceof Error ? githubError.message : "Unknown error"}` 
          }, { status: 500 })
        }
        break

      case "producthunt":
        try {
          // Check if Firecrawl API key is provided
          const firecrawlApiKey = filters?.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
          if (!firecrawlApiKey) {
            return NextResponse.json({ 
              error: "Firecrawl API key is required for ProductHunt scraping. Please provide it in the filters or set FIRECRAWL_API_KEY environment variable." 
            }, { status: 400 });
          }

          // Parse date parameters from filters or use current date
          const now = new Date();
          const year = filters?.phYear || now.getFullYear();
          const month = filters?.phMonth || (now.getMonth() + 1); // JavaScript months are 0-indexed
          const day = filters?.phDay || now.getDate();
          
          // Calculate week number (simple approximation)
          const startOfYear = new Date(year, 0, 1);
          const dateToCheck = filters?.phYear ? new Date(year, (month - 1), day) : now;
          const pastDaysOfYear = (dateToCheck.getTime() - startOfYear.getTime()) / 86400000;
          const week = filters?.phWeek || Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

          // Support new scraping options for /products page
          const scrapingOptions: any = {
            period: timePeriod as "daily" | "weekly" | "monthly",
            year,
            month: (timePeriod === "daily" || timePeriod === "monthly") ? month : undefined,
            day: timePeriod === "daily" ? day : undefined,
            week: timePeriod === "weekly" ? week : undefined,
            featured: filters?.phFeatured || false,
            apiKey: firecrawlApiKey,
            scrapeMode: filters?.scrapeMode || 'leaderboard',
            topics: filters?.topics || [],
            pageCount: filters?.pageCount || 1,
          };
          products = await scrapeProductHunt(scrapingOptions);
        } catch (phError) {
          console.error("❌ Product Hunt scraping failed:", phError)
          return NextResponse.json({ 
            error: `Product Hunt scraping failed: ${phError instanceof Error ? phError.message : "Unknown error"}` 
          }, { status: 500 })
        }
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid source. Must be "github" or "producthunt"' 
        }, { status: 400 })
    }

    console.log(`📊 Initial scraping found ${products.length} products`)
    if (products.length > 0) {
      console.log(`📝 Product names: ${products.map(p => p.name).join(', ')}`)
    }

    // Handle case where no products were found
    if (products.length === 0) {
      console.warn(`⚠️ No products found for ${source} with current filters`)
      return NextResponse.json({
        products: [],
        totalFound: 0,
        source,
        timestamp: new Date().toISOString(),
        message: `No products found for ${source} with the specified filters. Try adjusting your search criteria.`
      })
    }

    // AI enhancement is handled separately via the enhance API endpoint
    // No automatic enhancement during scraping to keep it fast and focused

    // Apply domain and category filters if specified
    if (filters?.domain?.length) {
      products = products.filter(product => 
        product.domains.some(domain => filters.domain?.includes(domain))
      )
      console.log(`🔍 Filtered by domains: ${products.length} products remaining`)
    }

    if (filters?.category?.length) {
      products = products.filter(product => 
        product.categories.some(category => filters.category?.includes(category))
      )
      console.log(`🔍 Filtered by categories: ${products.length} products remaining`)
    }

    // Apply query filter if specified
    if (filters?.query) {
      const query = filters.query.toLowerCase()
      products = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query)) ||
        product.features.some(feature => feature.toLowerCase().includes(query))
      )
      console.log(`🔍 Filtered by query "${filters.query}": ${products.length} products remaining`)
    }

    // Only apply maxLimit for GitHub, not Product Hunt
    let resultProducts = products;
    if (source === "github") {
      const minLimit = filters?.minLimit || 1;
      const maxLimit = filters?.maxLimit || 20;
      const finalLimit = Math.min(Math.max(products.length, minLimit), maxLimit);
      // Sort by stars
      resultProducts = [...products].sort((a, b) => {
        const aStars = a.metadata.stars || 0;
        const bStars = b.metadata.stars || 0;
        const aPeriodStars = a.metadata.starsToday || a.metadata.starsWeekly || a.metadata.starsMonthly || 0;
        const bPeriodStars = b.metadata.starsToday || b.metadata.starsWeekly || b.metadata.starsMonthly || 0;
        if (aPeriodStars !== bPeriodStars) return bPeriodStars - aPeriodStars;
        return bStars - aStars;
      }).slice(0, finalLimit);
    } else if (source === "producthunt") {
      // Sort by upvotes
      resultProducts = [...products].sort((a, b) => {
        const aUpvotes = a.metadata.upvotes || 0;
        const bUpvotes = b.metadata.upvotes || 0;
        const aPeriodUpvotes = a.metadata.upvotesToday || a.metadata.upvotesWeekly || a.metadata.upvotesMonthly || 0;
        const bPeriodUpvotes = b.metadata.upvotesToday || b.metadata.upvotesWeekly || b.metadata.upvotesMonthly || 0;
        if (aPeriodUpvotes !== bPeriodUpvotes) return bPeriodUpvotes - aPeriodUpvotes;
        return bUpvotes - aUpvotes;
      });
    }
    const result: ScrapeResult = {
      products: resultProducts,
      totalFound: products.length,
      source,
      timestamp: new Date().toISOString(),
      metadata: {
        timePeriod,
        filtersApplied: {
          domain: filters?.domain?.length || 0,
          category: filters?.category?.length || 0,
          techStack: filters?.techStack?.length || 0,
          query: !!filters?.query,
          hasLimits: !!(filters?.minLimit || filters?.maxLimit)
        },
        aiEnhanced: false,
        processingTime: Date.now() - startTime
      }
    };
    console.log(`🏁 Scraping completed: ${result.products.length}/${result.totalFound} products returned`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Scraping API error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
