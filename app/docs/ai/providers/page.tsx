export default function AIProvidersDocPage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-pink-500 hover:prose-a:text-pink-500/80 prose-code:bg-black prose-code:text-pink-500 prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-h1:text-4xl">
      <h1>AI_Providers</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-pink-500 pl-4 py-2">
        Secret_Scraper supports multiple AI providers for enhancing scraped product data. All API keys are stored client-side — never on our servers.
      </p>

      <h2>Supported_Providers</h2>

      <div className="not-prose space-y-4 my-8">
        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter m-0">OpenAI</h3>
            <span className="text-[10px] font-mono text-emerald-500 border border-emerald-500/30 px-2 py-0.5">ACTIVE</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-2">Models: <code className="text-pink-500 bg-black border border-border px-1">gpt-4o</code> <code className="text-pink-500 bg-black border border-border px-1">gpt-4o-mini</code> <code className="text-pink-500 bg-black border border-border px-1">gpt-3.5-turbo</code></p>
          <p className="text-xs font-mono text-muted-foreground mb-0">Reliable, fast, excellent at structured JSON output. Default uses gpt-4o-mini for cost efficiency.</p>
        </div>

        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter m-0">Groq</h3>
            <span className="text-[10px] font-mono text-emerald-500 border border-emerald-500/30 px-2 py-0.5">ACTIVE</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-2">Models: <code className="text-pink-500 bg-black border border-border px-1">llama-3.3-70b-versatile</code> <code className="text-pink-500 bg-black border border-border px-1">mixtral-8x7b-32768</code></p>
          <p className="text-xs font-mono text-muted-foreground mb-0">Extremely fast inference. Generous free tier. Great for bulk enhancement operations.</p>
        </div>

        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter m-0">Google Gemini</h3>
            <span className="text-[10px] font-mono text-emerald-500 border border-emerald-500/30 px-2 py-0.5">ACTIVE</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-2">Models: <code className="text-pink-500 bg-black border border-border px-1">gemini-2.0-flash</code> <code className="text-pink-500 bg-black border border-border px-1">gemini-2.0-flash-lite</code></p>
          <p className="text-xs font-mono text-muted-foreground mb-0">Large context window. Default uses gemini-2.0-flash for speed. Free tier available via Google AI Studio.</p>
        </div>

        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter m-0">Anthropic (Claude)</h3>
            <span className="text-[10px] font-mono text-emerald-500 border border-emerald-500/30 px-2 py-0.5">ACTIVE</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-2">Models: <code className="text-pink-500 bg-black border border-border px-1">claude-3-5-sonnet-20241022</code> <code className="text-pink-500 bg-black border border-border px-1">claude-3-haiku-20240307</code></p>
          <p className="text-xs font-mono text-muted-foreground mb-0">Superior reasoning with higher token context limits. Default uses claude-3-haiku for cost efficiency.</p>
        </div>
      </div>

      <h2>Key_Management</h2>
      <p>
        API keys are stored exclusively in your browser&apos;s <code>localStorage</code>. When you trigger an enhancement, the key is read from localStorage, sent to the Next.js API route, used for the single API call, and immediately discarded. Keys are <strong>never logged, cached, or stored</strong> on the server side.
      </p>

      <h2>Configuration</h2>
      <p>
        Open the <strong>AI Configuration</strong> panel from the dashboard to:
      </p>
      <ul>
        <li>Select your preferred AI provider.</li>
        <li>Enter your API key (stored in localStorage only).</li>
        <li>Choose enhancement tasks: summarize, highlights, features, domain classification.</li>
      </ul>

      <div className="border border-border p-4 bg-black mt-8">
        <h3 className="mt-0 text-pink-500 uppercase text-sm mb-2">Cost_Note</h3>
        <p className="mb-0 text-xs font-mono text-muted-foreground">
          AI enhancement costs are billed directly by your chosen provider. Secret_Scraper does not add any markup or fees. Groq and Gemini offer generous free tiers — use those for cost-free enhancement.
        </p>
      </div>
    </div>
  )
}