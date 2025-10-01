# GitHub Scraping Documentation

## Overview

The Secret Scrapper application includes a sophisticated GitHub trending repository scraper that extracts information about trending repositories from GitHub's trending page. This document explains how the scraping works, what tools are used, and the implementation details.

## 🛠️ Technologies and Tools Used

### Core Technologies
- **Native Fetch API**: Primary scraping method using browser's native `fetch()` function
- **Regular Expressions**: Complex regex patterns for HTML parsing and data extraction
- **GitHub REST API**: Used for data enhancement and additional repository details
- **TypeScript**: Type-safe implementation with proper interfaces

### Scraping Approach
- **Direct HTTP Requests**: No external scraping libraries like Puppeteer or Playwright
- **HTML Parsing**: Custom regex-based parsing of GitHub's trending page HTML
- **API Enhancement**: Supplements scraped data with GitHub's official API
- **Parallel Processing**: Concurrent requests for improved performance

## 🏗️ Architecture

### Main Components

1. **GitHubScraper Class** (`lib/scrapers/github-scraper.ts`)
   - Main scraping orchestrator
   - Handles multiple time periods (daily, weekly, monthly)
   - Manages parallel processing and data deduplication

2. **API Integration** (`app/api/scrape/route.ts`)
   - REST endpoint for scraping requests
   - Request validation and response handling
   - Integration with AI enhancement services

3. **Type Definitions** (`types/product.ts`)
   - TypeScript interfaces for data structures
   - Ensures type safety across the application

## 🔍 How GitHub Scraping Works

### 1. URL Construction

The scraper builds GitHub trending URLs based on filters:

```typescript
// Base trending URL
https://github.com/trending?since=daily

// Language-specific URLs (when tech stack is specified)
https://github.com/trending/javascript?since=daily
https://github.com/trending/python?since=weekly
```

**Time Periods Supported:**
- `daily` - Repositories trending today
- `weekly` - Repositories trending this week  
- `monthly` - Repositories trending this month

### 2. Web Scraping Process

#### HTTP Request Configuration
```typescript
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
    'Connection': 'keep-alive',
  },
  signal: AbortSignal.timeout(15000) // 15 second timeout
})
```

#### HTML Parsing Strategy

The scraper uses multiple regex patterns to handle GitHub's changing HTML structure:

**Pattern 1: Article-based structure**
```typescript
/<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g
```

**Pattern 2: Alternative article structure**
```typescript
/<article[^>]*>([\s\S]*?)<\/article>/g
```

**Pattern 3: Div-based structure**
```typescript
/<div[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/div>/g
```

### 3. Data Extraction

For each repository article, the scraper extracts:

#### Repository Information
- **Name and Owner**: Extracted from repository links
- **URL**: Constructed as `https://github.com/{owner}/{repo}`
- **Full Name**: Format `{owner}/{repo}`

#### Repository Metrics
- **Stars**: Total star count with multiple parsing patterns
- **Period Stars**: Stars gained in the specific time period
- **Language**: Primary programming language
- **Topics**: Repository tags and topics

#### Validation
- Path validation to ensure legitimate repository URLs
- Exclusion of non-repository paths (apps, sponsors, orgs, etc.)
- Sanitization of extracted data

### 4. Data Enhancement with GitHub API

After initial scraping, the scraper enhances data using GitHub's REST API:

```typescript
const apiUrl = `https://api.github.com/repos/${repo.fullName}`
const response = await fetch(apiUrl, {
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Secret-Scrapper-App'
  },
  signal: AbortSignal.timeout(8000)
})
```

**Enhanced Data Includes:**
- More accurate star counts
- Detailed descriptions
- Homepage/website URLs
- Complete topic lists
- Repository metadata

### 5. Domain Classification

The scraper automatically classifies repositories into domains:

- **AIE (AI & Machine Learning)**: AI, ML, neural networks, LLMs
- **Code (Development)**: Frameworks, libraries, programming tools
- **DevOps**: Deployment, infrastructure, containers
- **DevSecOps**: Security, authentication, encryption
- **Product**: Analytics, dashboards, metrics
- **Quality Assurance**: Testing frameworks, QA tools
- **Orchestration**: Workflows, pipelines, scheduling

## 📊 Data Processing Features

### Parallel Processing
- **Batch Processing**: Repositories processed in batches of 5
- **Rate Limiting**: 200ms delays between batches
- **Error Handling**: Individual failures don't stop the entire process

### Deduplication
- Merges duplicate repositories from different language pages
- Combines data from multiple sources
- Preserves the best available information

### Filtering Support
- **Domain Filtering**: Filter by specific domains
- **Technology Stack**: Filter by programming language
- **Time Period**: Daily, weekly, or monthly trending
- **Limit Control**: Configurable maximum results

## 🔧 Configuration and Usage

### API Endpoint
```http
POST /api/scrape
Content-Type: application/json

{
  "source": "github",
  "filters": {
    "timePeriod": "daily",
    "domain": ["AIE", "Code"],
    "techStack": ["javascript", "python"],
    "maxLimit": 20
  }
}
```

### Response Format
```typescript
interface ScrapeResult {
  success: boolean
  products: Product[]
  count: number
  message: string
  timePeriod: string
  processingTime: number
}
```

### Product Data Structure
```typescript
interface Product {
  id: string
  name: string
  description: string
  tags: string[]
  categories: string[]
  domains: Domain[]
  pricing: PricingInfo
  features: string[]
  links: {
    repository: string
    website?: string
    documentation?: string
  }
  source: "github"
  status: "pending"
  metadata: {
    stars: number
    starsToday: number
    starsWeekly: number
    starsMonthly: number
    language?: string
    trending: true
    scrapedAt: string
    timePeriod: string
  }
}
```

## 🛡️ Error Handling and Resilience

### Fallback Mechanisms
1. **Enhanced Fallback Parsing**: Alternative parsing when main patterns fail
2. **API Failure Handling**: Graceful degradation when GitHub API is unavailable
3. **Timeout Management**: Prevents hanging requests
4. **Individual Error Isolation**: One failed repository doesn't stop others

### Robustness Features
- **Multiple Parsing Patterns**: Adapts to GitHub's changing HTML structure
- **Validation Layers**: Multiple checks to ensure data quality
- **Retry Logic**: Built-in retry mechanisms for transient failures
- **Rate Limiting**: Respectful API usage patterns

## 🚀 Performance Characteristics

### Speed Optimizations
- **Parallel URL Processing**: Multiple trending pages scraped simultaneously
- **Batch API Calls**: Efficient GitHub API usage
- **Concurrent Enhancement**: Repository details fetched in parallel
- **Smart Limiting**: Prevents over-processing

### Resource Management
- **Memory Efficient**: Streaming processing of large HTML content
- **Connection Pooling**: Reuses HTTP connections
- **Timeout Controls**: Prevents resource leaks
- **Garbage Collection**: Proper cleanup of temporary data

## 🔍 Monitoring and Debugging

### Logging Features
- **Detailed Console Logs**: Step-by-step process tracking
- **Error Reporting**: Comprehensive error information
- **Performance Metrics**: Processing time measurements
- **Success/Failure Counts**: Statistical tracking

### Debug Information
- Repository validation details
- Parsing pattern success/failure
- API enhancement results
- Filtering decisions

## 🎯 Key Advantages

1. **No External Dependencies**: Uses native web APIs for scraping
2. **GitHub API Integration**: Combines web scraping with official API data
3. **Adaptive Parsing**: Handles GitHub's changing HTML structure
4. **Smart Classification**: Automatic domain categorization
5. **Comprehensive Filtering**: Multiple filter options for targeted results
6. **Performance Optimized**: Parallel processing and efficient data handling
7. **Error Resilient**: Multiple fallback mechanisms

## 📈 Future Enhancements

Potential improvements for the GitHub scraping system:

1. **Caching Layer**: Redis-based caching for repeated requests
2. **Rate Limiting**: More sophisticated rate limiting algorithms
3. **Monitoring**: Real-time scraping health monitoring
4. **Analytics**: Detailed scraping performance analytics
5. **Machine Learning**: AI-powered content classification
6. **Multi-Region**: Distributed scraping from multiple locations

---

This documentation provides a comprehensive overview of how GitHub trending repository scraping works in the Secret Scrapper application, covering both the technical implementation and practical usage aspects.
