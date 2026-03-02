export default function AIEnhancementDocPage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-pink-500 hover:prose-a:text-pink-500/80 prose-code:bg-black prose-code:text-pink-500 prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-h1:text-3xl prose-h1:md:text-4xl break-words">
      <h1>AI_Enhancement</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-pink-500 pl-4 py-2">
        Enhance scraped product data using AI. Generate concise summaries, extract key highlights, classify domains, and detect languages — all powered by your own API keys.
      </p>

      <h2>What_Enhancement_Does</h2>
      <p>
        Raw scraped data often contains unstructured descriptions, inconsistent formatting, and missing metadata. The AI enhancement system sends your product data to your chosen provider and returns:
      </p>
      <ul>
        <li><strong>Summary:</strong> A concise 1-2 sentence description of the product in English.</li>
        <li><strong>Highlights:</strong> 2-5 key feature highlights extracted from the product data.</li>
        <li><strong>Features:</strong> Structured feature list derived from the description.</li>
        <li><strong>Domain Classification:</strong> Suggests the most relevant domain (AIE, Code, DevOps, DevSecOps, Product, Quality Assurance, Orchestration).</li>
        <li><strong>Language Detection:</strong> If the original description is in a non-English language, it&apos;s automatically detected, translated, and the original language is recorded.</li>
      </ul>

      <h2>Enhancement_Modes</h2>
      <div className="not-prose space-y-3 my-8">
        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter mb-2">Single Enhancement</h3>
          <p className="text-xs font-mono text-muted-foreground mb-0">Click the ✨ Enhance button on any product card or in the product editor. Sends one product at a time to the AI provider.</p>
        </div>
        <div className="border border-pink-500/20 bg-pink-500/5 p-4">
          <h3 className="text-pink-500 uppercase text-sm font-display tracking-tighter mb-2">Bulk Enhancement</h3>
          <p className="text-xs font-mono text-muted-foreground mb-0">Select multiple products in multi-select mode and use Bulk AI Enhancement. Processes products sequentially to stay within rate limits.</p>
        </div>
      </div>

      <h2>Prompt_Structure</h2>
      <p>
        The enhancement system sends a structured prompt to the AI provider containing the product name, description, features, domain, and source. The AI is instructed to respond in strictly valid JSON format matching the expected schema.
      </p>
      <pre className="!bg-black !border-pink-500/30 !text-pink-500 overflow-x-auto text-xs md:text-sm whitespace-pre-wrap break-words">
        <code>
{`Tasks: ["summarize", "highlights", "features", "domains"]
Input: Product name, description, features list, source
Output: JSON {
  summary: string,
  highlights: string[],
  features: string[],
  suggestedDomain: string
}`}
        </code>
      </pre>

      <h2>Privacy</h2>
      <p>
        Your API key is read from <code>localStorage</code>, used for the single API call, and immediately discarded. Product data is sent directly to the AI provider (OpenAI, Groq, or Gemini) — it is not stored, cached, or logged by Secret_Scraper at any point.
      </p>

      <div className="border border-pink-500/20 p-4 bg-pink-500/5 mt-8">
        <h3 className="mt-0 text-pink-500 uppercase text-sm mb-2">Cost_Note</h3>
        <p className="mb-0 text-xs font-mono text-muted-foreground">
          Each enhancement uses ~500-1000 input tokens per product. Bulk enhancement across many products will consume credits accordingly. Groq and Gemini offer generous free tiers — consider using those for high-volume enhancement.
        </p>
      </div>
    </div>
  )
}