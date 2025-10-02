"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, Database, Code, Eye, Settings, Edit, Save, X, Layers } from "lucide-react"
import { format as formatDate } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ProductExporter } from "@/lib/export/formats"
import { SchemaBuilderDialog } from "@/components/schema-builder-dialog"
import { CustomSchema, SchemaManager } from "@/lib/schema/schema-manager"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
  selectedProducts: string[]
  onProductsUpdate?: (products: any[]) => void
}

export function ExportDialog({ open, onOpenChange, products, selectedProducts, onProductsUpdate }: ExportDialogProps) {
  const [format, setFormat] = useState<"json" | "csv" | "xml" | "markdown">("json")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeAiEnhancements, setIncludeAiEnhancements] = useState(true)
  const [useSelectedOnly, setUseSelectedOnly] = useState(false)
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({})
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLimit, setPreviewLimit] = useState(5)
  const [previewMode, setPreviewMode] = useState<'fixed' | 'all' | 'custom'>('all')
  const [customRange, setCustomRange] = useState('')
  const [customRangeError, setCustomRangeError] = useState('')
  const [editablePreview, setEditablePreview] = useState("")
  const [isPreviewEdited, setIsPreviewEdited] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Custom Schema functionality
  const [useCustomSchema, setUseCustomSchema] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<CustomSchema | null>(null)
  const [showSchemaBuilder, setShowSchemaBuilder] = useState(false)
  const [schemas, setSchemas] = useState<CustomSchema[]>([])

  // Load schemas when dialog opens
  useEffect(() => {
    if (open) {
      const loadedSchemas = SchemaManager.getSchemas()
      setSchemas(loadedSchemas)
    }
  }, [open])

  // Parse custom range input (e.g., "5-23" or "10")
  const parseCustomRange = (rangeStr: string): { start: number; end: number } | null => {
    if (!rangeStr.trim()) return null
    
    const trimmed = rangeStr.trim()
    
    // Single number (e.g., "10")
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed)
      if (num > 0 && num <= filteredProducts.length) {
        return { start: num - 1, end: num - 1 } // Convert to 0-based index
      }
      return null
    }
    
    // Range (e.g., "5-23")
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      
      if (start > 0 && end > 0 && start <= end && start <= filteredProducts.length && end <= filteredProducts.length) {
        return { start: start - 1, end: end - 1 } // Convert to 0-based index
      }
    }
    
    return null
  }

  // Validate custom range and set error
  const validateCustomRange = (rangeStr: string) => {
    if (!rangeStr.trim()) {
      setCustomRangeError('Range is required for custom preview')
      return false
    }
    
    const range = parseCustomRange(rangeStr)
    if (!range) {
      setCustomRangeError(`Invalid range. Use formats like "5" for single item or "5-23" for range. Max: ${filteredProducts.length}`)
      return false
    }
    
    setCustomRangeError('')
    return true
  }

  // Get preview products based on mode
  const getPreviewProducts = () => {
    switch (previewMode) {
      case 'all':
        return filteredProducts
      case 'custom':
        const range = parseCustomRange(customRange)
        if (range) {
          return filteredProducts.slice(range.start, range.end + 1)
        }
        return filteredProducts.slice(0, previewLimit) // Fallback to fixed limit
      case 'fixed':
      default:
        return filteredProducts.slice(0, previewLimit)
    }
  }

  const productsToExport =
    useSelectedOnly && selectedProducts.length > 0 ? products.filter((p) => selectedProducts.includes(p.id)) : products

  const filteredProducts =
    dateRange.start || dateRange.end
      ? productsToExport.filter((product) => {
        const scrapedDate = new Date(product.scrapedAt)
        if (dateRange.start && scrapedDate < dateRange.start) return false
        if (dateRange.end && scrapedDate > dateRange.end) return false
        return true
      })
      : productsToExport

  const handleExport = async () => {
    if (filteredProducts.length === 0) return

    setIsExporting(true)
    try {
      const options = {
        format,
        includeMetadata,
        includeAiEnhancements,
        ...(dateRange.start || dateRange.end ? { dateRange } : {}),
      }

      // For client-side download
      let content: string
      let mimeType: string
      let fileExtension: string

      // Handle custom schema for JSON format
      if (format === "json" && useCustomSchema && selectedSchema) {
        const transformedProducts = SchemaManager.applySchema(filteredProducts, selectedSchema)
        content = JSON.stringify({
          schema: {
            name: selectedSchema.name,
            description: selectedSchema.description,
            version: "1.0"
          },
          metadata: options.includeMetadata ? {
            exportDate: new Date().toISOString(),
            totalProducts: transformedProducts.length,
            format: "custom-json"
          } : undefined,
          products: transformedProducts
        }, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
      } else {
        // Use standard export formats
        switch (format) {
          case "csv":
            content = ProductExporter.exportToCSV(filteredProducts, options)
            mimeType = "text/csv"
            fileExtension = "csv"
            break
          case "xml":
            content = ProductExporter.exportToXML(filteredProducts, options)
            mimeType = "application/xml"
            fileExtension = "xml"
            break
          case "markdown":
            content = ProductExporter.exportToMarkdown(filteredProducts, options)
            mimeType = "text/markdown"
            fileExtension = "md"
            break
          case "json":
          default:
            content = ProductExporter.exportToJSON(filteredProducts, options)
            mimeType = "application/json"
            fileExtension = "json"
            break
        }
      }

      const timestamp = new Date().toISOString().split("T")[0]
      const schemaPrefix = useCustomSchema && selectedSchema ? `${selectedSchema.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_` : ''
      const filename = `${schemaPrefix}products-export-${timestamp}.${fileExtension}`

      ProductExporter.downloadFile(content, filename, mimeType)
      onOpenChange(false)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatIcons = {
    json: Code,
    csv: FileText,
    xml: Database,
    markdown: FileText,
  }

  const FormatIcon = formatIcons[format]

  // Generate preview content
  const getPreviewContent = () => {
    const options = {
      format,
      includeMetadata,
      includeAiEnhancements,
      ...(dateRange.start || dateRange.end ? { dateRange } : {}),
    }

    // Get preview products based on current mode
    const previewProducts = getPreviewProducts()

    // Handle custom schema for JSON format
    if (format === "json" && useCustomSchema && selectedSchema) {
      const transformedProducts = SchemaManager.applySchema(previewProducts, selectedSchema)
      return JSON.stringify({
        schema: {
          name: selectedSchema.name,
          description: selectedSchema.description,
          version: "1.0"
        },
        metadata: options.includeMetadata ? {
          exportDate: new Date().toISOString(),
          totalProducts: transformedProducts.length,
          format: "custom-json"
        } : undefined,
        products: transformedProducts
      }, null, 2)
    }

    // Use standard export formats
    switch (format) {
      case "json":
        return ProductExporter.exportToJSON(previewProducts, options)
      case "csv":
        return ProductExporter.exportToCSV(previewProducts, options)
      case "xml":
        return ProductExporter.exportToXML(previewProducts, options)
      case "markdown":
        return ProductExporter.exportToMarkdown(previewProducts, options)
      default:
        return ""
    }
  }

  // Update editable preview when format or settings change
  const updatePreview = () => {
    if (!isPreviewEdited) {
      // Only update preview if custom range is valid (for custom mode)
      if (previewMode === 'custom' && !parseCustomRange(customRange)) {
        setEditablePreview('') // Show empty preview for invalid custom range
        return
      }
      
      const content = getPreviewContent()
      setEditablePreview(content)
    }
  }

  // Update preview when dependencies change
  useEffect(() => {
    updatePreview()
  }, [format, includeMetadata, includeAiEnhancements, dateRange, previewLimit, previewMode, customRange, filteredProducts, useCustomSchema, selectedSchema])

  // Handle export with edited content if user made changes
  const handleExportWithPreview = async () => {
    if (isPreviewEdited && editablePreview) {
      // Export the edited content directly
      const timestamp = new Date().toISOString().split("T")[0]
      const fileExtension = format
      const filename = `products-export-${timestamp}.${fileExtension}`

      const mimeTypes = {
        json: "application/json",
        csv: "text/csv",
        xml: "application/xml",
        markdown: "text/markdown"
      }

      ProductExporter.downloadFile(editablePreview, filename, mimeTypes[format])
      onOpenChange(false)
      return
    }

    // Otherwise use normal export
    handleExport()
  }

  // Save edited content back to products
  const handleSaveChanges = async () => {
    if (!isPreviewEdited || !editablePreview || !onProductsUpdate) return

    setIsSaving(true)
    try {
      let updatedProducts: any[] = []

      switch (format) {
        case "json":
          try {
            const parsedData = JSON.parse(editablePreview)
            // Handle both array of products and object with products array
            updatedProducts = Array.isArray(parsedData) ? parsedData : parsedData.products || []
          } catch (error) {
            throw new Error("Invalid JSON format")
          }
          break

        case "csv":
          try {
            const lines = editablePreview.split('\n').filter(line => line.trim())
            if (lines.length < 2) throw new Error("CSV must have header and at least one data row")
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
            updatedProducts = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
              const product: any = {}
              headers.forEach((header, index) => {
                const value = values[index] || ''
                // Try to parse arrays and objects
                if (header === 'tags' || header === 'features' || header === 'highlights') {
                  try {
                    product[header] = value ? JSON.parse(value) : []
                  } catch {
                    product[header] = value ? value.split(';') : []
                  }
                } else if (header === 'pricing' || header === 'aiEnhancements') {
                  try {
                    product[header] = value ? JSON.parse(value) : null
                  } catch {
                    product[header] = null
                  }
                } else {
                  product[header] = value
                }
              })
              return product
            })
          } catch (error) {
            throw new Error("Invalid CSV format")
          }
          break

        case "xml":
          throw new Error("XML editing is not yet supported")

        case "markdown":
          throw new Error("Markdown editing is not yet supported")

        default:
          throw new Error("Unsupported format for editing")
      }

      // Update the products
      const allProducts = [...products]
      const productMap = new Map(allProducts.map(p => [p.id, p]))

      updatedProducts.forEach(updatedProduct => {
        if (updatedProduct.id && productMap.has(updatedProduct.id)) {
          // Update existing product
          const index = allProducts.findIndex(p => p.id === updatedProduct.id)
          allProducts[index] = { ...allProducts[index], ...updatedProduct, updatedAt: new Date().toISOString() }
        }
      })

      onProductsUpdate(allProducts)
      setIsPreviewEdited(false)
      setIsEditing(false)
      
      // Show success message (you might want to add a toast notification here)
      console.log("Products updated successfully")

    } catch (error) {
      console.error("Failed to save changes:", error)
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showPreview ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-md max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center cursor-pointer gap-2">
            <Download className="h-5 w-5" />
            Export Products
          </DialogTitle>
        </DialogHeader>

        <Tabs value={showPreview ? "preview" : "settings"} onValueChange={(value) => setShowPreview(value === "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Export Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={(value: "json" | "csv" | "xml" | "markdown") => {
                setFormat(value)
                // Reset custom schema when switching away from JSON
                if (value !== "json") {
                  setUseCustomSchema(false)
                  setSelectedSchema(null)
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="xml">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      XML
                    </div>
                  </SelectItem>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Markdown
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Schema Options (JSON only) */}
            {format === "json" && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Custom Schema</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSchemaBuilder(true)}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Manage Schemas
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-custom-schema" 
                    checked={useCustomSchema} 
                    onCheckedChange={(checked) => {
                      setUseCustomSchema(!!checked)
                      if (!checked) {
                        setSelectedSchema(null)
                      }
                    }} 
                  />
                  <Label htmlFor="use-custom-schema" className="text-sm">
                    Use custom schema for export
                  </Label>
                </div>

                {useCustomSchema && (
                  <div className="space-y-2">
                    <Label htmlFor="schema-select" className="text-sm">Select Schema</Label>
                    {schemas.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2 border border-dashed rounded">
                        No custom schemas found. 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-1" 
                          onClick={() => setShowSchemaBuilder(true)}
                        >
                          Create one now
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={selectedSchema?.id || ""}
                        onValueChange={(value) => {
                          const schema = schemas.find(s => s.id === value)
                          setSelectedSchema(schema || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a schema..." />
                        </SelectTrigger>
                        <SelectContent>
                          {schemas.map((schema) => (
                            <SelectItem key={schema.id} value={schema.id}>
                              <div className="flex flex-col">
                                <span>{schema.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {schema.fields.length} fields
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {selectedSchema && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <strong>Schema:</strong> {selectedSchema.name}
                        </div>
                        {selectedSchema.description && (
                          <div>
                            <strong>Description:</strong> {selectedSchema.description}
                          </div>
                        )}
                        <div>
                          <strong>Fields:</strong> {selectedSchema.fields.map(f => f.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <Label>Export Options</Label>

              <div className="flex items-center space-x-2">
                <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={(checked) => setIncludeMetadata(!!checked)} />
                <Label htmlFor="metadata" className="text-sm">
                  Include metadata
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ai-enhancements"
                  checked={includeAiEnhancements}
                  onCheckedChange={(checked) => setIncludeAiEnhancements(!!checked)}
                />
                <Label htmlFor="ai-enhancements" className="text-sm">
                  Include AI enhancements
                </Label>
              </div>

              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="selected-only" checked={useSelectedOnly} onCheckedChange={(checked) => setUseSelectedOnly(!!checked)} />
                  <Label htmlFor="selected-only" className="text-sm">
                    Export selected only ({selectedProducts.length} products)
                  </Label>
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? formatDate(dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? formatDate(dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Products to export:</span>
                  <span className="font-medium">{filteredProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium flex items-center gap-1">
                    <FormatIcon className="h-3 w-3" />
                    {format.toUpperCase()}
                    {useCustomSchema && selectedSchema && (
                      <Badge variant="secondary" className="ml-1 text-xs">Custom</Badge>
                    )}
                  </span>
                </div>
                {useCustomSchema && selectedSchema && (
                  <div className="flex justify-between">
                    <span>Schema:</span>
                    <span className="font-medium">{selectedSchema.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={filteredProducts.length === 0 || isExporting} className="flex-1">
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Preview (
                {previewMode === 'all' 
                  ? `showing all ${filteredProducts.length} products`
                  : previewMode === 'custom'
                    ? customRange && parseCustomRange(customRange) 
                      ? `showing items ${customRange} of ${filteredProducts.length} products`
                      : `custom range of ${filteredProducts.length} products`
                    : filteredProducts.length > previewLimit 
                      ? `showing first ${previewLimit} of ${filteredProducts.length} products`
                      : `${filteredProducts.length} products`
                }
                )
              </Label>
              <div className="flex items-center gap-2">
                {(format === "json" || format === "csv") && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                <Label htmlFor="preview-mode" className="text-xs">Show:</Label>
                <Select 
                  value={previewMode} 
                  onValueChange={(value: 'fixed' | 'all' | 'custom') => {
                    setPreviewMode(value)
                    setCustomRangeError('')
                  }}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {previewMode === 'fixed' && (
                  <Select value={previewLimit.toString()} onValueChange={(value) => setPreviewLimit(parseInt(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Custom Range Input */}
            {previewMode === 'custom' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom-range" className="text-sm">Range:</Label>
                  <Input
                    id="custom-range"
                    value={customRange}
                    onChange={(e) => {
                      setCustomRange(e.target.value)
                      if (e.target.value.trim()) {
                        validateCustomRange(e.target.value)
                      } else {
                        setCustomRangeError('')
                      }
                    }}
                    placeholder="e.g., 5 or 5-23"
                    className="w-32 h-8"
                  />
                  <div className="text-xs text-muted-foreground">
                    Use "5" for single item or "5-23" for range (max: {filteredProducts.length})
                  </div>
                </div>
                {customRangeError && (
                  <div className="text-xs text-destructive">
                    {customRangeError}
                  </div>
                )}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <div className="text-sm text-accent-foreground bg-accent/50 p-2 rounded border border-accent">
                  <strong>Warning:</strong> Once you save the changes, they will permanently update your product data and cannot be automatically reset.
                </div>
                <Textarea
                  value={editablePreview}
                  onChange={(e) => {
                    setEditablePreview(e.target.value)
                    setIsPreviewEdited(true)
                  }}
                  className="h-96 w-110 font-mono text-xs resize-none"
                  placeholder="Edit your content here..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setIsPreviewEdited(false)
                      updatePreview()
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!isPreviewEdited || isSaving || !onProductsUpdate}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96 w-full rounded-md border">
                <div className="p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all max-w-full">
                    {editablePreview}
                  </pre>
                </div>
              </ScrollArea>
            )}

            {isPreviewEdited && !isEditing && (
              <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/50 p-2 rounded">
                <Settings className="h-4 w-4" />
                <span>Preview has been edited. Export will use your changes.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsPreviewEdited(false)
                    updatePreview()
                  }}
                >
                  Reset
                </Button>
              </div>
            )}

            {!onProductsUpdate && isEditing && (
              <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/50 p-2 rounded">
                <Settings className="h-4 w-4" />
                <span>Changes can only be exported, not saved back to products (no update handler provided).</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                Back to Settings
              </Button>
              <Button onClick={handleExportWithPreview} disabled={filteredProducts.length === 0 || isExporting} className="flex-1">
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Schema Builder Dialog */}
        <SchemaBuilderDialog
          open={showSchemaBuilder}
          onOpenChange={setShowSchemaBuilder}
          onSchemaSelect={(schema) => {
            setSelectedSchema(schema)
            setUseCustomSchema(true)
            setShowSchemaBuilder(false)
            // Reload schemas to get the latest list
            const loadedSchemas = SchemaManager.getSchemas()
            setSchemas(loadedSchemas)
          }}
          selectedSchemaId={selectedSchema?.id}
        />
      </DialogContent>
    </Dialog>
  )
}
