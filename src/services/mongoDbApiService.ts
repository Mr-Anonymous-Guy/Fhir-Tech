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

class MongoDbApiService {
  private baseUrl = 'http://localhost:3001/api';

  // Helper method for API requests
  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async connect(): Promise<void> {
    // Test connection to backend
    try {
      await this.apiRequest('/health', { method: 'GET' });
      console.log('✅ Connected to MongoDB API backend');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB API backend:', error);
      throw new Error('Backend API is not available. Please ensure the backend server is running on port 3001.');
    }
  }

  async disconnect(): Promise<void> {
    // No action needed for HTTP API
    console.log('✅ MongoDB API service disconnected');
  }

  isConnectedDb(): boolean {
    // Always return true as we check connection on each request
    return true;
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

  async getMappingByCode(code: string): Promise<NAMASTEMapping | null> {
    try {
      return await this.apiRequest(`/mappings/${encodeURIComponent(code)}`);
    } catch (error) {
      if (error.message.includes('404')) {
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