"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, CheckCircle, XCircle, ExternalLink, Network } from "lucide-react"
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button disabled={approvedProducts.length === 0 || !cmsConfig} variant="outline" className="rounded-none border-border font-mono text-xs uppercase h-10 hover:bg-secondary">
          <Upload className="w-4 h-4 mr-2" />
          SYNC DEPLOY [{approvedProducts.length}]
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              Deployment Net
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Push {approvedProducts.length} verified packages to {cmsConfig?.provider || 'NULL'}.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {!cmsConfig ? (
            <div className="border border-destructive bg-destructive/10 p-6 text-center space-y-4">
              <Upload className="w-8 h-8 text-destructive mx-auto" />
              <h3 className="font-mono text-sm uppercase text-destructive font-bold">ROUTE_UNAVAILABLE</h3>
              <p className="font-mono text-[10px] text-destructive/80 uppercase">Define CMS uplink configuration matrix before initializing broadcast.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CMS Info */}
              <div className="border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="font-mono text-xs text-primary uppercase border-b border-primary/30 pb-2">Target Node</div>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-[10px] bg-black">SYS_{cmsConfig.provider.toUpperCase()}</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">READY_COUNT: {approvedProducts.length}</span>
                </div>
              </div>

              {/* Products to Publish */}
              <div className="border border-border p-4 bg-background">
                <h4 className="font-mono text-xs text-primary uppercase pb-3 border-b border-border">Manifest Sequence</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pt-3 pr-2">
                  {approvedProducts.slice(0, 10).map((product) => (
                    <div key={product.id} className="flex flex-col p-2 bg-secondary/20 border border-border/50">
                      <div className="flex justify-between items-center">
                        <p className="font-mono text-xs text-foreground truncate max-w-[200px]">{product.name}</p>
                        <Badge variant="outline" className="rounded-none border-border text-[9px] uppercase px-1 py-0">{product.status}</Badge>
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground mt-1 truncate">
                        SRC:{product.source} {product.domain && `| DOM:${product.domain}`}
                      </p>
                    </div>
                  ))}
                  {approvedProducts.length > 10 && (
                    <div className="p-2 text-[10px] font-mono text-center text-muted-foreground uppercase bg-secondary/10 border border-dashed border-border/50">
                      + {approvedProducts.length - 10} OVERFLOW PACKAGES
                    </div>
                  )}
                </div>
              </div>

              {/* Publishing Results */}
              {results && (
                <div className={`border p-4 ${results.success ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'}`}>
                  <div className="font-mono text-xs uppercase pb-3 border-b border-border mb-3 flex items-center gap-2">
                    {results.success ? <CheckCircle className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />}
                    <span className={results.success ? "text-primary" : "text-destructive"}>
                      TRANSMISSION {results.success ? "COMPLETE" : "HALTED"}
                    </span>
                  </div>
                  
                  {results.success ? (
                    <div className="space-y-4">
                      <div className="flex justify-between font-mono text-[10px] uppercase">
                        <span className="text-muted-foreground">VECTORS DELIVERED:</span>
                        <span className="text-primary font-bold">{results.published}</span>
                      </div>
                      {results.failed > 0 && (
                        <div className="flex justify-between font-mono text-[10px] uppercase">
                          <span className="text-muted-foreground">VECTORS DROPPED:</span>
                          <span className="text-destructive font-bold">{results.failed}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-destructive uppercase">{results.error}</p>
                  )}

                  {/* Individual Results */}
                  {results.results && (
                    <div className="mt-4 space-y-1 max-h-40 overflow-y-auto border-t border-border pt-3 pr-2">
                      {results.results.map((result: any, index: number) => (
                        <div key={index} className={`flex items-center justify-between p-2 font-mono text-[10px] border ${result.success ? 'border-primary/20 bg-primary/10 text-primary' : 'border-destructive/20 bg-destructive/10 text-destructive'}`}>
                          <span className="truncate max-w-[200px]">{result.productName}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {result.success ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                {result.url && (
                                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </>
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-none font-mono uppercase h-14">
            {results ? "CLOSE CHANNEL" : "ABORT"}
          </Button>
          {!results && cmsConfig && (
            <Button onClick={handlePublish} disabled={publishing} className="flex-1 btn-brutal h-14 text-xs">
              {publishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> UPLOADING...</> : <><Upload className="w-4 h-4 mr-2" /> EXECUTE SYNC</>}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

