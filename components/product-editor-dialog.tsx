"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, X, Plus, Save, ExternalLink, Trash2, Github, Sparkles, Loader2, Undo2, Search } from "lucide-react"
import type { Product, AIServiceConfig, Domain } from "@/types/product"
import { DOMAINS } from "@/types/product"
import { loadFromStorage, storage } from "@/lib/storage"

interface ProductEditorDialogProps {
  product: Product
  onProductUpdate: (productId: string, updates: Partial<Product>) => void
}

export function ProductEditorDialog({ product, onProductUpdate }: ProductEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product })
  const [newFeature, setNewFeature] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isDeepScraping, setIsDeepScraping] = useState(false)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)
  const [originalDescription, setOriginalDescription] = useState<string>("")
  const [aiDescription, setAiDescription] = useState<string>("")
  const [isShowingAi, setIsShowingAi] = useState(false)

  useEffect(() => {
    setEditedProduct({ ...product })
    if (product.aiEnhanced?.summary) {
      setAiDescription(product.aiEnhanced.summary)
      setOriginalDescription(product.description)
      setIsShowingAi(product.description === product.aiEnhanced.summary)
    }
  }, [product, open])

  const handleSave = () => {
    onProductUpdate(product.id, editedProduct)
    setOpen(false)
  }

  const addFeature = () => {
    if (newFeature.trim() && !editedProduct.features.includes(newFeature.trim())) {
      setEditedProduct({ ...editedProduct, features: [...editedProduct.features, newFeature.trim()] })
      setNewFeature("")
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setEditedProduct({ ...editedProduct, features: editedProduct.features.filter((feature) => feature !== featureToRemove) })
  }

  const addTag = () => {
    if (newTag.trim() && !(editedProduct.tags || []).includes(newTag.trim())) {
      setEditedProduct({ ...editedProduct, tags: [...(editedProduct.tags || []), newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEditedProduct({ ...editedProduct, tags: (editedProduct.tags || []).filter((tag) => tag !== tagToRemove) })
  }

  const handleToggleDescription = () => {
    if (isShowingAi && originalDescription) {
      setEditedProduct({ ...editedProduct, description: originalDescription })
      setIsShowingAi(false)
    } else if (!isShowingAi && aiDescription) {
      setEditedProduct({ ...editedProduct, description: aiDescription })
      setIsShowingAi(true)
    }
  }

  const handleEnhanceWithAI = async () => {
    setIsEnhancing(true)
    setEnhancementError(null)
    setOriginalDescription(editedProduct.description)

    try {
      const aiServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
      const enabledService = aiServices.find(s => s.enabled)
      if (!enabledService) throw new Error("No AI service configured.")

      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: enabledService.provider,
          product: { name: editedProduct.name, description: editedProduct.description, features: editedProduct.features, domain: editedProduct.domain },
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

      setAiDescription(enhancements.summary || editedProduct.description)
      setIsShowingAi(true)
      
      setEditedProduct({
        ...editedProduct,
        description: enhancements.summary || editedProduct.description,
        features: enhancements.highlights || editedProduct.features,
        domain: enhancements.suggestedDomain || (enhancements.suggestedDomains && enhancements.suggestedDomains.length > 0 ? enhancements.suggestedDomains[0] : editedProduct.domain),
        aiEnhanced: {
          ...editedProduct.aiEnhanced,
          summary: enhancements.summary,
          originalLanguage: enhancements.originalLanguage,
          highlights: enhancements.highlights,
          suggestedDomain: enhancements.suggestedDomain || (enhancements.suggestedDomains && enhancements.suggestedDomains.length > 0 ? enhancements.suggestedDomains[0] : editedProduct.aiEnhanced?.suggestedDomain),
        },
      })
    } catch (error) {
      setEnhancementError(error instanceof Error ? error.message : "Enhancement failed")
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleDeepScrape = async () => {
    if (editedProduct.source !== 'producthunt' || !editedProduct.links.productHunt) return

    setIsDeepScraping(true)
    setEnhancementError(null)

    try {
      const firecrawlApiKey = storage.loadFirecrawlApiKey()
      if (!firecrawlApiKey) throw new Error("Firecrawl API key not configured. Set it in the Scrape dialog first.")

      const response = await fetch("/api/scrape/deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: [editedProduct], firecrawlApiKey }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Deep scrape failed")
      }

      const result = await response.json()
      if (result.products && result.products.length > 0) {
        const enhanced = result.products[0]
        setEditedProduct({
          ...editedProduct,
          description: enhanced.description || editedProduct.description,
          links: { ...editedProduct.links, ...enhanced.links },
        })
      }
    } catch (error) {
      setEnhancementError(error instanceof Error ? error.message : "Deep scrape failed")
    } finally {
      setIsDeepScraping(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-none border-border font-mono text-xs uppercase h-8 hover:bg-secondary">
          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10 flex justify-between items-start">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter">Edit Sequence</SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Modify intelligence data manually or utilize AI augmentation.</SheetDescription>
          </SheetHeader>
          <div className="flex gap-2">
            {editedProduct.source === 'producthunt' && (
              <Button onClick={handleDeepScrape} disabled={isDeepScraping} variant="outline" className="rounded-none h-10 px-4 text-xs border-border">
                {isDeepScraping ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Scraping...</> : <><Search className="w-4 h-4 mr-2" /> Deep Scrape</>}
              </Button>
            )}
            <Button onClick={handleEnhanceWithAI} disabled={isEnhancing} className="btn-brutal h-10 px-4 text-xs">
              {isEnhancing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enhancing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Enhance with AI</>}
            </Button>
          </div>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {enhancementError && <div className="text-xs bg-destructive/10 text-destructive p-3 font-mono border border-destructive/20">{enhancementError}</div>}
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-none h-12 p-1">
              <TabsTrigger value="details" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Core Details</TabsTrigger>
              <TabsTrigger value="features" className="rounded-none font-mono uppercase text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Features Data</TabsTrigger>
            </TabsList>

            <div className="mt-6 border border-border p-6 bg-secondary/10">
              <TabsContent value="details" className="space-y-6 m-0">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Entity Name</Label>
                  <Input value={editedProduct.name} onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })} className="rounded-none border-border font-mono h-10" />
                </div>
                
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground flex justify-between">
                    Description Plot
                    {(originalDescription && aiDescription) && (
                      <span className="text-primary flex items-center gap-1 cursor-pointer" onClick={handleToggleDescription}>
                        <Undo2 className="h-3 w-3" /> {isShowingAi ? "Revert to Original" : "Show AI Generated"}
                      </span>
                    )}
                  </Label>
                  <Textarea rows={6} value={editedProduct.description} onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })} className="rounded-none border-border font-mono resize-none" />
                </div>

                {editedProduct.source !== 'producthunt' && (
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Vector Domain</Label>
                  <Select value={editedProduct.domain || ""} onValueChange={(value) => setEditedProduct({ ...editedProduct, domain: value as Domain })}>
                    <SelectTrigger className="rounded-none border-border h-10 font-mono">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {DOMAINS.map((domain) => <SelectItem key={domain} value={domain}>{domain}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {editedProduct.aiEnhanced?.suggestedDomain && editedProduct.aiEnhanced.suggestedDomain !== editedProduct.domain && (
                    <p className="text-[10px] font-mono text-muted-foreground">
                      AI SUGGESTION: {editedProduct.aiEnhanced.suggestedDomain}. 
                      <button type="button" className="text-primary underline ml-2" onClick={() => setEditedProduct({ ...editedProduct, domain: editedProduct.aiEnhanced?.suggestedDomain })}>APPLY</button>
                    </p>
                  )}
                </div>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">URL References</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="font-mono text-[10px] uppercase w-24 text-muted-foreground">Website</Label>
                      <Input type="url" placeholder="https://..." value={editedProduct.links?.website || ""} onChange={(e) => setEditedProduct({ ...editedProduct, links: { ...editedProduct.links, website: e.target.value } })} className="rounded-none border-border font-mono h-8 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="font-mono text-[10px] uppercase w-24 text-muted-foreground">Repository</Label>
                      <Input type="url" placeholder="https://github.com/..." value={editedProduct.links?.repository || ""} onChange={(e) => setEditedProduct({ ...editedProduct, links: { ...editedProduct.links, repository: e.target.value } })} className="rounded-none border-border font-mono h-8 text-xs" />
                    </div>
                    {editedProduct.source !== 'github' && (
                      <div className="flex items-center gap-2">
                        <Label className="font-mono text-[10px] uppercase w-24 text-muted-foreground">Product Hunt</Label>
                        <Input type="url" placeholder="https://producthunt.com/..." value={editedProduct.links?.productHunt || ""} onChange={(e) => setEditedProduct({ ...editedProduct, links: { ...editedProduct.links, productHunt: e.target.value } })} className="rounded-none border-border font-mono h-8 text-xs" />
                      </div>
                    )}
                    {editedProduct.source !== 'github' && (
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] uppercase text-muted-foreground">Social Links</Label>
                        <div className="space-y-1.5 mb-2">
                          {(editedProduct.links?.social || []).map((url, index) => {
                            const socialLabel = url.includes('x.com') ? 'X / Twitter' :
                              url.includes('twitter.com') ? 'Twitter' :
                              url.includes('linkedin.com') ? 'LinkedIn' :
                              url.includes('discord.gg') || url.includes('discord.com') ? 'Discord' :
                              url.includes('youtube.com') ? 'YouTube' :
                              url.includes('facebook.com') ? 'Facebook' :
                              url.includes('instagram.com') ? 'Instagram' :
                              url.includes('tiktok.com') ? 'TikTok' :
                              url.includes('bsky.app') ? 'Bluesky' :
                              url.includes('threads.net') ? 'Threads' :
                              url.includes('mastodon') ? 'Mastodon' :
                              'Social';
                            return (
                              <div key={index} className="flex items-center gap-2 group">
                                <span className="font-mono text-[10px] uppercase text-muted-foreground w-24 shrink-0">{socialLabel}</span>
                                <span className="text-xs font-mono text-foreground truncate flex-1">{url}</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                  title={`Open ${socialLabel}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                  onClick={() => {
                                    setEditedProduct({
                                      ...editedProduct,
                                      links: {
                                        ...editedProduct.links,
                                        social: (editedProduct.links?.social || []).filter((_, i) => i !== index)
                                      }
                                    });
                                  }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          {(!editedProduct.links?.social || editedProduct.links.social.length === 0) && (
                            <span className="text-[10px] text-muted-foreground font-mono">No social links. Use Deep Scrape to discover them.</span>
                          )}
                        </div>
                        <Input
                          placeholder="Add social URL (e.g., https://x.com/handle)..."
                          className="rounded-none border-border font-mono h-8 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && val.startsWith('http')) {
                                setEditedProduct({
                                  ...editedProduct,
                                  links: {
                                    ...editedProduct.links,
                                    social: [...(editedProduct.links?.social || []), val]
                                  }
                                });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Metadata</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {editedProduct.source === "github" && (
                      <>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">Language</Label>
                          <Input value={editedProduct.metadata?.language || ""} onChange={(e) => setEditedProduct({ ...editedProduct, metadata: { ...editedProduct.metadata, language: e.target.value } })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">License</Label>
                          <Input value={editedProduct.metadata?.license || ""} onChange={(e) => setEditedProduct({ ...editedProduct, metadata: { ...editedProduct.metadata, license: e.target.value } })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                      </>
                    )}
                    {editedProduct.source === "github" ? (
                      <>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">Stars</Label>
                          <Input type="number" value={editedProduct.metadata?.stars || 0} onChange={(e) => setEditedProduct({ ...editedProduct, metadata: { ...editedProduct.metadata, stars: Number(e.target.value) } })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">Forks</Label>
                          <Input type="number" value={editedProduct.metadata?.forks || 0} onChange={(e) => setEditedProduct({ ...editedProduct, metadata: { ...editedProduct.metadata, forks: Number(e.target.value) } })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">Upvotes</Label>
                          <Input type="number" value={editedProduct.metadata?.upvotes || 0} onChange={(e) => setEditedProduct({ ...editedProduct, metadata: { ...editedProduct.metadata, upvotes: Number(e.target.value) } })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-mono text-[10px] uppercase text-muted-foreground">Source</Label>
                          <Input value={editedProduct.source} onChange={(e) => setEditedProduct({ ...editedProduct, source: e.target.value as "github" | "producthunt" })} className="rounded-none border-border font-mono h-8 text-xs" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-6 m-0">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Feature Array (Max 5)</Label>
                  <div className="space-y-2 mb-4">
                    {editedProduct.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={feature} onChange={(e) => {
                            const uf = [...editedProduct.features]; uf[index] = e.target.value;
                            setEditedProduct({ ...editedProduct, features: uf })
                          }} 
                          className="rounded-none border-border font-mono h-10 flex-1" 
                        />
                        <Button variant="outline" className="rounded-none h-10 w-10 p-0 border-border text-muted-foreground" onClick={() => removeFeature(feature)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input placeholder="Append feature..." value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyPress={(e) => e.key === "Enter" && addFeature()} disabled={editedProduct.features.length >= 5} className="rounded-none border-border font-mono h-10" />
                    <Button onClick={addFeature} disabled={editedProduct.features.length >= 5} className="rounded-none h-10 px-4">
                      ADD
                    </Button>
                  </div>
                </div>

                {editedProduct.aiEnhanced?.highlights && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <Label className="font-mono text-xs uppercase text-primary">AI Suggestions</Label>
                    <div className="space-y-2">
                      {editedProduct.aiEnhanced.highlights.filter(h => !editedProduct.features.includes(h)).map((h, i) => (
                        <div key={i} className="text-xs font-mono p-3 border border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setEditedProduct({ ...editedProduct, features: [...editedProduct.features, h] })}>
                          + {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editedProduct.source === 'producthunt' && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <Label className="font-mono text-xs uppercase text-muted-foreground">Tags / Topics</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(editedProduct.tags || []).map((tag, index) => (
                        <Badge key={index} variant="outline" className="rounded-none border-border font-mono text-xs cursor-pointer hover:bg-destructive/20 hover:border-destructive/50 transition-colors" onClick={() => removeTag(tag)}>
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {(!editedProduct.tags || editedProduct.tags.length === 0) && (
                        <span className="text-xs text-muted-foreground font-mono">No tags added yet.</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === "Enter" && addTag()} className="rounded-none border-border font-mono h-10" />
                      <Button onClick={addTag} className="rounded-none h-10 px-4">
                        ADD
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4">
          <Button variant="outline" className="flex-1 rounded-none font-mono uppercase h-14" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1 btn-brutal h-14" onClick={handleSave}>
            <Save className="w-5 h-5 mr-2" /> Commit Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

