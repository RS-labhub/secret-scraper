export default function ProductHuntDocPage() {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-black prose-code:text-primary prose-code:border prose-code:border-border prose-code:p-1 prose-pre:bg-black prose-pre:border prose-pre:border-border prose-h1:text-4xl">
      <h1>ProductHunt_Protocol</h1>
      
      <p className="lead text-xl text-muted-foreground border-l-2 border-primary pl-4 py-2">
        Scrape ProductHunt leaderboards using Firecrawl. Supports daily, weekly, and monthly periods with Featured, All, or Both scope modes. Deep scrape individual products for GitHub repos, social handles, and full descriptions.
      </p>

      <h2>How_It_Works</h2>
      <p>
        ProductHunt scraping is powered by <a href="https://www.firecrawl.dev">Firecrawl</a>, a web scraping API that handles JavaScript-rendered pages. Your Firecrawl API key is stored <strong>only in your browser&apos;s localStorage</strong> — it is sent directly to Firecrawl&apos;s API and never touches our servers.
      </p>

      <h2>Scrape_Engine</h2>
      <pre className="!bg-black">
        <code>
          Engine: lib/scrapers/producthunt-scraper.ts{'\n'}
          API Route: POST /api/scrape{'\n'}
          Deep Scrape: POST /api/scrape/deep{'\n'}
          Output: Product Node
        </code>
      </pre>

      <h2>Leaderboard_Scraping</h2>
      <p>
        The primary scrape targets ProductHunt leaderboard pages and extracts structured product data from the HTML.
      </p>

      <h3>Scope_Modes</h3>
      <ul>
        <li><strong>Featured:</strong> Only curated/featured products (default ProductHunt leaderboard view).</li>
        <li><strong>All:</strong> Every product listed on the leaderboard (appends <code>/all</code> to the URL).</li>
        <li><strong>Both:</strong> Scrapes both Featured and All, merging results and marking featured products with a badge.</li>
      </ul>

      <h3>URL_Formats</h3>
      <pre className="!bg-black">
        <code>
          Daily:   /leaderboard/daily/YYYY/M/D{'\n'}
          Weekly:  /leaderboard/weekly/YYYY/W{'\n'}
          Monthly: /leaderboard/monthly/YYYY/M{'\n'}
          {'\n'}
          Append /all for all products{'\n'}
          Omit /all for featured only
        </code>
      </pre>

      <h3>Extracted_Data</h3>
      <ul>
        <li><strong>Name &amp; Tagline:</strong> Product name and one-line description.</li>
        <li><strong>Upvotes:</strong> Community vote count.</li>
        <li><strong>Tags:</strong> Topic/category tags extracted from the leaderboard page.</li>
        <li><strong>ProductHunt URL:</strong> Direct link to the product page.</li>
        <li><strong>Website:</strong> External website link (if available on the leaderboard).</li>
        <li><strong>Featured Status:</strong> Whether the product is a featured/curated pick.</li>
        <li><strong>Trending Status:</strong> Whether the product is marked as trending.</li>
      </ul>

      <h2>Deep_Scrape</h2>
      <p>
        After an initial leaderboard scrape, you can deep scrape individual products to extract detailed information that isn&apos;t available on the leaderboard page. Deep scrape visits each product&apos;s individual ProductHunt page using Firecrawl with <code>onlyMainContent: false</code> to capture sidebar sections.
      </p>

      <h3>Deep_Scrape_Extracts</h3>
      <ul>
        <li><strong>Full Description:</strong> The complete product description from the product page.</li>
        <li><strong>GitHub Repository:</strong> Extracted from the Company Info section if available.</li>
        <li><strong>Social Media Handles:</strong> X/Twitter and other social links from the Social section.</li>
        <li><strong>Official Website:</strong> The verified website URL from the &quot;Visit website&quot; button.</li>
      </ul>

      <h3>How_To_Deep_Scrape</h3>
      <ul>
        <li><strong>Single Product:</strong> Click the 🔍 Deep Scrape button on any product card or in the product editor.</li>
        <li><strong>Bulk Deep Scrape:</strong> Enter multi-select mode, select products, then click Bulk Deep Scrape in the toolbar.</li>
      </ul>

      <div className="border border-border p-4 bg-secondary/10 mt-8">
        <h3 className="mt-0 text-primary uppercase text-sm mb-2">Privacy_Note</h3>
        <p className="mb-0 text-xs font-mono">
          Your Firecrawl API key is stored only in your browser&apos;s localStorage. When scraping, it is sent directly from your browser to the Firecrawl API — our server acts only as a proxy to construct the correct request. We never log, store, or transmit your API key anywhere.
        </p>
      </div>

      <div className="border border-primary/20 p-4 bg-primary/5 mt-4">
        <h3 className="mt-0 text-primary uppercase text-sm mb-2">Rate_Limits</h3>
        <p className="mb-0 text-xs font-mono">
          Deep scraping makes one Firecrawl API call per product. Bulk deep scraping processes products in batches of 3 to respect rate limits. Monitor your Firecrawl credit usage when deep scraping large numbers of products.
        </p>
      </div>
    </div>
  )
}