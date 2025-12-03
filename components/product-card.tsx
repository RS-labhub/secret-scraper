"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductEditorDialog } from "./product-editor-dialog"
import { Trash2, Github, ExternalLink, Calendar, TrendingUp, Undo2 } from "lucide-react"
import type { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
  onProductUpdate: (productId: string, updates: Partial<Product>) => void
  onProductDelete?: (productId: string) => void
}

export function ProductCard({ product, onProductUpdate, onProductDelete }: ProductCardProps) {
  const [localProduct, setLocalProduct] = useState(product)

  // Sync local state with prop changes (important for bulk operations)
  useEffect(() => {
    setLocalProduct(product)
  }, [product])

  const handleEnhancementComplete = (productId: string, enhancements: any) => {
    const updatedProduct = {
      ...localProduct,
      aiEnhanced: {
        ...localProduct.aiEnhanced,
        ...enhancements,
      },
      // Update actual features from AI highlights (2-3 features with 7-10 words each)
      features: enhancements.highlights || localProduct.features,
      // Update domain if AI suggested one
      domain:
        enhancements.suggestedDomain ||
        (enhancements.suggestedDomains && enhancements.suggestedDomains.length > 0
          ? enhancements.suggestedDomains[0]
          : localProduct.domain),
    }
    setLocalProduct(updatedProduct)
    onProductUpdate(productId, updatedProduct)
  }

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

  const handleDelete = () => {
    if (onProductDelete) {
      onProductDelete(localProduct.id)
    }
  }

  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  const getSourceIcon = (source: Product["source"]) => {
    if (source === "github") {
      return <Github className="w-7 h-7 text-white" />
    }
    
    // Use Product Hunt logo if available in metadata
    if (source === "producthunt" && localProduct.metadata.sourceIcon) {
      return (
        <img 
          src={localProduct.metadata.sourceIcon} 
          alt="Product Hunt" 
          className="w-full h-full object-cover rounded-lg"
        />
      )
    }
    
    return (
      <div className="w-5 h-5 text-white font-bold flex items-center justify-center">
        🚀
      </div>
    )
  }

  const getPrimaryLink = () => {
    if (localProduct.links.website) return localProduct.links.website
    if (localProduct.links.repository) return localProduct.links.repository
    if (localProduct.links.productHunt) return localProduct.links.productHunt
    return null
  }

  const getMetricsByTimePeriod = () => {
    const timePeriod = localProduct.metadata.timePeriod || 'daily'
    
    if (localProduct.source === "github") {
      const totalStars = localProduct.metadata.stars || 0
      let periodStars = 0
      let periodLabel = ""
      
      if (timePeriod === 'daily') {
        periodStars = localProduct.metadata.starsToday || 0
        periodLabel = "today"
      } else if (timePeriod === 'weekly') {
        periodStars = localProduct.metadata.starsWeekly || 0
        periodLabel = "this week"
      } else if (timePeriod === 'monthly') {
        periodStars = localProduct.metadata.starsMonthly || 0
        periodLabel = "this month"
      }
      
      return { total: totalStars, period: periodStars, periodLabel, icon: "⭐", type: "stars" }
    } else {
      const totalUpvotes = localProduct.metadata.upvotes || 0
      let periodUpvotes = 0
      let periodLabel = ""
      
      if (timePeriod === 'daily') {
        periodUpvotes = localProduct.metadata.upvotesToday || 0
        periodLabel = "today"
      } else if (timePeriod === 'weekly') {
        periodUpvotes = localProduct.metadata.upvotesWeekly || 0
        periodLabel = "this week"
      } else if (timePeriod === 'monthly') {
        periodUpvotes = localProduct.metadata.upvotesMonthly || 0
        periodLabel = "this month"
      }
      
      return { total: totalUpvotes, period: periodUpvotes, periodLabel, icon: "▲", type: "upvotes" }
    }
  }

  // Use AI-enhanced content if available
  const displayDescription = localProduct.aiEnhanced?.summary || localProduct.description
  const displayDomain = localProduct.aiEnhanced?.suggestedDomain || localProduct.domain
  const metrics = getMetricsByTimePeriod()
  
  // Ensure we have exactly 2-3 features
  const displayFeatures = localProduct.features.slice(0, 3)

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              localProduct.source === "github" 
                ? "bg-gradient-to-br from-gray-700 to-gray-900" 
                : localProduct.metadata.sourceIcon 
                  ? "bg-transparent" // No background for Product Hunt logo
                  : "bg-gradient-to-br from-orange-500 to-red-600"
            }`}>
              {getSourceIcon(localProduct.source)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-serif font-bold leading-tight truncate">
                  {localProduct.name}
                </CardTitle>
                {getPrimaryLink() && (
                  <a
                    href={getPrimaryLink()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <CardDescription className="text-sm flex items-center gap-2 mt-1 truncate">
                <span className="capitalize">{localProduct.source}</span>
                {localProduct.source === "github" && metrics.period > 0 && (
                  <span className="text-xs flex items-center gap-1 flex-shrink-0 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    +{metrics.period} {metrics.periodLabel}
                  </span>
                )}
                {localProduct.metadata.timePeriod && (
                  <Badge variant="outline" className="text-xs py-0 px-1 flex-shrink-0">
                    <Calendar className="w-3 h-3 mr-1" />
                    {localProduct.metadata.timePeriod}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap max-w-32">
            {localProduct.aiEnhanced && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                AI Enhanced
              </Badge>
            )}
            <Badge className={getStatusColor(localProduct.status) + " text-xs"}>{localProduct.status}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{displayDescription}</p>

        {/* Metrics Row */}
        {(metrics.total > 0 || metrics.period > 0) && (
          <div className="flex items-center gap-4 text-xs">
            {metrics.total > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground capitalize">{metrics.type}:</span>
                <span className="font-medium">{metrics.icon} {metrics.total.toLocaleString()}</span>
              </div>
            )}
            {/* {metrics.period > 0 && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">+{metrics.period} {metrics.periodLabel}</span>
              </div>
            )} */}
          </div>
        )}

        {/* Domain (only 1) */}
        {displayDomain && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Domain</div>
            <div className="flex flex-wrap gap-1 max-w-full">
              <Badge variant="secondary" className="text-xs py-0 px-2 truncate max-w-20">
                {displayDomain}
              </Badge>
            </div>
          </div>
        )}

        {/* Features */}
        {displayFeatures && displayFeatures.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Key Features</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {displayFeatures.map((feature, index) => (
                <li key={`feature-${index}`} className="flex items-start gap-2">
                  <span className="text-blue-500 text-[10px] mt-0.5 flex-shrink-0">•</span>
                  <span className="line-clamp-1 break-words">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {localProduct.metadata.scrapedAt && (
              <span>Scraped {new Date(localProduct.metadata.scrapedAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex gap-1">
            <ProductEditorDialog product={localProduct} onProductUpdate={handleProductEdit} />
            {localProduct.status === "pending" && (
              <Button size="sm" className="text-xs px-3 py-1 h-7" onClick={() => handleApproval("approved")}>
                Approve
              </Button>
            )}
            {localProduct.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-7 text-amber-600 hover:text-amber-700 bg-transparent border-amber-300 hover:border-amber-400"
                onClick={handleUnapprove}
                title="Un-approve (move back to pending)"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            )}
            {onProductDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-7 text-destructive hover:text-destructive bg-transparent"
                onClick={handleDelete}
                title="Delete product permanently"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
