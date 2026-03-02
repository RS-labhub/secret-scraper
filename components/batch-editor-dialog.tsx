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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit3, Save, X, Plus } from "lucide-react"
import { DOMAINS } from "@/types/product"
import type { Domain, Product } from "@/types/product"

type BatchUpdatePayload = Partial<Product> & {
  featureOperations?: {
    add?: string[]
    remove?: string[]
  }
}

type BatchUpdatesState = {
  status?: Product["status"]
  domain?: Domain
  addFeatures?: string[]
  removeFeatures?: string[]
}

interface BatchEditorDialogProps {
  selectedProducts: Product[]
  onBatchUpdate: (productIds: string[], updates: BatchUpdatePayload) => void
  onClearSelection: () => void
}

export function BatchEditorDialog({ selectedProducts, onBatchUpdate, onClearSelection }: BatchEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [batchUpdates, setBatchUpdates] = useState<BatchUpdatesState>({})
  const [newFeature, setNewFeature] = useState("")
  const [featureToRemove, setFeatureToRemove] = useState("")

  const handleSave = () => {
    if (selectedProducts.length === 0) return

    const updates: BatchUpdatePayload = {}

    if (batchUpdates.status) {
      updates.status = batchUpdates.status
    }

    if (batchUpdates.domain) {
      updates.domain = batchUpdates.domain
    }

    if (batchUpdates.addFeatures?.length || batchUpdates.removeFeatures?.length) {
      updates.featureOperations = {
        add: batchUpdates.addFeatures || [],
        remove: batchUpdates.removeFeatures || [],
      }
    }

    const productIds = selectedProducts.map((p) => p.id)
    onBatchUpdate(productIds, updates)
    setOpen(false)
    onClearSelection()
    setBatchUpdates({})
  }

  const addFeatureToBatch = (type: "add" | "remove") => {
    const value = type === "add" ? newFeature : featureToRemove
    if (!value.trim()) return

    if (type === "add") {
      setBatchUpdates((prev) => ({
        ...prev,
        addFeatures: [...(prev.addFeatures || []), value.trim()],
      }))
      setNewFeature("")
    } else {
      setBatchUpdates((prev) => ({
        ...prev,
        removeFeatures: [...(prev.removeFeatures || []), value.trim()],
      }))
      setFeatureToRemove("")
    }
  }

  type FeatureBatchKey = "addFeatures" | "removeFeatures"

  const removeFeatureFromBatch = (type: FeatureBatchKey, item: string) => {
    setBatchUpdates((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((i) => i !== item),
    }))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="btn-brutal h-8 text-xs px-3">
          <Edit3 className="w-3 h-3 mr-2" />
          BATCH [{selectedProducts.length}]
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl md:max-w-3xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter">Bulk Mutation</SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Push mass parameter updates to {selectedProducts.length} selected entities.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-none h-12 p-1">
              <TabsTrigger value="status" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Core Meta</TabsTrigger>
              <TabsTrigger value="features" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Feature Adjust</TabsTrigger>
            </TabsList>

            <div className="mt-6 border border-border p-6 bg-secondary/10">
              <TabsContent value="status" className="space-y-6 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-mono text-xs uppercase text-muted-foreground">FORCE STATUS</Label>
                      <p className="text-[10px] text-muted-foreground/70 uppercase">OVERRIDE APPROVAL STATE</p>
                    </div>
                    <Select value={batchUpdates.status || ""} onValueChange={(value: Product["status"]) => setBatchUpdates({ ...batchUpdates, status: value })}>
                      <SelectTrigger className="rounded-none border-border font-mono h-10">
                        <SelectValue placeholder="STATUS_OVERRIDE" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-mono text-xs">
                        <SelectItem value="pending">PENDING</SelectItem>
                        <SelectItem value="approved">APPROVED</SelectItem>
                        <SelectItem value="rejected">REJECTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="font-mono text-xs uppercase text-muted-foreground">FORCE DOMAIN</Label>
                      <p className="text-[10px] text-muted-foreground/70 uppercase">OVERRIDE VECTOR SPACE</p>
                    </div>
                    <Select value={batchUpdates.domain || ""} onValueChange={(value) => setBatchUpdates({ ...batchUpdates, domain: value as Domain })}>
                      <SelectTrigger className="rounded-none border-border font-mono h-10">
                        <SelectValue placeholder="DOMAIN_OVERRIDE" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-mono text-xs">
                        {DOMAINS.map((domain) => (
                          <SelectItem key={domain} value={domain} className="uppercase">{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 border border-border bg-black mt-6">
                  <Label className="font-mono text-xs uppercase text-primary">TARGET MATRIX ({selectedProducts.length})</Label>
                  <div className="mt-3 space-y-2">
                    {selectedProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="text-xs font-mono flex items-center justify-between border-b border-border/50 pb-1">
                        <span className="truncate max-w-[200px] text-muted-foreground">{product.name}</span>
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase border-border">{product.status}</Badge>
                      </div>
                    ))}
                    {selectedProducts.length > 5 && (
                      <div className="font-mono text-[10px] text-muted-foreground uppercase pt-2">...AND {selectedProducts.length - 5} ADDITIONAL NODES</div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-8 m-0">
                {/* Add Features */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-xs uppercase text-primary">INJECT FEATURE</Label>
                    <p className="text-[10px] text-muted-foreground uppercase">APPEND TO SELECTED GROUPS</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input placeholder="TYPE_FEATURE_STRING..." value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFeatureToBatch("add")} className="rounded-none border-border font-mono h-10 text-xs" />
                    <Button onClick={() => addFeatureToBatch("add")} className="rounded-none h-10 w-10 p-0 text-white bg-primary hover:bg-primary/80"><Plus className="w-4 h-4 text-black" /></Button>
                  </div>

                  <div className="min-h-[40px] border border-border p-2 bg-black space-y-1">
                    {!batchUpdates.addFeatures?.length && <div className="text-[10px] font-mono text-muted-foreground text-center py-2">NO_INJECTION_QUEUED</div>}
                    {batchUpdates.addFeatures?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-1 bg-primary/10 border border-primary/20">
                        <span className="font-mono text-[10px] text-primary flex-1 pl-2">+{feature}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-primary hover:text-black" onClick={() => removeFeatureFromBatch("addFeatures", feature)}><X className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remove Features */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <Label className="font-mono text-xs uppercase text-destructive">PURGE FEATURE</Label>
                    <p className="text-[10px] text-muted-foreground uppercase">EXCISE EXACT MATCHES</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input placeholder="TYPE_EXACT_MATCH..." value={featureToRemove} onChange={(e) => setFeatureToRemove(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFeatureToBatch("remove")} className="rounded-none border-border font-mono h-10 text-xs" />
                    <Button variant="destructive" onClick={() => addFeatureToBatch("remove")} className="rounded-none h-10 w-10 p-0"><X className="w-4 h-4" /></Button>
                  </div>

                  <div className="min-h-[40px] border border-border p-2 bg-black space-y-1">
                    {!batchUpdates.removeFeatures?.length && <div className="text-[10px] font-mono text-muted-foreground text-center py-2">NO_PURGE_QUEUED</div>}
                    {batchUpdates.removeFeatures?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-1 bg-destructive/10 border border-destructive/20">
                        <span className="font-mono text-[10px] text-destructive flex-1 pl-2">-{feature}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-destructive hover:text-white" onClick={() => removeFeatureFromBatch("removeFeatures", feature)}><X className="w-3 h-3 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-none font-mono uppercase h-14">
            ABORT
          </Button>
          <Button onClick={handleSave} className="flex-1 btn-brutal h-14 text-xs">
            <Save className="w-4 h-4 mr-2" /> FORCE SYNC
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

