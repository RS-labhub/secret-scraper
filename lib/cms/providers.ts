export interface CMSProvider {
  name: string
  requiresApiKey: boolean
  requiresConfig: boolean
  configFields: CMSConfigField[]
  publish(product: any, config: any): Promise<CMSPublishResult>
  test(config: any): Promise<boolean>
}

export interface CMSConfigField {
  key: string
  label: string
  type: "text" | "password" | "url" | "select"
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface CMSPublishResult {
  success: boolean
  id?: string
  url?: string
  error?: string
}

export class ContentfulProvider implements CMSProvider {
  name = "Contentful"
  requiresApiKey = true
  requiresConfig = true
  configFields: CMSConfigField[] = [
    { key: "spaceId", label: "Space ID", type: "text", required: true, placeholder: "your-space-id" },
    { key: "accessToken", label: "Content Management API Token", type: "password", required: true },
    { key: "environment", label: "Environment", type: "text", required: false, placeholder: "master" },
    { key: "contentType", label: "Content Type ID", type: "text", required: true, placeholder: "product" },
  ]

  async publish(product: any, config: any): Promise<CMSPublishResult> {
    try {
      const { spaceId, accessToken, environment = "master", contentType } = config

      const response = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/${environment}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.contentful.management.v1+json",
          Authorization: `Bearer ${accessToken}`,
          "X-Contentful-Content-Type": contentType,
        },
        body: JSON.stringify({
          fields: {
            name: { "en-US": product.name },
            description: { "en-US": product.aiEnhanced?.summary || product.description },
            tags: { "en-US": product.aiEnhanced?.suggestedTags || product.tags },
            features: { "en-US": product.features },
            source: { "en-US": product.source },
            websiteUrl: { "en-US": product.links.website },
            repositoryUrl: { "en-US": product.links.repository },
            pricing: { "en-US": product.pricing?.type },
            rating: { "en-US": product.metadata.rating || product.metadata.stars },
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to publish to Contentful")
      }

      const result = await response.json()
      return {
        success: true,
        id: result.sys.id,
        url: `https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${result.sys.id}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async test(config: any): Promise<boolean> {
    try {
      const { spaceId, accessToken, environment = "master" } = config
      const response = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/${environment}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export class StrapiProvider implements CMSProvider {
  name = "Strapi"
  requiresApiKey = true
  requiresConfig = true
  configFields: CMSConfigField[] = [
    { key: "baseUrl", label: "Strapi Base URL", type: "url", required: true, placeholder: "https://your-strapi.com" },
    { key: "apiToken", label: "API Token", type: "password", required: true },
    { key: "contentType", label: "Content Type", type: "text", required: true, placeholder: "products" },
  ]

  async publish(product: any, config: any): Promise<CMSPublishResult> {
    try {
      const { baseUrl, apiToken, contentType } = config

      const response = await fetch(`${baseUrl}/api/${contentType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          data: {
            name: product.name,
            description: product.aiEnhanced?.summary || product.description,
            tags: product.aiEnhanced?.suggestedTags || product.tags,
            features: product.features,
            source: product.source,
            websiteUrl: product.links.website,
            repositoryUrl: product.links.repository,
            pricing: product.pricing?.type,
            rating: product.metadata.rating || product.metadata.stars,
            publishedAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to publish to Strapi")
      }

      const result = await response.json()
      return {
        success: true,
        id: result.data.id.toString(),
        url: `${baseUrl}/admin/content-manager/collectionType/api::${contentType}.${contentType}/${result.data.id}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async test(config: any): Promise<boolean> {
    try {
      const { baseUrl, apiToken } = config
      const response = await fetch(`${baseUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export class WebhookProvider implements CMSProvider {
  name = "Custom Webhook"
  requiresApiKey = false
  requiresConfig = true
  configFields: CMSConfigField[] = [
    {
      key: "webhookUrl",
      label: "Webhook URL",
      type: "url",
      required: true,
      placeholder: "https://your-api.com/webhook",
    },
    {
      key: "authHeader",
      label: "Authorization Header",
      type: "password",
      required: false,
      placeholder: "Bearer token",
    },
    { key: "method", label: "HTTP Method", type: "select", required: true, options: ["POST", "PUT", "PATCH"] },
  ]

  async publish(product: any, config: any): Promise<CMSPublishResult> {
    try {
      const { webhookUrl, authHeader, method = "POST" } = config

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (authHeader) {
        headers.Authorization = authHeader
      }

      const response = await fetch(webhookUrl, {
        method,
        headers,
        body: JSON.stringify({
          product: {
            name: product.name,
            description: product.aiEnhanced?.summary || product.description,
            tags: product.aiEnhanced?.suggestedTags || product.tags,
            features: product.features,
            source: product.source,
            links: product.links,
            pricing: product.pricing,
            metadata: product.metadata,
            aiEnhanced: product.aiEnhanced,
          },
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`)
      }

      const result = await response.text()
      return {
        success: true,
        id: product.id,
        url: webhookUrl,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async test(config: any): Promise<boolean> {
    try {
      const { webhookUrl, authHeader } = config

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (authHeader) {
        headers.Authorization = authHeader
      }

      const response = await fetch(webhookUrl, {
        method: "HEAD",
        headers,
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export class SanityProvider implements CMSProvider {
  name = "Sanity"
  requiresApiKey = true
  requiresConfig = true
  configFields: CMSConfigField[] = [
    { key: "projectId", label: "Project ID", type: "text", required: true, placeholder: "your-project-id" },
    { key: "dataset", label: "Dataset", type: "text", required: true, placeholder: "production" },
    { key: "token", label: "Write Token", type: "password", required: true },
    { key: "apiVersion", label: "API Version", type: "text", required: false, placeholder: "2023-05-03" },
  ]

  async publish(product: any, config: any): Promise<CMSPublishResult> {
    try {
      const { projectId, dataset, token, apiVersion = "2023-05-03" } = config

      const sanityDoc = {
        _type: "product",
        name: product.name,
        slug: {
          _type: "slug",
          current: product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        },
        description: product.aiEnhanced?.summary || product.description,
        tags: product.aiEnhanced?.suggestedTags || product.tags,
        features: product.features,
        source: product.source,
        websiteUrl: product.links.website,
        repositoryUrl: product.links.repository,
        pricing: product.pricing?.type,
        rating: product.metadata.rating || product.metadata.stars,
        publishedAt: new Date().toISOString(),
      }

      const response = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              create: sanityDoc,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.description || "Failed to publish to Sanity")
      }

      const result = await response.json()
      const documentId = result.results[0].id

      return {
        success: true,
        id: documentId,
        url: `https://${projectId}.sanity.studio/desk/product;${documentId}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async test(config: any): Promise<boolean> {
    try {
      const { projectId, dataset, token, apiVersion = "2023-05-03" } = config
      const response = await fetch(
        `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=*[0]`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return response.ok
    } catch {
      return false
    }
  }
}

export const CMS_PROVIDERS = {
  contentful: new ContentfulProvider(),
  strapi: new StrapiProvider(),
  sanity: new SanityProvider(),
  webhook: new WebhookProvider(),
}
