"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Search, Clock, TrendingUp, Key } from "lucide-react"
import { DOMAINS, CATEGORIES } from "@/types/product"
import type { Product, ScrapeRequest } from "@/types/product"
import { logAction } from "@/components/action-logger"
import { storage } from "@/lib/storage"

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

interface ScrapeDialogProps {
  onScrapeComplete: (products: Product[]) => void
}

export function ScrapeDialog({ onScrapeComplete }: ScrapeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<"github" | "producthunt">("github")
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [techStack, setTechStack] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [maxLimit, setMaxLimit] = useState(20)
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("")
  // ProductHunt specific date inputs
  const [phYear, setPhYear] = useState(new Date().getFullYear())
  const [phMonth, setPhMonth] = useState(new Date().getMonth() + 1)
  const [phDay, setPhDay] = useState(new Date().getDate())
  const [phWeek, setPhWeek] = useState(getWeekNumber(new Date()))
  const [phFeatured, setPhFeatured] = useState(false)
  // New: ProductHunt scraping mode, topics, page count
  const [phScrapeMode, setPhScrapeMode] = useState<'leaderboard' | 'products'>('leaderboard')
  const [phTopics, setPhTopics] = useState<string[]>([])
  const [phPageCount, setPhPageCount] = useState(1)

  // Load Firecrawl API key from storage on component mount
  useEffect(() => {
    const savedApiKey = storage.loadFirecrawlApiKey()
    if (savedApiKey) {
      setFirecrawlApiKey(savedApiKey)
    }
  }, [])

  // Save Firecrawl API key to storage when it changes
  useEffect(() => {
    if (firecrawlApiKey) {
      storage.saveFirecrawlApiKey(firecrawlApiKey)
    }
  }, [firecrawlApiKey])

  const handleScrape = async () => {
    setIsLoading(true)
    logAction("info", `Starting ${source} scraping for ${timePeriod} period`)
    try {
      // Both GitHub and ProductHunt now use the same scraping endpoint
      const scrapeRequest: ScrapeRequest = {
        source,
        filters: {
          domain: selectedDomains as any,
          category: selectedCategories as any,
          timePeriod,
          query: query || undefined,
          techStack: techStack.length > 0 ? techStack : undefined,
          maxLimit,
          firecrawlApiKey: firecrawlApiKey || undefined,
          // ProductHunt specific parameters
          ...(source === "producthunt" && {
            phYear,
            phMonth,
            phDay,
            phWeek,
            phFeatured,
            scrapeMode: phScrapeMode,
            topics: phTopics,
            pageCount: phPageCount,
          }),
        },
      }
      if (source === "producthunt") {
        logAction("info", `ProductHunt scraping: mode=${phScrapeMode}, topics=[${phTopics.join(', ')}], pages=${phPageCount}`)
      }
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scrapeRequest),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Scraping failed")
      }
      const result = await response.json()
      console.log("🔍 Scrape result received:", result)
      console.log("🔍 Products in result:", result.products?.length || 0)
      if (result.products?.length > 0) {
        console.log("🔍 First product sample:", result.products[0])
      }
      logAction("success", `Found ${result.products.length} products from ${source}`)
      onScrapeComplete(result.products)
      setOpen(false)
      setSelectedDomains([])
      setSelectedCategories([])
      setTechStack([])
      setQuery("")
      setMaxLimit(20)
      setPhTopics([])
      setPhPageCount(1)
    } catch (error) {
      console.error("Scraping error:", error)
      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }
      if (source === "producthunt" && errorMessage.includes("fetch")) {
        errorMessage = "ProductHunt backend server is not running. Please start the Python backend server first."
      }
      logAction("error", `Scraping failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    )
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const addTechStack = (tech: string) => {
    if (tech && !techStack.includes(tech)) {
      setTechStack((prev) => [...prev, tech])
    }
  }

  const removeTechStack = (tech: string) => {
    setTechStack((prev) => prev.filter((t) => t !== tech))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer gap-2">
          <Plus className="w-4 h-4" />
          Scrape Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Scrape Trending Products
          </DialogTitle>
          <DialogDescription>
            Scrape trending products from GitHub repositories or Product Hunt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Selection */}
          <div className="space-y-2">
            <Label>Source Platform</Label>
            <Select value={source} onValueChange={(value: "github" | "producthunt") => setSource(value)}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub Trending</SelectItem>
                <SelectItem value="producthunt">Product Hunt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Period - GitHub only */}
          {source === "github" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Period
              </Label>
              <Select value={timePeriod} onValueChange={(value: "daily" | "weekly" | "monthly") => setTimePeriod(value)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Trending</SelectItem>
                  <SelectItem value="weekly">Weekly Trending</SelectItem>
                  <SelectItem value="monthly">Monthly Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Firecrawl API Key for Product Hunt */}
          {source === "producthunt" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4 text-red-500" />
                Firecrawl API Key (Required for Product Hunt)
              </Label>
              <Input
                type="password"
                placeholder="Enter your Firecrawl API key (required)..."
                value={firecrawlApiKey}
                onChange={(e) => setFirecrawlApiKey(e.target.value)}
                className={!firecrawlApiKey ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 font-medium">Required:</span> Firecrawl bypasses anti-bot protection for reliable Product Hunt scraping. Get your API key from{" "}
                <a 
                  href="https://www.firecrawl.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  firecrawl.dev
                </a>
              </p>
              {!firecrawlApiKey && (
                <p className="text-xs text-red-500 font-medium">
                  ⚠️ Product Hunt scraping will fail without a Firecrawl API key
                </p>
              )}
            </div>
          )}

          {/* Product Hunt Scraping Mode */}
          {source === "producthunt" && (
            <div className="space-y-4">
              <Label>Product Hunt Scraping Mode</Label>
              <Select value={phScrapeMode} onValueChange={(value: 'leaderboard' | 'products') => setPhScrapeMode(value)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leaderboard">Leaderboard (daily/weekly/monthly)</SelectItem>
                  <SelectItem value="products">Products (by topic/tags, best rated, paginated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ProductHunt Date Selection - only for leaderboard mode */}
          {source === "producthunt" && phScrapeMode === 'leaderboard' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Date Selection for ProductHunt</Label>
              {/* ...existing code for date selection... */}
              {/* Year input - always required */}
              <div className="space-y-2">
                <Label className="text-sm">Year (2013 - {new Date().getFullYear()})</Label>
                <Input
                  type="number"
                  value={phYear}
                  onChange={(e) => setPhYear(Number(e.target.value))}
                  min={2013}
                  max={new Date().getFullYear()}
                  placeholder="Year"
                />
              </div>
              {/* Daily inputs */}
              {timePeriod === "daily" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Month (1-12)</Label>
                    <Input
                      type="number"
                      value={phMonth}
                      onChange={(e) => setPhMonth(Number(e.target.value))}
                      min={1}
                      max={12}
                      placeholder="Month"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Day (1-31)</Label>
                    <Input
                      type="number"
                      value={phDay}
                      onChange={(e) => setPhDay(Number(e.target.value))}
                      min={1}
                      max={31}
                      placeholder="Day"
                    />
                  </div>
                </div>
              )}
              {/* Weekly input */}
              {timePeriod === "weekly" && (
                <div className="space-y-2">
                  <Label className="text-sm">Week Number (1-53)</Label>
                  <Input
                    type="number"
                    value={phWeek}
                    onChange={(e) => setPhWeek(Number(e.target.value))}
                    min={1}
                    max={53}
                    placeholder="Week"
                  />
                </div>
              )}
              {/* Monthly input */}
              {timePeriod === "monthly" && (
                <div className="space-y-2">
                  <Label className="text-sm">Month (1-12)</Label>
                  <Input
                    type="number"
                    value={phMonth}
                    onChange={(e) => setPhMonth(Number(e.target.value))}
                    min={1}
                    max={12}
                    placeholder="Month"
                  />
                </div>
              )}
              {/* Featured toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="phFeatured"
                  checked={phFeatured}
                  onChange={(e) => setPhFeatured(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="phFeatured" className="text-sm">
                  Featured products only (excludes /all from URL)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                URLs generated:
                {timePeriod === "daily" && ` https://www.producthunt.com/leaderboard/daily/${phYear}/${phMonth}/${phDay}${phFeatured ? '' : '/all'}`}
                {timePeriod === "weekly" && ` https://www.producthunt.com/leaderboard/weekly/${phYear}/${phWeek}${phFeatured ? '' : '/all'}`}
                {timePeriod === "monthly" && ` https://www.producthunt.com/leaderboard/monthly/${phYear}/${phMonth}${phFeatured ? '' : '/all'}`}
              </p>
              {/* Today's date warning for daily scraping */}
              {timePeriod === "daily" && 
               phYear === new Date().getFullYear() && 
               phMonth === new Date().getMonth() + 1 && 
               phDay === new Date().getDate() && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                  <strong>Note:</strong> You're scraping today's ProductHunt leaderboard. Products might not be listed yet as ProductHunt updates throughout the day. For better results, try scraping at the end of the day or use yesterday's date.
                </p>
              )}
            </div>
          )}

          {/* Search Query - GitHub only */}
          {source === "github" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Query (Optional)
              </Label>
              <Input
                placeholder="Search for specific keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          {/* Max Limit - GitHub only */}
          {source === "github" && (
            <div className="space-y-2">
              <Label>Maximum Products</Label>
              <Input
                type="number"
                value={maxLimit}
                onChange={(e) => setMaxLimit(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>
          )}

          {/* Tech Stack (for GitHub) */}
          {source === "github" && (
            <div className="space-y-2">
              <Label>Technology Stack (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., typescript, python, react..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTechStack(e.currentTarget.value)
                      e.currentTarget.value = ""
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addTechStack(input.value)
                    input.value = ""
                  }}
                  className="cursor-pointer"
                >
                  Add
                </Button>
              </div>
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechStack(tech)}>
                      {tech} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Hunt Scraping Mode, Topics, and Page Count */}
          {source === "producthunt" && (
            <div className="space-y-4">
              {phScrapeMode === 'products' && (
                <div className="space-y-2">
                  <Label>Topics/Tags (Optional, comma separated)</Label>
                  <Input
                    placeholder="e.g., artificial-intelligence, developer-tools, design, productivity..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        setPhTopics([...phTopics, ...e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean)])
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['data-analytics', 'development', 'artificial-intelligence', 'developer-tools', 'website-builder', 'open-source', 'software-engineering', 'text-editors', 'no-code', 'sdk', 'vibe-coding', 'web-app', 'tech'].map((topic) => (
                      <Badge
                        key={topic}
                        variant={phTopics.includes(topic) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          if (phTopics.includes(topic)) {
                            setPhTopics(phTopics.filter(t => t !== topic))
                          } else {
                            setPhTopics([...phTopics, topic])
                          }
                        }}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  {phTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {phTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="cursor-pointer" onClick={() => setPhTopics(phTopics.filter(t => t !== topic))}>
                          {topic} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 mt-2">
                    <Label>Number of Pages to Scrape</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={phPageCount}
                      onChange={e => setPhPageCount(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Domain Filters - GitHub only */}
          {source === "github" && (
            <div className="space-y-2">
              <Label>Filter by Domains (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((domain) => (
                  <Badge
                    key={domain}
                    variant={selectedDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Filters - GitHub only */}
          {source === "github" && (
            <div className="space-y-2">
              <Label>Filter by Categories (Optional)</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button 
            onClick={handleScrape} 
            disabled={isLoading || (source === "producthunt" && !firecrawlApiKey)}
            className="cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {source === "producthunt" && !firecrawlApiKey ? "Firecrawl API Key Required" : "Start Scraping"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
