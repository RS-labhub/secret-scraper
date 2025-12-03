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
import { Edit, X, Plus, Save, ExternalLink, Trash2, Github, Sparkles, Loader2, Undo2 } from "lucide-react"
import type { Product, AIServiceConfig, Domain } from "@/types/product"
import { DOMAINS } from "@/types/product"
import { loadFromStorage } from "@/lib/storage"

interface ProductEditorDialogProps {
  product: Product
  onProductUpdate: (productId: string, updates: Partial<Product>) => void
}

export function ProductEditorDialog({ product, onProductUpdate }: ProductEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Product>({ 
    ...product,
  })
  const [newFeature, setNewFeature] = useState("")
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)
  const [originalDescription, setOriginalDescription] = useState<string>("")
  const [aiDescription, setAiDescription] = useState<string>("")
  const [isShowingAi, setIsShowingAi] = useState(false)

  // Update editedProduct when the product prop changes or when dialog opens
  useEffect(() => {
    setEditedProduct({ 
      ...product,
    })
    // Check if product already has AI enhanced description
    if (product.aiEnhanced?.summary) {
      setAiDescription(product.aiEnhanced.summary)
      setOriginalDescription(product.description)
      setIsShowingAi(product.description === product.aiEnhanced.summary)
    }
  }, [product, open]) // Also trigger when dialog opens

  const handleSave = () => {
    console.log('Saving product:', editedProduct)
    onProductUpdate(product.id, editedProduct)
    setOpen(false)
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

  const clearAllFeatures = () => {
    setEditedProduct({
      ...editedProduct,
      features: [],
    })
  }

  const handleToggleDescription = () => {
    if (isShowingAi && originalDescription) {
      // Currently showing AI, switch to original
      setEditedProduct({
        ...editedProduct,
        description: originalDescription,
      })
      setIsShowingAi(false)
    } else if (!isShowingAi && aiDescription) {
      // Currently showing original, switch to AI
      setEditedProduct({
        ...editedProduct,
        description: aiDescription,
      })
      setIsShowingAi(true)
    }
  }

  const handleEnhanceWithAI = async () => {
    setIsEnhancing(true)
    setEnhancementError(null)
    
    // Save original description before enhancement
    setOriginalDescription(editedProduct.description)

    try {
      // Load AI service configuration
      const aiServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
      const enabledService = aiServices.find(s => s.enabled)
      
      if (!enabledService) {
        throw new Error("No AI service configured. Please configure an AI service first.")
      }

      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: enabledService.provider,
          product: {
            name: editedProduct.name,
            description: editedProduct.description,
            features: editedProduct.features,
            domain: editedProduct.domain,
          },
          tasks: ["summarize", "highlights", "domains"],
          apiKey: enabledService.apiKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Enhancement failed")
      }

      const result = await response.json()
      const enhancements = result.enhancements

      // Save AI description and update product
      setAiDescription(enhancements.summary || editedProduct.description)
      setIsShowingAi(true)
      
      setEditedProduct({
        ...editedProduct,
        description: enhancements.summary || editedProduct.description,
        features: enhancements.highlights || editedProduct.features,
        domain:
          enhancements.suggestedDomain ||
          (enhancements.suggestedDomains && enhancements.suggestedDomains.length > 0
            ? enhancements.suggestedDomains[0]
            : editedProduct.domain),
        aiEnhanced: {
          ...editedProduct.aiEnhanced,
          summary: enhancements.summary,
          originalLanguage: enhancements.originalLanguage,
          highlights: enhancements.highlights,
          suggestedDomain:
            enhancements.suggestedDomain ||
            (enhancements.suggestedDomains && enhancements.suggestedDomains.length > 0
              ? enhancements.suggestedDomains[0]
              : editedProduct.aiEnhanced?.suggestedDomain),
        },
      })
    } catch (error) {
      console.error("Enhancement error:", error)
      setEnhancementError(error instanceof Error ? error.message : "Enhancement failed")
    } finally {
      setIsEnhancing(false)
    }
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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-serif font-bold">Edit Product</DialogTitle>
              <DialogDescription>Customize product details, features, and preview the final card.</DialogDescription>
            </div>
            <Button 
              onClick={handleEnhanceWithAI} 
              disabled={isEnhancing}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>
          {enhancementError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              {enhancementError}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
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
                  <div className="relative">
                    <Textarea
                      id="description"
                      rows={4}
                      value={editedProduct.description}
                      onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                      className="pr-12"
                    />
                    {(originalDescription && aiDescription) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleDescription}
                        className="absolute top-2 right-2 h-8 w-8"
                        title={isShowingAi ? "Switch to original description" : "Switch to AI description"}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {editedProduct.aiEnhanced?.originalLanguage && (
                    <p className="text-xs text-muted-foreground">
                      Original language: {editedProduct.aiEnhanced.originalLanguage}
                    </p>
                  )}
                  {(originalDescription && aiDescription) && (
                    <p className="text-xs text-muted-foreground">
                      Currently showing: {isShowingAi ? "AI enhanced" : "Original"} description
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Select
                    value={editedProduct.domain || ""}
                    onValueChange={(value) =>
                      setEditedProduct({
                        ...editedProduct,
                        domain: value as Domain,
                      })
                    }
                  >
                    <SelectTrigger id="domain">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editedProduct.aiEnhanced?.suggestedDomain &&
                    editedProduct.aiEnhanced.suggestedDomain !== editedProduct.domain && (
                      <p className="text-xs text-muted-foreground">
                        AI suggestion: {editedProduct.aiEnhanced.suggestedDomain}.{" "}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() =>
                            setEditedProduct({
                              ...editedProduct,
                              domain: editedProduct.aiEnhanced?.suggestedDomain,
                            })
                          }
                        >
                          Apply suggestion
                        </button>
                      </p>
                    )}
                </div>

              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Information</Label>
                  <div className="p-3 bg-muted rounded-lg space-y-3">
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
                    <div className="space-y-2 pt-2 border-t border-muted">
                      <Label htmlFor="website" className="text-sm font-medium">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder={editedProduct.links.repository || "https://example.com"}
                        value={editedProduct.links.website || editedProduct.links.repository || ""}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            links: { ...editedProduct.links, website: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Features (Maximum 5)</Label>
                    <p className="text-sm text-muted-foreground">Add key features for the product</p>
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
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const updatedFeatures = [...editedProduct.features]
                          updatedFeatures[index] = e.target.value
                          setEditedProduct({
                            ...editedProduct,
                            features: updatedFeatures
                          })
                        }}
                        className="flex-1 h-8 text-sm"
                      />
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive mt-2"
                        onClick={() => removeFeature(feature)}
                      />
                    </div>
                  ))}
                  {editedProduct.features.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No features added yet. Add features manually or use AI enhancement.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addFeature()}
                    disabled={editedProduct.features.length >= 5}
                  />
                  <Button onClick={addFeature} size="sm" disabled={editedProduct.features.length >= 5}>
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
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        editedProduct.source === "github" 
                          ? "bg-gradient-to-br from-gray-700 to-gray-900" 
                          : editedProduct.metadata.sourceIcon 
                            ? "bg-transparent" 
                            : "bg-gradient-to-br from-orange-500 to-red-600"
                      }`}>
                        {editedProduct.source === "github" ? (
                          <Github className="w-7 h-7 text-white" />
                        ) : editedProduct.metadata.sourceIcon ? (
                          <img 
                            src={editedProduct.metadata.sourceIcon} 
                            alt="Product Hunt" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-5 h-5 text-white font-bold flex items-center justify-center">
                            🚀
                          </div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-serif font-bold">{editedProduct.name}</CardTitle>
                        <CardDescription className="text-sm capitalize">{editedProduct.source}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground">{editedProduct.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {editedProduct.description}
                  </p>

                  {editedProduct.domain && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Domain</div>
                      <Badge variant="secondary" className="text-xs">
                        {editedProduct.domain}
                      </Badge>
                    </div>
                  )}

                  {editedProduct.features && editedProduct.features.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-primary mb-2">Key Features</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {editedProduct.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-accent">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {editedProduct.metadata.stars && `⭐ ${editedProduct.metadata.stars}`}
                      {editedProduct.metadata.rating && `⭐ ${editedProduct.metadata.rating}`}
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
