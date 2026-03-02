"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Settings, Zap, Download, Plus, Filter, ListChecks, Trash2, Sparkles, LayoutDashboard, Database, Cable, TerminalSquare, BookOpen, Layers, SearchCheck, Menu, X } from "lucide-react"
import { ScrapeDialog } from "@/components/scrape-dialog"
import { ProductCard } from "@/components/product-card"
import { AIServiceManager } from "@/components/ai-service-manager"
import { ExportDialog } from "@/components/export-dialog"
import { BulkAIEnhancementDialog } from "@/components/bulk-ai-enhancement-dialog"
import { ActionLogger, logAction } from "@/components/action-logger"
import { loadFromStorage, saveToStorage, storage } from "@/lib/storage"
import type { Product, Domain } from "@/types/product"
import { Analytics } from "@vercel/analytics/react"

export function DashboardView() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedSource, setSelectedSource] = useState<"all" | "github" | "producthunt">("all")
  
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBulkAIDialog, setShowBulkAIDialog] = useState(false)
  const [showAIManager, setShowAIManager] = useState(false)
  const [showLogViewer, setShowLogViewer] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [deepScrapingIds, setDeepScrapingIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const savedProducts = storage.loadProducts()
    if (savedProducts.length > 0) {
      setAllProducts(savedProducts)
      setFilteredProducts(savedProducts)
    }
  }, [])

  useEffect(() => {
    storage.saveProducts(allProducts)
  }, [allProducts])

  const availableDomains = useMemo(
    () => [...new Set(allProducts.map((p) => p.domain).filter((domain): domain is Domain => Boolean(domain)))],
    [allProducts]
  )

  useEffect(() => {
    let filtered = allProducts
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description.toLowerCase().includes(lowerQuery)
      )
    }
    if (selectedDomains.length > 0) {
      filtered = filtered.filter((product) => product.domain && selectedDomains.includes(product.domain))
    }
    if (selectedSource !== "all") {
      filtered = filtered.filter((product) => product.source === selectedSource)
    }
    setFilteredProducts(filtered)
  }, [allProducts, searchQuery, selectedDomains, selectedSource])

  const handleScrapeComplete = useCallback((products: Product[]) => {
    if (products && products.length > 0) {
      setAllProducts((currentProducts) => {
        const existingNames = new Set(currentProducts.map(p => p.name))
        const newProducts = products.filter(p => !existingNames.has(p.name))
        
        if (newProducts.length > 0) {
          logAction("success", `Added ${newProducts.length} new products`)
        }
        if (newProducts.length !== products.length) {
          const skipped = products.length - newProducts.length
          logAction("info", `Skipped ${skipped} duplicate product${skipped > 1 ? 's' : ''}`)
        }
        return [...newProducts, ...currentProducts]
      })
    }
  }, [])

  const handleProductUpdate = useCallback((productId: string, updates: Partial<Product>) => {
    setAllProducts((products) => products.map((product) => (product.id === productId ? { ...product, ...updates } : product)))
  }, [])

  const handleProductDelete = useCallback((productId: string) => {
    setAllProducts((products) => products.filter((product) => product.id !== productId))
  }, [])

  const handleClearAllProducts = useCallback(() => {
    if (allProducts.length === 0) return
    if (window.confirm(`Are you sure you want to delete all ${allProducts.length} products?`)) {
      setAllProducts([])
      logAction("info", "Cleared all products")
    }
  }, [allProducts.length])

  const toggleDomain = useCallback((domain: string) => {
    setSelectedDomains((prev) => prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain])
  }, [])

  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }, [])

  const handleDeepScrape = useCallback(async (product: Product) => {
    const firecrawlApiKey = storage.loadFirecrawlApiKey()
    if (!firecrawlApiKey) {
      logAction("error", "Firecrawl API key is required for deep scraping. Configure it in the Scrape dialog first.")
      return
    }

    setDeepScrapingIds((prev) => new Set(prev).add(product.id))
    logAction("info", `Deep scraping: ${product.name}`)

    try {
      const response = await fetch("/api/scrape/deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: [product], firecrawlApiKey }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Deep scrape failed")
      }

      const result = await response.json()
      if (result.products && result.products.length > 0) {
        const enhanced = result.products[0]
        handleProductUpdate(product.id, enhanced)
        logAction("success", `Deep scrape completed for ${product.name}`)
      }
    } catch (error) {
      logAction("error", `Deep scrape failed for ${product.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeepScrapingIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }, [handleProductUpdate])

  const handleBulkDeepScrape = useCallback(async () => {
    const firecrawlApiKey = storage.loadFirecrawlApiKey()
    if (!firecrawlApiKey) {
      logAction("error", "Firecrawl API key is required for deep scraping. Configure it in the Scrape dialog first.")
      return
    }

    const selectedProducts = allProducts.filter(p => selectedProductIds.has(p.id) && p.source === "producthunt")
    if (selectedProducts.length === 0) {
      logAction("error", "No Product Hunt products selected for deep scraping.")
      return
    }

    logAction("info", `Starting bulk deep scrape for ${selectedProducts.length} products...`)
    selectedProducts.forEach(p => setDeepScrapingIds((prev) => new Set(prev).add(p.id)))

    try {
      const response = await fetch("/api/scrape/deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: selectedProducts, firecrawlApiKey }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Bulk deep scrape failed")
      }

      const result = await response.json()
      if (result.products && result.products.length > 0) {
        result.products.forEach((enhanced: Product) => {
          handleProductUpdate(enhanced.id, enhanced)
        })
        logAction("success", `Bulk deep scrape completed for ${result.products.length} products`)
      }
    } catch (error) {
      logAction("error", `Bulk deep scrape failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeepScrapingIds(new Set())
      setSelectedProductIds(new Set())
      setSelectionMode(false)
    }
  }, [allProducts, selectedProductIds, handleProductUpdate])

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      
      {/* Sidebar Architecture */}
      <aside className="hidden md:flex flex-col w-[280px] border-r border-border bg-black sticky top-0 h-screen p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display uppercase leading-none">Secret<br/>Scraper</h1>
          </div>
        </div>

        <nav className="space-y-4 flex-1">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Menu</div>
          <button className="flex justify-start w-full gap-3 px-4 py-3 bg-secondary text-secondary-foreground font-mono text-sm border-l-2 border-primary">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <a href="/docs" className="flex items-center justify-start w-full gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary/50 font-mono text-sm border-l-2 border-transparent hover:border-border transition-colors">
            <BookOpen className="w-4 h-4" /> Documentation
          </a>
          <a href="/examples" className="flex items-center justify-start w-full gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary/50 font-mono text-sm border-l-2 border-transparent hover:border-border transition-colors">
            <Layers className="w-4 h-4" /> Examples
          </a>
          <button onClick={() => setShowAIManager(true)} className="flex justify-start w-full gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary/50 font-mono text-sm border-l-2 border-transparent hover:border-border transition-colors">
            <Cable className="w-4 h-4" /> AI Configuration
          </button>
          <button onClick={() => setShowLogViewer(true)} className="flex justify-start w-full gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary/50 font-mono text-sm border-l-2 border-transparent hover:border-border transition-colors">
            <ListChecks className="w-4 h-4" /> System Logs
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-border">
          <ScrapeDialog onScrapeComplete={handleScrapeComplete} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 border-b border-border items-center justify-between px-6 lg:px-12 bg-background/95 backdrop-blur z-40 sticky top-0">
          <div className="font-display text-2xl uppercase font-bold tracking-tight">
            Command Center
          </div>
          <div className="relative w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-10 rounded-none border-border bg-secondary/30 h-10 font-mono text-sm focus-visible:ring-primary focus-visible:border-primary" 
              placeholder="Search database..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden border-b border-border bg-background/95 backdrop-blur z-40 sticky top-0">
          <div className="flex items-center justify-between h-12 px-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display text-sm uppercase font-bold tracking-tight">Command Center</span>
            </div>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 border border-border bg-black text-primary"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
          {/* Mobile Search - always visible */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                className="pl-9 rounded-none border-border bg-secondary/30 h-8 font-mono text-xs focus-visible:ring-primary focus-visible:border-primary" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 top-[88px] z-50 bg-black/95 backdrop-blur-sm">
            <nav className="p-4 space-y-2 border-b border-border bg-black">
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-3">Navigation</div>
              <a href="/docs" className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-muted-foreground hover:bg-secondary/50 hover:text-white border border-border transition-colors" onClick={() => setMobileNavOpen(false)}>
                <BookOpen className="w-4 h-4" /> Documentation
              </a>
              <a href="/examples" className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-muted-foreground hover:bg-secondary/50 hover:text-white border border-border transition-colors" onClick={() => setMobileNavOpen(false)}>
                <Layers className="w-4 h-4" /> Examples
              </a>
              <button onClick={() => { setShowAIManager(true); setMobileNavOpen(false) }} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-mono text-muted-foreground hover:bg-secondary/50 hover:text-white border border-border transition-colors">
                <Cable className="w-4 h-4" /> AI Configuration
              </button>
              <button onClick={() => { setShowLogViewer(true); setMobileNavOpen(false) }} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-mono text-muted-foreground hover:bg-secondary/50 hover:text-white border border-border transition-colors">
                <ListChecks className="w-4 h-4" /> System Logs
              </button>
              <div className="pt-3">
                <ScrapeDialog onScrapeComplete={(products) => { handleScrapeComplete(products); setMobileNavOpen(false) }} />
              </div>
            </nav>
            <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        <div className="p-3 md:p-6 lg:p-12 space-y-4 md:space-y-12">
          
          {/* Brutalist Metric Cards */}
          {allProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <div className="border border-border p-3 md:p-6 bg-secondary/20 flex flex-col justify-between h-20 md:h-32">
                <div className="text-[10px] md:text-sm font-mono text-muted-foreground uppercase flex items-center gap-1 md:gap-2"><Database className="w-3 h-3 md:w-4 md:h-4"/> Scraped</div>
                <div className="text-2xl md:text-5xl font-black font-display text-primary">{allProducts.length}</div>
              </div>
              <div className="border border-border p-3 md:p-6 bg-secondary/20 flex flex-col justify-between h-20 md:h-32">
                <div className="text-[10px] md:text-sm font-mono text-muted-foreground uppercase flex items-center gap-1 md:gap-2"><Sparkles className="w-3 h-3 md:w-4 md:h-4"/> Enhanced</div>
                <div className="text-2xl md:text-5xl font-black font-display text-primary">{allProducts.filter(p => p.aiEnhanced).length}</div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          {allProducts.length > 0 && (
            <div className="space-y-2 md:space-y-0 md:flex md:flex-row md:gap-4 md:justify-between md:items-center bg-card-brutal p-3 md:p-4">
              {/* Filters */}
              <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground shrink-0">Src:</span>
                <Badge variant={selectedSource === "all" ? "default" : "outline"} className="rounded-none cursor-pointer border border-border text-[10px] md:text-xs h-6 md:h-auto shrink-0" onClick={() => setSelectedSource("all")}>All</Badge>
                <Badge variant={selectedSource === "github" ? "default" : "outline"} className="rounded-none cursor-pointer border border-border text-[10px] md:text-xs h-6 md:h-auto shrink-0" onClick={() => setSelectedSource("github")}>GitHub</Badge>
                <Badge variant={selectedSource === "producthunt" ? "default" : "outline"} className="rounded-none cursor-pointer border border-border text-[10px] md:text-xs h-6 md:h-auto shrink-0" onClick={() => setSelectedSource("producthunt")}>PH</Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto">
                {allProducts.some(p => p.source === 'producthunt') && (
                  <Button 
                    variant={selectionMode ? "default" : "outline"} 
                    size="sm"
                    className="rounded-none border-border font-mono uppercase text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-4 shrink-0" 
                    onClick={() => {
                      setSelectionMode(!selectionMode)
                      if (selectionMode) setSelectedProductIds(new Set())
                    }}
                  >
                    <SearchCheck className="w-3 h-3 mr-1" /> {selectionMode ? 'Cancel' : 'Deep'}
                  </Button>
                )}
                {selectionMode && selectedProductIds.size > 0 && (
                  <Button 
                    size="sm"
                    className="rounded-none font-mono uppercase text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-4 btn-brutal shrink-0" 
                    onClick={handleBulkDeepScrape}
                    disabled={deepScrapingIds.size > 0}
                  >
                    <Search className="w-3 h-3 mr-1" /> ({selectedProductIds.size})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-none border-border font-mono uppercase text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-4 shrink-0" onClick={() => setShowExportDialog(true)}>
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
                <Button variant="destructive" size="sm" className="rounded-none border-transparent font-mono uppercase text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-4 shrink-0" onClick={handleClearAllProducts}>
                  <Trash2 className="w-3 h-3 mr-1" /> Purge
                </Button>
              </div>
            </div>
          )}

          {/* Data Grid */}
          <div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductUpdate={handleProductUpdate}
                    onProductDelete={handleProductDelete}
                    onDeepScrape={product.source === "producthunt" ? handleDeepScrape : undefined}
                    isDeepScraping={deepScrapingIds.has(product.id)}
                    selectable={selectionMode}
                    selected={selectedProductIds.has(product.id)}
                    onSelectionToggle={toggleProductSelection}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-16 md:py-32 border-2 border-dashed border-border/50 bg-secondary/5">
                <TerminalSquare className="w-10 h-10 md:w-16 md:h-16 text-muted-foreground mb-4 md:mb-6 opacity-30" />
                <h3 className="text-lg md:text-2xl font-bold font-display uppercase tracking-widest text-muted-foreground mb-2 md:mb-4 text-center px-4">No Data Found</h3>
                <p className="text-muted-foreground font-mono text-xs md:text-sm max-w-sm text-center mb-6 md:mb-8 px-4">
                  Initiate a scrape sequence to retrieve intelligence.
                </p>
                <ScrapeDialog onScrapeComplete={handleScrapeComplete} />
              </div>
            )}
          </div>

        </div>
      </main>

      <AIServiceManager open={showAIManager} onOpenChange={setShowAIManager} />
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} products={allProducts} selectedProducts={[]} onProductsUpdate={setAllProducts} />
      <BulkAIEnhancementDialog open={showBulkAIDialog} onOpenChange={setShowBulkAIDialog} products={allProducts} onProductsUpdated={setAllProducts} />
      <ActionLogger isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />
      <Analytics />
    </div>
  )
}

