export default function AuthDocPage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-emerald-500 hover:prose-a:text-emerald-500/80 prose-code:bg-black prose-code:text-emerald-500 prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-h1:text-4xl">
      <h1>Auth_&amp;_API_Keys</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-emerald-500 pl-4 py-2">
        Secret_Scraper requires no accounts, no login, and no server-side authentication. API keys are stored exclusively in your browser and never touch our servers.
      </p>

      <h2>Zero-Account_Model</h2>
      <p>
        There is no sign-up, login, or user authentication system. You open the app and start using it immediately. This is by design — we don&apos;t want your personal information, and we don&apos;t need it.
      </p>

      <h2>API_Key_Management</h2>
      <p>
        The application uses third-party APIs for scraping (Firecrawl) and AI enhancement (OpenAI, Groq, Gemini). These require API keys that <strong>you</strong> provide. Here&apos;s exactly how they&apos;re handled:
      </p>

      <div className="not-prose space-y-4 my-8">
        <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="text-emerald-500 uppercase text-sm font-display tracking-tighter mb-3">Where Keys Are Stored</h3>
          <p className="text-sm font-mono text-muted-foreground mb-0">
            All API keys are stored in your browser&apos;s <code className="text-emerald-500 bg-black border border-border px-1">localStorage</code>. This means they exist only on your machine, inside your browser profile. They are never written to any server, database, or log file.
          </p>
        </div>

        <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="text-emerald-500 uppercase text-sm font-display tracking-tighter mb-3">How Keys Are Used</h3>
          <p className="text-sm font-mono text-muted-foreground mb-0">
            When you trigger a scrape or AI enhancement, your API key is read from localStorage and sent as part of the request body to our Next.js API route. The API route uses the key to make the call to the third-party service (Firecrawl, OpenAI, Groq, or Gemini) and then discards it. The key is <strong>never logged, cached, or persisted</strong> on the server side.
          </p>
        </div>

        <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="text-emerald-500 uppercase text-sm font-display tracking-tighter mb-3">Supported Keys</h3>
          <ul className="text-sm font-mono text-muted-foreground space-y-2 mb-0 list-none pl-0">
            <li>• <strong className="text-white">Firecrawl API Key</strong> — Required for ProductHunt scraping. Get one at <a href="https://www.firecrawl.dev" className="text-emerald-500 hover:text-emerald-500/80">firecrawl.dev</a></li>
            <li>• <strong className="text-white">OpenAI API Key</strong> — For GPT-4o / GPT-4o-mini AI enhancement. Get one at <a href="https://platform.openai.com" className="text-emerald-500 hover:text-emerald-500/80">platform.openai.com</a></li>
            <li>• <strong className="text-white">Groq API Key</strong> — For Llama / Mixtral AI enhancement. Get one at <a href="https://console.groq.com" className="text-emerald-500 hover:text-emerald-500/80">console.groq.com</a></li>
            <li>• <strong className="text-white">Gemini API Key</strong> — For Gemini 2.0 Flash AI enhancement. Get one at <a href="https://aistudio.google.com" className="text-emerald-500 hover:text-emerald-500/80">aistudio.google.com</a></li>
          </ul>
        </div>
      </div>

      <h2>Data_Privacy</h2>
      <p>
        All scraped product data is stored in your browser&apos;s <code>IndexedDB</code>. It never leaves your machine unless you explicitly export it. Clearing your browser data will remove all stored products — always export before clearing.
      </p>

      <div className="bg-black border border-emerald-500/30 p-4 mt-8">
        <h3 className="mt-0 text-emerald-500 text-sm tracking-tighter uppercase mb-2">Open_Source_Guarantee</h3>
        <p className="m-0 text-xs font-mono text-muted-foreground">
          This project is 100% open source under the MIT License. You can inspect every line of code to verify these privacy claims. No hidden endpoints, no secret data collection, no server-side key storage. What you see in the repository is exactly what runs.
        </p>
      </div>
    </div>
  )
}