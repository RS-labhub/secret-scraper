/**
 * Custom Schema Manager
 * Handles creation, storage, and management of custom export schemas
 */

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'array' | 'boolean' | 'object';
  mapping?: string; // Maps to product property path (e.g., 'name', 'metadata.stars', 'links.website')
  defaultValue?: any;
  required?: boolean;
}

export interface CustomSchema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'secret-scrapper-custom-schemas';

export class SchemaManager {
  /**
   * Create example schemas for users to start with
   */
  static createExampleSchemas(): void {
    const existingSchemas = this.getSchemas();
    
    // Don't create examples if schemas already exist
    if (existingSchemas.length > 0) return;

    const examples = [
      {
        name: "Minimal Product Info",
        description: "Basic product information with name, description, and website",
        fields: [
          {
            id: "field_1",
            name: "productName",
            type: "string" as const,
            mapping: "name",
            required: true
          },
          {
            id: "field_2", 
            name: "description",
            type: "string" as const,
            mapping: "description",
            required: false
          },
          {
            id: "field_3",
            name: "website",
            type: "string" as const,
            mapping: "links.website",
            required: false
          },
          {
            id: "field_4",
            name: "tags",
            type: "array" as const,
            mapping: "tags",
            required: false
          }
        ]
      },
      {
        name: "GitHub Repository Export",
        description: "Focused on GitHub repository data with stars, language, and links",
        fields: [
          {
            id: "field_1",
            name: "repo_name",
            type: "string" as const,
            mapping: "name",
            required: true
          },
          {
            id: "field_2",
            name: "stars",
            type: "number" as const,
            mapping: "metadata.stars",
            required: false
          },
          {
            id: "field_3",
            name: "language",
            type: "string" as const,
            mapping: "metadata.language",
            required: false
          },
          {
            id: "field_4",
            name: "github_url",
            type: "string" as const,
            mapping: "links.repository",
            required: false
          },
          {
            id: "field_5",
            name: "topics",
            type: "array" as const,
            mapping: "tags",
            required: false
          }
        ]
      },
      {
        name: "ProductHunt Launch Data",
        description: "ProductHunt specific data with upvotes and launch information",
        fields: [
          {
            id: "field_1",
            name: "product_name",
            type: "string" as const,
            mapping: "name",
            required: true
          },
          {
            id: "field_2",
            name: "tagline",
            type: "string" as const,
            mapping: "description",
            required: false
          },
          {
            id: "field_3",
            name: "upvotes",
            type: "number" as const,
            mapping: "metadata.upvotes",
            required: false
          },
          {
            id: "field_4",
            name: "logo",
            type: "string" as const,
            mapping: "logoUrl",
            required: false
          },
          {
            id: "field_5",
            name: "product_hunt_url",
            type: "string" as const,
            mapping: "links.productHunt",
            required: false
          },
          {
            id: "field_6",
            name: "categories",
            type: "array" as const,
            mapping: "categories",
            required: false
          }
        ]
      }
    ];

    // Create the example schemas
    examples.forEach(example => {
      this.saveSchema(example);
    });
  }

  /**
   * Get all saved schemas from localStorage
   */
  static getSchemas(): CustomSchema[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading schemas:', error);
      return [];
    }
  }

  /**
   * Save a schema to localStorage
   */
  static saveSchema(schema: Omit<CustomSchema, 'id' | 'createdAt' | 'updatedAt'>): CustomSchema {
    const schemas = this.getSchemas();
    const newSchema: CustomSchema = {
      ...schema,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    schemas.push(newSchema);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
    return newSchema;
  }

  /**
   * Update an existing schema
   */
  static updateSchema(id: string, updates: Partial<Omit<CustomSchema, 'id' | 'createdAt'>>): CustomSchema | null {
    const schemas = this.getSchemas();
    const index = schemas.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    const updatedSchema = {
      ...schemas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    schemas[index] = updatedSchema;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
    return updatedSchema;
  }

  /**
   * Delete a schema
   */
  static deleteSchema(id: string): boolean {
    const schemas = this.getSchemas();
    const filteredSchemas = schemas.filter(s => s.id !== id);
    
    if (filteredSchemas.length === schemas.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSchemas));
    return true;
  }

  /**
   * Get a specific schema by ID
   */
  static getSchema(id: string): CustomSchema | null {
    const schemas = this.getSchemas();
    return schemas.find(s => s.id === id) || null;
  }

  /**
   * Apply a custom schema to transform product data
   */
  static applySchema(products: any[], schema: CustomSchema): any[] {
    return products.map(product => {
      const transformed: any = {};

      schema.fields.forEach(field => {
        const value = this.getNestedValue(product, field.mapping || '');
        
        if (value !== undefined && value !== null) {
          transformed[field.name] = this.convertValue(value, field.type);
        } else if (field.defaultValue !== undefined) {
          transformed[field.name] = field.defaultValue;
        } else if (field.required) {
          transformed[field.name] = this.getDefaultForType(field.type);
        }
      });

      return transformed;
    });
  }

  /**
   * Get available product properties for mapping
   */
  static getAvailableProperties(): { path: string; label: string; type: string }[] {
    return [
      { path: 'id', label: 'Product ID', type: 'string' },
      { path: 'name', label: 'Product Name', type: 'string' },
      { path: 'description', label: 'Description', type: 'string' },
      { path: 'logoUrl', label: 'Logo URL', type: 'string' },
      { path: 'source', label: 'Source Platform', type: 'string' },
      { path: 'status', label: 'Status', type: 'string' },
      
      // Links
      { path: 'links.website', label: 'Website URL', type: 'string' },
      { path: 'links.repository', label: 'Repository URL', type: 'string' },
      { path: 'links.productHunt', label: 'ProductHunt URL', type: 'string' },
      { path: 'links.documentation', label: 'Documentation URL', type: 'string' },
      { path: 'links.demo', label: 'Demo URL', type: 'string' },
      
      // Metadata
      { path: 'metadata.stars', label: 'Stars Count', type: 'number' },
      { path: 'metadata.starsToday', label: 'Stars Today', type: 'number' },
      { path: 'metadata.upvotes', label: 'Upvotes Count', type: 'number' },
      { path: 'metadata.forks', label: 'Forks Count', type: 'number' },
      { path: 'metadata.language', label: 'Programming Language', type: 'string' },
      { path: 'metadata.license', label: 'License', type: 'string' },
      { path: 'metadata.scrapedAt', label: 'Scraped Date', type: 'string' },
      { path: 'metadata.sourceIcon', label: 'Source Icon', type: 'string' },
      
      // Arrays
      { path: 'tags', label: 'Tags', type: 'array' },
      { path: 'domains', label: 'Domains', type: 'array' },
      { path: 'categories', label: 'Categories', type: 'array' },
      { path: 'features', label: 'Features', type: 'array' },
      { path: 'pricing', label: 'Pricing', type: 'array' },
      
      // AI Enhanced
      { path: 'aiEnhanced.summary', label: 'AI Summary', type: 'string' },
      { path: 'aiEnhanced.highlights', label: 'AI Highlights', type: 'array' },
      { path: 'aiEnhanced.suggestedTags', label: 'AI Suggested Tags', type: 'array' },
      { path: 'aiEnhanced.suggestedDomains', label: 'AI Suggested Domains', type: 'array' },
      { path: 'aiEnhanced.suggestedCategories', label: 'AI Suggested Categories', type: 'array' },
    ];
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Convert value to specified type
   */
  private static convertValue(value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value || '');
      case 'number':
        return Number(value) || 0;
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value].filter(v => v !== undefined && v !== null);
      case 'object':
        return typeof value === 'object' ? value : {};
      default:
        return value;
    }
  }

  /**
   * Get default value for type
   */
  private static getDefaultForType(type: string): any {
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Validate schema
   */
  static validateSchema(schema: Partial<CustomSchema>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.name || schema.name.trim().length === 0) {
      errors.push('Schema name is required');
    }

    if (!schema.fields || schema.fields.length === 0) {
      errors.push('At least one field is required');
    }

    if (schema.fields) {
      schema.fields.forEach((field, index) => {
        if (!field.name || field.name.trim().length === 0) {
          errors.push(`Field ${index + 1}: Name is required`);
        }
        
        if (!field.type) {
          errors.push(`Field ${index + 1}: Type is required`);
        }

        // Check for duplicate field names
        const duplicates = schema.fields!.filter(f => f.name === field.name);
        if (duplicates.length > 1) {
          errors.push(`Field "${field.name}": Duplicate field names are not allowed`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export schema as JSON for backup/sharing
   */
  static exportSchema(schema: CustomSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Import schema from JSON
   */
  static importSchema(jsonString: string): { success: boolean; schema?: CustomSchema; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = this.validateSchema(parsed);
      
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Generate new ID and timestamps for imported schema
      const importedSchema = this.saveSchema({
        name: `${parsed.name} (Imported)`,
        description: parsed.description,
        fields: parsed.fields
      });

      return { success: true, schema: importedSchema };
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' };
    }
  }
}
