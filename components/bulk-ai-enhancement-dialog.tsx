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
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Product } from "@/types/product"
import { logAction } from "@/components/action-logger"
import { loadFromStorage } from "@/lib/storage"
import type { AIServiceConfig } from "@/types/product"

interface BulkAIEnhancementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onProductsUpdated: (products: Product[]) => void
}

export function BulkAIEnhancementDialog({
  open,
  onOpenChange,
  products,
  onProductsUpdated,
}: BulkAIEnhancementDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentProduct, setCurrentProduct] = useState<string>("")
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [results, setResults] = useState<{ success: string[]; failed: string[] }>({
    success: [],
    failed: [],
  })
  const [aiService, setAiService] = useState<AIServiceConfig | null>(null)

  // Load AI service configuration
  useEffect(() => {
    const savedServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
    const enabledService = savedServices.find(service => service.enabled && service.apiKey)
    setAiService(enabledService || null)
  }, [open])

  // Filter products that haven't been AI enhanced yet
  const unenhancedProducts = products.filter(product => !product.aiEnhanced)
  const totalToEnhance = unenhancedProducts.length

  const handleBulkEnhancement = async () => {
    if (totalToEnhance === 0) return

    if (!aiService) {
      logAction("error", "No AI service configured. Please configure an AI service first.")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setCompletedCount(0)
    setFailedCount(0)
    setResults({ success: [], failed: [] })

    logAction("info", `Starting bulk AI enhancement for ${totalToEnhance} products using ${aiService.provider}`)

    const updatedProducts = [...products]
    let completed = 0
    let failed = 0
    const successList: string[] = []
    const failedList: string[] = []

    for (let i = 0; i < unenhancedProducts.length; i++) {
      const product = unenhancedProducts[i]
      setCurrentProduct(product.name)
      
      try {
        const response = await fetch("/api/ai/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: aiService.provider,
            apiKey: aiService.apiKey,
            product: {
              name: product.name,
              description: product.description,
              tags: product.tags,
              features: product.features,
              source: product.source,
              pricing: product.pricing,
            },
            tasks: ["summarize", "highlights", "tags", "domains", "categories"],
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const enhancement = result.enhancements
          
          // Find and update the product in the array
          const productIndex = updatedProducts.findIndex(p => p.id === product.id)
          if (productIndex !== -1) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              aiEnhanced: enhancement,
            }
          }
          
          completed++
          successList.push(product.name)
          logAction("success", `Enhanced: ${product.name}`)
        } else {
          const errorData = await response.json()
          failed++
          failedList.push(product.name)
          logAction("error", `Failed to enhance: ${product.name} - ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        failed++
        failedList.push(product.name)
        logAction("error", `Error enhancing ${product.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      // Update progress
      const progressPercent = ((i + 1) / totalToEnhance) * 100
      setProgress(progressPercent)
      setCompletedCount(completed)
      setFailedCount(failed)
      setResults({ success: successList, failed: failedList })

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update the products in the parent component
    onProductsUpdated(updatedProducts)
    
    setIsProcessing(false)
    setCurrentProduct("")
    
    logAction("info", `Bulk enhancement completed: ${completed} success, ${failed} failed`)
  }

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false)
      // Reset state when closing
      setTimeout(() => {
        setProgress(0)
        setCompletedCount(0)
        setFailedCount(0)
        setCurrentProduct("")
        setResults({ success: [], failed: [] })
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Bulk AI Enhancement
          </DialogTitle>
          <DialogDescription>
            Enhance multiple products with AI-generated summaries, highlights, and tags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!aiService ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No AI service configured. Please configure an AI service in the AI Manager first.
              </AlertDescription>
            </Alert>
          ) : totalToEnhance === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All products have already been AI enhanced!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will enhance {totalToEnhance} products using {aiService.provider}. The process may take several minutes.
                </AlertDescription>
              </Alert>

              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  
                  {currentProduct && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Processing: {currentProduct}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600">
                      ✓ {completedCount} completed
                    </Badge>
                    {failedCount > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        ✗ {failedCount} failed
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!isProcessing && (completedCount > 0 || failedCount > 0) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Results:</div>
                  {results.success.length > 0 && (
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">✓ Enhanced ({results.success.length}):</span>
                      <div className="text-muted-foreground ml-4">
                        {results.success.slice(0, 3).join(", ")}
                        {results.success.length > 3 && ` and ${results.success.length - 3} more...`}
                      </div>
                    </div>
                  )}
                  {results.failed.length > 0 && (
                    <div className="text-sm">
                      <span className="text-red-600 font-medium">✗ Failed ({results.failed.length}):</span>
                      <div className="text-muted-foreground ml-4">
                        {results.failed.slice(0, 3).join(", ")}
                        {results.failed.length > 3 && ` and ${results.failed.length - 3} more...`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Close"}
          </Button>
          {aiService && totalToEnhance > 0 && !isProcessing && (
            <Button onClick={handleBulkEnhancement}>
              <Sparkles className="h-4 w-4 mr-2" />
              Enhance All ({totalToEnhance})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
