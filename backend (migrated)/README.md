# ProductHunt Scraper Backend

This backend service provides ProductHunt scraping functionality using Firecrawl.

## Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

**Note**: If you encounter issues with firecrawl-py, try upgrading:
```bash
pip install --upgrade firecrawl-py
```

2. Start the server:
```bash
python main.py
```

Or use the startup scripts:
- Windows: `start.bat`
- Linux/Mac: `./start.sh`

## API Usage

The server runs on `http://localhost:8000`

### Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /scrape` - Scrape ProductHunt leaderboard
- `GET /docs` - Interactive API documentation

### Example Request

```bash
curl -X POST "http://localhost:8000/scrape" \
     -H "Content-Type: application/json" \
     -d '{
       "api_key": "fc-your-firecrawl-api-key",
       "period": "daily",
       "year": 2025,
       "month": 9,
       "day": 21
     }'
```

### Parameters

- `api_key`: Firecrawl API key (required)
- `period`: "daily", "weekly", or "monthly" (default: "daily")
- `year`: Year (required, 2013-current)
- `month`: Month (required for daily/monthly)
- `day`: Day (required for daily)
- `week`: Week number (required for weekly)
- `featured`: Boolean, scrape featured products only (default: false)

## URL Examples

- Daily: `https://www.producthunt.com/leaderboard/daily/2025/9/21/all`
- Weekly: `https://www.producthunt.com/leaderboard/weekly/2025/38/all`
- Monthly: `https://www.producthunt.com/leaderboard/monthly/2025/9/all`
- Featured (remove `/all`): `https://www.producthunt.com/leaderboard/daily/2025/9/21`

## Troubleshooting

### Common Issues

**1. 'Firecrawl' object has no attribute 'scrape_url'**
- This means you have an older version of firecrawl-py
- Solution: `pip install --upgrade firecrawl-py>=1.4.4`

**2. ModuleNotFoundError: No module named 'firecrawl'**
- Solution: `pip install firecrawl-py`

**3. API Key Issues**
- Ensure your Firecrawl API key starts with `fc-`
- Get a valid key from [firecrawl.dev](https://www.firecrawl.dev)

**4. Server Won't Start**
- Check if port 8000 is already in use
- Try: `python -m uvicorn main:app --host 0.0.0.0 --port 8001`

**5. No Products Found**
- Verify the date exists (e.g., Feb 30th doesn't exist)
- Try different dates or periods
- Some older dates may have no ProductHunt data
