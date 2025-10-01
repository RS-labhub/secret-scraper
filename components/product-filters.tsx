"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X, Search } from "lucide-react"
import type { Product } from "@/types/product"

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
    pricing: [] as string[],
    tags: [] as string[],
    aiEnhanced: null as boolean | null,
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Get unique values for filter options
  const uniqueTags = [...new Set(products.flatMap((p) => p.tags))].slice(0, 20)
  const uniqueSources = [...new Set(products.map((p) => p.source))]
  const uniqueStatuses = [...new Set(products.map((p) => p.status))]
  const uniquePricing = [...new Set(products.map((p) => p.pricing?.type).filter(Boolean))]

  const applyFilters = () => {
    let filtered = products

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          product.features.some((feature) => feature.toLowerCase().includes(query)),
      )
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((product) => filters.status.includes(product.status))
    }

    // Source filter
    if (filters.source.length > 0) {
      filtered = filtered.filter((product) => filters.source.includes(product.source))
    }

    // Pricing filter
    if (filters.pricing.length > 0) {
      filtered = filtered.filter((product) => product.pricing && filters.pricing.includes(product.pricing.type))
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((product) => filters.tags.some((tag) => product.tags.includes(tag)))
    }

    // AI Enhanced filter
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

    // Update active filters for display
    const active: string[] = []
    if (newFilters.status.length > 0) active.push(`Status: ${newFilters.status.join(", ")}`)
    if (newFilters.source.length > 0) active.push(`Source: ${newFilters.source.join(", ")}`)
    if (newFilters.pricing.length > 0) active.push(`Pricing: ${newFilters.pricing.join(", ")}`)
    if (newFilters.tags.length > 0) active.push(`Tags: ${newFilters.tags.slice(0, 3).join(", ")}`)
    if (newFilters.aiEnhanced !== null) active.push(`AI Enhanced: ${newFilters.aiEnhanced ? "Yes" : "No"}`)

    setActiveFilters(active)
    applyFilters()
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      source: [],
      pricing: [],
      tags: [],
      aiEnhanced: null,
    })
    setActiveFilters([])
    onFilterChange(products)
  }

  // Apply filters when search changes
  React.useEffect(() => {
    applyFilters()
  }, [searchQuery])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search products, repositories, or tools..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Filters</Label>
                {activeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="cursor-pointer">
                    Clear All
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <div className="space-y-2">
                  {uniqueStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => updateFilter("status", status, checked ? "add" : "remove")}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Source</Label>
                <div className="space-y-2">
                  {uniqueSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source}`}
                        checked={filters.source.includes(source)}
                        onCheckedChange={(checked) => updateFilter("source", source, checked ? "add" : "remove")}
                      />
                      <Label htmlFor={`source-${source}`} className="text-sm capitalize">
                        {source}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Enhanced Filter */}
              <div className="space-y-2">
                <Label className="text-sm">AI Enhanced</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-enhanced-yes"
                      checked={filters.aiEnhanced === true}
                      onCheckedChange={(checked) => updateFilter("aiEnhanced", checked ? true : null, "set")}
                    />
                    <Label htmlFor="ai-enhanced-yes" className="text-sm">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-enhanced-no"
                      checked={filters.aiEnhanced === false}
                      onCheckedChange={(checked) => updateFilter("aiEnhanced", checked ? false : null, "set")}
                    />
                    <Label htmlFor="ai-enhanced-no" className="text-sm">
                      No
                    </Label>
                  </div>
                </div>
              </div>

              {/* Popular Tags */}
              <div className="space-y-2">
                <Label className="text-sm">Popular Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {uniqueTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => updateFilter("tags", tag, filters.tags.includes(tag) ? "remove" : "add")}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Filters */}
        <Button
          variant={filters.status.includes("pending") ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter("status", "pending", filters.status.includes("pending") ? "remove" : "add")}
        >
          Pending
        </Button>
        <Button
          variant={filters.aiEnhanced === true ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter("aiEnhanced", filters.aiEnhanced === true ? null : true, "set")}
        >
          AI Enhanced
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter}
              <X className="w-3 h-3 cursor-pointer" onClick={clearFilters} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
