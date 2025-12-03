export interface ExportOptions {
  format: "json" | "csv" | "xml" | "markdown"
  includeMetadata?: boolean
  includeAiEnhancements?: boolean
  dateRange?: {
    start?: Date
    end?: Date
  }
}

export class ProductExporter {
  static exportToJSON(products: any[], options: ExportOptions = { format: "json" }) {
    const exportData = {
      metadata: options.includeMetadata
        ? {
            exportDate: new Date().toISOString(),
            totalProducts: products.length,
            format: "json",
          }
        : undefined,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        logoUrl: product.logoUrl, // Add logo URL for ProductHunt products
        websiteUrl: product.links?.website,
        repositoryUrl: product.links?.repository,
        productHuntUrl: product.links?.productHunt,
        documentationUrl: product.links?.documentation,
        demoUrl: product.links?.demo,
        stars: product.metadata?.stars,
        starsToday: product.metadata?.starsToday,
        upvotes: product.metadata?.upvotes,
        forks: product.metadata?.forks,
        language: product.metadata?.language,
        license: product.metadata?.license,
        domains: product.domains,
        categories: product.categories,
        ...(product.features && product.features.length > 0 ? { features: product.features } : {}),
        pricing: product.pricing,
        source: product.source,
        status: product.status,
        scrapedAt: product.metadata?.scrapedAt,
        ...(options.includeAiEnhancements && product.aiEnhanced
          ? {
              aiSummary: product.aiEnhanced.summary,
              aiSuggestedDomains: product.aiEnhanced.suggestedDomains,
              aiSuggestedCategories: product.aiEnhanced.suggestedCategories,
            }
          : {}),
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }

  static exportToCSV(products: any[], options: ExportOptions = { format: "csv" }) {
    const headers = ["ID", "Name", "Description", "Logo URL", "Website URL", "Repository URL", "Product Hunt URL", "Stars", "Upvotes", "Language", "Domains", "Categories", "Features", "Pricing", "Source", "Status", "Scraped At"]

    if (options.includeAiEnhancements) {
      headers.push("AI Summary", "AI Suggested Domains", "AI Suggested Categories")
    }

    const csvRows = [headers.join(",")]

    products.forEach((product) => {
      const row = [
        product.id,
        `"${product.name?.replace(/"/g, '""') || ""}"`,
        `"${product.description?.replace(/"/g, '""') || ""}"`,
        product.logoUrl || "",
        product.links?.website || "",
        product.links?.repository || "",
        product.links?.productHunt || "",
        product.metadata?.stars || "",
        product.metadata?.upvotes || "",
        product.metadata?.language || "",
        `"${product.domains?.join("; ") || ""}"`,
        `"${product.categories?.join("; ") || ""}"`,
        `"${product.features?.join("; ") || ""}"`,
        `"${product.pricing?.type || ""}"`,
        product.source || "",
        product.status || "",
        product.metadata?.scrapedAt || "",
      ]

      if (options.includeAiEnhancements && product.aiEnhanced) {
        row.push(
          `"${product.aiEnhanced.summary?.replace(/"/g, '""') || ""}"`,
          `"${product.aiEnhanced.suggestedDomains?.join("; ") || ""}"`,
          `"${product.aiEnhanced.suggestedCategories?.join("; ") || ""}"`,
        )
      }

      csvRows.push(row.join(","))
    })

    return csvRows.join("\n")
  }

  static exportToXML(products: any[], options: ExportOptions = { format: "xml" }) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n'

    if (options.includeMetadata) {
      xml += `  <metadata>\n`
      xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`
      xml += `    <totalProducts>${products.length}</totalProducts>\n`
      xml += `    <format>xml</format>\n`
      xml += `  </metadata>\n`
    }

    products.forEach((product) => {
      xml += "  <product>\n"
      xml += `    <id>${product.id || ""}</id>\n`
      xml += `    <name><![CDATA[${product.name || ""}]]></name>\n`
      xml += `    <description><![CDATA[${product.description || ""}]]></description>\n`
      xml += `    <logoUrl>${product.logoUrl || ""}</logoUrl>\n`
      xml += `    <links>\n`
      xml += `      <website>${product.links?.website || ""}</website>\n`
      xml += `      <repository>${product.links?.repository || ""}</repository>\n`
      xml += `      <productHunt>${product.links?.productHunt || ""}</productHunt>\n`
      xml += `      <documentation>${product.links?.documentation || ""}</documentation>\n`
      xml += `      <demo>${product.links?.demo || ""}</demo>\n`
      xml += `    </links>\n`
      xml += `    <metadata>\n`
      xml += `      <stars>${product.metadata?.stars || ""}</stars>\n`
      xml += `      <starsToday>${product.metadata?.starsToday || ""}</starsToday>\n`
      xml += `      <upvotes>${product.metadata?.upvotes || ""}</upvotes>\n`
      xml += `      <forks>${product.metadata?.forks || ""}</forks>\n`
      xml += `      <language>${product.metadata?.language || ""}</language>\n`
      xml += `      <license>${product.metadata?.license || ""}</license>\n`
      xml += `      <scrapedAt>${product.metadata?.scrapedAt || ""}</scrapedAt>\n`
      xml += `    </metadata>\n`
      xml += `    <domains>\n`
      product.domains?.forEach((domain: string) => {
        xml += `      <domain><![CDATA[${domain}]]></domain>\n`
      })
      xml += `    </domains>\n`
      xml += `    <categories>\n`
      product.categories?.forEach((category: string) => {
        xml += `      <category><![CDATA[${category}]]></category>\n`
      })
      xml += `    </categories>\n`
      if (product.features && product.features.length > 0) {
        xml += `    <features>\n`
        product.features.forEach((feature: string) => {
          xml += `      <feature><![CDATA[${feature}]]></feature>\n`
        })
        xml += `    </features>\n`
      }
      xml += `    <pricing><![CDATA[${product.pricing?.type || ""}]]></pricing>\n`
      xml += `    <source>${product.source || ""}</source>\n`
      xml += `    <status>${product.status || ""}</status>\n`

      if (options.includeAiEnhancements && product.aiEnhanced) {
        xml += `    <aiEnhancements>\n`
        xml += `      <summary><![CDATA[${product.aiEnhanced.summary || ""}]]></summary>\n`
        xml += `      <suggestedDomains>\n`
        product.aiEnhanced.suggestedDomains?.forEach((domain: string) => {
          xml += `        <domain><![CDATA[${domain}]]></domain>\n`
        })
        xml += `      </suggestedDomains>\n`
        xml += `      <suggestedCategories>\n`
        product.aiEnhanced.suggestedCategories?.forEach((category: string) => {
          xml += `        <category><![CDATA[${category}]]></category>\n`
        })
        xml += `      </suggestedCategories>\n`
        xml += `    </aiEnhancements>\n`
      }

      xml += "  </product>\n"
    })

    xml += "</products>"
    return xml
  }

  static exportToMarkdown(products: any[], options: ExportOptions = { format: "markdown" }) {
    let markdown = ""

    if (options.includeMetadata) {
      markdown += `# Product Export\n\n`
      markdown += `- **Export Date**: ${new Date().toISOString()}\n`
      markdown += `- **Total Products**: ${products.length}\n`
      markdown += `- **Format**: Markdown\n\n`
      markdown += `---\n\n`
    }

    products.forEach((product, index) => {
      // Product header
      markdown += `## ${index + 1}. [${product.name}](${product.links?.website || product.links?.repository || product.links?.productHunt || '#'})\n\n`
      
      // Logo
      if (product.logoUrl) {
        markdown += `![${product.name} Logo](${product.logoUrl})\n\n`
      }
      
      // Description
      if (product.description) {
        markdown += `${product.description}\n\n`
      }

      // Source info and stats
      markdown += `**Source**: ${product.source}\n\n`
      
      if (product.source === "github" && product.metadata?.stars) {
        markdown += `⭐ **${product.metadata.stars.toLocaleString()} stars**`
        if (product.metadata?.starsToday && product.metadata.starsToday > 0) {
          markdown += ` (+${product.metadata.starsToday} today)`
        }
        markdown += `\n\n`
      } else if (product.source === "producthunt" && product.metadata?.upvotes) {
        markdown += `⬆️ **${product.metadata.upvotes} upvotes**\n\n`
      }

      // Features - Only show if they exist
      if (product.features && product.features.length > 0) {
        markdown += `**Key Features**:\n`
        product.features.forEach((feature: string) => {
          markdown += `- ${feature}\n`
        })
        markdown += `\n`
      }

      // AI Enhanced content
      if (options.includeAiEnhancements && product.aiEnhanced) {
        if (product.aiEnhanced.summary) {
          markdown += `**AI Summary**: ${product.aiEnhanced.summary}\n\n`
        }
      }

      // Links
      if (product.links) {
        markdown += `**Links**:\n`
        if (product.links.website) {
          markdown += `- [Website](${product.links.website})\n`
        }
        if (product.links.repository) {
          markdown += `- [Repository](${product.links.repository})\n`
        }
        if (product.links.productHunt) {
          markdown += `- [Product Hunt](${product.links.productHunt})\n`
        }
        if (product.links.documentation) {
          markdown += `- [Documentation](${product.links.documentation})\n`
        }
        markdown += `\n`
      }

      // Separator between products
      if (index < products.length - 1) {
        markdown += `---\n\n`
      }
    })

    return markdown
  }

  /**
   * Export using a custom schema (JSON format only)
   */
  static exportWithCustomSchema(
    products: any[], 
    schema: { name: string; description?: string; fields: any[] }, 
    options: ExportOptions = { format: "json" }
  ) {
    // This will be handled by SchemaManager.applySchema in the dialog
    // This method is kept for consistency but the actual work is done by SchemaManager
    return JSON.stringify({
      schema: {
        name: schema.name,
        description: schema.description,
        version: "1.0"
      },
      metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        totalProducts: products.length,
        format: "custom-json"
      } : undefined,
      products: products
    }, null, 2);
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
