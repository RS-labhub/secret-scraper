"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Trash2, Upload, Download, Save, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { type CustomSchema, type SchemaField, SchemaManager } from "@/lib/schema/schema-manager"

interface SchemaBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchemaSelect: (schema: CustomSchema) => void
  selectedSchemaId?: string
}

export function SchemaBuilderDialog({
  open,
  onOpenChange,
  onSchemaSelect,
  selectedSchemaId,
}: SchemaBuilderDialogProps) {
  const [schemas, setSchemas] = useState<CustomSchema[]>([])
  const [editingSchema, setEditingSchema] = useState<Partial<CustomSchema> | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newField, setNewField] = useState<Partial<SchemaField>>({
    name: "",
    type: "string",
    mapping: "",
    required: false,
  })

  const availableProperties = SchemaManager.getAvailableProperties()

  useEffect(() => {
    loadSchemas()
  }, [open])

  const loadSchemas = () => {
    // Create example schemas if none exist
    SchemaManager.createExampleSchemas()

    const loadedSchemas = SchemaManager.getSchemas()
    setSchemas(loadedSchemas)
  }

  const startNewSchema = () => {
    setEditingSchema({
      name: "",
      description: "",
      fields: [],
    })
    setIsEditing(true)
  }

  const editSchema = (schema: CustomSchema) => {
    setEditingSchema({ ...schema })
    setIsEditing(true)
  }

  const saveSchema = () => {
    if (!editingSchema) return

    const validation = SchemaManager.validateSchema(editingSchema)
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    try {
      let savedSchema: CustomSchema

      if (editingSchema.id) {
        // Update existing schema
        savedSchema = SchemaManager.updateSchema(editingSchema.id, editingSchema)!
      } else {
        // Create new schema
        savedSchema = SchemaManager.saveSchema(editingSchema as Omit<CustomSchema, "id" | "createdAt" | "updatedAt">)
      }

      loadSchemas()
      setIsEditing(false)
      setEditingSchema(null)

      toast({
        title: "Success",
        description: `Schema "${savedSchema.name}" saved successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schema",
        variant: "destructive",
      })
    }
  }

  const deleteSchema = (id: string) => {
    if (confirm("Are you sure you want to delete this schema?")) {
      SchemaManager.deleteSchema(id)
      loadSchemas()
      toast({
        title: "Success",
        description: "Schema deleted successfully",
      })
    }
  }

  const addField = () => {
    if (!editingSchema || !newField.name) return

    const field: SchemaField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newField.name,
      type: newField.type || "string",
      mapping: newField.mapping,
      required: newField.required || false,
      defaultValue: newField.defaultValue,
    }

    setEditingSchema({
      ...editingSchema,
      fields: [...(editingSchema.fields || []), field],
    })

    setNewField({
      name: "",
      type: "string",
      mapping: "",
      required: false,
    })
  }

  const removeField = (fieldId: string) => {
    if (!editingSchema) return

    setEditingSchema({
      ...editingSchema,
      fields: editingSchema.fields?.filter((f) => f.id !== fieldId) || [],
    })
  }

  const updateField = (fieldId: string, updates: Partial<SchemaField>) => {
    if (!editingSchema) return

    setEditingSchema({
      ...editingSchema,
      fields: editingSchema.fields?.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) || [],
    })
  }

  const exportSchema = (schema: CustomSchema) => {
    const jsonString = SchemaManager.exportSchema(schema)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${schema.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_schema.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = SchemaManager.importSchema(content)

      if (result.success) {
        loadSchemas()
        toast({
          title: "Success",
          description: `Schema imported successfully`,
        })
      } else {
        toast({
          title: "Import Error",
          description: result.error,
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  if (isEditing && editingSchema) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingSchema.id ? "Edit Schema" : "Create New Schema"}</DialogTitle>
            <DialogDescription>Build a custom schema to export your data in your preferred format</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Schema Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="schema-name">Schema Name *</Label>
                <Input
                  id="schema-name"
                  value={editingSchema.name || ""}
                  onChange={(e) =>
                    setEditingSchema({
                      ...editingSchema,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Minimal Product Export"
                />
              </div>
              <div>
                <Label htmlFor="schema-description">Description</Label>
                <Textarea
                  id="schema-description"
                  value={editingSchema.description || ""}
                  onChange={(e) =>
                    setEditingSchema({
                      ...editingSchema,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this schema is for..."
                  rows={2}
                />
              </div>
            </div>

            {/* Add Field */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Field</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="field-name">Field Name *</Label>
                        <Input
                          id="field-name"
                          value={newField.name || ""}
                          onChange={(e) =>
                            setNewField({
                              ...newField,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., productName"
                        />
                      </div>
                      <div>
                        <Label htmlFor="field-type">Type</Label>
                        <Select
                          value={newField.type}
                          onValueChange={(value) =>
                            setNewField({
                              ...newField,
                              type: value as any,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 xl:col-span-1">
                        <Label htmlFor="field-mapping">Map to Property</Label>
                        <Select
                          value={newField.mapping}
                          onValueChange={(value) =>
                            setNewField({
                              ...newField,
                              mapping: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProperties.map((prop) => (
                              <SelectItem key={prop.path} value={prop.path}>
                                <span className="truncate">
                                  {prop.label} ({prop.type})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addField} disabled={!newField.name} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field List */}
            {editingSchema.fields && editingSchema.fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schema Fields ({editingSchema.fields.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {editingSchema.fields.map((field) => (
                      <div key={field.id} className="flex flex-col lg:flex-row gap-4 p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateField(field.id, { type: value as any })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Mapped to</Label>
                            <Select
                              value={field.mapping}
                              onValueChange={(value) => updateField(field.id, { mapping: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="No mapping" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProperties.map((prop) => (
                                  <SelectItem key={prop.path} value={prop.path}>
                                    <span className="truncate">{prop.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between lg:justify-end gap-2 lg:flex-col lg:items-end">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => removeField(field.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditingSchema(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveSchema}>
              <Save className="w-4 h-4 mr-2" />
              Save Schema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Custom Export Schemas</DialogTitle>
          <DialogDescription>Create and manage custom schemas for exporting your data in JSON format</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
            <Button onClick={startNewSchema} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New Schema
            </Button>
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                accept=".json"
                onChange={importSchema}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import Schema
              </Button>
            </div>
          </div>

          {/* Schema List */}
          {schemas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No custom schemas found</p>
              <p className="text-sm">Create your first schema to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {schemas.map((schema) => (
                <Card
                  key={schema.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSchemaId === schema.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onSchemaSelect(schema)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{schema.name}</CardTitle>
                        {schema.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{schema.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            editSchema(schema)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            exportSchema(schema)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer hover:bg-destructive/30 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSchema(schema.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">
                          {schema.fields.length} field{schema.fields.length !== 1 ? "s" : ""}
                        </Badge>
                        {selectedSchemaId === schema.id && <Badge variant="default">Selected</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(schema.createdAt).toLocaleDateString()}
                      </div>
                      {schema.fields.slice(0, 3).map((field) => (
                        <div key={field.id} className="text-xs">
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">{field.name}</code>
                          <span className="text-muted-foreground ml-1">({field.type})</span>
                          {field.mapping && (
                            <span className="text-muted-foreground ml-1 truncate">→ {field.mapping}</span>
                          )}
                        </div>
                      ))}
                      {schema.fields.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{schema.fields.length - 3} more fields...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
