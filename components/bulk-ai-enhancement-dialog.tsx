"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
              features: product.features,
              source: product.source,
              domain: product.domain,
            },
            tasks: ["summarize", "highlights", "domains"],
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
              description: enhancement.summary || updatedProducts[productIndex].description,
              features: enhancement.highlights || updatedProducts[productIndex].features,
              domain: enhancement.suggestedDomain || updatedProducts[productIndex].domain,
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
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Batch Matrix Inference
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Execute bulk transformation routines across datastore.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {!aiService ? (
            <Alert className="rounded-none border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="font-mono text-xs text-destructive">
                SYSTEM ERROR: No AI core parameters detected. Configure services subsystem before execution.
              </AlertDescription>
            </Alert>
          ) : totalToEnhance === 0 ? (
            <Alert className="rounded-none border-primary bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="font-mono text-xs text-primary">
                STATUS: Optimal. All records presently augmented.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="rounded-none border-border bg-secondary/10">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="font-mono text-xs text-muted-foreground">
                  TARGET LOCK: {totalToEnhance} unformatted entries found. Utilizing {aiService.provider.toUpperCase()} engine. Operation will command heavy throughput.
                </AlertDescription>
              </Alert>

              {isProcessing && (
                <div className="space-y-4 border border-border p-4 bg-background">
                  <div className="flex items-center justify-between font-mono text-xs uppercase">
                    <span className="text-muted-foreground">Process Progress</span>
                    <span className="text-primary">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2 rounded-none bg-secondary [&>div]:bg-primary" />

                  {currentProduct && (
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground border-t border-border pt-4">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span className="truncate">PROCESSING: {currentProduct}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-[10px]">
                      [SUCCESS: {completedCount}]
                    </Badge>
                    {failedCount > 0 && (
                      <Badge variant="outline" className="rounded-none border-destructive text-destructive font-mono text-[10px]">
                        [FAILURE: {failedCount}]
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!isProcessing && (completedCount > 0 || failedCount > 0) && (
                <div className="space-y-4 border border-border p-4 bg-background">
                  <div className="font-mono text-xs uppercase text-muted-foreground border-b border-border pb-2">Telemetry Results:</div>
                  
                  {results.success.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] text-primary uppercase">[+] Success Array ({results.success.length} items):</span>
                      <div className="font-mono text-xs text-muted-foreground ml-4 break-words bg-secondary/30 p-2 border-l border-primary/50">
                        {results.success.slice(0, 3).join(", ")}
                        {results.success.length > 3 && ` ... +${results.success.length - 3} additional nodes`}
                      </div>
                    </div>
                  )}
                  {results.failed.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] text-destructive uppercase">[-] Failure Array ({results.failed.length} items):</span>
                      <div className="font-mono text-xs text-destructive/80 ml-4 break-words bg-destructive/10 p-2 border-l border-destructive/50">
                        {results.failed.slice(0, 3).join(", ")}
                        {results.failed.length > 3 && ` ... +${results.failed.length - 3} additional nodes`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="flex-1 rounded-none font-mono uppercase h-14">
            {isProcessing ? "LOCKED" : "ABORT"}
          </Button>
          {aiService && totalToEnhance > 0 && !isProcessing && (
            <Button onClick={handleBulkEnhancement} className="flex-1 btn-brutal h-14 text-xs">
              <Sparkles className="h-4 w-4 mr-2" /> EXECUTE ({totalToEnhance})
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

