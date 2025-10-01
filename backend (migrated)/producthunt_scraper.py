from firecrawl import Firecrawl
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductHuntScraper:
    def __init__(self, api_key: str):
        self.firecrawl = Firecrawl(api_key=api_key)
    
    def scrape_leaderboard(
        self, 
        period: str = "daily", 
        year: int = None, 
        month: int = None, 
        day: int = None, 
        week: int = None,
        featured: bool = False
    ) -> List[Dict]:
        """
        Scrape ProductHunt leaderboard for daily, weekly, or monthly periods
        
        Args:
            period: "daily", "weekly", or "monthly"
            year: Year (required)
            month: Month (required for daily and monthly)
            day: Day (required for daily)
            week: Week number (required for weekly)
            featured: If True, scrape featured products (remove /all from URL)
        """
        # Build URL based on parameters
        url = self._build_leaderboard_url(period, year, month, day, week, featured)
        logger.info(f"Scraping ProductHunt URL: {url}")
        
        try:
            # Scrape with Firecrawl
            logger.info(f"Calling Firecrawl API for URL: {url}")
            scrape_result = self.firecrawl.scrape(url, formats=['html'])
            
            # Extract HTML content - Firecrawl returns dict with 'html' key
            html_content = scrape_result.html if hasattr(scrape_result, 'html') else scrape_result.get('html')
            
            if not html_content:
                raise Exception("No HTML content found in Firecrawl response")
                
            logger.info(f"Received HTML content, length: {len(html_content)}")
            
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Extract products
            products = self._extract_products_from_html(soup)
            
            logger.info(f"Found {len(products)} products")
            return products
            
        except Exception as e:
            logger.error(f"Error scraping ProductHunt: {str(e)}")
            raise e
    
    def _build_leaderboard_url(
        self, 
        period: str, 
        year: int, 
        month: int = None, 
        day: int = None, 
        week: int = None,
        featured: bool = False
    ) -> str:
        """Build ProductHunt leaderboard URL based on parameters"""
        base_url = "https://www.producthunt.com/leaderboard"
        
        if period == "daily":
            if not all([year, month, day]):
                raise ValueError("Year, month, and day are required for daily leaderboard")
            url_path = f"daily/{year}/{month}/{day}"
        elif period == "weekly":
            if not all([year, week]):
                raise ValueError("Year and week are required for weekly leaderboard")
            url_path = f"weekly/{year}/{week}"
        elif period == "monthly":
            if not all([year, month]):
                raise ValueError("Year and month are required for monthly leaderboard")
            url_path = f"monthly/{year}/{month}"
        else:
            raise ValueError("Period must be 'daily', 'weekly', or 'monthly'")
        
        # Add /all suffix unless featured is True
        suffix = "" if featured else "/all"
        
        return f"{base_url}/{url_path}{suffix}"
    
    def _extract_products_from_html(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract products from ProductHunt HTML using CSS selectors"""
        product_sections = soup.select("section[data-test^='post-item']")
        logger.info(f"Found {len(product_sections)} product sections")
        
        products = []
        for idx, section in enumerate(product_sections, 1):
            try:
                product = self._extract_single_product(section, idx)
                if product:
                    products.append(product)
            except Exception as e:
                logger.warning(f"Error extracting product {idx}: {str(e)}")
        
        return products
    
    def _extract_single_product(self, section: BeautifulSoup, index: int) -> Optional[Dict]:
        """Extract data from a single product section"""
        try:
            # Logo
            logo_img = section.select_one("img")
            logo_url = logo_img["src"] if logo_img and logo_img.has_attr("src") else None
            
            # Title and URL
            title_div = section.select_one("div[data-test^='post-name-']")
            if not title_div:
                return None
            
            title_link = title_div.select_one("a")
            if not title_link:
                return None
                
            title = title_link.get_text(strip=True)
            product_url = title_link["href"] if title_link.has_attr("href") else None
            
            # Make URL absolute
            if product_url and product_url.startswith("/"):
                product_url = f"https://www.producthunt.com{product_url}"
            
            # Description - find next sibling div
            description = None
            next_div = title_div.find_next_sibling("div")
            if next_div and ("text-secondary" in next_div.get("class", []) or next_div.get("data-sentry-component") == "LegacyText"):
                description = next_div.get_text(strip=True)
            
            # Votes
            votes = 0
            vote_button = section.select_one("button[data-test='vote-button'] p")
            if vote_button:
                try:
                    votes = int(vote_button.get_text(strip=True))
                except (ValueError, TypeError):
                    pass
            
            # Tags
            tags = [tag.get_text(strip=True) for tag in section.select("div[data-sentry-component='TagList'] a")]
            
            return {
                "index": index,
                "logo": logo_url,
                "title": title,
                "description": description or f"{title} - Product from ProductHunt",
                "product_url": product_url or f"https://www.producthunt.com/posts/{title.lower().replace(' ', '-')}",
                "votes": votes,
                "tags": tags,
                "scraped_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error extracting product {index}: {str(e)}")
            return None

def scrape_producthunt(
    api_key: str,
    period: str = "daily",
    year: int = None,
    month: int = None,
    day: int = None,
    week: int = None,
    featured: bool = False
) -> List[Dict]:
    """
    Main function to scrape ProductHunt
    
    Args:
        api_key: Firecrawl API key
        period: "daily", "weekly", or "monthly"
        year: Year (required)
        month: Month (required for daily and monthly)
        day: Day (required for daily)
        week: Week number (required for weekly)
        featured: If True, scrape featured products
    
    Returns:
        List of product dictionaries
    """
    try:
        scraper = ProductHuntScraper(api_key)
        products = scraper.scrape_leaderboard(
            period=period,
            year=year,
            month=month,
            day=day,
            week=week,
            featured=featured
        )
        
        logger.info(f"Successfully scraped {len(products)} products from ProductHunt")
        return products
        
    except Exception as e:
        logger.error(f"ProductHunt scraping failed: {str(e)}")
        raise e

if __name__ == "__main__":
    # Test scraping
    import os
    from datetime import datetime
    
    # Example usage
    api_key = "your-api-key-here"  # Replace with your key
    
    # Test daily scraping
    today = datetime.now()
    products = scrape_producthunt(
        api_key=api_key,
        period="daily",
        year=today.year,
        month=today.month,
        day=today.day
    )
    
    print(f"Found {len(products)} products:")
    for product in products[:3]:  # Show first 3
        print(f"- {product['title']}: {product['votes']} votes")
