import { Terminal, Database, Code, Layers, Image } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-black text-foreground font-mono">
      {/* Header */}
      <header className="border-b border-border bg-[#050505] p-4 md:p-6 lg:px-12 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors group">
          <Terminal className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-display font-bold uppercase tracking-tighter text-base md:text-lg">SYS_MAIN</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/docs">
            <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase h-8 px-4 hover:bg-secondary cursor-pointer flex items-center justify-center">
              DOCS
            </Badge>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-24 space-y-12 md:space-y-24">
        {/* Hero Section */}
        <section className="space-y-4 md:space-y-6 text-center">
          <Badge variant="outline" className="rounded-none border-primary text-primary bg-primary/10 px-3 py-1 text-xs uppercase mb-4">
            Data_Samples
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl uppercase tracking-tighter text-white">Extraction_Matrices</h1>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto uppercase text-[10px] md:text-xs lg:text-sm">
            Real output payloads from supported sources. All products follow the unified Product schema.
          </p>
        </section>

        {/* ProductHunt Example */}
        <section className="border border-border bg-[#0a0a0a] p-4 md:p-6 lg:p-12 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Layers className="w-64 md:w-96 h-64 md:h-96" />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 relative z-10">
            <div className="flex-1 space-y-4 md:space-y-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-primary flex items-center gap-3 border-b border-border pb-4 mb-4">
                  <span className="w-3 h-3 bg-primary shrink-0" /> ProductHunt
                </h2>
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase mb-4">
                  Source: ProductHunt Leaderboard (Daily/Weekly/Monthly)
                </p>
                <div className="p-3 md:p-4 border border-border bg-black/50 text-[10px] md:text-xs text-muted-foreground space-y-2">
                  <p><span className="text-white">EXTRACTS:</span> Name, Description, Upvotes, Tags, Website, ProductHunt URL, Featured status.</p>
                  <p><span className="text-white">DEEP SCRAPE:</span> Full description, GitHub repo, Social handles (X/Twitter), Official website.</p>
                  <p><span className="text-white">SCRAPING ENGINE:</span> Firecrawl API (requires API key).</p>
                </div>
              </div>
            </div>

            <div className="lg:flex-[1.5] border border-border bg-black min-w-0">
              <div className="flex items-center justify-between border-b border-border p-2 bg-secondary/10">
                <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground ml-2 truncate">product_producthunt_example.json</span>
                <Badge variant="outline" className="rounded-none border-border text-[7px] md:text-[8px] h-4 py-0 bg-black shrink-0 ml-2">DEEP_SCRAPED</Badge>
              </div>
              <pre className="p-3 md:p-4 overflow-x-auto text-[9px] md:text-[10px] text-primary/80 leading-relaxed">
{`{
  "id": "ph_notra_2025",
  "name": "Notra",
  "description": "Notra connects to GitHub, Linear 
    and Slack to turn shipped work into 
    ready-to-publish changelogs, blog posts, 
    and social updates.",
  "domain": "Product",
  "features": [],
  "tags": [
    "Developer Tools", 
    "GitHub", 
    "Productivity"
  ],
  "links": {
    "website": "https://www.usenotra.com/",
    "repository": "https://github.com/usenotra/notra",
    "productHunt": "https://producthunt.com/posts/notra",
    "social": ["https://x.com/usenotra"]
  },
  "source": "producthunt",
  "metadata": {
    "upvotes": 847,
    "trending": true,
    "scrapedAt": "2025-10-15T12:00:00.000Z",
    "timePeriod": "daily",
    "sourceIcon": "🟠",
    "productIcon": "📝"
  },
  "status": "pending",
  "aiEnhanced": {
    "summary": "Automates changelog and content 
      creation from shipped dev work across 
      GitHub, Linear, and Slack.",
    "highlights": [
      "Auto-generates changelogs from commits",
      "Connects GitHub, Linear, Slack",
      "Creates blog posts and social updates"
    ],
    "suggestedDomain": "Product"
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* GitHub Example */}
        <section className="border border-border bg-[#0a0a0a] p-4 md:p-6 lg:p-12 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Code className="w-64 md:w-96 h-64 md:h-96" />
          </div>
          
          <div className="flex flex-col lg:flex-row-reverse gap-6 lg:gap-16 relative z-10">
            <div className="flex-1 space-y-4 md:space-y-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-blue-400 flex items-center gap-3 border-b border-border pb-4 mb-4">
                  <span className="w-3 h-3 bg-blue-400 shrink-0" /> GitHub
                </h2>
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase mb-4">
                  Source: GitHub Trending (Daily/Weekly/Monthly)
                </p>
                <div className="p-3 md:p-4 border border-border bg-black/50 text-[10px] md:text-xs text-muted-foreground space-y-2">
                  <p><span className="text-white">EXTRACTS:</span> Repo name, Description, Stars, Forks, Language, Topics, Stars today, License.</p>
                  <p><span className="text-white">PARSING:</span> Direct HTML parsing via JSDOM. No API key needed.</p>
                  <p><span className="text-white">FILTERS:</span> Time period (daily/weekly/monthly), Language.</p>
                </div>
              </div>
            </div>

            <div className="lg:flex-[1.5] border border-border bg-black min-w-0">
              <div className="flex items-center justify-between border-b border-border p-2 bg-secondary/10">
                <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground ml-2 truncate">product_github_example.json</span>
                <Badge variant="outline" className="rounded-none border-border text-[7px] md:text-[8px] h-4 py-0 bg-black shrink-0 ml-2">AI_ENHANCED</Badge>
              </div>
              <pre className="p-3 md:p-4 overflow-x-auto text-[9px] md:text-[10px] text-blue-400/80 leading-relaxed">
{`{
  "id": "gh_vercel_next.js",
  "name": "next.js",
  "description": "The React Framework",
  "domain": "Code",
  "features": [],
  "tags": ["nextjs", "react", "javascript"],
  "links": {
    "website": "https://nextjs.org",
    "repository": "https://github.com/vercel/next.js"
  },
  "source": "github",
  "metadata": {
    "stars": 128500,
    "starsToday": 245,
    "forks": 28100,
    "language": "JavaScript",
    "license": "MIT",
    "scrapedAt": "2025-10-15T12:00:00.000Z",
    "timePeriod": "daily"
  },
  "status": "approved",
  "aiEnhanced": {
    "summary": "A production-ready React framework 
      by Vercel with server-side rendering, 
      static generation, and full-stack 
      capabilities.",
    "highlights": [
      "Built-in SSR and static generation",
      "Full-stack React with API routes",
      "Automatic code splitting"
    ],
    "suggestedDomain": "Code"
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Product Card Preview */}
        <section className="border border-border bg-[#0a0a0a] p-4 md:p-6 lg:p-12 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Image className="w-64 md:w-96 h-64 md:h-96" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-purple-400 flex items-center gap-3 border-b border-border pb-4">
              <span className="w-3 h-3 bg-purple-400 shrink-0" /> Product Card
            </h2>
            <p className="text-muted-foreground text-[10px] md:text-xs uppercase">
              Each scraped product is rendered as a brutalist product card with all extracted data at a glance.
            </p>
            <div className="border border-border bg-black p-2 md:p-4">
              <img 
                src="/product-card.png" 
                alt="Product Card — showing name, description, tags, upvotes, source badge, and action buttons" 
                className="w-full h-auto rounded-none border border-border"
              />
            </div>
          </div>
        </section>

        {/* Product Schema Reference */}
        <section className="border border-border bg-[#0a0a0a] p-4 md:p-6 lg:p-12 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Database className="w-64 md:w-96 h-64 md:h-96" />
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-green-400 flex items-center gap-3 border-b border-border pb-4 mb-6">
              <span className="w-3 h-3 bg-green-400 shrink-0" /> Product Schema
            </h2>
            <p className="text-muted-foreground text-[10px] md:text-xs uppercase mb-6">
              All products — regardless of source — conform to this unified TypeScript interface.
            </p>
            <div className="border border-border bg-black min-w-0">
              <div className="flex items-center justify-between border-b border-border p-2 bg-secondary/10">
                <span className="text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground ml-2">types/product.ts</span>
                <Badge variant="outline" className="rounded-none border-border text-[7px] md:text-[8px] h-4 py-0 bg-black">TypeScript</Badge>
              </div>
              <pre className="p-3 md:p-4 overflow-x-auto text-[9px] md:text-[10px] text-green-400/80 leading-relaxed">
{`interface Product {
  id: string               // "ph_*" | "gh_*"
  name: string             // Product or repo name
  description: string      // Tagline or description
  domain?: string          // "Code" | "Product" | "Design"
  features: string[]       // Feature list (often AI)
  tags?: string[]          // PH categories / GH topics
  logoUrl?: string         // Product logo URL
  links: {
    website?: string       // Official website
    repository?: string    // GitHub repo URL
    productHunt?: string   // PH listing URL
    documentation?: string // Docs URL
    demo?: string          // Demo URL
    social?: string[]      // X, LinkedIn, etc.
  }
  source: "producthunt" | "github"
  metadata: {
    stars?: number         // GitHub stars
    starsToday?: number    // Stars gained today
    upvotes?: number       // PH upvotes
    forks?: number         // GitHub forks
    trending?: boolean     // Featured on PH
    language?: string      // Primary language (GH)
    license?: string       // License (GH)
    scrapedAt: string      // ISO timestamp
    timePeriod?: string    // daily | weekly | monthly
    sourceIcon?: string    // Emoji icon
    productIcon?: string   // Emoji icon
  }
  status: "pending" | "approved" | "rejected"
  aiEnhanced?: {
    summary?: string             // AI summary
    originalLanguage?: string    // Detected lang
    highlights?: string[]        // Key highlights
    suggestedDomain?: string     // AI domain
  }
}`}
              </pre>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-border p-6 text-center mt-12 md:mt-24">
        <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
          SYS_END // EOL
        </p>
      </footer>
    </div>
  )
}