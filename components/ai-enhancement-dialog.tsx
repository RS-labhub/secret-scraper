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
import { loadFromStorage } from "@/lib/storage"
import type { AIServiceConfig } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Eye, EyeOff } from "lucide-react"
import type { Product } from "@/types/product"

interface AIEnhancementDialogProps {
  product: Product
  onEnhancementComplete: (productId: string, enhancements: any) => void
}

export function AIEnhancementDialog({ product, onEnhancementComplete }: AIEnhancementDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState("groq")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiServices, setAiServices] = useState<AIServiceConfig[]>([])
  
  // Load AI services configuration
  useEffect(() => {
    const savedServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
    if (savedServices.length > 0) {
      setAiServices(savedServices)
      
      // Set default provider to the first enabled service
      const enabledService = savedServices.find(s => s.enabled)
      if (enabledService) {
        setProvider(enabledService.provider)
        setApiKey(enabledService.apiKey)
      }
    }
  }, [])
  const [tasks, setTasks] = useState({
    summarize: true,
    highlights: true,
    tags: true,
    features: true, // Add features generation task
  })
  const [preview, setPreview] = useState<any>(null)

  // Build providers list from AI services configuration
  const providers = [
    { id: "groq", name: "Groq", requiresKey: false },
    { id: "gemini", name: "Gemini", requiresKey: false },
    { id: "openai", name: "OpenAI", requiresKey: true },
    { id: "anthropic", name: "Anthropic", requiresKey: true },
  ]

  // Find selected provider, preferring the version from aiServices if available
  const selectedProvider = aiServices.find(s => s.provider === provider) 
    ? { 
        id: provider, 
        name: providers.find(p => p.id === provider)?.name || provider, 
        requiresKey: provider === "openai" || provider === "anthropic" 
      }
    : providers.find((p) => p.id === provider)

  const handleEnhance = async () => {
    // Use API key from services if available
    const serviceConfig = aiServices.find(s => s.provider === provider)
    const currentApiKey = serviceConfig?.apiKey || apiKey
    
    if (selectedProvider?.requiresKey && !currentApiKey.trim()) {
      alert("Please enter your API key or configure it in AI Services")
      return
    }

    setLoading(true)

    try {
      const selectedTasks = Object.entries(tasks)
        .filter(([_, enabled]) => enabled)
        .map(([task, _]) => task)

      if (selectedTasks.length === 0) {
        alert("Please select at least one enhancement task")
        return
      }

      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          product: {
            name: product.name,
            description: product.description,
            tags: product.tags,
            features: product.features,
          },
          tasks: selectedTasks,
          apiKey: selectedProvider?.requiresKey ? (serviceConfig?.apiKey || apiKey) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Enhancement failed")
      }

      const result = await response.json()
      setPreview(result.enhancements)
    } catch (error) {
      console.error("Enhancement error:", error)
      alert(error instanceof Error ? error.message : "Enhancement failed")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (preview) {
      onEnhancementComplete(product.id, preview)
      setOpen(false)
      setPreview(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs px-2 py-1 bg-transparent">
          <Sparkles className="w-3 h-3 mr-1" />
          Enhance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Enhancement
          </DialogTitle>
          <DialogDescription>
            Use AI to enhance "{product.name}" with better descriptions, highlights, and tags.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Enhancement Tasks</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summarize"
                    checked={tasks.summarize}
                    onCheckedChange={(checked) => setTasks({ ...tasks, summarize: checked as boolean })}
                  />
                  <Label htmlFor="summarize" className="text-sm">
                    Generate compelling summary
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="highlights"
                    checked={tasks.highlights}
                    onCheckedChange={(checked) => setTasks({ ...tasks, highlights: checked as boolean })}
                  />
                  <Label htmlFor="highlights" className="text-sm">
                    Extract feature highlights
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tags"
                    checked={tasks.tags}
                    onCheckedChange={(checked) => setTasks({ ...tasks, tags: checked as boolean })}
                  />
                  <Label htmlFor="tags" className="text-sm">
                    Suggest relevant tags
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="features"
                    checked={tasks.features}
                    onCheckedChange={(checked) => setTasks({ ...tasks, features: checked as boolean })}
                  />
                  <Label htmlFor="features" className="text-sm">
                    Generate key features (3-5 points)
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEnhance} disabled={loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Enhancing..." : "Enhance with AI"}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Current Product</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {preview && (
              <div>
                <Label className="text-sm font-medium">AI Enhancements</Label>
                <div className="mt-2 space-y-3">
                  {preview.summary && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                      <Label className="text-xs font-medium text-accent">Enhanced Summary</Label>
                      <p className="text-sm mt-1">{preview.summary}</p>
                    </div>
                  )}

                  {preview.highlights && (
                    <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                      <Label className="text-xs font-medium text-secondary">Feature Highlights</Label>
                      <ul className="text-sm mt-1 space-y-1">
                        {preview.highlights.map((highlight: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-secondary">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview.suggestedTags && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <Label className="text-xs font-medium text-primary">Suggested Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {preview.suggestedTags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.features && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Label className="text-xs font-medium text-green-600">Generated Features</Label>
                      <ul className="text-sm mt-1 space-y-1">
                        {preview.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button onClick={handleApply} className="w-full">
                    Apply Enhancements
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
