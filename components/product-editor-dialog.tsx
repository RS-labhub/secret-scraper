"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, X, Plus, Save, ExternalLink, Trash2 } from "lucide-react"
import type { Product } from "@/types/product"

interface ProductEditorDialogProps {
  product: Product
  onProductUpdate: (productId: string, updates: Partial<Product>) => void
}

export function ProductEditorDialog({ product, onProductUpdate }: ProductEditorDialogProps) {
  const [open, setOpen] = useState(false)
  // Initialize with current tags (not AI suggestions) to ensure manual edits are preserved
  const [editedProduct, setEditedProduct] = useState<Product>({ 
    ...product,
    // Ensure we start with the actual tags, not AI suggestions
    tags: product.tags || []
  })
  const [newTag, setNewTag] = useState("")
  const [newFeature, setNewFeature] = useState("")

  // Update editedProduct when the product prop changes or when dialog opens
  useEffect(() => {
    setEditedProduct({ 
      ...product,
      // Ensure we start with the actual tags, not AI suggestions
      tags: product.tags || []
    })
  }, [product, open]) // Also trigger when dialog opens

  const handleSave = () => {
    console.log('Saving product with tags:', editedProduct.tags)
    console.log('Full edited product:', editedProduct)
    onProductUpdate(product.id, editedProduct)
    setOpen(false)
  }

  const addTag = () => {
    if (newTag.trim() && !editedProduct.tags.includes(newTag.trim())) {
      setEditedProduct({
        ...editedProduct,
        tags: [...editedProduct.tags, newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    console.log('Removing tag:', tagToRemove)
    console.log('Current tags:', editedProduct.tags)
    const newTags = editedProduct.tags.filter((tag) => tag !== tagToRemove)
    console.log('New tags after removal:', newTags)
    setEditedProduct({
      ...editedProduct,
      tags: newTags,
    })
  }

  const addFeature = () => {
    if (newFeature.trim() && !editedProduct.features.includes(newFeature.trim())) {
      setEditedProduct({
        ...editedProduct,
        features: [...editedProduct.features, newFeature.trim()],
      })
      setNewFeature("")
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setEditedProduct({
      ...editedProduct,
      features: editedProduct.features.filter((feature) => feature !== featureToRemove),
    })
  }

  const clearAllTags = () => {
    setEditedProduct({
      ...editedProduct,
      tags: [],
    })
  }

  const clearAllFeatures = () => {
    setEditedProduct({
      ...editedProduct,
      features: [],
    })
  }

  const updatePricing = (type: "free" | "paid" | "freemium") => {
    setEditedProduct({
      ...editedProduct,
      pricing: { ...editedProduct.pricing, type },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs px-2 py-1 bg-transparent">
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold">Edit Product</DialogTitle>
          <DialogDescription>Customize product details, features, and preview the final card.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="features">Features & Tags</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={editedProduct.name}
                    onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={editedProduct.description}
                    onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    value={editedProduct.links.website || ""}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        links: { ...editedProduct.links, website: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select
                    value={editedProduct.pricing?.type || "free"}
                    onValueChange={(value: "free" | "paid" | "freemium") => updatePricing(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Information</Label>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Source:</span>
                      <Badge variant="outline" className="capitalize">
                        {editedProduct.source}
                      </Badge>
                    </div>
                    {editedProduct.links.repository && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Repository:</span>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={editedProduct.links.repository} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    )}
                    {editedProduct.metadata.stars && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Stars:</span>
                        <span className="text-sm">{editedProduct.metadata.stars}</span>
                      </div>
                    )}
                  </div>
                </div>

                {editedProduct.aiEnhanced && (
                  <div className="space-y-2">
                    <Label>AI Enhanced Content</Label>
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                      <div className="text-xs font-medium text-accent mb-2">AI Summary</div>
                      <p className="text-sm">{editedProduct.aiEnhanced.summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tags */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Tags</Label>
                    <p className="text-sm text-muted-foreground">Add relevant categories and keywords</p>
                  </div>
                  {editedProduct.tags.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllTags}
                      className="gap-2 text-destructive hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg">
                  {editedProduct.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 group">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-1 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeTag(tag)
                        }}
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="w-3 h-3 cursor-pointer hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {editedProduct.aiEnhanced?.suggestedTags && (
                  <div>
                    <Label className="text-sm font-medium text-accent">AI Suggested Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editedProduct.aiEnhanced.suggestedTags
                        .filter((tag) => !editedProduct.tags.includes(tag))
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent/10"
                            onClick={() => {
                              setEditedProduct({
                                ...editedProduct,
                                tags: [...editedProduct.tags, tag],
                              })
                            }}
                          >
                            + {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Features</Label>
                    <p className="text-sm text-muted-foreground">Key features and capabilities</p>
                  </div>
                  {editedProduct.features.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFeatures}
                      className="gap-2 text-destructive hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-2 min-h-[60px] p-3 border rounded-lg">
                  {editedProduct.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span className="text-sm flex-1">{feature}</span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground"
                        onClick={() => removeFeature(feature)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addFeature()}
                  />
                  <Button onClick={addFeature} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {editedProduct.aiEnhanced?.highlights && (
                  <div>
                    <Label className="text-sm font-medium text-primary">AI Suggested Features</Label>
                    <div className="space-y-1 mt-2">
                      {editedProduct.aiEnhanced.highlights
                        .filter((highlight) => !editedProduct.features.includes(highlight))
                        .map((highlight, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 bg-accent/5 border border-accent/20 rounded cursor-pointer hover:bg-accent/10"
                            onClick={() => {
                              setEditedProduct({
                                ...editedProduct,
                                features: [...editedProduct.features, highlight],
                              })
                            }}
                          >
                            + {highlight}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div>
              <Label className="text-base font-medium">Card Preview</Label>
              <p className="text-sm text-muted-foreground">Preview how your product card will appear</p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {editedProduct.source === "github" ? "🐙" : "🚀"}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base font-serif font-bold">{editedProduct.name}</CardTitle>
                        <CardDescription className="text-sm capitalize">{editedProduct.source}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editedProduct.aiEnhanced && (
                        <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                          AI Enhanced
                        </Badge>
                      )}
                      <Badge className="bg-muted text-muted-foreground">{editedProduct.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {editedProduct.aiEnhanced?.summary || editedProduct.description}
                  </p>

                  {editedProduct.aiEnhanced?.highlights && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-primary mb-2">Key Features</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {editedProduct.aiEnhanced.highlights.slice(0, 3).map((highlight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-accent">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(editedProduct.aiEnhanced?.suggestedTags || editedProduct.tags).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(editedProduct.aiEnhanced?.suggestedTags || editedProduct.tags).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(editedProduct.aiEnhanced?.suggestedTags || editedProduct.tags).length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {editedProduct.metadata.stars && `⭐ ${editedProduct.metadata.stars}`}
                      {editedProduct.metadata.rating && `⭐ ${editedProduct.metadata.rating}`}
                      {editedProduct.pricing && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {editedProduct.pricing.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
