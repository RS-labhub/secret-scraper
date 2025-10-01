import { type NextRequest, NextResponse } from "next/server"
import { ProductExporter } from "@/lib/export/formats"

export async function POST(request: NextRequest) {
  try {
    const { products, options } = await request.json()

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Products array is required" }, { status: 400 })
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (options.format) {
      case "csv":
        content = ProductExporter.exportToCSV(products, options)
        mimeType = "text/csv"
        fileExtension = "csv"
        break
      case "xml":
        content = ProductExporter.exportToXML(products, options)
        mimeType = "application/xml"
        fileExtension = "xml"
        break
      case "json":
      default:
        content = ProductExporter.exportToJSON(products, options)
        mimeType = "application/json"
        fileExtension = "json"
        break
    }

    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `products-export-${timestamp}.${fileExtension}`

    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export products" }, { status: 500 })
  }
}
