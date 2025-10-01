"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import type { Product } from "@/types/product"

interface PublishDialogProps {
  products: Product[]
  cmsConfig?: { provider: string; config: any }
  onPublishComplete: (results: any) => void
}

export function PublishDialog({ products, cmsConfig, onPublishComplete }: PublishDialogProps) {
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const approvedProducts = products.filter((p) => p.status === "approved")

  const handlePublish = async () => {
    if (!cmsConfig) {
      alert("Please configure CMS settings first")
      return
    }

    setPublishing(true)
    setResults(null)

    try {
      const response = await fetch("/api/cms/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: cmsConfig.provider,
          config: cmsConfig.config,
          products: approvedProducts,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Publishing failed")
      }

      const publishResults = await response.json()
      setResults(publishResults)
      onPublishComplete(publishResults)
    } catch (error) {
      console.error("Publishing error:", error)
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Publishing failed",
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={approvedProducts.length === 0 || !cmsConfig} className="cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Publish to CMS ({approvedProducts.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold">Publish to CMS</DialogTitle>
          <DialogDescription>
            Publish {approvedProducts.length} approved products to your CMS.
            {!cmsConfig && " Please configure CMS settings first."}
          </DialogDescription>
        </DialogHeader>

        {!cmsConfig ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">CMS Not Configured</h3>
            <p className="text-muted-foreground mb-4">Configure your CMS integration to publish products</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CMS Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Publishing Destination</CardTitle>
                <CardDescription>Products will be published to your configured CMS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary">{cmsConfig.provider}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {approvedProducts.length} approved products ready to publish
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products to Publish */}
            <div className="space-y-3">
              <h4 className="font-medium">Products to Publish</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {approvedProducts.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.source} • {product.tags.slice(0, 3).join(", ")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.status}
                    </Badge>
                  </div>
                ))}
                {approvedProducts.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ...and {approvedProducts.length - 10} more products
                  </p>
                )}
              </div>
            </div>

            {/* Publishing Results */}
            {results && (
              <Card className={results.success ? "border-secondary/20" : "border-destructive/20"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {results.success ? (
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    Publishing {results.success ? "Complete" : "Failed"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Successfully published:</span>
                        <Badge variant="secondary">{results.published} products</Badge>
                      </div>
                      {results.failed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Failed to publish:</span>
                          <Badge variant="destructive">{results.failed} products</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">{results.error}</p>
                  )}

                  {/* Individual Results */}
                  {results.results && (
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                      {results.results.map((result: any, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded text-xs ${
                            result.success ? "bg-secondary/10" : "bg-destructive/10"
                          }`}
                        >
                          <span>{result.productName}</span>
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-secondary" />
                                {result.url && (
                                  <Button variant="ghost" size="sm" asChild className="h-auto p-0">
                                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                              </>
                            ) : (
                              <XCircle className="w-3 h-3 text-destructive" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {results ? "Close" : "Cancel"}
              </Button>
              {!results && (
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {publishing ? "Publishing..." : `Publish ${approvedProducts.length} Products`}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
