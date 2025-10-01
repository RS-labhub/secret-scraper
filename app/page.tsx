"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Settings, Zap, Download, Plus, Filter, ListChecks, Trash2, Sparkles } from "lucide-react"
import { ScrapeDialog } from "@/components/scrape-dialog"
import { ProductCard } from "@/components/product-card"
import { AIServiceManager } from "@/components/ai-service-manager"
import { CMSConfigDialog } from "@/components/cms-config-dialog"
import { PublishDialog } from "@/components/publish-dialog"
import { ExportDialog } from "@/components/export-dialog"
import { BulkAIEnhancementDialog } from "@/components/bulk-ai-enhancement-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { ActionLogger, logAction } from "@/components/action-logger"
import { Footer } from "@/components/footer"
import { loadFromStorage, saveToStorage, storage } from "@/lib/storage"
import type { Product, ScrapeResult } from "@/types/product"
import { Analytics } from "@vercel/analytics/react"

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [cmsConfig, setCmsConfig] = useState<{ provider: string; config: any } | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBulkAIDialog, setShowBulkAIDialog] = useState(false)
  const [showAIManager, setShowAIManager] = useState(false)
  const [showLogViewer, setShowLogViewer] = useState(false)

  // Load initial data from storage
  useEffect(() => {
    console.log("🔄 Loading data from storage...")
    const savedProducts = storage.loadProducts()
    const savedCMSConfig = loadFromStorage<{ provider: string; config: any } | null>("cmsConfig", null)

    console.log("📦 Loaded products from storage:", savedProducts.length, savedProducts)

    if (savedProducts.length > 0) {
      setAllProducts(savedProducts)
      setFilteredProducts(savedProducts)
      logAction("success", `Loaded ${savedProducts.length} products from storage`)
    } else {
      console.log("📦 No products found in storage")
    }

    setCmsConfig(savedCMSConfig)
  }, [])

  // Save products to storage when they change
  useEffect(() => {
    console.log("💾 Saving products to storage:", allProducts.length, allProducts)
    storage.saveProducts(allProducts)
    if (allProducts.length > 0) {
      console.log("💾 Products saved successfully")
    }
  }, [allProducts])

  // Save CMS config to storage when it changes
  useEffect(() => {
    saveToStorage("cmsConfig", cmsConfig)
  }, [cmsConfig])

  // Available domains and categories - memoized
  const availableDomains = useMemo(() => [...new Set(allProducts.flatMap((p) => p.domains))], [allProducts])

  const availableCategories = useMemo(() => [...new Set(allProducts.flatMap((p) => p.categories))], [allProducts])

  // Add source filter state
  const [selectedSource, setSelectedSource] = useState<"all" | "github" | "producthunt">("all")

  // Filter products based on search and selection criteria
  useEffect(() => {
    let filtered = allProducts

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description.toLowerCase().includes(lowerQuery) ||
          product.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      )
    }

    if (selectedDomains.length > 0) {
      filtered = filtered.filter((product) =>
        product.domains && selectedDomains.some((domain) => product.domains.includes(domain as any))
      )
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        product.categories && selectedCategories.some((category) => product.categories.includes(category as any)),
      )
    }

    // Filter by source
    if (selectedSource !== "all") {
      filtered = filtered.filter((product) => product.source === selectedSource)
    }

    setFilteredProducts(filtered)
  }, [allProducts, searchQuery, selectedDomains, selectedCategories, selectedSource])

  // Handlers with useCallback to prevent unnecessary re-renders
  const handleScrapeComplete = useCallback((products: Product[]) => {
    console.log("📥 handleScrapeComplete called with products:", products?.length || 0)
    if (products && products.length > 0) {
      console.log("📥 Sample product received:", products[0])
      setAllProducts((currentProducts) => {
        // Filter out duplicate products by checking if their names already exist
        const existingNames = new Set(currentProducts.map(p => p.name))
        const newProducts = products.filter(p => !existingNames.has(p.name))

        console.log("📥 New products to add:", newProducts.length)
        console.log("📥 Existing products:", currentProducts.length)

        // Log the results
        if (newProducts.length > 0) {
          logAction("success", `Added ${newProducts.length} new products`)
        }

        if (newProducts.length !== products.length) {
          const skipped = products.length - newProducts.length
          logAction("info", `Skipped ${skipped} duplicate product${skipped > 1 ? 's' : ''}`)
        }

        const updatedProducts = [...newProducts, ...currentProducts]
        console.log("📥 Total products after update:", updatedProducts.length)
        return updatedProducts
      })
    } else {
      console.log("📥 No products received or empty array")
      logAction("info", "No new products found to add")
    }
  }, [])

  const handleProductUpdate = useCallback((productId: string, updates: Partial<Product>) => {
    setAllProducts((products) => {
      const productToUpdate = products.find(p => p.id === productId)
      if (productToUpdate) {
        logAction("info", `Updated product: ${productToUpdate.name}`)
      }
      return products.map((product) => (product.id === productId ? { ...product, ...updates } : product))
    })
  }, [])

  const handleProductDelete = useCallback((productId: string) => {
    setAllProducts((products) => {
      const productToDelete = products.find(p => p.id === productId)
      if (productToDelete) {
        logAction("info", `Deleted product: ${productToDelete.name}`)
      }
      return products.filter((product) => product.id !== productId)
    })
  }, [])

  const handleClearAllProducts = useCallback(() => {
    if (allProducts.length === 0) return

    if (window.confirm(`Are you sure you want to delete all ${allProducts.length} products? This action cannot be undone.`)) {
      setAllProducts([])
      logAction("info", `Cleared all products (${allProducts.length} items deleted)`)
    }
  }, [allProducts.length])

  const handleCMSConfigSave = useCallback((provider: string, config: any) => {
    setCmsConfig({ provider, config })
    logAction("success", `CMS configuration saved: ${provider}`)
  }, [])

  // Toggle domain selection
  const toggleDomain = useCallback((domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain],
    )
  }, [])

  // Toggle category selection
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }, [])

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground font-mono">Secret Scraper</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogViewer(!showLogViewer)}
                  className={`cursor-pointer gap-2 ${showLogViewer ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <ListChecks className="w-4 h-4" />
                  Activity Log
                </Button>
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={() => setShowAIManager(true)} className="cursor-pointer gap-2">
                  <Settings className=" w-4 h-4" />
                  AI Services
                </Button>
                {/* <CMSConfigDialog onConfigSave={handleCMSConfigSave} currentConfig={cmsConfig as any} /> */}
                <ScrapeDialog onScrapeComplete={handleScrapeComplete} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-card border-border"
              />
            </div>

            {/* Source filter */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground font-mono">Source</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedSource === "all" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs"
                  onClick={() => setSelectedSource("all")}
                >
                  All Sources
                </Badge>
                <Badge
                  variant={selectedSource === "github" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs"
                  onClick={() => setSelectedSource("github")}
                >
                  GitHub
                </Badge>
                <Badge
                  variant={selectedSource === "producthunt" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs"
                  onClick={() => setSelectedSource("producthunt")}
                >
                  Product Hunt
                </Badge>
              </div>
            </div>

            {availableDomains.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground font-mono">Domains</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableDomains.map((domain) => (
                    <Badge
                      key={domain}
                      variant={selectedDomains.includes(domain) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs"
                      onClick={() => toggleDomain(domain)}
                    >
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {availableCategories.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground font-mono">Categories</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "secondary" : "outline"}
                      className="cursor-pointer hover:bg-secondary/10 transition-colors font-mono text-xs"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {allProducts.length > 0 && (
            <div className="flex items-center justify-between mb-8 p-6 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-8 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary font-mono">{allProducts.length}</div>
                  <div className="text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary font-mono">
                    {allProducts.filter((p) => p.aiEnhanced).length}
                  </div>
                  <div className="text-muted-foreground">AI Enhanced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary font-mono">
                    {allProducts.filter((p) => p.status === "approved").length}
                  </div>
                  <div className="text-muted-foreground">Published</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PublishDialog products={allProducts} cmsConfig={cmsConfig as any} onPublishComplete={() => logAction("success", "Products published successfully")} />
                <Button variant="outline" size="sm" onClick={() => setShowBulkAIDialog(true)} className="cursor-pointer gap-2">
                  <Sparkles className="w-4 h-4" />
                  Bulk AI Enhance
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="cursor-pointer gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                {allProducts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllProducts}
                    className="cursor-pointer gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  onProductUpdate={handleProductUpdate}
                  onProductDelete={handleProductDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-mono">No products yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start by scraping products from GitHub trending repositories or Product Hunt daily tools
              </p>
              <ScrapeDialog onScrapeComplete={handleScrapeComplete} />
            </div>
          )}
        </main>

        <AIServiceManager open={showAIManager} onOpenChange={setShowAIManager} />

        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          products={allProducts}
          selectedProducts={[]}
          onProductsUpdate={(updatedActiveProducts) => {
            // Merge updated active products back into allProducts
            const updatedAllProducts = allProducts.map(product => {
              const updatedProduct = updatedActiveProducts.find(up => up.id === product.id)
              return updatedProduct || product
            })

            setAllProducts(updatedAllProducts)
            logAction("success", `Updated ${updatedActiveProducts.length} products via export dialog`)
          }}
        />

        <BulkAIEnhancementDialog
          open={showBulkAIDialog}
          onOpenChange={setShowBulkAIDialog}
          products={allProducts}
          onProductsUpdated={setAllProducts}
        />

        <ActionLogger
          isOpen={showLogViewer}
          onClose={() => setShowLogViewer(false)}
        />

      </div>
      <Analytics />
    </>
  )
}
