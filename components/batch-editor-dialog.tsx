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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit3, Save, X, Plus } from "lucide-react"
import type { Product } from "@/types/product"

interface BatchEditorDialogProps {
  selectedProducts: Product[]
  onBatchUpdate: (productIds: string[], updates: Partial<Product>) => void
  onClearSelection: () => void
}

export function BatchEditorDialog({ selectedProducts, onBatchUpdate, onClearSelection }: BatchEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [batchUpdates, setBatchUpdates] = useState<{
    status?: Product["status"]
    addTags?: string[]
    removeTags?: string[]
    addFeatures?: string[]
    removeFeatures?: string[]
    pricing?: Product["pricing"]
  }>({})
  const [newTag, setNewTag] = useState("")
  const [newFeature, setNewFeature] = useState("")

  const handleSave = () => {
    const updates: Partial<Product> = {}

    if (batchUpdates.status) {
      updates.status = batchUpdates.status
    }

    if (batchUpdates.pricing) {
      updates.pricing = batchUpdates.pricing
    }

    // Handle tag updates
    if (batchUpdates.addTags?.length || batchUpdates.removeTags?.length) {
      updates.tags = selectedProducts[0].tags // This will be processed per product
    }

    // Handle feature updates
    if (batchUpdates.addFeatures?.length || batchUpdates.removeFeatures?.length) {
      updates.features = selectedProducts[0].features // This will be processed per product
    }

    const productIds = selectedProducts.map((p) => p.id)
    onBatchUpdate(productIds, { ...updates, batchUpdates })
    setOpen(false)
    onClearSelection()
    setBatchUpdates({})
  }

  const addTagToBatch = (type: "add" | "remove") => {
    if (!newTag.trim()) return

    if (type === "add") {
      setBatchUpdates({
        ...batchUpdates,
        addTags: [...(batchUpdates.addTags || []), newTag.trim()],
      })
    } else {
      setBatchUpdates({
        ...batchUpdates,
        removeTags: [...(batchUpdates.removeTags || []), newTag.trim()],
      })
    }
    setNewTag("")
  }

  const addFeatureToBatch = (type: "add" | "remove") => {
    if (!newFeature.trim()) return

    if (type === "add") {
      setBatchUpdates({
        ...batchUpdates,
        addFeatures: [...(batchUpdates.addFeatures || []), newFeature.trim()],
      })
    } else {
      setBatchUpdates({
        ...batchUpdates,
        removeFeatures: [...(batchUpdates.removeFeatures || []), newFeature.trim()],
      })
    }
    setNewFeature("")
  }

  const removeFromBatch = (type: "addTags" | "removeTags" | "addFeatures" | "removeFeatures", item: string) => {
    setBatchUpdates({
      ...batchUpdates,
      [type]: batchUpdates[type]?.filter((i) => i !== item),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent hover:bg-accent/90">
          <Edit3 className="w-4 h-4 mr-2" />
          Batch Edit ({selectedProducts.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold">Batch Edit Products</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedProducts.length} selected products simultaneously.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status & Pricing</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Update Status</Label>
                  <p className="text-sm text-muted-foreground">Change approval status for all selected products</p>
                </div>

                <Select
                  value={batchUpdates.status || ""}
                  onValueChange={(value: Product["status"]) => setBatchUpdates({ ...batchUpdates, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Update Pricing</Label>
                  <p className="text-sm text-muted-foreground">Set pricing model for all selected products</p>
                </div>

                <Select
                  value={batchUpdates.pricing?.type || ""}
                  onValueChange={(value: "free" | "paid" | "freemium") =>
                    setBatchUpdates({ ...batchUpdates, pricing: { type: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Selected Products</Label>
              <div className="mt-2 space-y-1">
                {selectedProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="text-sm flex items-center justify-between">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {product.status}
                    </Badge>
                  </div>
                ))}
                {selectedProducts.length > 5 && (
                  <div className="text-sm text-muted-foreground">...and {selectedProducts.length - 5} more</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Tags */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Add Tags</Label>
                  <p className="text-sm text-muted-foreground">Tags to add to all selected products</p>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg">
                  {batchUpdates.addTags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      + {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromBatch("addTags", tag)} />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTagToBatch("add")}
                  />
                  <Button onClick={() => addTagToBatch("add")} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Remove Tags */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Remove Tags</Label>
                  <p className="text-sm text-muted-foreground">Tags to remove from all selected products</p>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg">
                  {batchUpdates.removeTags?.map((tag) => (
                    <Badge key={tag} variant="destructive" className="flex items-center gap-1">
                      - {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromBatch("removeTags", tag)} />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Remove tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTagToBatch("remove")}
                  />
                  <Button onClick={() => addTagToBatch("remove")} size="sm" variant="destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Features */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Add Features</Label>
                  <p className="text-sm text-muted-foreground">Features to add to all selected products</p>
                </div>

                <div className="space-y-2 min-h-[60px] p-3 border rounded-lg">
                  {batchUpdates.addFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-secondary/10 rounded">
                      <span className="text-sm flex-1">+ {feature}</span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground"
                        onClick={() => removeFromBatch("addFeatures", feature)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addFeatureToBatch("add")}
                  />
                  <Button onClick={() => addFeatureToBatch("add")} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Remove Features */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Remove Features</Label>
                  <p className="text-sm text-muted-foreground">Features to remove from all selected products</p>
                </div>

                <div className="space-y-2 min-h-[60px] p-3 border rounded-lg">
                  {batchUpdates.removeFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                      <span className="text-sm flex-1">- {feature}</span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground"
                        onClick={() => removeFromBatch("removeFeatures", feature)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Remove feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addFeatureToBatch("remove")}
                  />
                  <Button onClick={() => addFeatureToBatch("remove")} size="sm" variant="destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Apply to {selectedProducts.length} Products
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
