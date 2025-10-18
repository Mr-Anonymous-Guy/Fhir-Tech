/**
 * Browser-compatible database service using IndexedDB
 * This replaces the MongoDB driver for client-side storage
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

class BrowserDatabaseService {
  private db: IDBDatabase | null = null;
  private dbName = 'namaste-sync';
  private version = 1;
  private isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isConnected = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create mappings store
        if (!db.objectStoreNames.contains('mappings')) {
          const mappingStore = db.createObjectStore('mappings', { keyPath: 'namaste_code' });
          mappingStore.createIndex('category', 'category', { unique: false });
          mappingStore.createIndex('chapter_name', 'chapter_name', { unique: false });
          mappingStore.createIndex('confidence_score', 'confidence_score', { unique: false });
          mappingStore.createIndex('namaste_term', 'namaste_term', { unique: false });
        }

        // Create audit logs store
        if (!db.objectStoreNames.contains('auditLogs')) {
          const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('userId', 'userId', { unique: false });
          auditStore.createIndex('action', 'action', { unique: false });
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isConnected = false;
    }
  }

  isConnectedDb(): boolean {
    return this.isConnected && this.db !== null;
  }

  // Mapping operations
  async insertMappings(mappings: NAMASTEMapping[]): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readwrite');
    const store = transaction.objectStore('mappings');

    for (const mapping of mappings) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(mapping);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async searchMappings(
    query: string, 
    filters: MappingFilters = {},
    page: number = 1, 
    limit: number = 20
  ): Promise<{ mappings: NAMASTEMapping[]; total: number }> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readonly');
    const store = transaction.objectStore('mappings');

    return new Promise((resolve, reject) => {
      const allMappings: NAMASTEMapping[] = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const mapping = cursor.value as NAMASTEMapping;
          
          // Apply filters
          let matchesFilters = true;
          if (filters.category && mapping.category !== filters.category) {
            matchesFilters = false;
          }
          if (filters.chapter && mapping.chapter_name !== filters.chapter) {
            matchesFilters = false;
          }
          if (filters.minConfidence && mapping.confidence_score < filters.minConfidence) {
            matchesFilters = false;
          }
          if (filters.maxConfidence && mapping.confidence_score > filters.maxConfidence) {
            matchesFilters = false;
          }

          // Apply text search
          const searchTerm = query.toLowerCase();
          const matchesSearch = !query || 
            mapping.namaste_term.toLowerCase().includes(searchTerm) ||
            mapping.namaste_code.toLowerCase().includes(searchTerm) ||
            mapping.icd11_tm2_description.toLowerCase().includes(searchTerm);

          if (matchesFilters && matchesSearch) {
            allMappings.push(mapping);
          }

          cursor.continue();
        } else {
          // Sort by relevance/confidence score
          allMappings.sort((a, b) => b.confidence_score - a.confidence_score);
          
          // Apply pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedResults = allMappings.slice(startIndex, endIndex);

          resolve({
            mappings: paginatedResults,
            total: allMappings.length
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getMappingByCode(code: string): Promise<NAMASTEMapping | null> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readonly');
    const store = transaction.objectStore('mappings');

    return new Promise((resolve, reject) => {
      const request = store.get(code);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMappingStats(): Promise<MappingStats> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readonly');
    const store = transaction.objectStore('mappings');

    return new Promise((resolve, reject) => {
      let totalMappings = 0;
      let totalConfidence = 0;
      
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const mapping = cursor.value as NAMASTEMapping;
          totalMappings++;
          totalConfidence += mapping.confidence_score;
          cursor.continue();
        } else {
          resolve({
            totalMappings,
            avgConfidenceScore: totalMappings > 0 ? totalConfidence / totalMappings : 0
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getCategories(): Promise<string[]> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readonly');
    const store = transaction.objectStore('mappings');
    const index = store.index('category');

    return new Promise((resolve, reject) => {
      const categories = new Set<string>();
      const request = index.openCursor(null, 'nextunique');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          categories.add(cursor.key as string);
          cursor.continue();
        } else {
          resolve(Array.from(categories));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getChapters(): Promise<string[]> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readonly');
    const store = transaction.objectStore('mappings');
    const index = store.index('chapter_name');

    return new Promise((resolve, reject) => {
      const chapters = new Set<string>();
      const request = index.openCursor(null, 'nextunique');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          chapters.add(cursor.key as string);
          cursor.continue();
        } else {
          resolve(Array.from(chapters));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearMappings(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['mappings'], 'readwrite');
    const store = transaction.objectStore('mappings');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Audit log operations
  async insertAuditEntry(entry: AuditLogEntry): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['auditLogs'], 'readwrite');
    const store = transaction.objectStore('auditLogs');

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAuditLogs(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['auditLogs'], 'readonly');
    const store = transaction.objectStore('auditLogs');

    return new Promise((resolve, reject) => {
      const allEntries: AuditLogEntry[] = [];
      const request = store.openCursor(null, 'prev'); // Most recent first

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as AuditLogEntry;
          
          // Apply filters
          let matchesFilters = true;
          if (filters.action && entry.action !== filters.action) {
            matchesFilters = false;
          }
          if (filters.userId && entry.userId !== filters.userId) {
            matchesFilters = false;
          }
          if (filters.success !== undefined && entry.success !== filters.success) {
            matchesFilters = false;
          }
          if (filters.startDate && entry.timestamp < filters.startDate) {
            matchesFilters = false;
          }
          if (filters.endDate && entry.timestamp > filters.endDate) {
            matchesFilters = false;
          }

          if (matchesFilters) {
            allEntries.push(entry);
          }

          cursor.continue();
        } else {
          // Apply pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedResults = allEntries.slice(startIndex, endIndex);

          resolve({
            entries: paginatedResults,
            total: allEntries.length
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearAuditLogs(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(['auditLogs'], 'readwrite');
    const store = transaction.objectStore('auditLogs');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const browserDbService = new BrowserDatabaseService();
export type { MappingFilters, AuditFilters };