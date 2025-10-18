import { MongoClient, Db, Collection } from 'mongodb';
import { NAMASTEMapping, AuditLogEntry } from '@/types/fhir';

// Database interface for type safety
export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Mappings operations
  getMappings(filters?: MappingFilters, page?: number, limit?: number): Promise<PaginatedResult<NAMASTEMapping>>;
  insertMappings(mappings: NAMASTEMapping[]): Promise<void>;
  searchMappings(query: string, page?: number, limit?: number): Promise<SearchMappingsResult>;
  getMappingById(id: string): Promise<NAMASTEMapping | null>;
  updateMapping(id: string, mapping: Partial<NAMASTEMapping>): Promise<void>;
  deleteMapping(id: string): Promise<void>;
  clearMappings(): Promise<void>;
  
  // Audit log operations
  insertAuditEntry(entry: AuditLogEntry): Promise<void>;
  getAuditLogs(filters?: AuditFilters, page?: number, limit?: number): Promise<PaginatedResult<AuditLogEntry>>;
  clearAuditLogs(): Promise<void>;
  
  // Metadata operations
  getCategories(): Promise<string[]>;
  getChapters(): Promise<string[]>;
  getMappingStats(): Promise<MappingStats>;
}

export interface MappingFilters {
  category?: string;
  chapter?: string;
  search?: string;
}

export interface AuditFilters {
  action?: string;
  userId?: string;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchMappingsResult {
  results: Array<{
    mapping: NAMASTEMapping;
    score: number;
    highlights?: {
      term?: string;
      description?: string;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  query: string;
}

export interface MappingStats {
  totalMappings: number;
  categoryCounts: { [category: string]: number };
  chapterCounts: { [chapter: string]: number };
  avgConfidenceScore: number;
}

class MongoDBService implements DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private mappingsCollection: Collection<NAMASTEMapping> | null = null;
  private auditCollection: Collection<AuditLogEntry> | null = null;
  
  private readonly connectionString: string;
  private readonly dbName: string;
  
  constructor() {
    this.connectionString = import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017/namaste-sync';
    this.dbName = import.meta.env.VITE_MONGODB_DB_NAME || 'namaste-sync';
  }
  
  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      
      this.db = this.client.db(this.dbName);
      this.mappingsCollection = this.db.collection<NAMASTEMapping>('mappings');
      this.auditCollection = this.db.collection<AuditLogEntry>('audit_logs');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }
  
  private async createIndexes(): Promise<void> {
    if (!this.mappingsCollection || !this.auditCollection) return;
    
    try {
      // Mappings indexes
      await this.mappingsCollection.createIndex({ namaste_code: 1 }, { unique: true });
      await this.mappingsCollection.createIndex({ category: 1 });
      await this.mappingsCollection.createIndex({ chapter_name: 1 });
      await this.mappingsCollection.createIndex({ namaste_term: 'text', icd11_tm2_description: 'text' });
      await this.mappingsCollection.createIndex({ confidence_score: -1 });
      
      // Audit logs indexes
      await this.auditCollection.createIndex({ timestamp: -1 });
      await this.auditCollection.createIndex({ userId: 1 });
      await this.auditCollection.createIndex({ action: 1 });
      await this.auditCollection.createIndex({ success: 1 });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.mappingsCollection = null;
      this.auditCollection = null;
      console.log('Disconnected from MongoDB');
    }
  }
  
  isConnected(): boolean {
    return this.client?.topology?.isConnected() || false;
  }
  
  // Mappings operations
  async getMappings(filters: MappingFilters = {}, page = 1, limit = 20): Promise<PaginatedResult<NAMASTEMapping>> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    
    const query: Record<string, unknown> = {};
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.chapter) {
      query.chapter_name = new RegExp(filters.chapter, 'i');
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    const skip = (page - 1) * limit;
    const total = await this.mappingsCollection.countDocuments(query);
    const data = await this.mappingsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ confidence_score: -1, namaste_code: 1 })
      .toArray();
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async insertMappings(mappings: NAMASTEMapping[]): Promise<void> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    
    try {
      await this.mappingsCollection.insertMany(mappings, { ordered: false });
      console.log(`Inserted ${mappings.length} mappings`);
    } catch (error: unknown) {
      // Handle duplicate key errors gracefully
      if ((error as { code?: number }).code === 11000) {
        console.warn('Some mappings already exist, skipping duplicates');
      } else {
        throw error;
      }
    }
  }
  
  async searchMappings(query: string, page = 1, limit = 10): Promise<SearchMappingsResult> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    
    const searchQuery = {
      $text: { $search: query }
    };
    
    const skip = (page - 1) * limit;
    const total = await this.mappingsCollection.countDocuments(searchQuery);
    
    const results = await this.mappingsCollection
      .find(searchQuery, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const formattedResults = results.map(result => {
      const highlights: { term?: string; description?: string } = {};
      const normalizedQuery = query.toLowerCase();
      
      if (result.namaste_term.toLowerCase().includes(normalizedQuery)) {
        highlights.term = result.namaste_term.replace(
          new RegExp(normalizedQuery, 'gi'),
          match => `<mark>${match}</mark>`
        );
      }
      
      if (result.icd11_tm2_description.toLowerCase().includes(normalizedQuery)) {
        highlights.description = result.icd11_tm2_description.replace(
          new RegExp(normalizedQuery, 'gi'),
          match => `<mark>${match}</mark>`
        );
      }
      
      return {
        mapping: result,
        score: (result as { score?: number }).score || 1,
        highlights: Object.keys(highlights).length > 0 ? highlights : undefined
      };
    });
    
    return {
      results: formattedResults,
      total,
      page,
      limit,
      query
    };
  }
  
  async getMappingById(id: string): Promise<NAMASTEMapping | null> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    return await this.mappingsCollection.findOne({ namaste_code: id });
  }
  
  async updateMapping(id: string, mapping: Partial<NAMASTEMapping>): Promise<void> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    await this.mappingsCollection.updateOne(
      { namaste_code: id },
      { $set: { ...mapping, updated_at: new Date() } }
    );
  }
  
  async deleteMapping(id: string): Promise<void> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    await this.mappingsCollection.deleteOne({ namaste_code: id });
  }
  
  async clearMappings(): Promise<void> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    await this.mappingsCollection.deleteMany({});
  }
  
  // Audit log operations
  async insertAuditEntry(entry: AuditLogEntry): Promise<void> {
    if (!this.auditCollection) throw new Error('Database not connected');
    await this.auditCollection.insertOne(entry);
  }
  
  async getAuditLogs(filters: AuditFilters = {}, page = 1, limit = 20): Promise<PaginatedResult<AuditLogEntry>> {
    if (!this.auditCollection) throw new Error('Database not connected');
    
    const query: Record<string, unknown> = {};
    
    if (filters.action) {
      query.action = filters.action;
    }
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.success !== undefined) {
      query.success = filters.success;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {};
      if (filters.dateFrom) {
        (query.timestamp as Record<string, unknown>).$gte = filters.dateFrom.toISOString();
      }
      if (filters.dateTo) {
        (query.timestamp as Record<string, unknown>).$lte = filters.dateTo.toISOString();
      }
    }
    
    const skip = (page - 1) * limit;
    const total = await this.auditCollection.countDocuments(query);
    const data = await this.auditCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async clearAuditLogs(): Promise<void> {
    if (!this.auditCollection) throw new Error('Database not connected');
    await this.auditCollection.deleteMany({});
  }
  
  // Metadata operations
  async getCategories(): Promise<string[]> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    return await this.mappingsCollection.distinct('category');
  }
  
  async getChapters(): Promise<string[]> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    return await this.mappingsCollection.distinct('chapter_name');
  }
  
  async getMappingStats(): Promise<MappingStats> {
    if (!this.mappingsCollection) throw new Error('Database not connected');
    
    const [totalMappings, categoryStats, avgConfidence] = await Promise.all([
      this.mappingsCollection.countDocuments(),
      this.mappingsCollection.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      this.mappingsCollection.aggregate([
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$confidence_score' }
          }
        }
      ]).toArray()
    ]);
    
    const categoryCounts: { [category: string]: number } = {};
    categoryStats.forEach(stat => {
      categoryCounts[stat._id] = stat.count;
    });
    
    const chapterStats = await this.mappingsCollection.aggregate([
      {
        $group: {
          _id: '$chapter_name',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const chapterCounts: { [chapter: string]: number } = {};
    chapterStats.forEach(stat => {
      chapterCounts[stat._id] = stat.count;
    });
    
    return {
      totalMappings,
      categoryCounts,
      chapterCounts,
      avgConfidenceScore: avgConfidence[0]?.avgScore || 0
    };
  }
}

// Singleton instance
export const dbService = new MongoDBService();