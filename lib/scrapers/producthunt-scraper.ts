import Firecrawl from '@mendable/firecrawl-js';
import { JSDOM } from 'jsdom';
import type { Product } from '../../types/product';

export interface ProductHuntScrapingOptions {
  period: 'daily' | 'weekly' | 'monthly';
  year?: number;
  month?: number;
  day?: number;
  week?: number;
  featured?: boolean;
  apiKey: string;
}

export interface ProductHuntProduct {
  index: number;
  logo?: string;
  title: string;
  description: string;
  product_url?: string;
  votes: number;
  scraped_at: string;
}

export class ProductHuntScraper {
  private firecrawl: Firecrawl;

  constructor(apiKey: string) {
    this.firecrawl = new Firecrawl({ apiKey });
  }

  /**
   * Extract HTML content from a Firecrawl scrape response
   */
  private extractHtmlFromResponse(scrapeResult: any): string | null {
    let htmlContent: string | null = null;
    if (scrapeResult && typeof scrapeResult === 'object') {
      const anyResult = scrapeResult as any;
      if (anyResult.data && typeof anyResult.data === 'object' && anyResult.data.html) {
        htmlContent = anyResult.data.html;
      } else if (anyResult.html && typeof anyResult.html === 'string') {
        htmlContent = anyResult.html;
      } else if (anyResult.content && typeof anyResult.content === 'string') {
        htmlContent = anyResult.content;
      } else if (anyResult.data && typeof anyResult.data === 'string') {
        htmlContent = anyResult.data;
      }
    } else if (typeof scrapeResult === 'string') {
      htmlContent = scrapeResult;
    }
    return htmlContent;
  }

  /**
   * Scrape ProductHunt leaderboard for daily, weekly, or monthly periods.
   * Supports scraping featured only, all only, or both (merging results).
   */
  async scrapeLeaderboard(options: ProductHuntScrapingOptions): Promise<Product[]> {
    const scrapeScope = (options as any).scrapeScope || 'both';

    const scrapeOne = async (url: string, label: string): Promise<Product[]> => {
      try {
        console.log(`🔍 Scraping ${label}: ${url}`);
        const scrapeResult = await this.firecrawl.scrape(url, { formats: ['html'] });
        const htmlContent = this.extractHtmlFromResponse(scrapeResult);

        if (!htmlContent) {
          console.error(`Firecrawl response format for ${label}:`, JSON.stringify(scrapeResult).substring(0, 200));
          throw new Error(`HTML content is empty or not parsed properly from ${label} response`);
        }

        console.log(`Received ${label} HTML content, length: ${htmlContent.length}`);
        const products = this.extractProductsFallback(htmlContent, options.period, label === 'featured');
        console.log(`🎉 Found ${products.length} ${label} products`);
        return products;
      } catch (error) {
        console.error(`Error scraping ProductHunt ${label}: ${error}`);
        throw error;
      }
    };

    if (scrapeScope === 'featured') {
      const featuredUrl = this.buildLeaderboardUrl({ ...options, featured: true });
      return scrapeOne(featuredUrl, 'featured');
    }

    if (scrapeScope === 'all') {
      const allUrl = this.buildLeaderboardUrl({ ...options, featured: false });
      return scrapeOne(allUrl, 'all');
    }

    // Default: 'both' - scrape featured and all, merge results
    const featuredUrl = this.buildLeaderboardUrl({ ...options, featured: true });
    const allUrl = this.buildLeaderboardUrl({ ...options, featured: false });

    const [featuredProducts, allProducts] = await Promise.all([
      scrapeOne(featuredUrl, 'featured'),
      scrapeOne(allUrl, 'all'),
    ]);

    // Merge: featured products first, then all products that aren't already in featured
    const featuredNames = new Set(featuredProducts.map(p => p.name.toLowerCase()));
    const uniqueAllProducts = allProducts.filter(p => !featuredNames.has(p.name.toLowerCase()));

    const merged = [...featuredProducts, ...uniqueAllProducts];
    console.log(`📊 Merged: ${featuredProducts.length} featured + ${uniqueAllProducts.length} additional = ${merged.length} total`);
    return merged;
  }

  /**
   * Build ProductHunt leaderboard URL based on parameters
   */
  private buildLeaderboardUrl(options: ProductHuntScrapingOptions): string {
    const { period, year, month, day, week, featured = false } = options;
    const baseUrl = "https://www.producthunt.com/leaderboard";
    let urlPath: string;
    if (period === "daily") {
      if (!year || !month || !day) {
        throw new Error("Year, month, and day are required for daily leaderboard");
      }
      urlPath = `daily/${year}/${month}/${day}`;
    } else if (period === "weekly") {
      if (!year || !week) {
        throw new Error("Year and week are required for weekly leaderboard");
      }
      urlPath = `weekly/${year}/${week}`;
    } else if (period === "monthly") {
      if (!year || !month) {
        throw new Error("Year and month are required for monthly leaderboard");
      }
      urlPath = `monthly/${year}/${month}`;
    } else {
      throw new Error("Invalid period. Must be 'daily', 'weekly', or 'monthly'.");
    }
    // Add /all unless featured is true
    const suffix = featured ? '' : '/all';
    return `${baseUrl}/${urlPath}${suffix}`;
  }

  /**
   * Scrape ProductHunt /products page with topics and pagination
   */
  async scrapeProductsPage(options: { topics?: string[]; pageCount?: number }): Promise<Product[]> {
    const { topics = [], pageCount = 1 } = options;
    let products: Product[] = [];
    // If multiple topics, fetch each separately and merge results
    const topicList = topics.length > 0 ? topics : [undefined];
    for (const topic of topicList) {
      for (let page = 1; page <= pageCount; page++) {
        let url = 'https://www.producthunt.com/products';
        const params: string[] = [];
        if (topic) {
          params.push(`topic=${topic}`);
        } else {
          params.push('order=best_rated');
        }
        if (page > 1) {
          params.push(`page=${page}`);
        }
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
        try {
          const scrapeResult = await this.firecrawl.scrape(url, { formats: ['html'] });
          const htmlContent = this.extractHtmlFromResponse(scrapeResult);
          
          if (!htmlContent) throw new Error("HTML content is empty");
          console.log(`✅ Received HTML content for topic ${topic || 'best_rated'} page ${page}, length: ${htmlContent.length}`);
          // Robust extraction for /products page
          const dom = new JSDOM(htmlContent);
          const document = dom.window.document;
          // Find product blocks by looking for divs with a product image and a nested flex-col
          const productDivs = Array.from(document.querySelectorAll('div.flex.flex-row.gap-3, div.flex.flex-row.gap-3.sm\:gap-4')).filter(div => div.querySelector('img') && div.querySelector('div.flex.flex-col'));
          productDivs.forEach((div, index) => {
            try {
              // Logo
              const logoImg = div.querySelector('img');
              const logoUrl = logoImg?.getAttribute('src') || undefined;
              // Find the nested <a> inside the flex-col div (not the first <a> which is logo)
              const flexCol = div.querySelector('div.flex.flex-col');
              let title = '';
              let description = '';
              let productUrl = '';
              if (flexCol) {
                const productLink = flexCol.querySelector('a');
                if (productLink) {
                  // Title: first div inside productLink
                  const titleDiv = productLink.querySelector('div');
                  if (titleDiv) {
                    title = titleDiv.textContent?.replace(/^[0-9.\s]+/, '').trim() || '';
                  }
                  // Description: second div inside productLink
                  const descDiv = productLink.querySelectorAll('div')[1];
                  if (descDiv) {
                    description = descDiv.textContent?.trim() || '';
                  }
                  productUrl = productLink.getAttribute('href') || '';
                  if (productUrl && productUrl.startsWith('/')) {
                    productUrl = `https://www.producthunt.com${productUrl}`;
                  }
                }
              }
              // Upvotes (not available directly, fallback to 0)
              const votes = 0;
              if (title) {
                products.push({
                  id: `ph-products-${Date.now()}-${index}`,
                  name: title,
                  description: description || `${title} - Product from ProductHunt`,
                  features: [],
                  logoUrl,
                  links: {
                    productHunt: productUrl
                  },
                  source: "producthunt",
                  metadata: {
                    upvotes: votes,
                    scrapedAt: new Date().toISOString(),
                    timePeriod: "daily",
                    sourceIcon: logoUrl || "https://www.producthunt.com/favicon.ico",
                    sourceColor: "#da552f"
                  },
                  status: "pending"
                });
              }
            } catch (err) {
              // Skip extraction errors
            }
          });
        } catch (error) {
          console.error(`❌ Error scraping ProductHunt products page ${page} for topic ${topic}: ${error}`);
          throw error;
        }
      }
    }
    return products;
  }

  /**
   * Extract data from a single product section HTML (deprecated - kept for fallback)
   */
  private extractSingleProduct(sectionHtml: string, index: number): Product | null {
    try {
      // Extract logo URL
      const logoMatch = sectionHtml.match(/<img[^>]+src="([^"]+)"/);
      const logoUrl = logoMatch ? logoMatch[1] : undefined;

      // Extract title and product URL
      const titleMatch = sectionHtml.match(/data-test="post-name[^"]*"[^>]*>([^<]+)</);
      const title = titleMatch ? titleMatch[1].trim() : null;

      const urlMatch = sectionHtml.match(/href="([^"]+)"/);
      let productUrl = urlMatch ? urlMatch[1] : null;
      if (productUrl && productUrl.startsWith('/')) {
        productUrl = `https://www.producthunt.com${productUrl}`;
      }

      // Extract description
      const descMatch = sectionHtml.match(/class="[^"]*text-secondary[^"]*"[^>]*>([^<]+)</);
      const description = descMatch ? descMatch[1].trim() : null;

      // Extract votes
      const voteMatch = sectionHtml.match(/data-test="vote-button"[^>]*>.*?<p[^>]*>(\d+)</);
      const votes = voteMatch ? parseInt(voteMatch[1], 10) : 0;

      if (!title) {
        console.warn(`⚠️ No title found for product ${index}`);
        return null;
      }

      const product: Product = {
        id: `ph-${Date.now()}-${index}`,
        name: title,
        description: description || `${title} - Product from ProductHunt`,
        features: [],
        logoUrl,
        links: {
          productHunt: productUrl || `https://www.producthunt.com/posts/${title.toLowerCase().replace(/\s+/g, '-')}`
        },
        source: "producthunt" as const,
        metadata: {
          upvotes: votes,
          upvotesToday: votes,
          scrapedAt: new Date().toISOString(),
          timePeriod: "daily" as const,
          sourceIcon: logoUrl || "https://www.producthunt.com/favicon.ico",
          sourceColor: "#da552f"
        },
        status: "pending" as const
      };

      return product;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback extraction method using simpler patterns
   */
  private extractProductsFallback(htmlContent: string, period: string = 'daily', isFeatured: boolean = false): Product[] {
    const products: Product[] = [];
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      const sections = Array.from(document.querySelectorAll('section[data-test^="post-item-"]'));
      sections.forEach((section, idx) => {
        try {
          // Index
          const index = idx + 1;
          // Logo - try img first, then video poster
          const logoImg = section.querySelector('img');
          let logoUrl = logoImg?.getAttribute('src') || undefined;
          if (!logoUrl) {
            const videoEl = section.querySelector('video');
            logoUrl = videoEl?.getAttribute('poster') || undefined;
          }

          // Title and product link
          const titleDiv = section.querySelector('[data-test^="post-name-"]');
          const titleLink = titleDiv?.querySelector('a');
          const title = titleLink?.textContent?.trim() || '';
          let productUrl = titleLink?.getAttribute('href') || '';
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = `https://www.producthunt.com${productUrl}`;
          }

          // Description - look for text-secondary span sibling
          let description: string | undefined = undefined;
          if (titleDiv) {
            let nextSibling = titleDiv.nextElementSibling;
            if (nextSibling) {
              const classList = nextSibling.getAttribute('class') || '';
              const isSecondary = classList.includes('text-secondary');
              const isLegacyText = nextSibling.getAttribute('data-sentry-component') === 'LegacyText';
              if (isSecondary || isLegacyText) {
                description = nextSibling.textContent?.trim() || undefined;
              }
            }
          }
          if (!description) {
            description = `${title} - Product from ProductHunt`;
          }

          // Extract tags/topics from links containing /topics/
          const tags: string[] = [];
          const topicLinks = Array.from(section.querySelectorAll('a[href*="/topics/"]'));
          topicLinks.forEach(a => {
            const tagText = a.textContent?.trim();
            if (tagText && !tags.includes(tagText)) {
              tags.push(tagText);
            }
          });

          // Upvotes
          let upvotes = 0;
          const voteButtons = section.querySelectorAll('button[data-test="vote-button"] p');
          if (voteButtons.length > 0) {
            const upvoteText = voteButtons[0].textContent?.replace(/,/g, '').trim();
            upvotes = upvoteText ? parseInt(upvoteText, 10) : 0;
          }

          if (title) {
            products.push({
              id: `ph-leaderboard-${Date.now()}-${index}`,
              name: title,
              description,
              features: [],
              tags: tags.length > 0 ? tags : undefined,
              logoUrl,
              links: {
                productHunt: productUrl
              },
              source: "producthunt",
              metadata: {
                upvotes,
                trending: isFeatured,
                scrapedAt: new Date().toISOString(),
                timePeriod: period as "daily" | "weekly" | "monthly",
                sourceIcon: logoUrl || "https://www.producthunt.com/favicon.ico",
                sourceColor: "#da552f"
              },
              status: "pending"
            });
          }
        } catch (err) {
          // Skip extraction errors
        }
      });
    } catch (error) {
      // Fallback extraction failed silently
    }
    return products;
  }

  /**
   * Deep scrape a single ProductHunt product page to get website, GitHub repo, socials, and full description.
   * Uses onlyMainContent: false to capture the Company Info and Social sidebar sections.
   */
  async enhanceProductData(product: Product): Promise<Product> {
    const phUrl = product.links.productHunt;
    if (!phUrl) return product;

    // Derive the /products/ URL from the post URL if needed
    let productPageUrl = phUrl;
    if (phUrl.includes('/posts/')) {
      productPageUrl = phUrl.replace('/posts/', '/products/');
    }
    
    try {
      console.log(`Deep scraping: ${productPageUrl}`);
      
      // Scrape with onlyMainContent: false to get Company Info & Social sections
      const scrapeResult = await this.firecrawl.scrape(productPageUrl, {
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 3000,
      });
      const htmlContent = this.extractHtmlFromResponse(scrapeResult);
      const markdown = (scrapeResult as any)?.markdown || '';

      // --- 1. Extract website from HTML & description from markdown ---
      if (htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Extract website from the "Visit website" button (data-test attribute)
        const visitButton = document.querySelector('a[data-test="visit-website-button"]');
        if (visitButton) {
          const href = visitButton.getAttribute('href');
          if (href) {
            product.links.website = href.replace(/\?ref=producthunt$/, '');
          }
        }
      }

      // Extract description from markdown — it appears as a plain text line
      // after the category links and before the navigation tabs (Overview, Reviews, etc.)
      // Pattern: categories text, then the description, then "- [Overview]..."
      if (markdown) {
        // Look for text between the "Visit website" link area and the nav tabs
        const descMatch = markdown.match(/\[Visit website\][^\n]*\n[\s\S]*?\n((?:[A-Z])[^\n]{40,500})\n/);
        if (descMatch && descMatch[1]) {
          const desc = descMatch[1].trim();
          if (desc.length > (product.description?.length || 0) && !desc.includes('©') && !desc.startsWith('-') && !desc.startsWith('[')) {
            product.description = desc;
          }
        }
      }

      // --- 2. Parse markdown for Company Info (GitHub) and Social sections ---
      // These sections are only available with onlyMainContent: false
      if (markdown) {
        // Extract GitHub from Company Info section
        // Markdown pattern: "Company Info\n[site.com](url) [GitHub](https://github.com/...)"
        const companyInfoMatch = markdown.match(/Company Info[\s\S]*?(?=\w+ Info|Forum|Social|## )/i);
        if (companyInfoMatch) {
          const companySection = companyInfoMatch[0];
          
          // Find GitHub link
          const githubMatch = companySection.match(/\[GitHub\]\((https?:\/\/github\.com\/[^\s)]+)\)/i);
          if (githubMatch) {
            product.links.repository = githubMatch[1].replace(/\?ref=producthunt$/, '');
            console.log(`  Found GitHub: ${product.links.repository}`);
          }

          // Extract website from Company Info if not yet found
          if (!product.links.website) {
            const websiteMatch = companySection.match(/\[([^\]]+)\]\((https?:\/\/(?!github\.com)[^\s)]+)\)/i);
            if (websiteMatch) {
              product.links.website = websiteMatch[2].replace(/\?ref=producthunt$/, '');
            }
          }
        }

        // Extract social links from the "Social" section in the sidebar
        // The section is a line like: "Social [X](https://x.com/handle) [LinkedIn](https://linkedin.com/...)"
        // Must match "Social " followed by markdown links, NOT "Social & Community" or "Social Networking"
        const socialMatch = markdown.match(/(?:^|\n)Social\s+(\[[^\]]+\]\(https?:\/\/[^\s)]+\)[\s\S]*?)(?:\n\n|\n##)/i);
        if (socialMatch) {
          const socialSection = socialMatch[0];
          const socials: string[] = [];
          
          const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
          let match;
          while ((match = linkRegex.exec(socialSection)) !== null) {
            const label = match[1];
            const url = match[2].replace(/\?ref=producthunt$/, '');
            
            const socialDomains = ['x.com', 'twitter.com', 'linkedin.com', 'discord.gg', 'discord.com', 'facebook.com', 'instagram.com', 'youtube.com', 'tiktok.com', 'mastodon.', 'bsky.app', 'threads.net'];
            const isSocialUrl = socialDomains.some(d => url.includes(d));
            const isSocialLabel = ['x', 'twitter', 'linkedin', 'discord', 'facebook', 'instagram', 'youtube', 'tiktok', 'mastodon', 'bluesky', 'threads'].some(s => label.toLowerCase() === s || label.toLowerCase().includes(s));
            
            if ((isSocialUrl || isSocialLabel) && !url.includes('producthunt.com') && !socials.includes(url)) {
              socials.push(url);
              console.log(`  Found social: ${label} -> ${url}`);
            }
          }
          
          if (socials.length > 0) {
            product.links.social = socials;
          }
        }

        // Fallback: website from markdown "Visit website" link
        if (!product.links.website) {
          const visitMatch = markdown.match(/\[Visit website\]\((https?:\/\/[^\s)]+)\)/i);
          if (visitMatch) {
            product.links.website = visitMatch[1].replace(/\?ref=producthunt$/, '');
          }
        }
      }

      return product;
    } catch (error) {
      console.error(`Error deep scraping ${productPageUrl}:`, error);
      return product; // fallback to original
    }
  }
}

/**
 * Main function to scrape ProductHunt
 */
export async function scrapeProductHunt(options: ProductHuntScrapingOptions): Promise<Product[]> {
  try {
    const scraper = new ProductHuntScraper(options.apiKey);
    let products: Product[] = [];
    
    if ((options as any).scrapeMode === 'products') {
      products = await scraper.scrapeProductsPage({
        topics: (options as any).topics || [],
        pageCount: (options as any).pageCount || 1
      });
    } else {
      // Default to leaderboard
      products = await scraper.scrapeLeaderboard(options);
    }
    
    // Apply Deep Scrape if enabled
    if ((options as any).deepScrape && products.length > 0) {
       console.log(`Starting deep scrape for ${products.length} ProductHunt items...`);
       const batchSize = 3; // Keep small to avoid limit exhaustion
       for (let i = 0; i < products.length; i += batchSize) {
         const batch = products.slice(i, i + batchSize);
         await Promise.all(batch.map(async (product) => {
           await scraper.enhanceProductData(product);
         }));
         if (i + batchSize < products.length) {
            await new Promise(resolve => setTimeout(resolve, 500)); // small delay to respect limits
         }
       }
    }
    
    return products;
  } catch (error) {
    console.error(`ProductHunt scraping failed:`, error);
    throw error;
  }
}
