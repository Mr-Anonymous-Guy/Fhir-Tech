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
import { mongoDbApiService as dbService, MappingFilters, AuditFilters } from './mongoDbApiService';
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
  private useBrowserFallback = false;
  private browserMappings: NAMASTEMapping[] = [];
  private browserAuditLog: AuditLogEntry[] = [];
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
      // Try to connect to MongoDB API first
      await dbService.connect();

      // Check if we need to seed initial data
      const stats = await dbService.getMappingStats();
      if (stats.totalMappings === 0) {
        console.log('No existing data found, seeding initial data...');
        await this.seedInitialData();
      }

      this.isInitialized = true;
      console.log('Enhanced FHIR Service initialized successfully with MongoDB API');
    } catch (error) {
      console.warn('MongoDB API not available, falling back to browser database:', error);
      // Fall back to browser-based storage
      await this.initializeBrowserFallback();
    }
  }

  private async initializeBrowserFallback() {
    try {
      console.log('Initializing browser-based fallback storage...');
      this.useBrowserFallback = true;
      
      // Load from localStorage if available
      const storedMappings = localStorage.getItem('namaste-mappings');
      const storedAuditLog = localStorage.getItem('namaste-audit-log');
      
      if (storedMappings) {
        this.browserMappings = JSON.parse(storedMappings);
        console.log(`Loaded ${this.browserMappings.length} mappings from localStorage`);
      } else {
        // Generate sample data
        this.browserMappings = this.generateSampleMappings();
        localStorage.setItem('namaste-mappings', JSON.stringify(this.browserMappings));
        console.log(`Generated ${this.browserMappings.length} sample mappings`);
      }
      
      if (storedAuditLog) {
        this.browserAuditLog = JSON.parse(storedAuditLog);
        console.log(`Loaded ${this.browserAuditLog.length} audit entries from localStorage`);
      } else {
        // Generate sample audit log
        this.browserAuditLog = this.generateSampleAuditLog();
        localStorage.setItem('namaste-audit-log', JSON.stringify(this.browserAuditLog));
        console.log(`Generated ${this.browserAuditLog.length} sample audit entries`);
      }
      
      this.isInitialized = true;
      console.log('Browser fallback initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser fallback:', error);
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
      // Ayurveda - Respiratory System
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
        namaste_term: 'Shwasa (Asthma)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78173',
        icd11_tm2_description: 'Traditional breathing disorder',
        icd11_biomedicine_code: 'BB499',
        confidence_score: 0.93
      },
      {
        namaste_code: 'AYU-003',
        namaste_term: 'Hikka (Hiccup)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78174',
        icd11_tm2_description: 'Traditional hiccup disorder',
        icd11_biomedicine_code: 'BB500',
        confidence_score: 0.89
      },

      // Ayurveda - Digestive System
      {
        namaste_code: 'AYU-004',
        namaste_term: 'Amlapitta (Hyperacidity)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20847',
        icd11_tm2_description: 'Traditional digestive disorder',
        icd11_biomedicine_code: 'BB769',
        confidence_score: 0.92
      },
      {
        namaste_code: 'AYU-005',
        namaste_term: 'Atisara (Diarrhea)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20848',
        icd11_tm2_description: 'Traditional loose stools disorder',
        icd11_biomedicine_code: 'BB770',
        confidence_score: 0.94
      },
      {
        namaste_code: 'AYU-006',
        namaste_term: 'Grahani (Malabsorption)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20849',
        icd11_tm2_description: 'Traditional absorption disorder',
        icd11_biomedicine_code: 'BB771',
        confidence_score: 0.87
      },
      {
        namaste_code: 'AYU-007',
        namaste_term: 'Arsha (Hemorrhoids)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20850',
        icd11_tm2_description: 'Traditional pile disorder',
        icd11_biomedicine_code: 'BB772',
        confidence_score: 0.96
      },

      // Ayurveda - Endocrine and Metabolic
      {
        namaste_code: 'AYU-008',
        namaste_term: 'Madhumeha (Diabetes)',
        category: 'Ayurveda',
        chapter_name: 'Endocrine and Metabolic Disorders',
        icd11_tm2_code: 'XE94567',
        icd11_tm2_description: 'Traditional diabetes disorder',
        icd11_biomedicine_code: 'BC123',
        confidence_score: 0.98
      },
      {
        namaste_code: 'AYU-009',
        namaste_term: 'Prameha (Urinary Disorders)',
        category: 'Ayurveda',
        chapter_name: 'Endocrine and Metabolic Disorders',
        icd11_tm2_code: 'XE94568',
        icd11_tm2_description: 'Traditional urinary disorder',
        icd11_biomedicine_code: 'BC124',
        confidence_score: 0.91
      },
      {
        namaste_code: 'AYU-010',
        namaste_term: 'Sthaulya (Obesity)',
        category: 'Ayurveda',
        chapter_name: 'Endocrine and Metabolic Disorders',
        icd11_tm2_code: 'XE94569',
        icd11_tm2_description: 'Traditional weight disorder',
        icd11_biomedicine_code: 'BC125',
        confidence_score: 0.89
      },

      // Ayurveda - Musculoskeletal
      {
        namaste_code: 'AYU-011',
        namaste_term: 'Sandhivata (Arthritis)',
        category: 'Ayurveda',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF34521',
        icd11_tm2_description: 'Traditional joint disorder',
        icd11_biomedicine_code: 'BD456',
        confidence_score: 0.90
      },
      {
        namaste_code: 'AYU-012',
        namaste_term: 'Amavata (Rheumatoid Arthritis)',
        category: 'Ayurveda',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF34522',
        icd11_tm2_description: 'Traditional inflammatory joint disorder',
        icd11_biomedicine_code: 'BD457',
        confidence_score: 0.88
      },
      {
        namaste_code: 'AYU-013',
        namaste_term: 'Gridhrasi (Sciatica)',
        category: 'Ayurveda',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF34523',
        icd11_tm2_description: 'Traditional nerve pain disorder',
        icd11_biomedicine_code: 'BD458',
        confidence_score: 0.92
      },

      // Ayurveda - Skin Disorders
      {
        namaste_code: 'AYU-014',
        namaste_term: 'Tvak Roga (Skin Disease)',
        category: 'Ayurveda',
        chapter_name: 'Skin and Tissue Disorders',
        icd11_tm2_code: 'XH78901',
        icd11_tm2_description: 'Traditional skin disorder',
        icd11_biomedicine_code: 'BE789',
        confidence_score: 0.87
      },
      {
        namaste_code: 'AYU-015',
        namaste_term: 'Kushtha (Chronic Skin Disease)',
        category: 'Ayurveda',
        chapter_name: 'Skin and Tissue Disorders',
        icd11_tm2_code: 'XH78902',
        icd11_tm2_description: 'Traditional chronic skin disorder',
        icd11_biomedicine_code: 'BE790',
        confidence_score: 0.85
      },
      {
        namaste_code: 'AYU-016',
        namaste_term: 'Dadru (Ringworm)',
        category: 'Ayurveda',
        chapter_name: 'Skin and Tissue Disorders',
        icd11_tm2_code: 'XH78903',
        icd11_tm2_description: 'Traditional fungal skin disorder',
        icd11_biomedicine_code: 'BE791',
        confidence_score: 0.93
      },

      // Siddha System
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
        namaste_code: 'SID-002',
        namaste_term: 'Soolai (Abdominal Pain)',
        category: 'Siddha',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB45678',
        icd11_tm2_description: 'Traditional abdominal disorder',
        icd11_biomedicine_code: 'BB567',
        confidence_score: 0.85
      },
      {
        namaste_code: 'SID-003',
        namaste_term: 'Kumayam (Fever)',
        category: 'Siddha',
        chapter_name: 'Infectious Diseases',
        icd11_tm2_code: 'XI12345',
        icd11_tm2_description: 'Traditional fever disorder',
        icd11_biomedicine_code: 'BF890',
        confidence_score: 0.93
      },
      {
        namaste_code: 'SID-004',
        namaste_term: 'Iya Noigal (Respiratory Disorders)',
        category: 'Siddha',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF67893',
        icd11_tm2_description: 'Traditional breathing disorder',
        icd11_biomedicine_code: 'BB124',
        confidence_score: 0.89
      },
      {
        namaste_code: 'SID-005',
        namaste_term: 'Karappan (Skin Disease)',
        category: 'Siddha',
        chapter_name: 'Skin and Tissue Disorders',
        icd11_tm2_code: 'XH67894',
        icd11_tm2_description: 'Traditional skin condition',
        icd11_biomedicine_code: 'BE125',
        confidence_score: 0.86
      },
      {
        namaste_code: 'SID-006',
        namaste_term: 'Neerizhivu (Diabetes)',
        category: 'Siddha',
        chapter_name: 'Endocrine and Metabolic Disorders',
        icd11_tm2_code: 'XE67895',
        icd11_tm2_description: 'Traditional diabetes condition',
        icd11_biomedicine_code: 'BC126',
        confidence_score: 0.94
      },
      {
        namaste_code: 'SID-007',
        namaste_term: 'Moolam (Hemorrhoids)',
        category: 'Siddha',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB67896',
        icd11_tm2_description: 'Traditional pile condition',
        icd11_biomedicine_code: 'BB127',
        confidence_score: 0.91
      },

      // Unani System
      {
        namaste_code: 'UNA-001',
        namaste_term: 'Nazla (Common Cold)',
        category: 'Unani',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF67892',
        icd11_tm2_description: 'Traditional cold disorder',
        icd11_biomedicine_code: 'BB123',
        confidence_score: 0.90
      },
      {
        namaste_code: 'UNA-002',
        namaste_term: 'Ziabetus (Diabetes)',
        category: 'Unani',
        chapter_name: 'Endocrine and Metabolic Disorders',
        icd11_tm2_code: 'XE56789',
        icd11_tm2_description: 'Traditional diabetes disorder',
        icd11_biomedicine_code: 'BC456',
        confidence_score: 0.96
      },
      {
        namaste_code: 'UNA-003',
        namaste_term: 'Waja ul Mafasil (Joint Pain)',
        category: 'Unani',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF23456',
        icd11_tm2_description: 'Traditional joint pain disorder',
        icd11_biomedicine_code: 'BD567',
        confidence_score: 0.89
      },
      {
        namaste_code: 'UNA-004',
        namaste_term: 'Baras (Skin Disorder)',
        category: 'Unani',
        chapter_name: 'Skin and Tissue Disorders',
        icd11_tm2_code: 'XH34567',
        icd11_tm2_description: 'Traditional skin disorder',
        icd11_biomedicine_code: 'BE345',
        confidence_score: 0.84
      },
      {
        namaste_code: 'UNA-005',
        namaste_term: 'Qabz (Constipation)',
        category: 'Unani',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB34568',
        icd11_tm2_description: 'Traditional bowel disorder',
        icd11_biomedicine_code: 'BB346',
        confidence_score: 0.92
      },
      {
        namaste_code: 'UNA-006',
        namaste_term: 'Humma (Fever)',
        category: 'Unani',
        chapter_name: 'Infectious Diseases',
        icd11_tm2_code: 'XI34569',
        icd11_tm2_description: 'Traditional fever condition',
        icd11_biomedicine_code: 'BF347',
        confidence_score: 0.88
      },
      {
        namaste_code: 'UNA-007',
        namaste_term: 'Sual (Cough)',
        category: 'Unani',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF34570',
        icd11_tm2_description: 'Traditional cough condition',
        icd11_biomedicine_code: 'BB348',
        confidence_score: 0.91
      },
      {
        namaste_code: 'UNA-008',
        namaste_term: 'Aseer (Heart Disease)',
        category: 'Unani',
        chapter_name: 'Cardiovascular Disorders',
        icd11_tm2_code: 'XC34571',
        icd11_tm2_description: 'Traditional heart condition',
        icd11_biomedicine_code: 'BH349',
        confidence_score: 0.87
      },
      {
        namaste_code: 'UNA-009',
        namaste_term: 'Wajaul Kafal (Lower Back Pain)',
        category: 'Unani',
        chapter_name: 'Musculoskeletal Disorders',
        icd11_tm2_code: 'XF34572',
        icd11_tm2_description: 'Traditional back pain condition',
        icd11_biomedicine_code: 'BD350',
        confidence_score: 0.93
      },
      {
        namaste_code: 'UNA-010',
        namaste_term: 'Safra (Gastritis)',
        category: 'Unani',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB34573',
        icd11_tm2_description: 'Traditional stomach inflammation',
        icd11_biomedicine_code: 'BB351',
        confidence_score: 0.90
      }
    ];
  }

  private generateSampleAuditLog(): AuditLogEntry[] {
    const actions = ['search', 'translate', 'encounter_upload', 'bulk_upload', 'fhir_generation'];
    const queries = ['fever', 'diabetes', 'headache', 'cough', 'skin disorder', 'digestive issues'];
    const userNames = ['Dr. Priya Sharma', 'Dr. Rajesh Kumar', 'Dr. Anita Singh', 'Dr. Mohammad Ali'];
    
    const entries: AuditLogEntry[] = [];
    
    // Generate entries for the last 30 days
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const success = Math.random() > 0.1; // 90% success rate
      
      entries.push({
        id: `audit-${i + 1}`,
        timestamp: timestamp.toISOString(),
        userId: `user-${Math.floor(Math.random() * 4) + 1}`,
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        action,
        query: action === 'search' ? queries[Math.floor(Math.random() * queries.length)] : undefined,
        resource: action.includes('upload') ? 'Patient encounter data' : undefined,
        resultCount: action === 'search' ? Math.floor(Math.random() * 50) + 1 : undefined,
        success,
        duration: Math.floor(Math.random() * 2000) + 100, // 100-2100ms
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'FHIR-Client/1.0'
      });
    }
    
    // Sort by timestamp descending (newest first)
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

      let searchResult;
      
      if (this.useBrowserFallback) {
        // Use browser-based search
        const searchTerm = query.toLowerCase();
        const filteredMappings = this.browserMappings.filter(mapping => 
          mapping.namaste_term.toLowerCase().includes(searchTerm) ||
          mapping.namaste_code.toLowerCase().includes(searchTerm) ||
          mapping.category.toLowerCase().includes(searchTerm) ||
          mapping.chapter_name.toLowerCase().includes(searchTerm) ||
          mapping.icd11_tm2_description.toLowerCase().includes(searchTerm)
        );
        
        const total = filteredMappings.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMappings = filteredMappings.slice(startIndex, endIndex);
        
        searchResult = {
          mappings: paginatedMappings,
          total
        };
      } else {
        // Use MongoDB API
        searchResult = await dbService.searchMappings(query, {}, page, pageSize);
      }
      // Transform to expected format
      const results: SearchResult[] = searchResult.mappings.map(mapping => ({
        namaste: mapping,
        highlights: [],
        relevanceScore: mapping.confidence_score
      }));

      // Log the search
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
        mapping = await dbService.getMappingByCode(code);
      } else {
        // Search by other code systems
        const results = await dbService.searchMappings('', {}, 1, 1000);

        if (sourceSystem === 'icd11-tm2') {
          mapping = results.mappings.find(m => m.icd11_tm2_code === code) || null;
        } else if (sourceSystem === 'icd11-biomedicine') {
          mapping = results.mappings.find(m => m.icd11_biomedicine_code === code) || null;
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

    if (this.useBrowserFallback) {
      // Use browser-based filtering
      let filteredMappings = [...this.browserMappings];
      
      if (filters.category) {
        filteredMappings = filteredMappings.filter(m => m.category === filters.category);
      }
      
      if (filters.chapter) {
        filteredMappings = filteredMappings.filter(m => m.chapter_name === filters.chapter);
      }
      
      const total = filteredMappings.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedMappings = filteredMappings.slice(startIndex, endIndex);
      
      return {
        mappings: paginatedMappings,
        total,
        page,
        pageSize
      };
    } else {
      // Use MongoDB API
      const mappingFilters: MappingFilters = {
        category: filters.category,
        chapter: filters.chapter
      };

      const result = await dbService.searchMappings('', mappingFilters, page, pageSize);
      
      return {
        mappings: result.mappings,
        total: result.total,
        page,
        pageSize
      };
    }
  }

  /**
   * Get audit log with filters
   */
  async getAuditLog(page = 1, pageSize = 20, filters: { action?: string; success?: boolean; startDate?: string } = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.useBrowserFallback) {
      // Use browser-based filtering
      let filteredEntries = [...this.browserAuditLog];
      
      if (filters.action) {
        filteredEntries = filteredEntries.filter(e => e.action === filters.action);
      }
      
      if (filters.success !== undefined) {
        filteredEntries = filteredEntries.filter(e => e.success === filters.success);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredEntries = filteredEntries.filter(e => new Date(e.timestamp) >= startDate);
      }
      
      const total = filteredEntries.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
      
      return {
        entries: paginatedEntries,
        total,
        page,
        pageSize
      };
    } else {
      // Use MongoDB API
      const auditFilters: AuditFilters = {
        action: filters.action,
        success: filters.success,
        startDate: filters.startDate
      };

      const result = await dbService.getAuditLogs(auditFilters, page, pageSize);
      
      return {
        entries: result.entries,
        total: result.total,
        page,
        pageSize
      };
    }
  }

  /**
   * Get metadata (categories, chapters)
   */
  async getMetadata() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.useBrowserFallback) {
      // Extract unique categories and chapters from browser data
      const categories = [...new Set(this.browserMappings.map(m => m.category))];
      const chapters = [...new Set(this.browserMappings.map(m => m.chapter_name))];
      
      return { categories, chapters };
    } else {
      // Use MongoDB API
      const [categories, chapters] = await Promise.all([
        dbService.getCategories(),
        dbService.getChapters()
      ]);

      return { categories, chapters };
    }
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
    const allMappings = await dbService.searchMappings('', {}, 1, 10000);

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
      concept: allMappings.mappings.map(mapping => ({
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

    const allMappings = await dbService.searchMappings('', {}, 1, 10000);

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
          element: allMappings.mappings.map(mapping => ({
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
          element: allMappings.mappings.map(mapping => ({
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
      if (this.useBrowserFallback) {
        // Add to browser audit log
        this.browserAuditLog.unshift(auditEntry); // Add to beginning for newest first
        // Keep only last 1000 entries to prevent memory issues
        if (this.browserAuditLog.length > 1000) {
          this.browserAuditLog = this.browserAuditLog.slice(0, 1000);
        }
        // Save to localStorage
        localStorage.setItem('namaste-audit-log', JSON.stringify(this.browserAuditLog));
      } else {
        // Log to MongoDB for local storage
        if (this.isInitialized) {
          await dbService.insertAuditEntry(auditEntry);
        }
      }

      // Also log to Supabase for dynamic management and analytics
      try {
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
      } catch (supabaseError) {
        // Supabase logging is optional
        console.warn('Failed to log to Supabase:', supabaseError);
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  /**
   * Force refresh all data
   */
  async forceRefresh() {
    console.log('Force refreshing FHIR service data...');
    this.isInitialized = false;
    await this.initialize();
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