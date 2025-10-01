from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
from datetime import datetime
import logging

from producthunt_scraper import scrape_producthunt

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ProductHunt Scraper API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    api_key: str
    period: str = "daily"  # "daily", "weekly", "monthly"
    year: int
    month: Optional[int] = None
    day: Optional[int] = None
    week: Optional[int] = None
    featured: bool = False

class ScrapeResponse(BaseModel):
    success: bool
    products: List[Dict]
    total_found: int
    timestamp: str
    message: Optional[str] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "ProductHunt Scraper API", 
        "version": "1.0.0",
        "endpoints": {
            "scrape": "POST /scrape - Scrape ProductHunt leaderboard",
            "health": "GET /health - Health check"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_leaderboard(request: ScrapeRequest):
    """
    Scrape ProductHunt leaderboard
    
    Args:
        request: ScrapeRequest containing scraping parameters
    
    Returns:
        ScrapeResponse with scraped products
    """
    try:
        logger.info(f"🚀 Received scrape request: {request.period} for {request.year}")
        
        # Validate request parameters
        if request.period == "daily" and not all([request.year, request.month, request.day]):
            raise HTTPException(
                status_code=400, 
                detail="Year, month, and day are required for daily scraping"
            )
        elif request.period == "weekly" and not all([request.year, request.week]):
            raise HTTPException(
                status_code=400, 
                detail="Year and week are required for weekly scraping"
            )
        elif request.period == "monthly" and not all([request.year, request.month]):
            raise HTTPException(
                status_code=400, 
                detail="Year and month are required for monthly scraping"
            )
        
        # Validate year range (ProductHunt data availability)
        if request.year < 2013 or request.year > datetime.now().year:
            raise HTTPException(
                status_code=400,
                detail="Year must be between 2013 and current year"
            )
        
        # Validate API key
        if not request.api_key or not request.api_key.startswith("fc-"):
            raise HTTPException(
                status_code=400,
                detail="Valid Firecrawl API key is required (starts with 'fc-')"
            )
        
        # Scrape ProductHunt
        products = scrape_producthunt(
            api_key=request.api_key,
            period=request.period,
            year=request.year,
            month=request.month,
            day=request.day,
            week=request.week,
            featured=request.featured
        )
        
        # Format response
        response = ScrapeResponse(
            success=True,
            products=products,
            total_found=len(products),
            timestamp=datetime.now().isoformat(),
            message=f"Successfully scraped {len(products)} products from ProductHunt {request.period} leaderboard"
        )
        
        logger.info(f"Scraping completed: {len(products)} products found")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Scraping failed: {str(e)}")
        return ScrapeResponse(
            success=False,
            products=[],
            total_found=0,
            timestamp=datetime.now().isoformat(),
            error=str(e)
        )

if __name__ == "__main__":
    logger.info("Starting ProductHunt Scraper API server...")
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
