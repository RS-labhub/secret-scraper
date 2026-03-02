"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, FileJson, Link2, Zap } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { GitHubScraper } from "@/lib/scrapers/github-scraper"
import { ProductHuntScraper } from "@/lib/scrapers/producthunt-scraper"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Loader2, Search, Clock, TrendingUp, Key, Settings2 } from "lucide-react"
import type { Product, ScrapeRequest } from "@/types/product"
import { logAction } from "@/components/action-logger"
import { storage } from "@/lib/storage"

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

interface ScrapeDialogProps {
  onScrapeComplete: (products: Product[]) => void
}

const COMMON_TECH_STACKS = [
  "1C Enterprise", "C", "C#", "C++", "CSS", "Clojure", "Common Lisp", "Crystal", "D", "Dart",
  "Elixir", "Elm", "Emacs Lisp", "Erlang", "F#", "Fortran", "GDScript", "Go", "HCL", "Haskell",
  "Haxe", "Java", "JavaScript", "Julia", "Jupyter Notebook", "Kotlin", "Lua", "MQL4", "MQL5",
  "Nim", "Nix", "OCaml", "Objective-C", "PHP", "Pascal", "Perl", "PowerShell", "Prolog",
  "PureScript", "Python", "R", "Racket", "Ruby", "Rust", "Scala", "Shell", "Solidity",
  "Svelte", "Swift", "TeX", "Terraform", "TypeScript", "Vala", "Verilog", "Vim script", "Vue", "Zig"
]
const PH_SUGGESTED_TOPICS = ["ai", "developer-tools", "productivity", "design-tools", "saas", "marketing", "open-source"]

export function ScrapeDialog({ onScrapeComplete }: ScrapeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<"github" | "producthunt">("github")
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [techStack, setTechStack] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [maxLimit, setMaxLimit] = useState(20)
  const [translateDescriptions, setTranslateDescriptions] = useState(false)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [firecrawlApiKey, setFirecrawlApiKey] = useState("")
  const [phYear, setPhYear] = useState(yesterday.getFullYear())
  const [phMonth, setPhMonth] = useState(yesterday.getMonth() + 1)
  const [phDay, setPhDay] = useState(yesterday.getDate())
  const [phWeek, setPhWeek] = useState(getWeekNumber(yesterday))
  const [phFeatured, setPhFeatured] = useState(false)
  const [phScrapeScope, setPhScrapeScope] = useState<'featured' | 'all' | 'both'>('both')
  const [phScrapeMode, setPhScrapeMode] = useState<'leaderboard' | 'products'>('leaderboard')
  const [phTopics, setPhTopics] = useState<string[]>([])
  const [phPageCount, setPhPageCount] = useState(1)
  const [phDeepScrape, setPhDeepScrape] = useState(false)

  useEffect(() => {
    const savedApiKey = storage.loadFirecrawlApiKey()
    if (savedApiKey) {
      setFirecrawlApiKey(savedApiKey)
    }
  }, [])

  useEffect(() => {
    if (firecrawlApiKey) {
      storage.saveFirecrawlApiKey(firecrawlApiKey)
    }
  }, [firecrawlApiKey])

  const handleScrape = async () => {
    setIsLoading(true)
    logAction("info", `Starting ${source} scraping for ${timePeriod} period`)
    try {
      const scrapeRequest: ScrapeRequest = {
        source,
        filters: {
          timePeriod,
          query: query || undefined,
          techStack: techStack.length > 0 ? techStack : undefined,
          maxLimit,
          firecrawlApiKey: firecrawlApiKey || undefined,
          ...(source === "github" && { translateDescriptions }),
          ...(source === "producthunt" && {
            phYear,
            phMonth,
            phDay,
            phWeek,
            phFeatured,
            phScrapeScope,
            scrapeMode: phScrapeMode,
            deepScrape: phDeepScrape,
            topics: phTopics,
            pageCount: phPageCount,
          }),
        },
      }
      
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeRequest),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Scraping failed")
      }
      const result = await response.json()
      logAction("success", `Found ${result.products.length} products from ${source}`)
      onScrapeComplete(result.products)
      setOpen(false)
      setTechStack([])
      setQuery("")
    } catch (error) {
      console.error("Scraping error:", error)
      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }
      logAction("error", `Scraping failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTech = (tech: string) => {
    setTechStack(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech])
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="btn-brutal w-full justify-center text-sm group">
          <TrendingUp className="w-4 h-4 mr-2 group-hover:animate-pulse" />
          Initialize Scrape
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-4 md:p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 font-display uppercase text-xl md:text-2xl tracking-tighter">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Scrape Protocol
            </SheetTitle>
            <SheetDescription className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
              Configure parameters to extract intelligence.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-4 md:p-6 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
          {/* Source Selection - Big UI */}
          <div className="space-y-4">
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Target Vector</Label>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={() => setSource("github")}
                className={`p-3 md:p-4 border text-left flex flex-col gap-1.5 md:gap-2 transition-all ${source === "github" ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"}`}
              >
                <span className="font-bold uppercase tracking-tight text-sm md:text-base">GitHub</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Trending repos & developers</span>
              </button>
              <button
                onClick={() => setSource("producthunt")}
                className={`p-3 md:p-4 border text-left flex flex-col gap-1.5 md:gap-2 transition-all ${source === "producthunt" ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"}`}
              >
                <span className="font-bold uppercase tracking-tight text-sm md:text-base">Product Hunt</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Daily launches & startups</span>
              </button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-none h-12 p-1">
              <TabsTrigger value="basic" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Basic Config</TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Advanced <Settings2 className="w-3 h-3 ml-2"/></TabsTrigger>
            </TabsList>
            
            <div className="mt-4 md:mt-6 border border-border p-4 md:p-6 bg-secondary/10">
              <TabsContent value="basic" className="space-y-6 m-0">
                {source === "github" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-mono text-xs uppercase text-muted-foreground">Time Horizon</Label>
                      <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                        <SelectTrigger className="rounded-none border-border h-12 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border">
                          <SelectItem value="daily" className="font-mono">Daily Trending</SelectItem>
                          <SelectItem value="weekly" className="font-mono">Weekly Trending</SelectItem>
                          <SelectItem value="monthly" className="font-mono">Monthly Trending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="font-mono text-xs uppercase text-muted-foreground">Tech Stack Interest (Optional)</Label>
                      <ScrollArea className="h-48 border border-border p-2">
                        <div className="flex flex-wrap gap-2">
                          {COMMON_TECH_STACKS.map(tech => (
                            <Badge
                              key={tech}
                              variant={techStack.includes(tech) ? "default" : "outline"}
                              className="cursor-pointer rounded-none border-border hover:bg-primary/20"
                              onClick={() => toggleTech(tech)}
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
                
                {source === "producthunt" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                        <Key className="w-3 h-3 text-primary" /> Firecrawl Authentication
                      </Label>
                      <Input
                        type="password"
                        placeholder="sk-fc-..."
                        value={firecrawlApiKey}
                        onChange={(e) => setFirecrawlApiKey(e.target.value)}
                        className={`rounded-none border-border h-12 font-mono ${!firecrawlApiKey ? "border-destructive/50 focus-visible:ring-destructive" : ""}`}
                      />
                      {!firecrawlApiKey && <p className="text-xs text-destructive font-mono">Required for bypass protocol.</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="font-mono text-xs uppercase text-muted-foreground">Scrape Mode</Label>
                      <Select value={phScrapeMode} onValueChange={(v: any) => setPhScrapeMode(v)}>
                        <SelectTrigger className="rounded-none border-border h-12 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="leaderboard">Leaderboard (Time-based)</SelectItem>
                          <SelectItem value="products">Topic/Tag Search</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {phScrapeMode === 'products' && (
                      <div className="space-y-4 pt-2 border-t border-border/50">
                        <Label className="font-mono text-xs uppercase text-muted-foreground">Topics / Tags</Label>
                        <Input
                          placeholder="Type or select a topic and press Enter..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value) {
                              const newTopics = e.currentTarget.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
                              setPhTopics(prev => [...new Set([...prev, ...newTopics])])
                              e.currentTarget.value = ""
                            }
                          }}
                          className="rounded-none border-border h-10 font-mono"
                        />

                        <div className="flex flex-wrap gap-2">
                          {phTopics.map(topic => (
                            <Badge key={topic} variant="default" className="cursor-pointer rounded-none border border-primary hover:bg-destructive" onClick={() => setPhTopics(phTopics.filter(t => t !== topic))}>{topic} ×</Badge>
                          ))}
                        </div>

                        <div className="pt-2">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground mb-2 block">Suggestions</Label>
                          <div className="flex flex-wrap gap-2">
                            {PH_SUGGESTED_TOPICS.map(topic => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className="cursor-pointer rounded-none border-border hover:bg-primary/20 text-xs"
                                onClick={() => !phTopics.includes(topic) && setPhTopics([...phTopics, topic])}
                              >
                                + {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {phScrapeMode === 'leaderboard' && (
                      <div className="space-y-4 pt-2 border-t border-border/50">
                        <Label className="font-mono text-xs uppercase text-muted-foreground">Time Parameters</Label>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2">
                             <Label className="text-xs font-mono">Year</Label>
                             <Input type="number" value={phYear} onChange={e => setPhYear(Number(e.target.value))} className="rounded-none border-border" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-xs font-mono">Month</Label>
                             <Input type="number" min={1} max={12} value={phMonth} onChange={e => setPhMonth(Number(e.target.value))} className="rounded-none border-border" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-xs font-mono">Day</Label>
                             <Input type="number" min={1} max={31} value={phDay} onChange={e => setPhDay(Number(e.target.value))} className="rounded-none border-border" />
                           </div>
                        </div>

                        <div className="space-y-3 pt-3">
                          <Label className="font-mono text-xs uppercase text-muted-foreground">Scrape Scope</Label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() => setPhScrapeScope("featured")}
                              className={`p-3 border text-center text-xs font-mono uppercase transition-all ${phScrapeScope === "featured" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground text-muted-foreground"}`}
                            >
                              Featured
                            </button>
                            <button
                              onClick={() => setPhScrapeScope("all")}
                              className={`p-3 border text-center text-xs font-mono uppercase transition-all ${phScrapeScope === "all" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground text-muted-foreground"}`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setPhScrapeScope("both")}
                              className={`p-3 border text-center text-xs font-mono uppercase transition-all ${phScrapeScope === "both" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground text-muted-foreground"}`}
                            >
                              Both
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {phScrapeScope === 'featured' && 'Scrape only featured/top products from the leaderboard.'}
                            {phScrapeScope === 'all' && 'Scrape all products from the leaderboard.'}
                            {phScrapeScope === 'both' && 'Scrape both featured and all products. Featured products will be labeled.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 m-0">
                {source === "github" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-mono text-xs uppercase text-muted-foreground">Free-Text Query</Label>
                      <Input
                        placeholder="Specific repository names or keywords..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="rounded-none border-border font-mono h-10"
                      />
                    </div>
                    <div className="space-y-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-mono text-xs uppercase text-muted-foreground">Translate Descriptions</Label>
                        <p className="text-xs text-muted-foreground">Auto-translate foreign repo descriptions to English.</p>
                      </div>
                      <Switch checked={translateDescriptions} onCheckedChange={setTranslateDescriptions} />
                    </div>
                    <div className="space-y-3 flex items-center justify-between">
                      <Label className="font-mono text-xs uppercase text-muted-foreground">Max Yield</Label>
                      <Input
                        type="number"
                        value={maxLimit}
                        onChange={(e) => setMaxLimit(Number(e.target.value))}
                        min={1} max={100}
                        className="rounded-none border-border font-mono w-24 h-10"
                      />
                    </div>
                  </div>
                )}

                {source === "producthunt" && (
                  <div className="space-y-6">
                    <div className="space-y-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-mono text-xs uppercase text-muted-foreground text-primary">Deep Extraction</Label>
                        <p className="text-[10px] text-muted-foreground max-w-[200px] leading-tight">Scrapes individual product pages to extract explicit website URLs & social handles. (Slower)</p>
                      </div>
                      <Switch checked={phDeepScrape} onCheckedChange={setPhDeepScrape} />
                    </div>

                    {phScrapeMode === 'products' && (
                      <div className="space-y-4">
                        <Label className="font-mono text-xs uppercase text-muted-foreground">Result Depth</Label>
                        <div className="space-y-2 flex items-center justify-between">
                          <span className="text-xs font-mono text-muted-foreground">Pages to scrape</span>
                          <Input type="number" min={1} max={5} value={phPageCount} onChange={e => setPhPageCount(Number(e.target.value))} className="rounded-none border-border w-24 h-8" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-4 md:p-6 border-t border-border bg-black sticky bottom-0">
          <Button
            onClick={handleScrape}
            disabled={isLoading || (source === "producthunt" && !firecrawlApiKey)}
            className="w-full btn-brutal h-12 md:h-14 text-sm md:text-lg"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Executing...</>
            ) : (
              <><Zap className="w-5 h-5 mr-3" /> Execute Scrape Sequence</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

