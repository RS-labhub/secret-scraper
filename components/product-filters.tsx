"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X, Search, Terminal } from "lucide-react"
import { DOMAINS } from "@/types/product"
import type { Domain, Product } from "@/types/product"

interface ProductFiltersProps {
  products: Product[]
  onFilterChange: (filteredProducts: Product[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ProductFilters({ products, onFilterChange, searchQuery, onSearchChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState({
    status: [] as Product["status"][],
    source: [] as Product["source"][],
    domain: [] as Domain[],
    aiEnhanced: null as boolean | null,
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const uniqueDomains = Array.from(
    new Set(
      products
        .map((p) => p.domain || p.aiEnhanced?.suggestedDomain)
        .filter((domain): domain is Domain => Boolean(domain)),
    ),
  ) as Domain[]
  const uniqueSources = [...new Set(products.map((p) => p.source))]
  const uniqueStatuses = [...new Set(products.map((p) => p.status))]

  const applyFilters = () => {
    let filtered = products

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.features.some((feature) => feature.toLowerCase().includes(query)) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          product.domain?.toLowerCase().includes(query) ||
          product.metadata?.language?.toLowerCase().includes(query),
      )
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter((product) => filters.status.includes(product.status))
    }

    if (filters.source.length > 0) {
      filtered = filtered.filter((product) => filters.source.includes(product.source))
    }

    if (filters.domain.length > 0) {
      filtered = filtered.filter((product) => product.domain && filters.domain.includes(product.domain))
    }

    if (filters.aiEnhanced !== null) {
      filtered = filtered.filter((product) => Boolean(product.aiEnhanced) === filters.aiEnhanced)
    }

    onFilterChange(filtered)
  }

  const updateFilter = (key: keyof typeof filters, value: any, action: "add" | "remove" | "set") => {
    const newFilters = { ...filters }

    if (action === "set") {
      newFilters[key] = value
    } else if (Array.isArray(newFilters[key])) {
      const array = newFilters[key] as any[]
      if (action === "add" && !array.includes(value)) {
        array.push(value)
      } else if (action === "remove") {
        const index = array.indexOf(value)
        if (index > -1) array.splice(index, 1)
      }
    }

    setFilters(newFilters)

    const active: string[] = []
    if (newFilters.status.length > 0) active.push(`STAT: ${newFilters.status.join("|")}`)
    if (newFilters.source.length > 0) active.push(`SRC: ${newFilters.source.join("|")}`)
    if (newFilters.domain.length > 0) active.push(`DOM: ${newFilters.domain.join("|")}`)
    if (newFilters.aiEnhanced !== null) active.push(`AI: ${newFilters.aiEnhanced ? "TRUE" : "FALSE"}`)
    setActiveFilters(active)
    applyFilters()
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      source: [],
      domain: [],
      aiEnhanced: null,
    })
    setActiveFilters([])
    onFilterChange(products)
  }

  React.useEffect(() => {
    applyFilters()
  }, [searchQuery, filters])

  return (
    <div className="space-y-4 font-mono">
      {/* Search */}
      <div className="flex-1 relative">
        <Terminal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
        <Input
          placeholder="AWAITING_QUERY..."
          className="pl-10 rounded-none border-border bg-black font-mono text-xs uppercase h-10 focus-visible:ring-primary focus-visible:border-primary placeholder:opacity-50"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
          <div className="w-2 h-4 bg-primary animate-pulse" />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase h-8 hover:bg-secondary cursor-pointer">
              <Filter className="w-3 h-3 mr-2" />
              MATRIX_FILTERS
              {activeFilters.length > 0 && (
                <Badge variant="outline" className="ml-2 rounded-none border-primary bg-primary text-black font-bold text-[9px] px-1 py-0 h-4">
                  [{activeFilters.length}]
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 rounded-none border-border bg-black shadow-2xl shadow-primary/10" align="start">
            <div className="p-3 border-b border-border bg-secondary/10 flex items-center justify-between">
              <Label className="font-mono text-xs uppercase text-primary">Filter_Matrix</Label>
              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[9px] font-mono uppercase rounded-none hover:bg-destructive/20 hover:text-destructive text-muted-foreground px-2">
                  PURGE_ALL
                </Button>
              )}
            </div>

            <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase text-muted-foreground border-b border-border/50 pb-1 flex w-full">Status_Nodes</Label>
                <div className="space-y-2">
                  {uniqueStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => updateFilter("status", status, checked ? "add" : "remove")}
                        className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border shadow-none"
                      />
                      <Label htmlFor={`status-${status}`} className="text-[10px] uppercase leading-none cursor-pointer">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase text-muted-foreground border-b border-border/50 pb-1 flex w-full">Origin_Vectors</Label>
                <div className="space-y-2">
                  {uniqueSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source}`}
                        checked={filters.source.includes(source)}
                        onCheckedChange={(checked) => updateFilter("source", source, checked ? "add" : "remove")}
                        className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border shadow-none"
                      />
                      <Label htmlFor={`source-${source}`} className="text-[10px] uppercase leading-none cursor-pointer">
                        {source}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domain Filter */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase text-muted-foreground border-b border-border/50 pb-1 flex w-full">Target_Domains</Label>
                <div className="space-y-2">
                  {(uniqueDomains.length > 0 ? uniqueDomains : DOMAINS).map((domain) => (
                    <div key={domain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`domain-${domain}`}
                        checked={filters.domain.includes(domain as Domain)}
                        onCheckedChange={(checked) => updateFilter("domain", domain, checked ? "add" : "remove")}
                        className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border shadow-none"
                      />
                      <Label htmlFor={`domain-${domain}`} className="text-[10px] uppercase leading-none cursor-pointer">
                        {domain}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Enhanced Filter */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase text-muted-foreground border-b border-border/50 pb-1 flex w-full">Neural_Enhancement</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-enhanced-yes"
                      checked={filters.aiEnhanced === true}
                      onCheckedChange={(checked) => updateFilter("aiEnhanced", checked ? true : null, "set")}
                      className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border shadow-none"
                    />
                    <Label htmlFor="ai-enhanced-yes" className="text-[10px] uppercase leading-none cursor-pointer">
                      ACTIVE (TRUE)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-enhanced-no"
                      checked={filters.aiEnhanced === false}
                      onCheckedChange={(checked) => updateFilter("aiEnhanced", checked ? false : null, "set")}
                      className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:text-black border-border shadow-none"
                    />
                    <Label htmlFor="ai-enhanced-no" className="text-[10px] uppercase leading-none cursor-pointer">
                      INACTIVE (FALSE)
                    </Label>
                  </div>
                </div>
              </div>

            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Filters */}
        <Button
          variant="outline"
          size="sm"
          className={`rounded-none font-mono text-[10px] uppercase h-8 transition-colors ${filters.status.includes("pending") ? "bg-primary text-black border-primary hover:bg-primary/90" : "border-border hover:bg-secondary"}`}
          onClick={() => updateFilter("status", "pending", filters.status.includes("pending") ? "remove" : "add")}
        >
          {filters.status.includes("pending") && <span className="mr-1 opacity-50">&gt;</span>} Q_PENDING
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-none font-mono text-[10px] uppercase h-8 transition-colors ${filters.aiEnhanced === true ? "bg-primary text-black border-primary hover:bg-primary/90" : "border-border hover:bg-secondary"}`}
          onClick={() => updateFilter("aiEnhanced", filters.aiEnhanced === true ? null : true, "set")}
        >
          {filters.aiEnhanced === true && <span className="mr-1 opacity-50">&gt;</span>} Q_ENHANCED
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="rounded-none border-border bg-secondary/20 px-2 py-1 flex items-center gap-2 text-[9px] uppercase hover:bg-secondary/40">
              <span className="text-primary/70">{filter.split(':')[0]}:</span>
              <span className="font-bold">{filter.split(':')[1]}</span>
              <X className="w-3 h-3 cursor-pointer hover:text-destructive ml-1" onClick={() => {
                // Determine which filter to remove based on label
                const prefix = filter.split(':')[0]
                if (prefix === 'STAT') updateFilter("status", [], "set")
                else if (prefix === 'SRC') updateFilter("source", [], "set")
                else if (prefix === 'DOM') updateFilter("domain", [], "set")
                else if (prefix === 'AI') updateFilter("aiEnhanced", null, "set")
              }} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

