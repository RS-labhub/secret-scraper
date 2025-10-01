"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Loader2, AlertCircle, CheckCircle } from "lucide-react"
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
    { value: "openai", label: "OpenAI", description: "GPT models for general AI tasks" },
    { value: "anthropic", label: "Anthropic", description: "Claude models for detailed analysis" },
    { value: "groq", label: "Groq", description: "Fast inference with Llama models" },
    { value: "gemini", label: "Google Gemini", description: "Google's multimodal AI" },
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
        setTestResult({ success: true, message: "Connected and ready" })
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
      case "openai":
        return "sk-..."
      case "anthropic":
        return "sk-ant-..."
      case "groq":
        return "gsk_..."
      case "gemini":
        return "AI..."
      default:
        return "Enter API key"
    }
  }

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API key" })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      let testEndpoint = ""
      let testPayload = {}
      let headers: Record<string, string> = {
        "Content-Type": "application/json"
      }

      switch (selectedProvider) {
        case "openai":
          testEndpoint = "https://api.openai.com/v1/chat/completions"
          headers["Authorization"] = `Bearer ${apiKey}`
          testPayload = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "What is an apple?" }],
            max_tokens: 50
          }
          break

        case "anthropic":
          testEndpoint = "https://api.anthropic.com/v1/messages"
          headers["x-api-key"] = apiKey
          headers["anthropic-version"] = "2023-06-01"
          testPayload = {
            model: "claude-3-haiku-20240307",
            max_tokens: 50,
            messages: [{ role: "user", content: "What is an apple?" }]
          }
          break

        case "groq":
          testEndpoint = "https://api.groq.com/openai/v1/chat/completions"
          headers["Authorization"] = `Bearer ${apiKey}`
          testPayload = {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "What is an apple?" }],
            max_tokens: 50
          }
          break

        case "gemini":
          testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
          testPayload = {
            contents: [{ parts: [{ text: "What is an apple?" }] }]
          }
          break
      }

      const response = await fetch(testEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful! API key is valid." })
        setIsConnected(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = "Connection failed"
        
        if (response.status === 401) {
          errorMessage = "Invalid API key"
        } else if (response.status === 429) {
          errorMessage = "API quota exceeded or rate limit reached"
        } else if (response.status === 403) {
          errorMessage = "Access forbidden - check your API key permissions"
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        setTestResult({ success: false, message: errorMessage })
        setIsConnected(false)
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}` 
      })
      setIsConnected(false)
    } finally {
      setIsTesting(false)
    }
  }

  const saveConfiguration = () => {
    if (!isConnected) {
      setTestResult({ success: false, message: "Please test the connection first" })
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

    setTestResult({ success: true, message: "Configuration saved successfully!" })
  }

  const getDefaultModel = (provider: string) => {
    switch (provider) {
      case "openai": return "gpt-3.5-turbo"
      case "anthropic": return "claude-3-haiku-20240307"
      case "groq": return "llama-3.1-8b-instant"
      case "gemini": return "gemini-pro"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Service Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          {currentConfig && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Currently connected to {providers.find(p => p.value === currentConfig.provider)?.label}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnect} className="cursor-pointer">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Choose AI Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isConnected}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex flex-col">
                      <span>{provider.label}</span>
                      <span className="text-xs text-muted-foreground">{provider.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={getApiKeyPlaceholder(selectedProvider)}
                  disabled={isConnected}
                />
                {selectedProvider === "openai" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      OpenAI platform
                    </a>
                  </p>
                )}
                {selectedProvider === "anthropic" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anthropic console
                    </a>
                  </p>
                )}
                {selectedProvider === "groq" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Groq console
                    </a>
                  </p>
                )}
                {selectedProvider === "gemini" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Google AI Studio
                    </a>
                  </p>
                )}
              </div>
              <Button 
                onClick={testConnection} 
                disabled={!apiKey.trim() || isTesting || isConnected}
                variant="outline"
                className="cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing
                  </>
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Save Configuration */}
          {isConnected && !currentConfig && (
            <Button onClick={saveConfiguration} className="w-full">
              Save Configuration
            </Button>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">How it works:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Choose your preferred AI provider</li>
                  <li>• Enter your API key and test the connection</li>
                  <li>• Once connected, the AI will enhance your scraped products</li>
                  <li>• Only one provider can be active at a time</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
