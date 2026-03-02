"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const [useSelectedOnly, setUseSelectedOnly] = useState(false)
  const [approvedOnly, setApprovedOnly] = useState(false)
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

  const productsToExport = useMemo(() =>
    useSelectedOnly && selectedProducts.length > 0 ? products.filter((p) => selectedProducts.includes(p.id)) : products,
    [useSelectedOnly, selectedProducts, products]
  )

  // Filter by approval status
  const statusFiltered = useMemo(() =>
    approvedOnly ? productsToExport.filter(p => p.status === "approved") : productsToExport,
    [approvedOnly, productsToExport]
  )

  const filteredProducts = useMemo(() =>
    dateRange.start || dateRange.end
      ? statusFiltered.filter((product) => {
        const scrapedDate = new Date(product.scrapedAt)
        if (dateRange.start && scrapedDate < dateRange.start) return false
        if (dateRange.end && scrapedDate > dateRange.end) return false
        return true
      })
      : statusFiltered,
    [dateRange.start, dateRange.end, statusFiltered]
  )

  const handleExport = async () => {
    if (filteredProducts.length === 0) return

    setIsExporting(true)
    try {
      const options = {
        format,
        includeMetadata,
        ...(dateRange.start || dateRange.end ? { dateRange } : {}),
      }

      // For client-side download
      let content: string
      let mimeType: string
      let fileExtension: string

      // Handle custom schema 
      if ((format === "json" || format === "csv") && useCustomSchema && selectedSchema) {
        const transformedProducts = SchemaManager.applySchema(filteredProducts, selectedSchema)
        
        if (format === "json") {
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
          content = ProductExporter.exportToCSV(transformedProducts, options)
          mimeType = "text/csv"
          fileExtension = "csv"
        }
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
      ...(dateRange.start || dateRange.end ? { dateRange } : {}),
    }

    // Get preview products based on current mode
    const previewProducts = getPreviewProducts()

    // Handle custom schema 
    if ((format === "json" || format === "csv") && useCustomSchema && selectedSchema) {
      const transformedProducts = SchemaManager.applySchema(previewProducts, selectedSchema)
      
      if (format === "json") {
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
      } else {
        return ProductExporter.exportToCSV(transformedProducts, options)
      }
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
      if (previewMode === 'custom' && !parseCustomRange(customRange)) {
        setEditablePreview('') // Show empty preview for invalid custom range
        return
      }
      const content = getPreviewContent()
      setEditablePreview(content)
    }
  }

  useEffect(() => {
    updatePreview()
  }, [format, includeMetadata, dateRange, previewLimit, previewMode, customRange, filteredProducts, useCustomSchema, selectedSchema])

  const handleExportWithPreview = async () => {
    if (isPreviewEdited && editablePreview) {
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
    handleExport()
  }

  const handleSaveChanges = async () => {
    if (!isPreviewEdited || !editablePreview || !onProductsUpdate) return
    
    setIsSaving(true)
    try {
      let updatedProducts: any[] = []

      switch (format) {
        case "json":
          try {
            const parsedData = JSON.parse(editablePreview)
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

      const allProducts = [...products]
      const productMap = new Map(allProducts.map(p => [p.id, p]))

      updatedProducts.forEach(updatedProduct => {
        if (updatedProduct.id && productMap.has(updatedProduct.id)) {
          const index = allProducts.findIndex(p => p.id === updatedProduct.id)
          allProducts[index] = { ...allProducts[index], ...updatedProduct, updatedAt: new Date().toISOString() }
        }
      })

      onProductsUpdate(allProducts)
      setIsPreviewEdited(false)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save changes:", error)
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-3xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-4 md:p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-xl md:text-2xl tracking-tighter flex items-center gap-2">
              <Download className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Data Export
            </SheetTitle>
            <SheetDescription className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
              Extract intelligence data in structured formats.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-4 md:p-6 flex-1 space-y-4 md:space-y-6">
          <Tabs value={showPreview ? "preview" : "settings"} onValueChange={(value) => setShowPreview(value === "preview")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-none h-10 md:h-12 p-1">
              <TabsTrigger value="settings" className="rounded-none font-mono uppercase text-[10px] md:text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Settings</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-none font-mono uppercase text-[10px] md:text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Preview</TabsTrigger>
            </TabsList>

            <div className="mt-4 md:mt-6">
              <TabsContent value="settings" className="space-y-6 m-0 border border-border bg-secondary/10 p-4 md:p-6">
                
                {/* Format Selection */}
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Export Format</Label>
                  <Select value={format} onValueChange={(value: "json" | "csv" | "xml" | "markdown") => {
                    setFormat(value)
                    if (value !== "json") {
                      setUseCustomSchema(false)
                      setSelectedSchema(null)
                    }
                  }}>
                    <SelectTrigger className="rounded-none border-border font-mono h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="json"><div className="flex items-center gap-2 font-mono"><Code className="h-4 w-4" />JSON</div></SelectItem>
                      <SelectItem value="csv"><div className="flex items-center gap-2 font-mono"><FileText className="h-4 w-4" />CSV</div></SelectItem>
                      <SelectItem value="xml"><div className="flex items-center gap-2 font-mono"><Database className="h-4 w-4" />XML</div></SelectItem>
                      <SelectItem value="markdown"><div className="flex items-center gap-2 font-mono"><FileText className="h-4 w-4" />MARKDOWN</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Schema Options */}
                {(format === "json" || format === "csv") && (
                  <div className="space-y-4 p-4 border border-border bg-background">
                    <div className="flex items-center justify-between">
                      <Label className="font-mono text-xs uppercase text-foreground">Custom Schema Structure</Label>
                      <Button variant="outline" size="sm" onClick={() => setShowSchemaBuilder(true)} className="rounded-none h-8 font-mono text-xs uppercase border-border">
                        <Layers className="h-3 w-3 mr-2" /> Manage
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="use-custom-schema" checked={useCustomSchema} onCheckedChange={(checked) => {
                        setUseCustomSchema(!!checked)
                        if (!checked) setSelectedSchema(null)
                      }} className="rounded-none border-border" />
                      <Label htmlFor="use-custom-schema" className="font-mono text-xs uppercase cursor-pointer">Inject Custom Schema</Label>
                    </div>

                    {useCustomSchema && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {schemas.length === 0 ? (
                          <div className="font-mono text-xs text-muted-foreground p-3 border border-dashed border-border bg-secondary/20">
                            No custom schemas found.
                            <Button variant="link" className="p-0 h-auto ml-2 text-primary font-mono text-xs underline" onClick={() => setShowSchemaBuilder(true)}>Create</Button>
                          </div>
                        ) : (
                          <Select value={selectedSchema?.id || ""} onValueChange={(value) => setSelectedSchema(schemas.find(s => s.id === value) || null)}>
                            <SelectTrigger className="rounded-none border-border font-mono h-10 text-xs">
                              <SelectValue placeholder="Select Schema Definition" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {schemas.map((schema) => (
                                <SelectItem key={schema.id} value={schema.id} className="font-mono text-xs">
                                  {schema.name} ({schema.fields.length} FIELDS)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {selectedSchema && (
                          <div className="font-mono text-[10px] text-muted-foreground space-y-1 p-3 bg-secondary/30 border border-border/50">
                            <div><span className="text-primary">SCHEMA:</span> {selectedSchema.name}</div>
                            {selectedSchema.description && <div><span className="text-primary">DESC:</span> {selectedSchema.description}</div>}
                            <div className="break-words"><span className="text-primary">FIELDS:</span> {selectedSchema.fields.map(f => f.name).join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-4 pt-2">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Extraction Parameters</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={(checked) => setIncludeMetadata(!!checked)} className="rounded-none border-border" />
                      <Label htmlFor="metadata" className="font-mono text-xs uppercase cursor-pointer">Inject Metadata</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="approved-only" checked={approvedOnly} onCheckedChange={(checked) => setApprovedOnly(!!checked)} className="rounded-none border-border" />
                      <Label htmlFor="approved-only" className="font-mono text-xs uppercase cursor-pointer">Filter: Approved Only</Label>
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="selected-only" checked={useSelectedOnly} onCheckedChange={(checked) => setUseSelectedOnly(!!checked)} className="rounded-none border-border text-primary" />
                        <Label htmlFor="selected-only" className="font-mono text-xs uppercase cursor-pointer text-primary">Filter: Selected Context ({selectedProducts.length})</Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">Temporal Bound (Optional)</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-mono text-xs rounded-none border-border h-10">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dateRange.start ? formatDate(dateRange.start, "yyyy-MM-dd") : "START_DATE"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-none border-border">
                        <Calendar mode="single" selected={dateRange.start} onSelect={(date) => setDateRange((prev) => ({ ...prev, start: date }))} initialFocus className="font-mono" />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-mono text-xs rounded-none border-border h-10">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dateRange.end ? formatDate(dateRange.end, "yyyy-MM-dd") : "END_DATE"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-none border-border">
                        <Calendar mode="single" selected={dateRange.end} onSelect={(date) => setDateRange((prev) => ({ ...prev, end: date }))} initialFocus className="font-mono" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Export Summary */}
                <div className="border border-border bg-black p-4 space-y-2 mt-4">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-muted-foreground">TARGET_COUNTing:</span>
                    <span className="text-primary">{filteredProducts.length} RECORDS</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-muted-foreground">FORMAT:</span>
                    <span className="flex items-center gap-2 uppercase">
                      <FormatIcon className="h-3 w-3 text-primary" /> {format}
                      {useCustomSchema && selectedSchema && <Badge variant="outline" className="rounded-none border-primary text-primary text-[10px] h-5 px-1 py-0">CUSTOM</Badge>}
                    </span>
                  </div>
                  {useCustomSchema && selectedSchema && (
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">SCHEMA_DEF:</span>
                      <span className="truncate max-w-[200px] text-right">{selectedSchema.name}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 m-0 border border-border bg-secondary/10 p-6 flex flex-col h-full min-h-[500px]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="font-mono text-xs uppercase">
                    Preview Matrix 
                    <span className="text-muted-foreground ml-2">
                      ({previewMode === 'all' ? `ALL ${filteredProducts.length}` : previewMode === 'custom' ? `CUSTOM` : `TOP ${Math.min(previewLimit, filteredProducts.length)}`})
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    {(format === "json" || format === "csv") && !isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8 p-0 rounded-none border-border text-primary hover:text-primary/80">
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    <Select value={previewMode} onValueChange={(value: 'fixed' | 'all' | 'custom') => {
                      setPreviewMode(value)
                      setCustomRangeError('')
                    }}>
                      <SelectTrigger className="w-24 h-8 rounded-none border-border font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="fixed" className="font-mono text-xs">FIXED</SelectItem>
                        <SelectItem value="all" className="font-mono text-xs">ALL</SelectItem>
                        <SelectItem value="custom" className="font-mono text-xs">CUSTOM</SelectItem>
                      </SelectContent>
                    </Select>

                    {previewMode === 'fixed' && (
                      <Select value={previewLimit.toString()} onValueChange={(value) => setPreviewLimit(parseInt(value))}>
                        <SelectTrigger className="w-20 h-8 rounded-none border-border font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {["3", "5", "10", "20"].map(v => <SelectItem key={v} value={v} className="font-mono text-xs">{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {previewMode === 'custom' && (
                  <div className="space-y-2 border border-border bg-background p-3">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="custom-range" className="font-mono text-xs text-muted-foreground">RANGE[</Label>
                      <Input id="custom-range" value={customRange} onChange={(e) => {
                        setCustomRange(e.target.value)
                        if (e.target.value.trim()) validateCustomRange(e.target.value)
                        else setCustomRangeError('')
                      }} placeholder="e.g., 5 or 5-23" className="w-32 h-8 rounded-none font-mono text-xs border-primary" />
                      <Label className="font-mono text-xs text-muted-foreground">]</Label>
                    </div>
                    {customRangeError && <div className="text-[10px] font-mono text-destructive uppercase">{customRangeError}</div>}
                  </div>
                )}

                <div className="flex-1 mt-2 border border-border relative group">
                  {isEditing ? (
                    <div className="h-full flex flex-col">
                      <div className="text-[10px] font-mono text-primary bg-primary/10 p-2 border-b border-border uppercase">
                        WARNING: Manual overrides will permanently mutate the datastore upon save.
                      </div>
                      <Textarea value={editablePreview} onChange={(e) => { setEditablePreview(e.target.value); setIsPreviewEdited(true) }} className="flex-1 min-h-[400px] w-full font-mono text-xs rounded-none border-0 resize-y p-4 bg-black text-primary focus-visible:ring-0" />
                      <div className="flex gap-2 p-2 border-t border-border bg-secondary">
                        <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setIsPreviewEdited(false); updatePreview() }} className="rounded-none font-mono text-xs flex-1 h-8">Cancel</Button>
                        <Button size="sm" onClick={handleSaveChanges} disabled={!isPreviewEdited || isSaving || !onProductsUpdate} className="rounded-none font-mono text-xs flex-1 h-8 btn-brutal">
                          {isSaving ? "SAVING" : "COMMIT OVERRIDE"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] w-full bg-black">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">{editablePreview || "// No data available in current scope"}</pre>
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {isPreviewEdited && !isEditing && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-primary bg-primary/10 p-3 border border-primary/30 uppercase mt-4">
                    <span><Settings className="h-3 w-3 inline mr-2" /> Buffer modified. Export will use manual override.</span>
                    <Button variant="ghost" size="sm" onClick={() => { setIsPreviewEdited(false); updatePreview() }} className="h-6 text-[10px] font-mono hover:bg-primary hover:text-black">Reset Buffer</Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-4 md:p-6 border-t border-border bg-black sticky bottom-0 flex gap-3 md:gap-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-none font-mono uppercase h-10 md:h-14 text-xs">Cancel</Button>
          {showPreview && isPreviewEdited ? (
            <Button onClick={handleExportWithPreview} disabled={filteredProducts.length === 0 || isExporting} className="flex-1 btn-brutal h-10 md:h-14 text-[10px] md:text-xs">
              {isExporting ? "PROCESSING..." : "EXPORT OVERRIDE"}
            </Button>
          ) : (
            <Button onClick={handleExport} disabled={filteredProducts.length === 0 || isExporting} className="flex-1 btn-brutal h-10 md:h-14 text-[10px] md:text-xs">
              <Download className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> {isExporting ? "PROCESSING..." : "EXPORT"}
            </Button>
          )}
        </div>

        <SchemaBuilderDialog
          open={showSchemaBuilder}
          onOpenChange={setShowSchemaBuilder}
          onSchemaSelect={(schema) => {
            setSelectedSchema(schema)
            setUseCustomSchema(true)
            setShowSchemaBuilder(false)
            // Reload schemas
            const loadedSchemas = SchemaManager.getSchemas()
            setSchemas(loadedSchemas)
          }}
          selectedSchemaId={selectedSchema?.id}
        />
      </SheetContent>
    </Sheet>
  )
}

