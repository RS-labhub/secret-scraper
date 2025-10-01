"""
Test script for ProductHunt scraper
Usage: python test_scraper.py
"""

from producthunt_scraper import scrape_producthunt
from datetime import datetime, timedelta
import os

# Get API key from environment or set it directly
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "your-api-key-here")

def test_daily_scraping():
    """Test scraping daily leaderboard"""
    print("\n" + "="*60)
    print("TEST 1: Daily Leaderboard Scraping")
    print("="*60)
    
    # Use yesterday's date (current date - 1)
    test_date = datetime.now() - timedelta(days=1)
    
    try:
        products = scrape_producthunt(
            api_key=FIRECRAWL_API_KEY,
            period="daily",
            year=test_date.year,
            month=test_date.month,
            day=test_date.day,
            featured=False
        )
        
        print(f"\nSUCCESS: Found {len(products)} products")
        
        if products:
            print("\nFirst 3 Products:")
            for i, product in enumerate(products[:3], 1):
                print(f"\n{i}. {product['title']}")
                print(f"   URL: {product['product_url']}")
                print(f"   Description: {product['description'][:100]}...")
                print(f"   Votes: {product['votes']}")
                print(f"   Tags: {', '.join(product['tags'][:3])}")
        
        return True
    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        return False


def test_weekly_scraping():
    """Test scraping weekly leaderboard"""
    print("\n" + "="*60)
    print("TEST 2: Weekly Leaderboard Scraping")
    print("="*60)
    
    # Get current week
    current_date = datetime.now()
    week_number = current_date.isocalendar()[1]
    
    try:
        products = scrape_producthunt(
            api_key=FIRECRAWL_API_KEY,
            period="weekly",
            year=current_date.year,
            week=week_number - 1,  # Previous week
            featured=True
        )
        
        print(f"\nSUCCESS: Found {len(products)} products")
        
        if products:
            print(f"\nTop product: {products[0]['title']}")
            print(f"   Votes: {products[0]['votes']}")
        
        return True
    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        return False


def test_monthly_scraping():
    """Test scraping monthly leaderboard"""
    print("\n" + "="*60)
    print("TEST 3: Monthly Leaderboard Scraping")
    print("="*60)
    
    # Use last month
    current_date = datetime.now()
    last_month = current_date.month - 1 if current_date.month > 1 else 12
    year = current_date.year if current_date.month > 1 else current_date.year - 1
    
    try:
        products = scrape_producthunt(
            api_key=FIRECRAWL_API_KEY,
            period="monthly",
            year=year,
            month=last_month,
            featured=False
        )
        
        print(f"\nSUCCESS: Found {len(products)} products")
        
        if products:
            print(f"\nTop 3 products by votes:")
            sorted_products = sorted(products, key=lambda x: x['votes'], reverse=True)[:3]
            for i, product in enumerate(sorted_products, 1):
                print(f"{i}. {product['title']} - {product['votes']} votes")
        
        return True
    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        return False


def test_specific_date():
    """Test scraping a specific known date"""
    print("\n" + "="*60)
    print("TEST 4: Specific Date (2025-09-27)")
    print("="*60)
    
    try:
        products = scrape_producthunt(
            api_key=FIRECRAWL_API_KEY,
            period="daily",
            year=2025,
            month=9,
            day=27,
            featured=False
        )
        
        print(f"\nSUCCESS: Found {len(products)} products")
        
        if products:
            print("\nSample Products:")
            for product in products[:5]:
                print(f"   * {product['title']} ({product['votes']} votes)")
        
        return True
    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("   ProductHunt Scraper Test Suite")
    print("="*60)
    
    if not FIRECRAWL_API_KEY or FIRECRAWL_API_KEY == "your-api-key-here":
        print("\nERROR: Please set FIRECRAWL_API_KEY environment variable")
        print("   Or update the API key in this script")
        return
    
    results = {
        "Daily Scraping": test_daily_scraping(),
        "Weekly Scraping": test_weekly_scraping(),
        "Monthly Scraping": test_monthly_scraping(),
        "Specific Date": test_specific_date()
    }
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        print(f"{test_name}: {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\nAll tests passed! The scraper is working correctly.")
    else:
        print("\nSome tests failed. Check the logs above for details.")


if __name__ == "__main__":
    main()
