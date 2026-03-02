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
import { loadFromStorage } from "@/lib/storage"
import type { AIServiceConfig } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, BrainCircuit, Scan } from "lucide-react"
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
  const [aiServices, setAiServices] = useState<AIServiceConfig[]>([])
  
  useEffect(() => {
    const savedServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
    if (savedServices.length > 0) {
      setAiServices(savedServices)
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
    domain: true,
    features: true,
  })
  const [preview, setPreview] = useState<any>(null)

  const providers = [
    { id: "groq", name: "Groq", requiresKey: false },
    { id: "gemini", name: "Gemini", requiresKey: false },
    { id: "openai", name: "OpenAI", requiresKey: true },
    { id: "anthropic", name: "Anthropic", requiresKey: true },
  ]

  const selectedProvider = aiServices.find(s => s.provider === provider)
    ? {
        id: provider,
        name: providers.find(p => p.id === provider)?.name || provider,
        requiresKey: provider === "openai" || provider === "anthropic"
      }
    : providers.find((p) => p.id === provider)

  const handleEnhance = async () => {
    const serviceConfig = aiServices.find(s => s.provider === provider)
    const currentApiKey = serviceConfig?.apiKey || apiKey

    if (selectedProvider?.requiresKey && !currentApiKey.trim()) {
      alert("SYS_HALT: MISSING_AUTH_VECTOR. Configure API Key.")
      return
    }

    setLoading(true)

    try {
      const selectedTasks = Object.entries(tasks)
        .filter(([_, enabled]) => enabled)
        .map(([task, _]) => task)

      if (selectedTasks.length === 0) {
        alert("SYS_HALT: NO_MUTATION_TASKS_SELECTED")
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
            features: product.features,
            domain: product.domain,
          },
          tasks: selectedTasks,
          apiKey: selectedProvider?.requiresKey ? (serviceConfig?.apiKey || apiKey) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "MIND_MERGE_FAILED")
      }

      const result = await response.json()
      setPreview(result.enhancements)
    } catch (error) {
      console.error("Enhancement error:", error)
      alert(error instanceof Error ? error.message : "MIND_MERGE_FAILED")
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="font-mono text-[9px] uppercase px-2 py-1 rounded-none border-primary text-primary hover:bg-primary hover:text-black">
          <BrainCircuit className="w-3 h-3 mr-1" />
          MIND_MERGE
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              Intelligence Vector
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Execute neural enhancements on "{product.name}".
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-mono text-xs text-primary uppercase border-b border-primary/20 pb-2 flex w-full">Neural_Core</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="rounded-none border-border font-mono text-[10px] uppercase bg-black h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border font-mono text-[10px]">
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="uppercase">
                        SYS_{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase text-muted-foreground block mb-4">Mutation_Directives</Label>
                <div className="space-y-3 font-mono text-[10px] uppercase">
                  <div className="flex items-start space-x-3 p-2 border border-border/50 bg-secondary/10">
                    <Checkbox id="summarize" checked={tasks.summarize} onCheckedChange={(c) => setTasks({ ...tasks, summarize: c as boolean })} className="mt-0.5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border" />
                    <Label htmlFor="summarize" className="leading-tight">Synthesize Context Matrix</Label>
                  </div>
                  <div className="flex items-start space-x-3 p-2 border border-border/50 bg-secondary/10">
                    <Checkbox id="highlights" checked={tasks.highlights} onCheckedChange={(c) => setTasks({ ...tasks, highlights: c as boolean })} className="mt-0.5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border" />
                    <Label htmlFor="highlights" className="leading-tight">Extract Primary Nodes</Label>
                  </div>
                  <div className="flex items-start space-x-3 p-2 border border-border/50 bg-secondary/10">
                    <Checkbox id="features" checked={tasks.features} onCheckedChange={(c) => setTasks({ ...tasks, features: c as boolean })} className="mt-0.5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border" />
                    <Label htmlFor="features" className="leading-tight">Auto-Generate Features</Label>
                  </div>
                  <div className="flex items-start space-x-3 p-2 border border-border/50 bg-secondary/10">
                    <Checkbox id="domain" checked={tasks.domain} onCheckedChange={(c) => setTasks({ ...tasks, domain: c as boolean })} className="mt-0.5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border" />
                    <Label htmlFor="domain" className="leading-tight">Optimize TLD Routing</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleEnhance} disabled={loading} variant="outline" className="w-full rounded-none border-primary text-primary hover:bg-primary/20 font-mono text-[10px] uppercase h-10">
                {loading ? <><Scan className="w-3 h-3 mr-2 animate-spin" /> ESTABLISHING_LINK...</> : <><Sparkles className="w-3 h-3 mr-2" /> INITIALIZE_INFERENCE</>}
              </Button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="border border-border bg-black p-4">
                <Label className="font-mono text-[10px] uppercase text-muted-foreground border-b border-border pb-1 block mb-3">Origin_State</Label>
                <div className="space-y-2 font-mono">
                  <h4 className="text-xs text-primary truncate">{product.name}</h4>
                  <p className="text-[9px] text-muted-foreground line-clamp-4">{product.description}</p>
                  {product.domain && (
                    <Badge variant="outline" className="rounded-none border-border px-1 py-0 text-[8px] bg-secondary/30 mt-2">
                      DOM: {product.domain}
                    </Badge>
                  )}
                </div>
              </div>

              {preview && (
                <div className="border border-primary bg-primary/5 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Label className="font-mono text-xs uppercase text-primary border-b border-primary/30 pb-1 flex justify-between items-center mb-3">
                    Mutated_State <span className="text-[9px] text-primary/50">MEM_READY</span>
                  </Label>
                  
                  {preview.summary && (
                    <div className="space-y-1">
                      <Label className="font-mono text-[8px] uppercase text-primary/70">Context_Matrix</Label>
                      <p className="font-mono text-[9px] bg-black border border-primary/20 p-2">{preview.summary}</p>
                    </div>
                  )}

                  {preview.highlights && (
                    <div className="space-y-1">
                      <Label className="font-mono text-[8px] uppercase text-primary/70">Primary_Nodes</Label>
                      <ul className="font-mono text-[9px] space-y-1 bg-black border border-primary/20 p-2">
                        {preview.highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-primary">
                            <span className="opacity-50">&gt;</span> <span className="text-foreground">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview.features && (
                    <div className="space-y-1">
                      <Label className="font-mono text-[8px] uppercase text-primary/70">Inferred_Features</Label>
                      <ul className="font-mono text-[9px] space-y-1 bg-black border border-primary/20 p-2">
                        {preview.features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-primary">
                            <span className="opacity-50">+</span> <span className="text-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview.suggestedDomain && (
                    <div className="space-y-1">
                      <Label className="font-mono text-[8px] uppercase text-primary/70">TLD_Route</Label>
                      <p className="font-mono text-[10px] font-bold bg-black border border-primary/20 p-2 text-primary">{preview.suggestedDomain}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={() => { setOpen(false); setPreview(null); }} className="flex-1 rounded-none font-mono uppercase h-14 cursor-pointer">
            DISCONNECT
          </Button>
          <Button onClick={handleApply} disabled={!preview} className="flex-1 btn-brutal h-14 text-xs cursor-pointer">
            COMMIT_MUTATION
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

