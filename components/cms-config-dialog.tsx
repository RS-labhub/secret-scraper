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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, CheckCircle, XCircle, Eye, EyeOff, Plug } from "lucide-react"
import { CMS_PROVIDERS } from "@/lib/cms/providers"

interface CMSConfigDialogProps {
  onConfigSave: (provider: string, config: any) => void
  currentConfig?: { provider: string; config: any }
}

export function CMSConfigDialog({ onConfigSave, currentConfig }: CMSConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState(currentConfig?.provider || "contentful")
  const [config, setConfig] = useState(currentConfig?.config || {})
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const selectedProvider = CMS_PROVIDERS[provider as keyof typeof CMS_PROVIDERS]

  const handleConfigChange = (key: string, value: string) => {
    setConfig({ ...config, [key]: value })
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/cms/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          config,
        }),
      })

      const result = await response.json()
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? "UPLINK_ESTABLISHED" : "CONNECTION_REFUSED"),
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "SYSERR: FAILED_TO_PING_NODE",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    onConfigSave(provider, config)
    setOpen(false)
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })
  }

  const isConfigComplete = selectedProvider.configFields.every((field) => !field.required || config[field.key])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-none border-border font-mono text-xs uppercase h-10 hover:bg-secondary cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          CMS_CONFIG
          {currentConfig && (
            <Badge variant="outline" className="ml-2 rounded-none border-primary text-primary bg-primary/10 px-1 py-0 h-4 text-[9px] uppercase">
              {CMS_PROVIDERS[currentConfig.provider as keyof typeof CMS_PROVIDERS]?.name}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <Plug className="h-6 w-6 text-primary" />
              Node Interfaces
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Define authentication vectors for external target systems.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-8">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="font-mono text-xs text-primary uppercase border-b border-primary/20 pb-2 flex w-full">CMS_Provider_Select</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="cursor-pointer rounded-none border-border font-mono text-xs h-10 bg-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border font-mono text-xs">
                {Object.entries(CMS_PROVIDERS).map(([key, providerInstance]) => (
                  <SelectItem key={key} value={key} className="uppercase">
                    {providerInstance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration Fields */}
          <div className="space-y-4 border border-border p-4 bg-background">
            <Label className="font-mono text-xs uppercase text-muted-foreground block mb-4">Auth_Parameters</Label>
            {selectedProvider.configFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="font-mono text-[10px] uppercase text-muted-foreground">
                  {field.label.replace(/\s+/g, '_')}
                  {field.required && <span className="text-primary ml-1">*</span>}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={config[field.key] || ""}
                    onValueChange={(value) => handleConfigChange(field.key, value)}
                  >
                    <SelectTrigger className="rounded-none border-border font-mono text-xs bg-black h-10">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border font-mono text-xs">
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option} className="uppercase">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={config[field.key] || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      className="rounded-none border-border font-mono text-xs bg-black h-10 placeholder:text-muted-foreground/30 focus-visible:ring-primary"
                    />
                    {field.type === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 rounded-none hover:bg-secondary/50"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Test Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <Label className="font-mono text-xs uppercase">Diagnostics</Label>
              <Button onClick={handleTest} disabled={testing || !isConfigComplete} variant="outline" size="sm" className="rounded-none border-border font-mono text-[10px] uppercase h-8 cursor-pointer">
                {testing && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                {testing ? "PINGING..." : "PING_NODE"}
              </Button>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 font-mono text-xs uppercase border ${testResult.success ? "bg-primary/5 border-primary/30" : "bg-destructive/5 border-destructive/30"}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                <span className={`truncate ${testResult.success ? "text-primary" : "text-destructive"}`}>
                  {testResult.message}
                </span>
              </div>
            )}
          </div>

          {/* API Endpoint Info */}
          <div className="p-4 border border-dashed border-border bg-secondary/10">
            <Label className="font-mono text-[10px] uppercase text-muted-foreground block mb-2">Rest_Endpoint_Exposed</Label>
            <code className="text-xs font-mono bg-black p-2 border border-border block overflow-x-auto text-primary">
              GET {typeof window !== "undefined" ? window.location.origin : ""}/api/products
            </code>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-none font-mono uppercase h-14 cursor-pointer">
            ABORT
          </Button>
          <Button onClick={handleSave} disabled={!isConfigComplete} className="flex-1 btn-brutal h-14 text-xs cursor-pointer">
            COMMIT_MEM
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

