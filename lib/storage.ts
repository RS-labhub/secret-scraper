import { AppSettings, Product } from "@/types/product"

const STORAGE_KEYS = {
  PRODUCTS: "product-scraper-products",
  SETTINGS: "product-scraper-settings",
  LAST_SCRAPE: "product-scraper-last-scrape",
  FIRECRAWL_API_KEY: "product-scraper-firecrawl-key",
} as const

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === "undefined") return defaultValue
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Failed to load from storage (${key}):`, error)
    return defaultValue
  }
}

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save to storage (${key}):`, error)
  }
}

export const storage = {
  saveProducts: (products: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    } catch (error) {
      console.error("Failed to save products:", error)
    }
  },

  loadProducts: (): Product[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load products:", error)
      return []
    }
  },

  saveSettings: (settings: AppSettings) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify({
          ...settings,
          lastUpdated: new Date().toISOString(),
        }),
      )
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  },

  loadSettings: (): AppSettings | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error("Failed to load settings:", error)
      return null
    }
  },

  saveLastScrape: (result: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SCRAPE, JSON.stringify(result))
    } catch (error) {
      console.error("Failed to save last scrape:", error)
    }
  },

  loadLastScrape: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_SCRAPE)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error("Failed to load last scrape:", error)
      return null
    }
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  },

  saveFirecrawlApiKey: (apiKey: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FIRECRAWL_API_KEY, apiKey)
    } catch (error) {
      console.error("Failed to save Firecrawl API key:", error)
    }
  },

  loadFirecrawlApiKey: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.FIRECRAWL_API_KEY) || ""
    } catch (error) {
      console.error("Failed to load Firecrawl API key:", error)
      return ""
    }
  },
}
