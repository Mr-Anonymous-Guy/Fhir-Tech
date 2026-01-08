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
  // 1. Check for manual environment variable override
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envBase && !envBase.includes("yourdomain.com") && !envBase.startsWith("@")) {
    return `${envBase.replace(/\/$/, "")}/api`;
  }

  // 2. In local development (localhost), try to hit the backend directly on port 3001
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname === "[::1]";

    // If we're on localhost and NOT on the backend port already
    if (isLocal && window.location.port !== "3001") {
      return "http://localhost:3001/api";
    }
  }

  // 3. Fallback: Use relative path (works with Vite proxy and Vercel/production)
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
      const contentType = response.headers.get("content-type");

      // If not JSON, it's likely an HTML error page (404/500)
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        const isHtml = text.trim().startsWith('<') || text.includes('The page could not be found');

        if (isHtml) {
          throw new Error(`API returned an HTML error instead of JSON. (Status: ${response.status})`);
        }

        throw new Error(`Unexpected response format: ${text.slice(0, 50)}...`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `API Error (${response.status})`);
      }

      return result;
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