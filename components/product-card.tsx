"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductEditorDialog } from "./product-editor-dialog"       
import { Trash2, Github, ExternalLink, Calendar, TrendingUp, Undo2, Cable, Search, Loader2, CheckSquare, Square } from "lucide-react"                                                
import type { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
  onProductUpdate: (productId: string, updates: Partial<Product>) => void
  onProductDelete?: (productId: string) => void
  onDeepScrape?: (product: Product) => void
  isDeepScraping?: boolean
  selectable?: boolean
  selected?: boolean
  onSelectionToggle?: (productId: string) => void
}

export function ProductCard({ product, onProductUpdate, onProductDelete, onDeepScrape, isDeepScraping, selectable, selected, onSelectionToggle }: ProductCardProps) {
  const [localProduct, setLocalProduct] = useState(product)

  useEffect(() => { setLocalProduct(product) }, [product])

  const handleProductEdit = (productId: string, updates: Partial<Product>) => {
    const updatedProduct = { ...localProduct, ...updates }
    setLocalProduct(updatedProduct)
    onProductUpdate(productId, updatedProduct)
  }

  const handleApproval = (status: Product["status"]) => {
    const updatedProduct = { ...localProduct, status }
    setLocalProduct(updatedProduct)
    onProductUpdate(localProduct.id, updatedProduct)
  }

  const handleUnapprove = () => {
    const updatedProduct = { ...localProduct, status: "pending" as Product["status"] }
    setLocalProduct(updatedProduct)
    onProductUpdate(localProduct.id, updatedProduct)
  }

  const handleDelete = () => { if (onProductDelete) onProductDelete(localProduct.id) }

  const getSourceIcon = (source: Product["source"]) => {
    if (source === "github") return <Github className="w-6 h-6 text-foreground" />
    if (source === "producthunt" && localProduct.metadata.sourceIcon) {
      return <img src={localProduct.metadata.sourceIcon} alt="Product Hunt" className="w-full h-full object-cover grayscale contrast-125" />
    }
    return <div className="w-5 h-5 text-foreground font-bold flex items-center justify-center">PH</div>
  }

  const getPrimaryLink = () => {
    if (localProduct.links.website) return localProduct.links.website
    if (localProduct.links.repository) return localProduct.links.repository
    if (localProduct.links.productHunt) return localProduct.links.productHunt
    return null
  }

  const displayDescription = localProduct.aiEnhanced?.summary || localProduct.description
  const displayDomain = localProduct.aiEnhanced?.suggestedDomain || localProduct.domain
  const displayFeatures = localProduct.features.slice(0, 3)

  return (
    <Card className={`card-brutal flex flex-col justify-between h-full bg-black group relative ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-0 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectable && localProduct.source === "producthunt" && (
              <button
                onClick={() => onSelectionToggle?.(localProduct.id)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {selected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
              </button>
            )}
            <div className={`w-12 h-12 flex items-center justify-center border border-border bg-secondary/30 ${localProduct.source === "github" ? "" : ""}`}>
              {getSourceIcon(localProduct.source)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-display uppercase tracking-tight text-foreground truncate max-w-[200px]">
                  {localProduct.name}
                </CardTitle>
                <div className="flex gap-1 items-center">
                  {localProduct.links.website && (
                    <a href={localProduct.links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Website">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {localProduct.links.repository && (
                    <a href={localProduct.links.repository} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Repository">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {localProduct.links.productHunt && (
                    <a href={localProduct.links.productHunt} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Product Hunt Post">
                      <span className="w-4 h-4 font-bold flex items-center justify-center text-[10px] border border-current rounded-full">P</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-2 uppercase tracking-wider">
                {localProduct.source} <span className="opacity-30">|</span> {localProduct.metadata.timePeriod || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col space-y-6">
        <p className="text-sm text-muted-foreground font-mono leading-relaxed line-clamp-3">
          {displayDescription}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {displayDomain && localProduct.source !== "producthunt" && (
            <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/20">
              VECTOR: {displayDomain}
            </Badge>
          )}
          
          {localProduct.source === "github" && (
             <>
                {(localProduct.metadata.stars !== undefined) && (
                   <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/10 flex items-center gap-1">
                     <span className="text-yellow-500">â˜…</span> {localProduct.metadata.stars || 0}
                   </Badge>
                )}
                {(localProduct.metadata.starsToday !== undefined) && (
                   <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/10 flex items-center gap-1">
                     <TrendingUp className="w-3 h-3 text-green-500" /> +{localProduct.metadata.starsToday || 0} today
                   </Badge>
                )}
                {localProduct.metadata.language && (
                   <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/10">
                     {localProduct.metadata.language}
                   </Badge>
                )}
             </>
          )}

          {localProduct.source === "producthunt" && typeof localProduct.metadata.upvotes !== 'undefined' && (
             <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/10 flex items-center gap-1">
                <span className="text-orange-500">▲</span> {localProduct.metadata.upvotes}
             </Badge>
          )}

          {localProduct.source === "producthunt" && localProduct.metadata.trending && (
             <Badge variant="outline" className="rounded-none border-orange-500/50 font-mono text-[10px] uppercase bg-orange-500/10 text-orange-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Featured
             </Badge>
          )}

          {localProduct.source === "producthunt" && localProduct.tags && localProduct.tags.length > 0 && (
            localProduct.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase bg-secondary/10">
                {tag}
              </Badge>
            ))
          )}

        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-2">
            {localProduct.aiEnhanced && (
              <Badge variant="outline" className="rounded-none border-primary/30 text-primary bg-primary/5 font-mono text-[10px] uppercase">
                <Cable className="w-3 h-3 mr-1" /> AI Processed
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {localProduct.source === "producthunt" && onDeepScrape && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-none border-border font-mono text-xs uppercase h-8 hover:bg-secondary" 
                onClick={() => onDeepScrape(localProduct)}
                disabled={isDeepScraping}
              >
                {isDeepScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                {isDeepScraping ? '' : 'Deep'}
              </Button>
            )}
            <ProductEditorDialog product={localProduct} onProductUpdate={handleProductEdit} />
            {onProductDelete && (
              <Button size="sm" variant="outline" className="rounded-none border-destructive/50 text-destructive hover:bg-destructive hover:text-white font-mono text-xs uppercase h-8" onClick={handleDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
