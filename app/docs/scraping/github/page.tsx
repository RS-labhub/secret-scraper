export default function GitHubDocPage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-blue-400 hover:prose-a:text-blue-400/80 prose-code:bg-black prose-code:text-blue-400 prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-h1:text-4xl">
      <h1>GitHub_Protocol</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-blue-400 pl-4 py-2">
        Scrape trending repositories from GitHub. No API key required — uses direct HTML parsing of GitHub&apos;s trending pages.
      </p>

      <h2>How_It_Works</h2>
      <p>
        GitHub scraping fetches the GitHub trending page HTML and parses it server-side using JSDOM. No external APIs or API keys are needed — it works by parsing the publicly available trending page directly.
      </p>

      <h2>Scrape_Engine</h2>
      <pre className="!bg-black !border-blue-400/30 !text-blue-400">
        <code>
          Target: https://github.com/trending{'\n'}
          Engine: lib/scrapers/github-scraper.ts{'\n'}
          API Route: POST /api/scrape{'\n'}
          Parser: JSDOM (server-side){'\n'}
          Output: Product Node
        </code>
      </pre>

      <h2>Extracted_Data</h2>
      <ul>
        <li><strong>Repository Name:</strong> Owner and repo name from the trending page.</li>
        <li><strong>Description:</strong> Repository &quot;About&quot; text.</li>
        <li><strong>Stars &amp; Forks:</strong> Current star and fork counts.</li>
        <li><strong>Language:</strong> Primary programming language.</li>
        <li><strong>Topics:</strong> Repository topic tags.</li>
        <li><strong>Stars Today:</strong> Stars gained in the current trending period.</li>
        <li><strong>License:</strong> Repository license if available.</li>
        <li><strong>GitHub URL:</strong> Direct link to the repository.</li>
      </ul>

      <h2>Configuration</h2>
      <p>
        When scraping GitHub, you can configure:
      </p>
      <ul>
        <li><strong>Time Period:</strong> Daily, Weekly, or Monthly trending.</li>
        <li><strong>Language Filter:</strong> Filter by programming language (optional).</li>
      </ul>

      <div className="border border-blue-400/20 p-4 bg-blue-400/5 mt-8">
        <h3 className="mt-0 text-blue-400 uppercase text-sm mb-2">No_API_Key_Needed</h3>
        <p className="mb-0 text-xs font-mono text-muted-foreground">
          GitHub scraping does not require any API key. However, GitHub may rate-limit requests from the same IP if scraping is done too frequently. Use reasonable intervals between scrapes.
        </p>
      </div>
    </div>
  )
}