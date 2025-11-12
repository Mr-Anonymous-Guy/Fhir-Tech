/**
 * MongoDB API Service
 * Communicates with the local MongoDB backend API
 */

import { NAMASTEMapping, AuditLogEntry } from '@/types/fhir';

interface MappingStats {
  totalMappings: number;
  avgConfidenceScore: number;
}

interface MappingFilters {
  category?: 'Ayurveda' | 'Siddha' | 'Unani';
  chapter?: string;
  minConfidence?: number;
  maxConfidence?: number;
}

interface AuditFilters {
  action?: string;
  userId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
}

// Resolve API base URL dynamically
const resolveApiBaseUrl = () => {
  // Check for environment variable, but ignore placeholder values
  const envBase =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    (typeof process !== "undefined" ? (process as any)?.env?.VITE_API_BASE_URL : "");

  const normalizedEnvBase =
    typeof envBase === "string" && envBase.length > 0
      ? envBase.replace(/\/$/, "")
      : "";

  // Ignore placeholder values like "api.yourdomain.com" or "@api_base_url"
  const isPlaceholder = normalizedEnvBase && (
    normalizedEnvBase.includes("yourdomain.com") ||
    normalizedEnvBase.includes("@api") ||
    normalizedEnvBase.startsWith("@")
  );

  if (normalizedEnvBase && !isPlaceholder) {
    return `${normalizedEnvBase}/api`;
  }

  // In browser, check if we're on localhost
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return "http://localhost:3001/api";
    }
  }

  // Default to relative path for Vercel deployment
  return "/api";
};

class MongoDbApiService {
  private isAvailable = false;
  
  private getBaseUrl(): string {
    return resolveApiBaseUrl();
  }

  // Helper method for API requests
  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    // Test connection to backend
    try {
      const healthCheck = await this.apiRequest('/health', { method: 'GET' });
      this.isAvailable = true;
      console.log('✅ Connected to MongoDB API backend. Database status:', healthCheck.database);
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ MongoDB API backend not available, will use browser fallback:', error);
      // Don't throw error here to allow browser fallback to work
    }
  }

  async disconnect(): Promise<void> {
    // No action needed for HTTP API
    this.isAvailable = false;
    console.log('✅ MongoDB API service disconnected');
  }

  isConnectedDb(): boolean {
    return this.isAvailable;
  }

  // Mapping operations
  async insertMappings(mappings: NAMASTEMapping[]): Promise<void> {
    await this.apiRequest('/mappings', {
      method: 'POST',
      body: JSON.stringify(mappings)
    });
  }

  async searchMappings(
    query: string,
    filters: MappingFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ mappings: NAMASTEMapping[]; total: number }> {
    // Don't check isAvailable - try the API call directly
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters.category) params.append('category', filters.category);
    if (filters.chapter) params.append('chapter', filters.chapter);
    if (filters.minConfidence) params.append('minConfidence', filters.minConfidence.toString());
    if (filters.maxConfidence) params.append('maxConfidence', filters.maxConfidence.toString());

    const result = await this.apiRequest(`/mappings/search?${params.toString()}`);
    return {
      mappings: result.mappings,
      total: result.total
    };
  }

  async getAllMappings(
    filters: MappingFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ mappings: NAMASTEMapping[]; total: number }> {
    // Don't check isAvailable - try the API call directly
    // If it fails, the caller will catch it and fall back
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters.category) params.append('category', filters.category);
    if (filters.chapter) params.append('chapter', filters.chapter);

    const result = await this.apiRequest(`/mappings?${params.toString()}`);
    return {
      mappings: result.mappings,
      total: result.total
    };
  }

  async getMappingByCode(code: string): Promise<NAMASTEMapping | null> {
    try {
      return await this.apiRequest(`/mappings/${encodeURIComponent(code)}`);
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getMappingStats(): Promise<MappingStats> {
    return await this.apiRequest('/mappings/stats/summary');
  }

  async getCategories(): Promise<string[]> {
    return await this.apiRequest('/mappings/metadata/categories');
  }

  async getChapters(): Promise<string[]> {
    return await this.apiRequest('/mappings/metadata/chapters');
  }

  async clearMappings(): Promise<void> {
    await this.apiRequest('/mappings', { method: 'DELETE' });
  }

  // Audit log operations
  async insertAuditEntry(entry: AuditLogEntry): Promise<void> {
    await this.apiRequest('/audit', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }

  async getAuditLogs(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters.action) params.append('action', filters.action);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.success !== undefined) params.append('success', filters.success.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const result = await this.apiRequest(`/audit?${params.toString()}`);
    return {
      entries: result.entries,
      total: result.total
    };
  }

  async clearAuditLogs(): Promise<void> {
    await this.apiRequest('/audit', { method: 'DELETE' });
  }
}

// Export singleton instance
export const mongoDbApiService = new MongoDbApiService();
export type { MappingFilters, AuditFilters };