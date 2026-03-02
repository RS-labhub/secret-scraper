export default function DocsPage() {
  return (
    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:overflow-x-auto prose-pre:max-w-[85vw] md:prose-pre:max-w-none max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-[#0a0a0a] prose-code:text-primary prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-border prose-h1:text-4xl lg:prose-h1:text-5xl prose-h1:text-white prose-h2:text-gray-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/og-image.png" alt="Secret Scraper" className="w-full rounded-none border border-border mb-8 not-prose" />
      <h1 className="mb-4">Welcome_to_Secret_Scraper</h1>
      <p className="lead text-xl text-primary font-mono border-l-4 border-primary pl-6 py-2 mb-12 bg-primary/5">
        Secret_Scraper is an open-source, privacy-first platform for discovering and curating trending products from GitHub and ProductHunt. Zero telemetry. Zero accounts. Your API keys never touch our servers.
      </p>

      <h2>What_Is_Secret_Scraper?</h2>
      <p>
        The internet is full of product launches, open-source repos, and tools — all scattered across different platforms. Secret_Scraper brings them together. Scrape ProductHunt leaderboards and GitHub trending pages, deep-dive into individual products for GitHub repos and social links, enhance everything with AI, and export your curated dataset in any format you need.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12 not-prose">
        <div className="border border-border bg-[#0a0a0a] p-6 group hover:border-primary/50 transition-colors">
          <div className="w-8 h-8 bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
            <span className="text-primary font-bold">01</span>
          </div>
          <h3 className="font-display text-xl uppercase tracking-tighter text-white mb-2 group-hover:text-primary transition-colors">Scrape</h3>
          <p className="text-sm text-muted-foreground font-mono">Scrape GitHub trending repos or ProductHunt leaderboards. Choose scope (Featured / All / Both), time period, and date.</p>
        </div>
        <div className="border border-border bg-[#0a0a0a] p-6 group hover:border-pink-500/50 transition-colors">
          <div className="w-8 h-8 bg-pink-500/20 flex items-center justify-center mb-4 border border-pink-500/30">
            <span className="text-pink-500 font-bold">02</span>
          </div>
          <h3 className="font-display text-xl uppercase tracking-tighter text-white mb-2 group-hover:text-pink-500 transition-colors">Deep_Scrape</h3>
          <p className="text-sm text-muted-foreground font-mono">Deep scrape individual PH products to extract GitHub repos, social handles (X/Twitter), full descriptions, and website URLs.</p>
        </div>
        <div className="border border-border bg-[#0a0a0a] p-6 group hover:border-blue-500/50 transition-colors">
          <div className="w-8 h-8 bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-500/30">
            <span className="text-blue-500 font-bold">03</span>
          </div>
          <h3 className="font-display text-xl uppercase tracking-tighter text-white mb-2 group-hover:text-blue-500 transition-colors">AI_Enhance</h3>
          <p className="text-sm text-muted-foreground font-mono">Enhance products with OpenAI, Groq, or Gemini — generate summaries, highlights, and domain classification automatically.</p>
        </div>
        <div className="border border-border bg-[#0a0a0a] p-6 group hover:border-emerald-500/50 transition-colors">
          <div className="w-8 h-8 bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
            <span className="text-emerald-500 font-bold">04</span>
          </div>
          <h3 className="font-display text-xl uppercase tracking-tighter text-white mb-2 group-hover:text-emerald-500 transition-colors">Export</h3>
          <p className="text-sm text-muted-foreground font-mono">Export your curated dataset as JSON. Approve, reject, and filter before exporting.</p>
        </div>
      </div>

      <h2>Privacy_&amp;_Security</h2>
      <p>Secret_Scraper is designed with privacy as a core principle, not an afterthought.</p>
      <div className="bg-emerald-500/5 border border-emerald-500/30 p-6 my-8 not-prose">
        <ul className="space-y-3 text-sm font-mono text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> <span><strong className="text-white">Your API keys stay in your browser.</strong> All keys (Firecrawl, OpenAI, Groq, Gemini) are stored in <code className="text-emerald-500 bg-[#0a0a0a] border border-border px-1">localStorage</code> and sent directly to the respective API providers. We never see, log, or store them.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> <span><strong className="text-white">Zero telemetry.</strong> No analytics, no tracking, no usage data. Ever.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> <span><strong className="text-white">Browser-only storage.</strong> All scraped data lives in your browser&apos;s IndexedDB. Nothing leaves your machine unless you explicitly export it.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> <span><strong className="text-white">No accounts.</strong> No sign-up, no login, no user profiles. Just open and use.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> <span><strong className="text-white">100% open source.</strong> MIT licensed. Every line of code is available for inspection on GitHub.</span></li>
        </ul>
      </div>

      <h2>Getting_Started</h2>
      <ol className="space-y-4 font-mono text-sm">
        <li>Open <strong>Scrape Products</strong> from the dashboard.</li>
        <li>Choose your source — <strong>GitHub</strong> (no API key needed) or <strong>ProductHunt</strong> (requires a free <a href="https://www.firecrawl.dev">Firecrawl API key</a>).</li>
        <li>Configure your scrape: select time period, date, and scope.</li>
        <li>Products appear in your dashboard — browse, filter, and edit.</li>
        <li>Use <strong>Deep Scrape</strong> on PH products to get GitHub repos, social links, and full descriptions.</li>
        <li>Optionally enhance products with <strong>AI</strong> (OpenAI, Groq, or Gemini).</li>
        <li><strong>Export</strong> your curated data as JSON.</li>
      </ol>

      <h2>API_Keys_You&apos;ll_Need</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="border border-border bg-[#0a0a0a] p-4 font-mono text-sm">
          <p className="text-primary font-bold mb-2">For Scraping</p>
          <p className="text-muted-foreground"><a href="https://www.firecrawl.dev" className="text-primary hover:text-primary/80">Firecrawl API key</a> — required for ProductHunt scraping. GitHub scraping needs no key.</p>
        </div>
        <div className="border border-border bg-[#0a0a0a] p-4 font-mono text-sm">
          <p className="text-pink-500 font-bold mb-2">For AI Enhancement (Optional)</p>
          <p className="text-muted-foreground">OpenAI, Groq, or Gemini API key — for generating summaries, highlights, and domain classification.</p>
        </div>
      </div>

      <hr className="border-border my-12" />

      <div className="bg-[#050505] border border-border p-6 font-mono text-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 text-[10px] text-muted-foreground">OPEN_SOURCE</div>
        <p className="text-muted-foreground leading-relaxed">
          <span className="text-primary font-bold animate-pulse">$&gt;</span> Secret_Scraper is 100% open source under the MIT License. All data stays in your browser. API keys are stored client-side only and sent directly to the respective providers. We don&apos;t collect, store, or transmit any of your data. Explore the source code on <a href="https://github.com/RS-labhub/secret-scraper" className="text-primary hover:text-primary/80">GitHub</a>.
        </p>
      </div>
    </div>
  )
}