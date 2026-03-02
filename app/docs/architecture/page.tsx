export default function ArchitecturePage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-black prose-code:text-primary prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-h1:text-4xl">
      <h1>System_Architecture</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-primary pl-4 py-2">
        Secret_Scraper is a single-stack Next.js application. No separate backend, no external databases, no cloud dependencies. Everything runs through Next.js API routes.
      </p>

      <h2>Tech_Stack</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 my-6">
        {[
          { label: 'Framework', value: 'Next.js 15 (App Router)' },
          { label: 'Language', value: 'TypeScript' },
          { label: 'Runtime', value: 'Bun' },
          { label: 'Styling', value: 'Tailwind CSS v4 + shadcn/ui' },
          { label: 'Storage', value: 'IndexedDB / localStorage (browser-only)' },
          { label: 'PH Scraping', value: 'Firecrawl API' },
          { label: 'GitHub Scraping', value: 'Direct HTML + JSDOM' },
          { label: 'AI Providers', value: 'OpenAI / Groq / Gemini' },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border bg-[#0a0a0a] p-3 font-mono text-xs">
            <span className="text-primary">{label}:</span> <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>

      <h2>API_Routes</h2>
      <p>All server-side logic runs as Next.js API routes. There is no separate backend service or database.</p>
      <ul>
        <li><code>POST /api/scrape</code> — Scrapes GitHub trending pages or ProductHunt leaderboards. Accepts source, time period, date, scope, and Firecrawl API key.</li>
        <li><code>POST /api/scrape/deep</code> — Deep scrapes individual ProductHunt product pages in batches. Extracts GitHub repos, social handles, full descriptions, and website URLs.</li>
        <li><code>POST /api/ai/enhance</code> — Sends product data to the configured AI provider for summarization, highlights, and domain classification.</li>
        <li><code>POST /api/export</code> — Exports product data in JSON format.</li>
      </ul>

      <h2>Data_Flow</h2>
      <ol>
        <li>User configures a scrape (source, period, date, scope) in the Scrape Dialog.</li>
        <li>The relevant scraping engine (<code>lib/scrapers/*</code>) fetches and parses the target page via a Next.js API route.</li>
        <li>Parsed products are returned to the browser and stored in <code>IndexedDB</code>.</li>
        <li>(Optional) User triggers deep scrape to enrich individual PH products with GitHub repos, socials, and full descriptions.</li>
        <li>(Optional) Products are enhanced via AI for summaries and domain classification.</li>
        <li>User reviews, edits, approves/rejects products in the dashboard.</li>
        <li>User exports curated data in their preferred format.</li>
      </ol>

      <h2>Privacy_Architecture</h2>
      <p>
        Privacy is built into every layer of the architecture:
      </p>
      <ul>
        <li><strong>No server-side storage:</strong> No database, no file system writes, no session storage. All product data lives exclusively in the browser&apos;s IndexedDB.</li>
        <li><strong>No API key persistence:</strong> API keys (Firecrawl, OpenAI, Groq, Gemini) are stored in the browser&apos;s <code>localStorage</code>. When a request is made, the key is read from localStorage, used for the single API call to the third-party provider, and immediately discarded. Keys are never logged, cached, or stored server-side.</li>
        <li><strong>No telemetry:</strong> Zero analytics, zero tracking, zero usage data collection.</li>
        <li><strong>No accounts:</strong> No sign-up, login, or user identification of any kind.</li>
        <li><strong>Open source:</strong> The full codebase is MIT-licensed. Every claim above is verifiable by inspecting the source.</li>
      </ul>

      <div className="bg-secondary/10 border border-border p-4 my-8">
        <h3 className="mt-0 text-blue-400">Rate_Limits</h3>
        <p className="mb-0 text-sm font-mono">
          Scraping is subject to rate limits from target platforms and Firecrawl. Deep scraping processes products in batches of 3 to manage API rate limits. GitHub trending scraping requires no API key but may be rate-limited by GitHub for frequent requests.
        </p>
      </div>
    </div>
  )
}