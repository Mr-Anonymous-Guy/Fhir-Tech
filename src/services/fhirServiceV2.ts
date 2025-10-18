import { 
  NAMASTEMapping, 
  FHIRCodeSystem, 
  FHIRConceptMap, 
  FHIRBundle, 
  SearchResult, 
  LookupResponse, 
  TranslationResponse, 
  AuditLogEntry, 
  ABHAUser 
} from '@/types/fhir';
import { dbService, MappingFilters, AuditFilters } from './database';
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced FHIR Service with MongoDB local storage and Supabase dynamic management
 * 
 * Architecture:
 * - MongoDB: Local storage for mappings, audit logs, and cached data
 * - Supabase: User authentication, profiles, and dynamic data management
 * - Hybrid approach for better performance and offline capability
 */
class EnhancedFHIRService {
  private isInitialized = false;
  private mockUser: ABHAUser = {
    id: 'demo-user-123',
    abhaId: '12-3456-7890-1234',
    phoneNumber: '+91-9876543210',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@hospital.in',
    verified: true,
    createdAt: '2024-01-15T08:30:00Z',
    lastLogin: new Date().toISOString()
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Connect to MongoDB
      await dbService.connect();
      
      // Check if we need to seed initial data
      const stats = await dbService.getMappingStats();
      if (stats.totalMappings === 0) {
        await this.seedInitialData();
      }
      
      this.isInitialized = true;
      console.log('Enhanced FHIR Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FHIR Service:', error);
      // Fall back to in-memory mode if MongoDB is not available
      this.isInitialized = false;
    }
  }

  private async seedInitialData() {
    try {
      console.log('Seeding initial mapping data...');
      
      // Try to load from CSV first
      const response = await fetch('/data/ayush_icd11_mappings_200.csv');
      if (response.ok) {
        const csvText = await response.text();
        const mappings = this.parseCSVMappings(csvText);
        await dbService.insertMappings(mappings);
        console.log(`Seeded ${mappings.length} mappings from CSV`);
      } else {
        // Fall back to sample data
        const sampleMappings = this.generateSampleMappings();
        await dbService.insertMappings(sampleMappings);
        console.log(`Seeded ${sampleMappings.length} sample mappings`);
      }
      
      // Generate initial audit entries
      await this.generateMockAuditLog();
    } catch (error) {
      console.error('Failed to seed initial data:', error);
    }
  }

  private parseCSVMappings(csvText: string): NAMASTEMapping[] {
    const lines = csvText.split('\n').slice(1); // Skip header
    return lines
      .filter(line => line.trim())
      .map(line => {
        const [namaste_code, namaste_term, icd11_tm2_code, icd11_biomedicine_code, description] = 
          line.split(',').map(field => field.trim().replace(/"/g, ''));
        
        // Extract category from code prefix
        let category: 'Ayurveda' | 'Siddha' | 'Unani' = 'Ayurveda';
        if (namaste_code.startsWith('AYU-')) category = 'Ayurveda';
        else if (namaste_code.startsWith('SID-')) category = 'Siddha';
        else if (namaste_code.startsWith('UNA-')) category = 'Unani';
        
        // Generate chapter name from traditional term
        let chapter_name = 'General Medicine';
        const term = namaste_term.toLowerCase();
        if (term.includes('respiratory') || term.includes('cough') || term.includes('asthma')) {
          chapter_name = 'Respiratory System Disorders';
        } else if (term.includes('digestive') || term.includes('gastro') || term.includes('diarrhea')) {
          chapter_name = 'Digestive System Disorders';
        } else if (term.includes('skin') || term.includes('dermatitis')) {
          chapter_name = 'Skin and Tissue Disorders';
        } else if (term.includes('fever') || term.includes('infection')) {
          chapter_name = 'Infectious Diseases';
        } else if (term.includes('diabetes') || term.includes('metabolic')) {
          chapter_name = 'Endocrine and Metabolic Disorders';
        }
        
        return {
          namaste_code,
          namaste_term,
          category,
          chapter_name,
          icd11_tm2_code,
          icd11_tm2_description: description,
          icd11_biomedicine_code,
          confidence_score: 0.95
        };
      });
  }

  private generateSampleMappings(): NAMASTEMapping[] {
    return [
      {
        namaste_code: 'AYU-001',
        namaste_term: 'Kasa (Cough)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78172',
        icd11_tm2_description: 'Traditional cough disorder',
        icd11_biomedicine_code: 'BB498',
        confidence_score: 0.95
      },
      {
        namaste_code: 'AYU-002',
        namaste_term: 'Amlapitta (Hyperacidity)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20847',
        icd11_tm2_description: 'Traditional digestive disorder',
        icd11_biomedicine_code: 'BB769',
        confidence_score: 0.92
      },
      {
        namaste_code: 'SID-001',
        namaste_term: 'Vayu Gunmam (Joint Pain)',
        category: 'Siddha',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF89234',
        icd11_tm2_description: 'Traditional joint disorder',
        icd11_biomedicine_code: 'BD234',
        confidence_score: 0.88
      },
      {
        namaste_code: 'UNA-001',
        namaste_term: 'Nazla (Common Cold)',
        category: 'Unani',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF67892',
        icd11_tm2_description: 'Traditional cold disorder',
        icd11_biomedicine_code: 'BB123',
        confidence_score: 0.90
      }
    ];
  }

  private async generateMockAuditLog() {
    const actions = ['search', 'translate', 'encounter_upload', 'fhir_generation'] as const;
    const queries = ['kasa', 'amlapitta', 'respiratory', 'digestive', 'skin conditions'];
    
    const entries: AuditLogEntry[] = [];
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      entries.push({
        id: `audit-${i + 1}`,
        timestamp,
        userId: this.mockUser.id,
        userName: this.mockUser.name,
        action: actions[Math.floor(Math.random() * actions.length)],
        query: queries[Math.floor(Math.random() * queries.length)],
        resultCount: Math.floor(Math.random() * 10) + 1,
        success: Math.random() > 0.1,
        duration: Math.floor(Math.random() * 500) + 50,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'FHIR-Client/1.0'
      });
    }

    for (const entry of entries) {
      await dbService.insertAuditEntry(entry);
    }
  }

  // Public API Methods

  /**
   * FHIR $lookup operation - Search for codes with MongoDB full-text search
   */
  async lookup(query: string, page = 1, pageSize = 10): Promise<LookupResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const searchResult = await dbService.searchMappings(query, page, pageSize);
      
      // Transform to expected format
      const results: SearchResult[] = searchResult.results.map(result => ({
        namaste: result.mapping,
        highlights: result.highlights,
        relevanceScore: result.score
      }));

      // Log the search to both MongoDB and Supabase
      await this.logAuditEntry({
        action: 'search',
        query,
        resultCount: searchResult.total,
        success: true,
        duration: Date.now() - startTime
      });

      return {
        results,
        total: searchResult.total,
        page,
        pageSize,
        query
      };
    } catch (error) {
      await this.logAuditEntry({
        action: 'search',
        query,
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * FHIR $translate operation - Convert between code systems
   */
  async translate(code: string, sourceSystem: string, targetSystem: string): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let mapping: NAMASTEMapping | null = null;
      
      if (sourceSystem === 'namaste') {
        mapping = await dbService.getMappingById(code);
      } else {
        // Search by other code systems
        const filters: MappingFilters = {};
        const results = await dbService.getMappings(filters, 1, 1000);
        
        if (sourceSystem === 'icd11-tm2') {
          mapping = results.data.find(m => m.icd11_tm2_code === code) || null;
        } else if (sourceSystem === 'icd11-biomedicine') {
          mapping = results.data.find(m => m.icd11_biomedicine_code === code) || null;
        }
      }

      if (!mapping) {
        throw new Error(`Code ${code} not found in ${sourceSystem}`);
      }

      const translations = [];
      
      if (targetSystem === 'namaste' && sourceSystem !== 'namaste') {
        translations.push({
          targetCode: mapping.namaste_code,
          targetSystem: 'namaste',
          targetDisplay: mapping.namaste_term,
          equivalence: 'equivalent',
          confidence: mapping.confidence_score
        });
      }
      
      if (targetSystem === 'icd11-tm2' && sourceSystem !== 'icd11-tm2') {
        translations.push({
          targetCode: mapping.icd11_tm2_code,
          targetSystem: 'icd11-tm2',
          targetDisplay: mapping.icd11_tm2_description,
          equivalence: 'equivalent',
          confidence: mapping.confidence_score
        });
      }
      
      if (targetSystem === 'icd11-biomedicine' && sourceSystem !== 'icd11-biomedicine') {
        translations.push({
          targetCode: mapping.icd11_biomedicine_code,
          targetSystem: 'icd11-biomedicine',
          targetDisplay: mapping.icd11_tm2_description,
          equivalence: 'equivalent',
          confidence: mapping.confidence_score
        });
      }

      await this.logAuditEntry({
        action: 'translate',
        query: `${code} from ${sourceSystem} to ${targetSystem}`,
        resultCount: translations.length,
        success: true,
        duration: Date.now() - startTime
      });

      return {
        sourceCode: code,
        sourceSystem,
        translations
      };
    } catch (error) {
      await this.logAuditEntry({
        action: 'translate',
        query: `${code} from ${sourceSystem} to ${targetSystem}`,
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get all mappings with filters and pagination
   */
  async getAllMappings(filters: { category?: string; chapter?: string } = {}, page = 1, pageSize = 20) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const mappingFilters: MappingFilters = {
      category: filters.category,
      chapter: filters.chapter
    };

    const result = await dbService.getMappings(mappingFilters, page, pageSize);
    
    return {
      mappings: result.data,
      total: result.total,
      page,
      pageSize
    };
  }

  /**
   * Get audit log with filters
   */
  async getAuditLog(page = 1, pageSize = 20, filters: { action?: string } = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const auditFilters: AuditFilters = {
      action: filters.action
    };

    const result = await dbService.getAuditLogs(auditFilters, page, pageSize);
    
    return {
      entries: result.data,
      total: result.total,
      page,
      pageSize
    };
  }

  /**
   * Get metadata (categories, chapters)
   */
  async getMetadata() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const [categories, chapters] = await Promise.all([
      dbService.getCategories(),
      dbService.getChapters()
    ]);

    return { categories, chapters };
  }

  /**
   * Process bulk upload and generate FHIR Bundle
   */
  async processBulkUpload(mappings: NAMASTEMapping[]): Promise<{ bundle: FHIRBundle; downloadUrl: string }> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Store mappings in MongoDB
      await dbService.insertMappings(mappings);

      // Generate FHIR Bundle
      const bundle: FHIRBundle = {
        resourceType: 'Bundle',
        id: `bulk-upload-${Date.now()}`,
        meta: {
          lastUpdated: new Date().toISOString()
        },
        type: 'collection',
        timestamp: new Date().toISOString(),
        total: mappings.length,
        entry: mappings.map((mapping, index) => ({
          id: `entry-${index + 1}`,
          fullUrl: `urn:uuid:${mapping.namaste_code}`,
          resource: {
            resourceType: 'Condition',
            id: mapping.namaste_code,
            meta: {
              profile: ['http://terminology.gov.in/StructureDefinition/NAMASTECondition']
            },
            clinicalStatus: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active'
              }]
            },
            category: [{
              coding: [{
                system: 'http://terminology.gov.in/CodeSystem/condition-category',
                code: mapping.category.toLowerCase(),
                display: mapping.category
              }]
            }],
            code: {
              coding: [
                {
                  system: 'http://terminology.gov.in/CodeSystem/namaste',
                  code: mapping.namaste_code,
                  display: mapping.namaste_term
                },
                {
                  system: 'http://id.who.int/icd/release/11/2022-02/tm2',
                  code: mapping.icd11_tm2_code,
                  display: mapping.icd11_tm2_description
                },
                {
                  system: 'http://id.who.int/icd/release/11/2022-02/biomedicine',
                  code: mapping.icd11_biomedicine_code,
                  display: mapping.icd11_tm2_description
                }
              ],
              text: mapping.namaste_term
            },
            subject: {
              reference: 'Patient/demo-patient',
              display: 'Demo Patient'
            },
            recordedDate: new Date().toISOString()
          }
        }))
      };

      const downloadUrl = `data:application/json;base64,${btoa(JSON.stringify(bundle, null, 2))}`;

      await this.logAuditEntry({
        action: 'bulk_upload',
        resultCount: mappings.length,
        success: true,
        duration: Date.now() - startTime
      });

      return { bundle, downloadUrl };
    } catch (error) {
      await this.logAuditEntry({
        action: 'bulk_upload',
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Generate FHIR CodeSystem resource
   */
  async generateCodeSystem(): Promise<FHIRCodeSystem> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stats = await dbService.getMappingStats();
    const allMappings = await dbService.getMappings({}, 1, 10000);

    return {
      resourceType: 'CodeSystem',
      id: 'namaste-terminology',
      url: 'http://terminology.gov.in/CodeSystem/namaste',
      version: '1.0.0',
      name: 'NAMASTETerminology',
      title: 'NAMASTE Traditional Medicine Terminology',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      description: 'Standardized terminology for Ayurveda, Siddha, and Unani medical systems',
      purpose: 'To provide standardized coding for traditional Indian medicine systems in FHIR-compliant electronic health records',
      copyright: '© 2024 Government of India. All rights reserved.',
      content: 'complete',
      count: stats.totalMappings,
      concept: allMappings.data.map(mapping => ({
        code: mapping.namaste_code,
        display: mapping.namaste_term,
        definition: `${mapping.category} term for ${mapping.chapter_name}`,
        property: [
          { code: 'category', valueString: mapping.category },
          { code: 'chapter', valueString: mapping.chapter_name },
          { code: 'icd11-tm2-map', valueCode: mapping.icd11_tm2_code },
          { code: 'icd11-biomedicine-map', valueCode: mapping.icd11_biomedicine_code },
          { code: 'confidence', valueString: mapping.confidence_score.toString() }
        ]
      }))
    };
  }

  /**
   * Generate FHIR ConceptMap resource
   */
  async generateConceptMap(): Promise<FHIRConceptMap> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const allMappings = await dbService.getMappings({}, 1, 10000);

    return {
      resourceType: 'ConceptMap',
      id: 'namaste-icd11-map',
      url: 'http://terminology.gov.in/ConceptMap/namaste-icd11',
      version: '1.0.0',
      name: 'NAMASTEToICD11Map',
      title: 'NAMASTE to ICD-11 Concept Mapping',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      description: 'Bidirectional mapping between NAMASTE traditional medicine codes and ICD-11 TM2 + Biomedicine codes',
      purpose: 'Enable interoperability between traditional medicine and biomedical coding systems',
      sourceUri: 'http://terminology.gov.in/CodeSystem/namaste',
      targetUri: 'http://id.who.int/icd/release/11/2022-02',
      group: [
        {
          source: 'http://terminology.gov.in/CodeSystem/namaste',
          target: 'http://id.who.int/icd/release/11/2022-02/tm2',
          element: allMappings.data.map(mapping => ({
            code: mapping.namaste_code,
            display: mapping.namaste_term,
            target: [{
              code: mapping.icd11_tm2_code,
              display: mapping.icd11_tm2_description,
              equivalence: 'equivalent' as const,
              comment: `Confidence: ${mapping.confidence_score}`
            }]
          }))
        },
        {
          source: 'http://terminology.gov.in/CodeSystem/namaste',
          target: 'http://id.who.int/icd/release/11/2022-02/biomedicine',
          element: allMappings.data.map(mapping => ({
            code: mapping.namaste_code,
            display: mapping.namaste_term,
            target: [{
              code: mapping.icd11_biomedicine_code,
              display: mapping.icd11_tm2_description,
              equivalence: 'equivalent' as const,
              comment: `Confidence: ${mapping.confidence_score}`
            }]
          }))
        }
      ]
    };
  }

  /**
   * Mock ABHA authentication
   */
  async authenticateABHA(abhaId: string, phoneNumber: string, otp: string): Promise<ABHAUser> {
    if (otp === '123456' || abhaId === 'demo') {
      return {
        ...this.mockUser,
        lastLogin: new Date().toISOString()
      };
    }
    throw new Error('Invalid credentials');
  }

  /**
   * Log audit entry to both MongoDB and Supabase
   */
  private async logAuditEntry(entry: Partial<AuditLogEntry>) {
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: this.mockUser.id,
      userName: this.mockUser.name,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      ...entry
    } as AuditLogEntry;

    try {
      // Log to MongoDB for local storage
      if (this.isInitialized) {
        await dbService.insertAuditEntry(auditEntry);
      }

      // Also log to Supabase for dynamic management and analytics
      await supabase.from('audit_logs').insert({
        id: auditEntry.id,
        timestamp: auditEntry.timestamp,
        user_id: auditEntry.userId,
        user_email: this.mockUser.email,
        action: auditEntry.action,
        table_name: 'mappings',
        record_id: auditEntry.query || 'unknown',
        new_values: {
          query: auditEntry.query,
          result_count: auditEntry.resultCount,
          duration: auditEntry.duration,
          success: auditEntry.success
        }
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await dbService.disconnect();
  }
}

// Export singleton instance
export const enhancedFhirService = new EnhancedFHIRService();