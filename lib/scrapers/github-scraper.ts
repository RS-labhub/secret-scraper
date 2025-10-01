import type { Product, ScrapeRequest, Domain } from "../../types/product"

interface TrendingRepo {
  name: string
  fullName: string
  url: string
  description: string
  stars: number
  starsToday?: number
  starsWeekly?: number
  starsMonthly?: number
  language?: string
  contributors: string[]
  topics?: string[]
  pricing?: {
    type: "free" | "paid" | "freemium"
    plans?: string[]
  }
  features?: string[]
  website?: string
  documentation?: string
}

export class GitHubScraper {
  constructor() {
    // No longer needs external API keys - uses native fetch
  }

  async scrapeTrending(filters?: ScrapeRequest["filters"]): Promise<Product[]> {
    const timePeriod = filters?.timePeriod || "daily"

    try {
      console.log(`Starting GitHub trending scrape for ${timePeriod} period`)
      
      const urls = this.buildTrendingUrls(timePeriod, filters)
      
      console.log(`Scraping ${urls.length} GitHub trending URLs in parallel`)
      const scrapingPromises = urls.map(url => this.scrapeUrl(url, timePeriod))
      
      const allRepoArrays = await Promise.allSettled(scrapingPromises)
      const allRepos: TrendingRepo[] = []

      // Collect results from all parallel scraping operations
      allRepoArrays.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allRepos.push(...result.value)
        } else {
          console.error(`URL ${index + 1} failed:`, result.reason)
        }
      })

      console.log(`Found ${allRepos.length} total repositories from GitHub trending`)

      // Remove duplicates and merge data
      const uniqueRepos = this.deduplicateRepositories(allRepos, timePeriod)
      console.log(`After deduplication: ${uniqueRepos.length} unique repositories`)

      // Apply maxLimit - use the actual available count vs requested limit
      const maxLimit = filters?.maxLimit || 20
      const actualLimit = Math.min(maxLimit, uniqueRepos.length)
      const reposToProcess = uniqueRepos.slice(0, actualLimit)
      
      console.log(`Processing ${reposToProcess.length} repositories with GitHub API`)
      
      // Enhanced parallel processing for repository details
      const products: Product[] = []
      
      // Process repositories in batches to avoid rate limiting
      const batchSize = 5
      
      for (let i = 0; i < reposToProcess.length; i += batchSize) {
        const batch = reposToProcess.slice(i, i + batchSize)
        
        const enhancementPromises = batch.map(async (repo, batchIndex) => {
          const repoIndex = i + batchIndex + 1
          try {
            const enhancedRepo = await this.enhanceRepositoryData(repo)
            const product = this.convertToProduct(enhancedRepo, timePeriod)
            
            // Apply filters
            if (this.shouldIncludeProduct(product, filters)) {
              return product
            } else {
              return null
            }
          } catch (error) {
            console.error(`Error processing repo ${repo.fullName}:`, error)
            // Continue with basic data
            const product = this.convertToProduct(repo, timePeriod)
            if (this.shouldIncludeProduct(product, filters)) {
              return product
            }
            return null
          }
        })

        const batchResults = await Promise.allSettled(enhancementPromises)
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            products.push(result.value)
          }
        })

        // Small delay between batches to be respectful to GitHub API
        if (i + batchSize < reposToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      console.log(`GitHub scraping completed. Found ${products.length} products.`)
      return products

    } catch (error) {
      console.error("GitHub scraping failed:", error)
      throw new Error(`GitHub scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async scrapeUrl(url: string, timePeriod: "daily" | "weekly" | "monthly"): Promise<TrendingRepo[]> {
    try {
      console.log(`Scraping: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const repos = this.parseRepositories(html, timePeriod)
      
      console.log(`${url} found ${repos.length} repositories`)
      return repos

    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      return []
    }
  }

  private buildTrendingUrls(timePeriod: "daily" | "weekly" | "monthly", filters?: ScrapeRequest["filters"]): string[] {
    const baseUrl = "https://github.com/trending"
    const periodParam = `?since=${timePeriod}` // Always include the since parameter
    
    const urls = [
      `${baseUrl}${periodParam}`, // All languages - main trending page
    ]

    // Only add language-specific URLs if tech stack is specifically requested
    if (filters?.techStack?.length) {
      console.log(`Adding language-specific URLs for: ${filters.techStack.join(', ')}`)
      filters.techStack.forEach(tech => {
        const langParam = tech.toLowerCase()
        const langUrl = `${baseUrl}/${langParam}${periodParam}`
        urls.push(langUrl)
      })
      
      // When tech stack is specified, only use language-specific URLs, not the general trending page
      urls.splice(0, 1) // Remove the general trending URL
    }

    console.log(`Total URLs to scrape: ${urls.length}`)
    return urls
  }

  private parseRepositories(html: string, timePeriod: "daily" | "weekly" | "monthly"): TrendingRepo[] {
    const repos: TrendingRepo[] = []

    try {
      console.log(`Starting to parse HTML for trending repositories (${html.length} characters)`)
      
      // Try multiple regex patterns for different GitHub layouts
      let matches: RegExpMatchArray[] = []
      
      // Pattern 1: Current Box-row structure
      let repoRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g
      matches = Array.from(html.matchAll(repoRegex))
      
      // Pattern 2: Alternative article structure
      if (matches.length === 0) {
        repoRegex = /<article[^>]*>([\s\S]*?)<\/article>/g
        matches = Array.from(html.matchAll(repoRegex))
      }
      
      // Pattern 3: Div-based structure
      if (matches.length === 0) {
        repoRegex = /<div[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/div>/g
        matches = Array.from(html.matchAll(repoRegex))
      }

      console.log(`Found ${matches.length} potential repository articles`)

      for (const match of matches) {
        try {
          const repoHtml = match[1]
          
          // Try multiple patterns for repository name extraction
          let repoPath = ""
          let owner = ""
          let repoName = ""
          
          // Pattern 1: Look for repository links in the format /owner/repo
          const repoLinkMatches = Array.from(repoHtml.matchAll(/<a[^>]*href="(\/([^\/\s]+)\/([^\/\s\?#]+))"[^>]*>/g))
          
          for (const match of repoLinkMatches) {
            const path = match[1]
            const ownerCandidate = match[2]
            const repoCandidate = match[3]
            
            // Validate this is a repository path
            if (this.isValidRepositoryPath(path, ownerCandidate, repoCandidate)) {
              // Additional validation: check if this is not a user profile or other GitHub path
              if (!path.includes('/settings') && !path.includes('/issues') && !path.includes('/pulls')) {
                repoPath = path
                owner = ownerCandidate.replace(/[<>\"']/g, '').trim()
                repoName = repoCandidate.replace(/[<>\"']/g, '').trim()
                break
              }
            }
          }

          // Use the values we extracted
          if (!repoPath || !owner || !repoName) {
            console.log("Skipping article - missing repository data")
            continue
          }
          
          // Validate this is actually a repository URL pattern
          if (!this.isValidRepositoryPath(repoPath, owner, repoName)) {
            continue
          }

          const url = `https://github.com${repoPath}`
          const fullName = `${owner}/${repoName}`

          // Extract description - try multiple patterns for current GitHub structure
          let description = ""
          
          // Pattern 1: Current GitHub trending page description
          let descMatch = repoHtml.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/)
          if (descMatch) {
            description = descMatch[1].replace(/<[^>]*>/g, '').trim()
          }
          
          // Pattern 2: Alternative description pattern
          if (!description) {
            descMatch = repoHtml.match(/<p[^>]*class="[^"]*color-fg-muted[^"]*"[^>]*>([\s\S]*?)<\/p>/)
            if (descMatch) {
              description = descMatch[1].replace(/<[^>]*>/g, '').trim()
            }
          }
          
          // Pattern 3: More generic description pattern
          if (!description) {
            descMatch = repoHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/)
            if (descMatch && descMatch[1].length < 500) { // Avoid capturing large blocks
              const potentialDesc = descMatch[1].replace(/<[^>]*>/g, '').trim()
              if (potentialDesc && !potentialDesc.includes('stars') && !potentialDesc.includes('forks')) {
                description = potentialDesc
              }
            }
          }
          
          console.log(`Extracted description for ${fullName}: "${description.substring(0, 100)}..."`)

          // Extract language
          const langMatch = repoHtml.match(/<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]*)<\/span>/)
          const language = langMatch ? langMatch[1].trim() : undefined

          // Extract stars with multiple patterns
          let stars = 0
          
          // Pattern 1: Link to stargazers
          let starsMatch = repoHtml.match(/<a[^>]*href="[^"]*\/stargazers"[^>]*>([^<]*)<\/a>/)
          if (starsMatch) {
            const starsText = starsMatch[1].replace(/,/g, '').replace(/\s+/g, '').trim()
            stars = parseInt(starsText) || 0
          }
          
          // Pattern 2: SVG with star icon followed by number
          if (stars === 0) {
            starsMatch = repoHtml.match(/<svg[^>]*octicon-star[^>]*>[\s\S]*?<\/svg>\s*([0-9,]+)/i)
            if (starsMatch) {
              stars = parseInt(starsMatch[1].replace(/,/g, '')) || 0
            }
          }
          
          // Pattern 3: Text pattern for stars
          if (stars === 0) {
            starsMatch = repoHtml.match(/([0-9,]+)\s*star/i)
            if (starsMatch) {
              stars = parseInt(starsMatch[1].replace(/,/g, '')) || 0
            }
          }

          // Extract period-specific stars gained with better patterns
          let periodStars = 0
          const starsGainedMatch = repoHtml.match(/(\d+(?:,\d+)*)\s*stars?\s*(?:this\s*)?(?:today|week|month)/i)
          if (starsGainedMatch) {
            periodStars = parseInt(starsGainedMatch[1].replace(/,/g, '')) || 0
          }

          console.log(`Stars for ${fullName}: ${stars} total, ${periodStars} this period`)

          // Extract topics with better pattern
          const topicsMatches = Array.from(repoHtml.matchAll(/<a[^>]*class="[^"]*topic-tag[^"]*"[^>]*>([^<]*)<\/a>/g))
          const topics = topicsMatches.map(match => match[1].trim()).filter(topic => topic.length > 0)

          const repo: TrendingRepo = {
            name: repoName,
            fullName,
            url,
            description,
            stars,
            language,
            contributors: [],
            topics,
          }

          // Set period-specific stars
          if (timePeriod === "daily") {
            repo.starsToday = periodStars
          } else if (timePeriod === "weekly") {
            repo.starsWeekly = periodStars
          } else if (timePeriod === "monthly") {
            repo.starsMonthly = periodStars
          }

          repos.push(repo)

        } catch (error) {
          console.warn("Error parsing individual repository:", error)
          continue
        }
      }

      console.log(`Successfully parsed ${repos.length} repositories from trending page`)

      // Enhanced fallback: If main parsing failed, try alternative approach
      if (repos.length === 0) {
        console.log("Main parsing failed, trying enhanced fallback...")
        const fallbackRepos = this.parseEnhancedFallback(html, timePeriod)
        repos.push(...fallbackRepos)
      }

    } catch (error) {
      console.error("Error parsing repositories HTML:", error)
    }

    return repos.slice(0, 25) // Limit results per URL to actual trending count
  }

  private isValidRepositoryPath(path: string, owner: string, repoName: string): boolean {
    // Validate this is a proper repository path
    if (!path.startsWith('/')) return false
    
    // Should be exactly /owner/repo format
    const pathParts = path.substring(1).split('/')
    if (pathParts.length !== 2) return false
    
    // Exclude known non-repository patterns
    const excludePatterns = [
      'apps/',      // GitHub Apps
      'sponsors/',  // GitHub Sponsors
      'orgs/',      // Organization pages
      'teams/',     // Team pages
      'marketplace/', // Marketplace
      'settings/',  // Settings
      'notifications/', // Notifications
      'explore/',   // Explore
      'trending/',  // Trending (circular)
      'collections/', // Collections
      'topics/',    // Topics
    ]
    
    for (const pattern of excludePatterns) {
      if (path.includes(pattern)) {
        console.log(`Excluding ${path} - matches pattern ${pattern}`)
        return false
      }
    }
    
    // Owner and repo name should be valid
    if (!owner || !repoName || owner.length < 1 || repoName.length < 1) return false
    
    // Should not contain special characters that indicate it's not a repo
    if (owner.includes('?') || owner.includes('#') || owner.includes('&')) return false
    if (repoName.includes('?') || repoName.includes('#') || repoName.includes('&')) return false
    
    return true
  }

  private parseEnhancedFallback(html: string, timePeriod: "daily" | "weekly" | "monthly"): TrendingRepo[] {
    const repos: TrendingRepo[] = []
    
    try {
      console.log("Attempting enhanced fallback parsing...")
      
      // Look for repository links in a more targeted way
      // Target links that are specifically within repository article structures
      const articleSections = html.split('<article')
      
      for (const section of articleSections) {
        if (!section.includes('Box-row')) continue
        
        // Look for href patterns that match repository structure
        const repoLinkMatch = section.match(/href="(\/[^\/\s"]+\/[^\/\s"?#]+)"/g)
        
        if (repoLinkMatch) {
          for (const linkMatch of repoLinkMatch.slice(0, 1)) { // Only first link per article
            const pathMatch = linkMatch.match(/href="(\/[^"]+)"/)
            if (!pathMatch) continue
            
            const repoPath = pathMatch[1]
            const pathParts = repoPath.substring(1).split('/')
            
            if (pathParts.length !== 2) continue
            
            const owner = pathParts[0].replace(/[<>\"']/g, '').trim()
            const repoName = pathParts[1].replace(/[<>\"']/g, '').trim()
            
            // Use the same validation as main parser
            if (!this.isValidRepositoryPath(repoPath, owner, repoName)) continue
            
            const repo: TrendingRepo = {
              name: repoName,
              fullName: `${owner}/${repoName}`,
              url: `https://github.com${repoPath}`,
              description: "", // Will be enhanced by API call
              stars: 0,
              contributors: [],
              topics: [],
            }

            console.log(`Fallback found valid repository: ${repo.fullName}`)
            repos.push(repo)
            
            if (repos.length >= 20) break
          }
        }
        
        if (repos.length >= 20) break
      }
      
      console.log(`Enhanced fallback found ${repos.length} repositories`)
      
    } catch (error) {
      console.warn("Enhanced fallback parsing failed:", error)
    }

    return repos
  }

  private deduplicateRepositories(repos: TrendingRepo[], timePeriod: "daily" | "weekly" | "monthly"): TrendingRepo[] {
    const repoMap = new Map<string, TrendingRepo>()
    
    for (const repo of repos) {
      const existing = repoMap.get(repo.fullName)
      if (existing) {
        // Merge data - keep the best information
        existing.description = existing.description || repo.description
        existing.stars = Math.max(existing.stars, repo.stars)
        existing.language = existing.language || repo.language
        
        // Merge topics
        if (repo.topics?.length) {
          existing.topics = [...new Set([...(existing.topics || []), ...repo.topics])]
        }
        
        // Merge period-specific data
        if (timePeriod === "daily") {
          existing.starsToday = Math.max(existing.starsToday || 0, repo.starsToday || 0)
        } else if (timePeriod === "weekly") {
          existing.starsWeekly = Math.max(existing.starsWeekly || 0, repo.starsWeekly || 0)
        } else if (timePeriod === "monthly") {
          existing.starsMonthly = Math.max(existing.starsMonthly || 0, repo.starsMonthly || 0)
        }
      } else {
        repoMap.set(repo.fullName, { ...repo })
      }
    }
    
    return Array.from(repoMap.values())
  }

  private async enhanceRepositoryData(repo: TrendingRepo): Promise<TrendingRepo> {
    try {
      // Use GitHub's public API to get more details
      const apiUrl = `https://api.github.com/repos/${repo.fullName}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Secret-Scrapper-App'
        },
        signal: AbortSignal.timeout(8000) // 8 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.description && !repo.description) {
          console.log(`GitHub API data for ${repo.fullName}: stars=${data.stargazers_count}, language=${data.language}, website=${!!data.homepage}`)
        }
        
        const enhanced = {
          ...repo,
          description: data.description || repo.description || "No description available",
          stars: data.stargazers_count || repo.stars,
          language: data.language || repo.language,
          topics: data.topics?.length ? data.topics : repo.topics || [],
          website: data.homepage || undefined,
          features: data.topics || repo.topics || [],
        }
        
        console.log(`Enhanced ${repo.fullName} successfully`)
        return enhanced
      } else {
        console.warn(`GitHub API request failed for ${repo.fullName}: ${response.status}`)
      }
    } catch (error) {
      console.warn(`Failed to enhance repo ${repo.fullName}:`, error)
    }

    return repo
  }

  private convertToProduct(repo: TrendingRepo, timePeriod: "daily" | "weekly" | "monthly"): Product {
    const domains = this.classifyDomains(repo)
    
    // Clean the repository name to remove any HTML artifacts
    const cleanName = repo.name.replace(/[<>\"']/g, '').replace(/\s+/g, ' ').trim()
    
    const product = {
      id: `github-${repo.fullName.replace(/[\/\s]/g, '-').toLowerCase()}`,
      name: cleanName,
      description: repo.description || "No description available",
      tags: [
        ...(repo.topics || []),
        ...(repo.language ? [repo.language] : []),
        "open-source",
        "trending",
        timePeriod
      ],
      categories: [], // Will be set by AI classification
      domains,
      pricing: repo.pricing || {
        type: "free" as const,
        plans: ["Open Source"]
      },
      features: repo.features || repo.topics || [],
      links: {
        repository: repo.url,
        website: repo.website,
        documentation: repo.documentation
      },
      source: "github" as const,
      status: "pending" as const,
      metadata: {
        stars: repo.stars,
        starsToday: repo.starsToday || 0,
        starsWeekly: repo.starsWeekly || 0,
        starsMonthly: repo.starsMonthly || 0,
        language: repo.language,
        trending: true,
        scrapedAt: new Date().toISOString(),
        timePeriod: timePeriod,
      }
    }
    
    // Return product without verbose logging
    return product
  }

  private classifyDomains(repo: TrendingRepo): Domain[] {
    const domains: Domain[] = []
    const name = repo.name.toLowerCase()
    const description = repo.description?.toLowerCase() || ""
    const topics = (repo.topics || []).map(t => t.toLowerCase())
    const language = repo.language?.toLowerCase() || ""

    // AI & Machine Learning
    if (
      topics.some(t => ["ai", "ml", "machine-learning", "deep-learning", "neural-network", "tensorflow", "pytorch", "llm", "nlp"].includes(t)) ||
      name.includes("ai") || name.includes("ml") || name.includes("neural") ||
      description.includes("artificial intelligence") || description.includes("machine learning") ||
      description.includes("deep learning") || description.includes("neural network")
    ) {
      domains.push("AIE")
    }

    // Development Tools & Code
    if (
      topics.some(t => ["cli", "tool", "development", "programming", "framework", "library", "sdk"].includes(t)) ||
      ["typescript", "javascript", "python", "rust", "go", "java"].includes(language) ||
      description.includes("framework") || description.includes("library") || description.includes("development")
    ) {
      domains.push("Code")
    }

    // DevOps
    if (
      topics.some(t => ["devops", "deployment", "infrastructure", "docker", "kubernetes", "terraform", "ansible", "ci-cd", "automation"].includes(t)) ||
      name.includes("deploy") || name.includes("infra") || name.includes("docker") ||
      description.includes("deployment") || description.includes("infrastructure") || description.includes("devops")
    ) {
      domains.push("DevOps")
    }

    // Security (DevSecOps)
    if (
      topics.some(t => ["security", "encryption", "authentication", "vulnerability", "cybersecurity", "privacy"].includes(t)) ||
      name.includes("security") || name.includes("auth") || name.includes("encrypt") ||
      description.includes("security") || description.includes("authentication") || description.includes("encryption")
    ) {
      domains.push("DevSecOps")
    }

    // Product Management
    if (
      topics.some(t => ["product", "management", "analytics", "tracking", "metrics", "dashboard"].includes(t)) ||
      description.includes("analytics") || description.includes("dashboard") || description.includes("metrics")
    ) {
      domains.push("Product")
    }

    // Quality Assurance
    if (
      topics.some(t => ["testing", "qa", "quality", "test", "automation", "selenium", "jest", "cypress"].includes(t)) ||
      name.includes("test") || name.includes("qa") ||
      description.includes("testing") || description.includes("quality assurance")
    ) {
      domains.push("Quality Assurance")
    }

    // Orchestration
    if (
      topics.some(t => ["orchestration", "workflow", "pipeline", "coordination", "scheduling", "job"].includes(t)) ||
      name.includes("orchestr") || name.includes("workflow") || name.includes("pipeline") ||
      description.includes("orchestration") || description.includes("workflow") || description.includes("pipeline")
    ) {
      domains.push("Orchestration")
    }

    // Default to Code if no specific domain found
    if (domains.length === 0) {
      domains.push("Code")
    }

    return domains
  }

  private shouldIncludeProduct(product: Product, filters?: ScrapeRequest["filters"]): boolean {
    if (!filters) return true

    // Filter by domains
    if (filters.domain && filters.domain.length > 0) {
      const hasMatchingDomain = product.domains.some(domain => 
        filters.domain!.includes(domain)
      )
      if (!hasMatchingDomain) {
        console.log(`🚫 Excluding ${product.name} - domain filter mismatch`)
        return false
      }
    }

    // Filter by categories
    if (filters.category && filters.category.length > 0) {
      const hasMatchingCategory = product.categories.some(category => 
        filters.category!.includes(category)
      )
      if (!hasMatchingCategory) {
        console.log(`🚫 Excluding ${product.name} - category filter mismatch`)
        return false
      }
    }

    // Filter by technology stack/programming language
    if (filters.techStack && filters.techStack.length > 0) {
      const productLanguage = product.metadata.language?.toLowerCase()
      const productTags = product.tags.map(tag => tag.toLowerCase())
      
      const hasMatchingTechStack = filters.techStack.some(tech => {
        const techLower = tech.toLowerCase()
        
        // Direct language match
        if (productLanguage === techLower) return true
        
        // Check common variations
        const variations: Record<string, string[]> = {
          'javascript': ['js', 'node', 'nodejs'],
          'typescript': ['ts'],
          'python': ['py'],
          'c++': ['cpp'],
          'c#': ['csharp', 'dotnet'],
          'go': ['golang']
        }
        
        if (variations[techLower]?.includes(productLanguage || '')) return true
        if (productLanguage && variations[productLanguage]?.includes(techLower)) return true
        
        // Check tags
        return productTags.some(tag => tag.includes(techLower) || techLower.includes(tag))
      })
      
      if (!hasMatchingTechStack) {
        return false
      }
    }

    return true
  }
}
