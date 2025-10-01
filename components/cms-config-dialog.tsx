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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"
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
    setTestResult(null) // Clear test result when config changes
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
        message: result.message || (result.success ? "Connection successful" : "Connection failed"),
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          CMS Settings
          {currentConfig && (
            <Badge variant="secondary" className="ml-2">
              {CMS_PROVIDERS[currentConfig.provider as keyof typeof CMS_PROVIDERS]?.name}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold">CMS Integration Settings</DialogTitle>
          <DialogDescription>
            Configure your CMS connection to publish approved products automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>CMS Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CMS_PROVIDERS).map(([key, providerInstance]) => (
                  <SelectItem key={key} value={key}>
                    {providerInstance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration Fields */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Configuration</Label>
            {selectedProvider.configFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={config[field.key] || ""}
                    onValueChange={(value) => handleConfigChange(field.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
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
                    />
                    {field.type === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Test Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Test Connection</Label>
              <Button onClick={handleTest} disabled={testing || !isConfigComplete} size="sm" className="cursor-pointer">
                {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {testing ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {testResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResult.success
                    ? "bg-secondary/10 border border-secondary/20"
                    : "bg-destructive/10 border border-destructive/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-secondary" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm ${testResult.success ? "text-secondary" : "text-destructive"}`}>
                  {testResult.message}
                </span>
              </div>
            )}
          </div>

          {/* API Endpoint Info */}
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">API Endpoint</Label>
            <p className="text-sm text-muted-foreground mt-1">External systems can fetch approved products from:</p>
            <code className="text-xs bg-background p-2 rounded mt-2 block">
              GET {typeof window !== "undefined" ? window.location.origin : ""}/api/products
            </code>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isConfigComplete} className="cursor-pointer">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
