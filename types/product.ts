export const DOMAINS = ["AIE", "Code", "DevOps", "DevSecOps", "Product", "Quality Assurance", "Orchestration"] as const

export const CATEGORIES = [
  "Autonomous Agent",
  "Browser",
  "Code Benchmark",
  "Compliance",
  "Design",
  "Documentation",
  "Editor",
  "Execution Sandbox",
  "Frontend & Mobile",
  "Gateway",
  "Infrastructure As Code",
  "MCP",
  "Migration",
  "Model",
  "Nocode",
  "Observability",
  "Prompting",
  "Prototyping",
  "Requirements",
  "Review",
  "SRE",
  "Spec Driven",
  "Terminal",
  "Testing",
  "Vuln Scanning",
] as const

export type Domain = (typeof DOMAINS)[number]
export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  description: string
  tags: string[]
  domains: Domain[]
  categories: Category[]
  pricing?: {
    type: "free" | "paid" | "freemium"
    plans?: string[]
  }
  features: string[]
  logoUrl?: string // URL to the product logo (especially for ProductHunt products)
  links: {
    website?: string
    repository?: string
    productHunt?: string
    documentation?: string
    demo?: string
  }
  source: "github" | "producthunt"
  metadata: {
    stars?: number
    starsToday?: number
    starsWeekly?: number
    starsMonthly?: number
    upvotes?: number
    upvotesToday?: number
    upvotesWeekly?: number
    upvotesMonthly?: number
    forks?: number
    users?: number
    votes?: number
    rating?: number
    trending?: boolean
    language?: string
    license?: string
    lastUpdated?: string
    scrapedAt: string
    timePeriod?: "daily" | "weekly" | "monthly"
    // Icon and branding fields
    sourceIcon?: string // URL to source platform icon (e.g., Product Hunt logo)
    sourceColor?: string // Brand color of the source platform
    productIcon?: string // Product-specific icon/emoji
  }
  status: "pending" | "approved" | "rejected" | "discarded"
  aiEnhanced?: {
    summary?: string
    highlights?: string[]
    suggestedTags?: string[]
    suggestedDomains?: Domain[]
    suggestedCategories?: Category[]
  }
}

export interface ScrapeRequest {
  source: "github" | "producthunt"
  filters?: {
    domain?: Domain[]
    category?: Category[]
    trending?: boolean
    timePeriod?: "daily" | "weekly" | "monthly"
    query?: string
    techStack?: string[]
    minLimit?: number
    maxLimit?: number
    firecrawlApiKey?: string
    // ProductHunt specific date parameters
    phYear?: number
    phMonth?: number
    phDay?: number
    phWeek?: number
    phFeatured?: boolean
    scrapeMode?: 'leaderboard' | 'products'
    topics?: string[]
    pageCount?: number
  }
}

export interface ScrapeResult {
  products: Product[]
  totalFound: number
  source: string
  timestamp: string
  message?: string
  metadata?: {
    timePeriod?: string
    filtersApplied?: {
      domain: number
      category: number
      techStack: number
      query: boolean
      hasLimits: boolean
    }
    aiEnhanced?: boolean
    processingTime?: number
  }
}

export interface AIServiceConfig {
  provider: "openai" | "anthropic" | "groq" | "gemini"
  apiKey: string
  model?: string
  enabled: boolean
}

export interface AppSettings {
  aiServices: AIServiceConfig[]
  cmsConfig?: {
    provider: string
    config: any
  }
  autoSave: boolean
  lastUpdated: string
}
