"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, Upload, Download, Save, Edit, Database, Braces } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const deprecatedProperties = new Set(["tags", "domains", "categories", "pricing"])
  const availableProperties = SchemaManager.getAvailableProperties().filter(
    (prop) => !deprecatedProperties.has(prop.path) && !prop.path.startsWith("aiEnhanced.")
  )

  useEffect(() => {
    loadSchemas()
  }, [open])

  const loadSchemas = () => {
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
        savedSchema = SchemaManager.updateSchema(editingSchema.id, editingSchema)!
      } else {
        savedSchema = SchemaManager.saveSchema(editingSchema as Omit<CustomSchema, "id" | "createdAt" | "updatedAt">)
      }

      loadSchemas()
      setIsEditing(false)
      setEditingSchema(null)

      toast({
        title: "SUCCESS",
        description: `SCHEMA_SAVED [${savedSchema.name}]`,
      })
    } catch (error) {
      toast({
        title: "ERROR",
        description: "SCHEMA_SAVE_FAILED",
        variant: "destructive",
      })
    }
  }

  const deleteSchema = (id: string) => {
    if (confirm("PURGE SCHEMA? THIS ACTION IS IRREVERSIBLE.")) {
      SchemaManager.deleteSchema(id)
      loadSchemas()
      toast({
        title: "PURGED",
        description: "SCHEMA_DELETED",
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
          title: "SUCCESS",
          description: `SCHEMA_IMPORTED`,
        })
      } else {
        toast({
          title: "IMPORT_ERROR",
          description: result.error,
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-card border-l border-border p-0 overflow-y-auto font-sans flex flex-col gap-0 duration-300">
        <div className="p-6 border-b border-border bg-card z-20 sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-display uppercase text-2xl tracking-tighter flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              {isEditing ? (editingSchema?.id ? "EDIT_SCHEMA" : "NEW_SCHEMA") : "SCHEMA_BUILDER"}
            </SheetTitle>
            <SheetDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {isEditing ? "Define custom data structure for matrix export" : "Manage JSON export mappings"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {isEditing && editingSchema ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 border border-border p-4 bg-background">
                <div className="space-y-2">
                  <Label htmlFor="schema-name" className="font-mono text-xs uppercase">Schema_Name *</Label>
                  <Input
                    id="schema-name"
                    value={editingSchema.name || ""}
                    onChange={(e) => setEditingSchema({ ...editingSchema, name: e.target.value })}
                    placeholder="e.g., MINIMAL_EXPORT_01"
                    className="font-mono rounded-none border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schema-description" className="font-mono text-xs uppercase">Description</Label>
                  <Textarea
                    id="schema-description"
                    value={editingSchema.description || ""}
                    onChange={(e) => setEditingSchema({ ...editingSchema, description: e.target.value })}
                    placeholder="Matrix purpose..."
                    rows={2}
                    className="font-mono text-xs rounded-none border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="border border-primary/20 bg-primary/5 p-4 space-y-4 relative">
                <div className="absolute top-0 right-0 p-2 opacity-50"><Braces className="w-12 h-12 text-primary" /></div>
                <h3 className="font-mono text-xs text-primary uppercase border-b border-primary/20 pb-2">Add_New_Node</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs pt-2">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px]">Node_ID *</Label>
                    <Input
                      value={newField.name || ""}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      placeholder="e.g. productName"
                      className="h-8 text-[10px] rounded-none border-border bg-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px]">Data_Type</Label>
                    <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value as any })}>
                      <SelectTrigger className="h-8 text-[10px] rounded-none border-border bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value="string" className="text-[10px]">STRING</SelectItem>
                        <SelectItem value="number" className="text-[10px]">NUMBER</SelectItem>
                        <SelectItem value="boolean" className="text-[10px]">BOOLEAN</SelectItem>
                        <SelectItem value="array" className="text-[10px]">ARRAY</SelectItem>
                        <SelectItem value="object" className="text-[10px]">OBJECT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label className="uppercase text-[10px]">Source_Map</Label>
                    <Select value={newField.mapping} onValueChange={(value) => setNewField({ ...newField, mapping: value })}>
                      <SelectTrigger className="h-8 text-[10px] rounded-none border-border bg-black">
                        <SelectValue placeholder="NULL_MAPPING" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border">
                        {availableProperties.map((prop) => (
                          <SelectItem key={prop.path} value={prop.path} className="text-[10px]">
                            {prop.label.toUpperCase()} [{prop.type}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addField} disabled={!newField.name} variant="outline" className="w-full mt-4 rounded-none h-8 font-mono text-[10px] uppercase border-primary text-primary hover:bg-primary/20">
                  <Plus className="w-3 h-3 mr-2" /> APPEND_NODE
                </Button>
              </div>

              {editingSchema.fields && editingSchema.fields.length > 0 && (
                <div className="border border-border p-4 bg-background">
                  <h3 className="font-mono text-xs uppercase border-b border-border pb-2 mb-4">Topology_Nodes [{editingSchema.fields.length}]</h3>
                  <div className="space-y-2">
                    {editingSchema.fields.map((field) => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 border border-border/50 bg-secondary/10 font-mono text-[10px] items-center">
                        <div className="sm:col-span-3">
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            className="h-7 text-[10px] rounded-none bg-black border-border shadow-none"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value as any })}>
                            <SelectTrigger className="h-7 text-[10px] rounded-none border-border bg-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              <SelectItem value="string" className="text-[10px]">STRING</SelectItem>
                              <SelectItem value="number" className="text-[10px]">NUMBER</SelectItem>
                              <SelectItem value="boolean" className="text-[10px]">BOOLEAN</SelectItem>
                              <SelectItem value="array" className="text-[10px]">ARRAY</SelectItem>
                              <SelectItem value="object" className="text-[10px]">OBJECT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-4">
                          <Select value={field.mapping} onValueChange={(value) => updateField(field.id, { mapping: value })}>
                            <SelectTrigger className="h-7 text-[10px] rounded-none border-border bg-black">
                              <SelectValue placeholder="NULL_MAPPING" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {availableProperties.map((prop) => (
                                <SelectItem key={prop.path} value={prop.path} className="text-[10px]">
                                  {prop.label.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1 bg-black px-1 border border-border h-7">
                            <span className="text-[8px] uppercase">{field.required ? 'REQ' : 'OPT'}</span>
                            <Switch checked={field.required} onCheckedChange={(c) => updateField(field.id, { required: c })} className="scale-50 data-[state=checked]:bg-primary" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="h-7 w-7 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 w-full">
                <Button onClick={startNewSchema} className="flex-1 rounded-none btn-brutal h-10 text-xs">
                  <Plus className="w-4 h-4 mr-2" /> INIT_SCHEMA
                </Button>
                <div className="relative flex-1">
                  <input type="file" accept=".json" onChange={importSchema} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Button variant="outline" className="w-full rounded-none border-border font-mono text-xs uppercase h-10 hover:bg-secondary">
                    <Upload className="w-4 h-4 mr-2" /> IMPORT_JSON
                  </Button>
                </div>
              </div>

              {schemas.length === 0 ? (
                <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-secondary/5 font-mono text-xs uppercase p-4 text-center">
                  <Database className="w-8 h-8 mb-4 opacity-50" />
                  NO_SCHEMAS_FOUND
                  <br/>
                  <span className="text-[10px] mt-2 opacity-50">INITIALIZE NEW TOPOLOGY TO BEGIN</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {schemas.map((schema) => (
                    <div key={schema.id} onClick={() => onSchemaSelect(schema)} className={`group relative border p-4 cursor-pointer transition-colors bg-background flex flex-col gap-3 ${selectedSchemaId === schema.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}>
                      <div className="flex justify-between items-start select-none">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono text-sm text-foreground uppercase truncate max-w-[200px]">{schema.name}</h4>
                            {selectedSchemaId === schema.id && <Badge variant="outline" className="rounded-none border-primary bg-primary text-black font-bold text-[9px] uppercase px-1 py-0 h-4">ACTIVE</Badge>}
                          </div>
                          {schema.description && <p className="font-mono text-[10px] text-muted-foreground mt-1 truncate max-w-[250px]">{schema.description}</p>}
                        </div>
                        <div className="flex bg-black border border-border">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); editSchema(schema); }} className="h-6 w-6 rounded-none hover:bg-secondary text-muted-foreground hover:text-foreground">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <div className="w-px bg-border h-6" />
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); exportSchema(schema); }} className="h-6 w-6 rounded-none hover:bg-secondary text-muted-foreground hover:text-foreground">
                            <Download className="w-3 h-3" />
                          </Button>
                          <div className="w-px bg-border h-6" />
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSchema(schema.id); }} className="h-6 w-6 rounded-none hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 font-mono text-[9px] uppercase text-muted-foreground items-center border-t border-border pt-2 select-none">
                        <Badge variant="outline" className="rounded-none border-border px-1 py-0 bg-secondary/30 h-4">{schema.fields.length}_NODES</Badge>
                        <span>|</span>
                        <span>ACT: {new Date(schema.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {schema.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 select-none">
                          {schema.fields.slice(0, 4).map((f) => (
                            <span key={f.id} className="font-mono text-[9px] bg-secondary/40 text-muted-foreground px-1 border border-border/50">
                              {f.name}
                            </span>
                          ))}
                          {schema.fields.length > 4 && (
                            <span className="font-mono text-[9px] bg-secondary/40 text-muted-foreground px-1 border border-border/50">
                              +{schema.fields.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-black sticky bottom-0 flex gap-4 mt-auto">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditingSchema(null); }} className="flex-1 rounded-none font-mono uppercase h-14">
                ABORT
              </Button>
              <Button onClick={saveSchema} className="flex-1 btn-brutal h-14 text-xs">
                <Save className="w-4 h-4 mr-2" /> COMPILE_SCHEMA
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-none font-mono uppercase h-14">
              CLOSE_INTERFACE
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

