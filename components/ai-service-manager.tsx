"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Loader2, AlertCircle, CheckCircle, Network, Key, Terminal } from "lucide-react"
import type { AIServiceConfig } from "@/types/product"
import { loadFromStorage, saveToStorage } from "@/lib/storage"

interface AIServiceManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigChange?: (services: AIServiceConfig[]) => void
}

export function AIServiceManager({ open, onOpenChange, onConfigChange }: AIServiceManagerProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("openai")
  const [apiKey, setApiKey] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [currentConfig, setCurrentConfig] = useState<AIServiceConfig | null>(null)

  const providers = [
    { value: "openai", label: "OPENAI", description: "GPT Models (Standard Compute)" },
    { value: "anthropic", label: "ANTHROPIC", description: "Claude Models (Deep Analysis)" },
    { value: "groq", label: "GROQ", description: "Llama Models (High Velocity Inference)" },
    { value: "gemini", label: "GOOGLE GEMINI", description: "Gemini Models (Multimodal)" },
  ]

  // Load current configuration
  useEffect(() => {
    if (open) {
      const savedServices = loadFromStorage<AIServiceConfig[]>("aiServices", [])
      const activeService = savedServices.find(service => service.enabled)

      if (activeService) {
        setSelectedProvider(activeService.provider)
        setApiKey(activeService.apiKey)
        setCurrentConfig(activeService)
        setIsConnected(true)
        setTestResult({ success: true, message: "UPLINK ESTABLISHED. NODE READY." })
      } else {
        // Reset state when opening
        setSelectedProvider("openai")
        setApiKey("")
        setIsConnected(false)
        setTestResult(null)
        setCurrentConfig(null)
      }
    }
  }, [open])

  const getApiKeyPlaceholder = (provider: string) => {
    switch (provider) {
      case "openai": return "sk-..."
      case "anthropic": return "sk-ant-..."
      case "groq": return "gsk_..."
      case "gemini": return "AI..."
      default: return "INPUT_AUTH_TOKEN..."
    }
  }

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "AUTH_TOKEN_MISSING" })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({ success: true, message: "HANDSHAKE SUCCESSFUL. NODE VERIFIED." })
        setIsConnected(true)
      } else {
        setTestResult({ success: false, message: data.error || "UPLINK_FAILED" })
        setIsConnected(false)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `ERR_NETWORK: ${error instanceof Error ? error.message : "UNKNOWN_FATAL_ERROR"}`
      })
      setIsConnected(false)
    } finally {
      setIsTesting(false)
    }
  }

  const saveConfiguration = () => {
    if (!isConnected) {
      setTestResult({ success: false, message: "ERR: MUST_TEST_UPLINK_FIRST" })
      return
    }

    const newConfig: AIServiceConfig = {
      provider: selectedProvider as any,
      apiKey: apiKey.trim(),
      model: getDefaultModel(selectedProvider),
      enabled: true,
    }

    // Save as the only enabled service (disable others)
    const allServices: AIServiceConfig[] = providers.map(provider => ({
      provider: provider.value as any,
      apiKey: provider.value === selectedProvider ? apiKey.trim() : "",
      model: getDefaultModel(provider.value),
      enabled: provider.value === selectedProvider,
    }))

    saveToStorage("aiServices", allServices)
    setCurrentConfig(newConfig)

    if (onConfigChange) {
      onConfigChange(allServices)
    }

    setTestResult({ success: true, message: "CONFIGURATION_LOCKED. SYSTEMS_NOMINAL." })
  }

  const getDefaultModel = (provider: string) => {
    switch (provider) {
      case "openai": return "gpt-4o-mini"
      case "anthropic": return "claude-3-haiku-20240307"
      case "groq": return "llama-3.1-8b-instant"
      case "gemini": return "gemini-2.0-flash"
      default: return ""
    }
  }

  const disconnect = () => {
    setApiKey("")
    setIsConnected(false)
    setTestResult(null)
    setCurrentConfig(null)

    // Clear all services
    saveToStorage("aiServices", [])
    if (onConfigChange) {
      onConfigChange([])
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              Intelligence Core
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Configure remote neural networking parameters.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {/* Current Status */}
          {currentConfig && (
            <div className="border border-primary bg-primary/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>LINK ACTIVE: {providers.find((p) => p.value === currentConfig.provider)?.label}</span>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect} className="rounded-none h-8 font-mono text-[10px] border-primary text-primary hover:bg-primary hover:text-black">
                SEVER LINK
              </Button>
            </div>
          )}

          <div className="space-y-6 border border-border p-6 bg-secondary/10">
            {/* Provider Selection */}
            <div className="space-y-3">
              <Label className="font-mono text-xs uppercase text-muted-foreground">Core Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isConnected}>
                <SelectTrigger className="rounded-none border-border font-mono h-10">
                  <SelectValue placeholder="SELECT_NODE" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  {providers.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value} className="font-mono text-xs focus:bg-primary focus:text-black">
                      <div className="flex flex-col text-left">
                        <span>{provider.label}</span>
                        <span className="text-[10px] opacity-70">{provider.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <Label htmlFor="apiKey" className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                <Key className="w-3 h-3" /> Auth Token
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={getApiKeyPlaceholder(selectedProvider)}
                    disabled={isConnected}
                    className="rounded-none border-border font-mono h-10"
                  />
                  {!isConnected && (
                    <p className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> ACQUIRE KEY:{" "}
                      {selectedProvider === "openai" && <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PLATFORM.OPENAI.COM</a>}
                      {selectedProvider === "anthropic" && <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CONSOLE.ANTHROPIC.COM</a>}
                      {selectedProvider === "groq" && <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CONSOLE.GROQ.COM</a>}
                      {selectedProvider === "gemini" && <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AISTUDIO.GOOGLE.COM</a>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Test Action inline */}
            {!isConnected && (
              <Button
                onClick={testConnection}
                disabled={!apiKey.trim() || isTesting}
                variant="outline"
                className="w-full rounded-none font-mono text-xs uppercase border-border h-10 hover:bg-white hover:text-black transition-colors"
              >
                {isTesting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> INTERROGATING NODE</> : "PING SERVER (TEST LINK)"}
              </Button>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert className={`rounded-none border-l-4 p-4 ${testResult.success ? "border-l-primary border-primary/20 bg-primary/10" : "border-l-destructive border-destructive/20 bg-destructive/10"}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
              <AlertDescription className={`font-mono text-[10px] uppercase ml-2 ${testResult.success ? "text-primary" : "text-destructive"}`}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Info Block */}
          <div className="border border-border bg-black p-4 space-y-2 font-mono text-[10px] uppercase text-muted-foreground">
            <p className="text-primary">SYSTEM DIRECTIVES:</p>
            <ul className="space-y-1 ml-2 list-disc list-inside marker:text-primary">
              <li>Select preferred compute engine.</li>
              <li>Inject valid authentication token.</li>
              <li>Ping server to verify handshake.</li>
              <li>Commit configuration to memory block.</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-none font-mono uppercase h-14">
            Close Panel
          </Button>
          {isConnected && !currentConfig && (
            <Button onClick={saveConfiguration} className="flex-1 btn-brutal h-14 text-xs">
              <Brain className="w-5 h-5 mr-2" /> COMMIT LINK
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

