![secret-scrapper](public/og-image.png)

# Secret Scrapper

A powerful web scraping application that aggregates trending products from GitHub and ProductHunt.

## Features

- **GitHub Scraping**: Scrape trending repositories with GitHub trending pages
- **ProductHunt Scraping**: Scrape ProductHunt leaderboards (daily, weekly, monthly) using Firecrawl
- **AI Enhancement**: Enhance product descriptions and categorization using various AI providers
- **Product Management**: Approve, reject, and edit scraped products
- **Export**: Export data to various formats (JSON, CSV, etc.)
- **CMS Integration**: Publish to various CMS platforms (REMOVED FOR NOW)

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **GitHub Scraping**: TypeScript-based scraper integrated into the Next.js API
- **ProductHunt Scraping**: Python backend using Firecrawl and FastAPI
- **AI Enhancement**: Multiple AI provider support (OpenAI, Anthropic, etc.)

## Setup

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Python 3.8+ (for ProductHunt scraping)
- Firecrawl API key (for ProductHunt scraping)

### Frontend Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### ProductHunt Backend Setup (DEPRECATED)

For ProductHunt scraping, you need to start the Python backend:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   python main.py
   ```
   
   Or use the startup scripts:
   - Windows: `start.bat`
   - Linux/Mac: `./start.sh`

4. The backend will be available at [http://localhost:8000](http://localhost:8000)

### API Keys

- **Firecrawl API Key**: Required for ProductHunt scraping. Get it from [firecrawl.dev](https://www.firecrawl.dev)
- **AI Provider API Keys**: Required for AI enhancement features

## Usage

### Scraping Products

1. Click "Scrape Products" button
2. Choose your source (GitHub or ProductHunt)
3. For ProductHunt:
   - Enter your Firecrawl API key
   - Select time period (daily/weekly/monthly)
   - Enter the date/week/month you want to scrape
   - Optionally enable "Featured only" mode
4. Configure filters and click "Start Scraping"

### Managing Products

- **View**: Browse scraped products in the main interface
- **Edit**: Click edit button to modify product details
- **Enhance**: Use AI to improve descriptions and categorization
- **Approve/Reject**: Set product status for workflow management
- **Export**: Export selected products to various formats

## ProductHunt URLs

The application generates ProductHunt URLs in these formats:

- **Daily**: `https://www.producthunt.com/leaderboard/daily/YYYY/M/D/all`
- **Weekly**: `https://www.producthunt.com/leaderboard/weekly/YYYY/W/all`
- **Monthly**: `https://www.producthunt.com/leaderboard/monthly/YYYY/M/all`
- **Featured** (remove `/all`): Shows only featured products

Examples:
- Daily: `https://www.producthunt.com/leaderboard/daily/2025/9/21/all`
- Weekly: `https://www.producthunt.com/leaderboard/weekly/2025/38/all`
- Monthly: `https://www.producthunt.com/leaderboard/monthly/2025/9/all`

## API Endpoints

### Frontend (Next.js)
- `POST /api/scrape` - GitHub scraping (ProductHunt now redirects to Python backend)
- `POST /api/ai/enhance` - AI enhancement
- `POST /api/export` - Export products
- `POST /api/cms/publish` - CMS publishing // REMOVED FOR NOW

### Python Backend (DEPRECATED)
- `GET http://localhost:8000/` - API information
- `GET http://localhost:8000/health` - Health check
- `POST http://localhost:8000/scrape` - ProductHunt scraping
- `GET http://localhost:8000/docs` - Interactive API documentation


&nbsp;

## Meet the Author

<img  src="https://raw.githubusercontent.com/RS-labhub/secret-scraper/master/public/Author.jpg" alt="Author">

<div align="center">

**Built for Finding Radhika by [RS-labhub](https://github.com/RS-labhub)**
