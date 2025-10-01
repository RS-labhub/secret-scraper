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
  tags: string[];
  scraped_at: string;
}

export class ProductHuntScraper {
  private firecrawl: Firecrawl;

  constructor(apiKey: string) {
    this.firecrawl = new Firecrawl({ apiKey });
  }

  /**
   * Scrape ProductHunt leaderboard for daily, weekly, or monthly periods
   */
  async scrapeLeaderboard(options: ProductHuntScrapingOptions): Promise<Product[]> {
    const url = this.buildLeaderboardUrl(options);
    try {
      const scrapeResult = await this.firecrawl.scrape(url, { formats: ['html'] });

      // Extract HTML content from Firecrawl response
      let htmlContent: string | null = null;
      if (scrapeResult?.html) {
  htmlContent = scrapeResult.html;
      } else if ((scrapeResult as any)?.content) {
  htmlContent = (scrapeResult as any).content;
      } else if ((scrapeResult as any)?.data) {
  htmlContent = (scrapeResult as any).data;
      } else if (typeof scrapeResult === 'string') {
  htmlContent = scrapeResult;
      } else if (typeof scrapeResult === 'object' && scrapeResult && 'html' in scrapeResult) {
  htmlContent = (scrapeResult as any).html;
      } else {
        throw new Error("No HTML content found in Firecrawl response");
      }

      if (!htmlContent) {
        throw new Error("HTML content is empty");
      }

      console.log(`✅ Received HTML content, length: ${htmlContent.length}`);

  // Parse HTML and extract products
  // Use products page extraction for /products scraping
  // For leaderboard, fallback to extractProductsFallback
  const products = this.extractProductsFallback(htmlContent, options.period);
  console.log(`🎉 Found ${products.length} products`);
  return products;
    } catch (error) {
      console.error(`❌ Error scraping ProductHunt: ${error}`);
      throw error;
    }
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
          let htmlContent: string | null = null;
          if (scrapeResult?.html) htmlContent = scrapeResult.html;
          else if ((scrapeResult as any)?.content) htmlContent = (scrapeResult as any).content;
          else if ((scrapeResult as any)?.data) htmlContent = (scrapeResult as any).data;
          else if (typeof scrapeResult === 'string') htmlContent = scrapeResult;
          else if (typeof scrapeResult === 'object' && scrapeResult && 'html' in scrapeResult) htmlContent = (scrapeResult as any).html;
          else throw new Error("No HTML content found in Firecrawl response");
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
              // Tags (not available directly, fallback to empty)
              const tags: string[] = [];
              // Upvotes (not available directly, fallback to 0)
              const votes = 0;
              if (title) {
                products.push({
                  id: `ph-products-${Date.now()}-${index}`,
                  name: title,
                  description: description || `${title} - Product from ProductHunt`,
                  tags,
                  domains: [],
                  categories: [],
                  features: [],
                  logoUrl,
                  links: {
                    website: productUrl,
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

      // Extract tags (simplified)
      const tagRegex = />([^<]{2,20})</g;
      const tags: string[] = [];
      let tagMatch;
      while ((tagMatch = tagRegex.exec(sectionHtml)) !== null) {
        const tag = tagMatch[1].trim();
        if (tag.length > 2 && tag.length < 20 && !tag.includes('http') && !tag.includes('data-')) {
          tags.push(tag);
        }
      }

      if (!title) {
        console.warn(`⚠️ No title found for product ${index}`);
        return null;
      }

      const product: Product = {
        id: `ph-${Date.now()}-${index}`,
        name: title,
        description: description || `${title} - Product from ProductHunt`,
        tags: tags.slice(0, 5), // Limit to 5 tags
        domains: [], // Will be determined by AI enhancement
        categories: [], // Will be determined by AI enhancement
        features: [], // Will be extracted during AI enhancement
        logoUrl,
        links: {
          website: productUrl || `https://www.producthunt.com/posts/${title.toLowerCase().replace(/\s+/g, '-')}`,
          productHunt: productUrl || `https://www.producthunt.com/posts/${title.toLowerCase().replace(/\s+/g, '-')}`
        },
        source: "producthunt" as const,
        metadata: {
          upvotes: votes,
          upvotesToday: votes, // Assuming the votes are for the current period
          scrapedAt: new Date().toISOString(),
          timePeriod: "daily" as const,
          sourceIcon: logoUrl || "https://www.producthunt.com/favicon.ico", // Use product logo if available, fallback to PH favicon
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
  private extractProductsFallback(htmlContent: string, period: string = 'daily'): Product[] {
    const products: Product[] = [];
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      const sections = Array.from(document.querySelectorAll('section[data-test^="post-item-"]'));
      sections.forEach((section, idx) => {
        try {
          // Index
          const index = idx + 1;
          // Logo
          const logoImg = section.querySelector('img');
          const logoUrl = logoImg?.getAttribute('src') || undefined;

          // Title and product link
          const titleDiv = section.querySelector('div[data-test^="post-name-"]');
          const titleLink = titleDiv?.querySelector('a');
          const title = titleLink?.textContent?.trim() || '';
          let productUrl = titleLink?.getAttribute('href') || '';
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = `https://www.producthunt.com${productUrl}`;
          }

          // Description
          let description: string | undefined = undefined;
          if (titleDiv) {
            let nextDiv = titleDiv.nextElementSibling;
            if (nextDiv) {
              const classList = nextDiv.getAttribute('class') || '';
              const isSecondary = classList.includes('text-secondary');
              const isLegacyText = nextDiv.getAttribute('data-sentry-component') === 'LegacyText';
              if (isSecondary || isLegacyText) {
                description = nextDiv.textContent?.trim() || undefined;
              }
            }
          }
          if (!description) {
            description = `${title} - Product from ProductHunt`;
          }

          // Upvotes
          let upvotes = 0;
          const voteButtons = section.querySelectorAll('button[data-test="vote-button"] p');
          if (voteButtons.length > 0) {
            const upvoteText = voteButtons[0].textContent?.replace(/,/g, '').trim();
            upvotes = upvoteText ? parseInt(upvoteText, 10) : 0;
          }

          // Tags
          const tagElements = section.querySelectorAll('div[data-sentry-component="TagList"] a');
          const tags = Array.from(tagElements).map(tag => tag.textContent?.trim() || '').filter(Boolean);

          if (title) {
            products.push({
              id: `ph-leaderboard-${Date.now()}-${index}`,
              name: title,
              description,
              tags,
              domains: [],
              categories: [],
              features: [],
              logoUrl,
              links: {
                website: productUrl,
                productHunt: productUrl
              },
              source: "producthunt",
              metadata: {
                upvotes,
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
}

/**
 * Main function to scrape ProductHunt
 */
export async function scrapeProductHunt(options: ProductHuntScrapingOptions): Promise<Product[]> {
  try {
    const scraper = new ProductHuntScraper(options.apiKey);
    if ((options as any).scrapeMode === 'products') {
      return await scraper.scrapeProductsPage({
        topics: (options as any).topics || [],
        pageCount: (options as any).pageCount || 1
      });
    }
    // Default to leaderboard
    return await scraper.scrapeLeaderboard(options);
  } catch (error) {
    console.error(`❌ ProductHunt scraping failed:`, error);
    throw error;
  }
}
