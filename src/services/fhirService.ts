import { NAMASTEMapping, FHIRCodeSystem, FHIRConceptMap, FHIRValueSet, FHIRBundle, SearchResult, LookupResponse, TranslationResponse, AuditLogEntry, ABHAUser } from '@/types/fhir';

// Mock FHIR Service for demonstration purposes
class FHIRService {
  private mappings: NAMASTEMapping[] = [];
  private auditLog: AuditLogEntry[] = [];
  
  // Mock ABHA user for demo mode
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
    this.loadMappingsFromCSV();
    this.generateMockAuditLog();
  }

  // Load NAMASTE mappings from new CSV data format
  private async loadMappingsFromCSV() {
    try {
      const response = await fetch('/data/ayush_icd11_mappings_200.csv');
      const csvText = await response.text();
      
      const lines = csvText.split('\n').slice(1); // Skip header
      this.mappings = lines
        .filter(line => line.trim())
        .map(line => {
          const [namaste_code, namaste_term, icd11_tm2_code, icd11_biomedicine_code, description] = 
            line.split(',').map(field => field.trim());
          
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
            confidence_score: 0.95 // Default high confidence for new data
          };
        });
      
      console.log(`Loaded ${this.mappings.length} NAMASTE mappings from new dataset`);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      // Fallback sample data
      this.generateSampleMappings();
    }
  }

  private generateSampleMappings() {
    // Generate some sample mappings if CSV fails to load
    this.mappings = [
      {
        namaste_code: 'NAM001',
        namaste_term: 'Kasa (Cough)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78172',
        icd11_tm2_description: 'Traditional cough disorder',
        icd11_biomedicine_code: 'BB498',
        confidence_score: 0.95
      },
      {
        namaste_code: 'NAM002',
        namaste_term: 'Amlapitta (Hyperacidity)',
        category: 'Ayurveda',
        chapter_name: 'Digestive System Disorders',
        icd11_tm2_code: 'XB20847',
        icd11_tm2_description: 'Traditional digestive disorder',
        icd11_biomedicine_code: 'BB769',
        confidence_score: 0.92
      }
    ];
  }

  private generateMockAuditLog() {
    const actions = ['search', 'translate', 'encounter_upload', 'fhir_generation'];
    const queries = ['kasa', 'amlapitta', 'respiratory', 'digestive', 'skin conditions'];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      this.auditLog.push({
        id: `audit-${i + 1}`,
        timestamp,
        userId: this.mockUser.id,
        userName: this.mockUser.name,
        action: actions[Math.floor(Math.random() * actions.length)] as any,
        query: queries[Math.floor(Math.random() * queries.length)],
        resultCount: Math.floor(Math.random() * 10) + 1,
        success: Math.random() > 0.1, // 90% success rate
        duration: Math.floor(Math.random() * 500) + 50,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'FHIR-Client/1.0'
      });
    }
  }

  // FHIR $lookup operation - Search for codes
  async lookup(query: string, page = 1, pageSize = 10): Promise<LookupResponse> {
    const startTime = Date.now();
    
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      let results = this.mappings
        .map(mapping => {
          const termMatch = mapping.namaste_term.toLowerCase().includes(normalizedQuery);
          const codeMatch = mapping.namaste_code.toLowerCase().includes(normalizedQuery);
          const chapterMatch = mapping.chapter_name.toLowerCase().includes(normalizedQuery);
          const icd11Match = mapping.icd11_tm2_description.toLowerCase().includes(normalizedQuery);
          
          let relevanceScore = 0;
          const highlights: any = {};
          
          if (termMatch) {
            relevanceScore += 3;
            highlights.term = mapping.namaste_term.replace(
              new RegExp(normalizedQuery, 'gi'), 
              match => `<mark>${match}</mark>`
            );
          }
          if (codeMatch) relevanceScore += 2;
          if (chapterMatch) relevanceScore += 1;
          if (icd11Match) {
            relevanceScore += 2;
            highlights.description = mapping.icd11_tm2_description.replace(
              new RegExp(normalizedQuery, 'gi'), 
              match => `<mark>${match}</mark>`
            );
          }
          
          return {
            namaste: mapping,
            highlights,
            relevanceScore: relevanceScore * mapping.confidence_score
          };
        })
        .filter(result => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      // If no exact matches, do fuzzy search
      if (results.length === 0) {
        results = this.mappings
          .map(mapping => ({
            namaste: mapping,
            highlights: {},
            relevanceScore: this.calculateFuzzyScore(normalizedQuery, mapping)
          }))
          .filter(result => result.relevanceScore > 0.3)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      const total = results.length;
      const startIdx = (page - 1) * pageSize;
      const paginatedResults = results.slice(startIdx, startIdx + pageSize);

      // Log the search
      this.logAuditEntry({
        action: 'search',
        query,
        resultCount: total,
        success: true,
        duration: Date.now() - startTime
      });

      return {
        results: paginatedResults,
        total,
        page,
        pageSize,
        query
      };
    } catch (error) {
      this.logAuditEntry({
        action: 'search',
        query,
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private calculateFuzzyScore(query: string, mapping: NAMASTEMapping): number {
    const text = `${mapping.namaste_term} ${mapping.chapter_name} ${mapping.icd11_tm2_description}`.toLowerCase();
    const words = query.split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (text.includes(word)) {
        score += 0.5;
      }
    });
    
    return score * mapping.confidence_score;
  }

  // FHIR $translate operation - Convert between code systems
  async translate(code: string, sourceSystem: string, targetSystem: string): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      let mapping: NAMASTEMapping | undefined;
      
      if (sourceSystem === 'namaste') {
        mapping = this.mappings.find(m => m.namaste_code === code);
      } else if (sourceSystem === 'icd11-tm2') {
        mapping = this.mappings.find(m => m.icd11_tm2_code === code);
      } else if (sourceSystem === 'icd11-biomedicine') {
        mapping = this.mappings.find(m => m.icd11_biomedicine_code === code);
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
          targetDisplay: mapping.icd11_tm2_description, // Using TM2 description as biomedicine display
          equivalence: 'equivalent',
          confidence: mapping.confidence_score
        });
      }

      this.logAuditEntry({
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
      this.logAuditEntry({
        action: 'translate',
        query: `${code} from ${sourceSystem} to ${targetSystem}`,
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  // Generate FHIR CodeSystem resource
  generateCodeSystem(): FHIRCodeSystem {
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
      count: this.mappings.length,
      concept: this.mappings.map(mapping => ({
        code: mapping.namaste_code,
        display: mapping.namaste_term,
        definition: `${mapping.category} term for ${mapping.chapter_name}`,
        property: [
          {
            code: 'category',
            valueString: mapping.category
          },
          {
            code: 'chapter',
            valueString: mapping.chapter_name
          },
          {
            code: 'icd11-tm2-map',
            valueCode: mapping.icd11_tm2_code
          },
          {
            code: 'icd11-biomedicine-map',
            valueCode: mapping.icd11_biomedicine_code
          },
          {
            code: 'confidence',
            valueString: mapping.confidence_score.toString()
          }
        ]
      }))
    };
  }

  // Generate FHIR ConceptMap resource
  generateConceptMap(): FHIRConceptMap {
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
          element: this.mappings.map(mapping => ({
            code: mapping.namaste_code,
            display: mapping.namaste_term,
            target: [{
              code: mapping.icd11_tm2_code,
              display: mapping.icd11_tm2_description,
              equivalence: 'equivalent',
              comment: `Confidence: ${mapping.confidence_score}`
            }]
          }))
        },
        {
          source: 'http://terminology.gov.in/CodeSystem/namaste',
          target: 'http://id.who.int/icd/release/11/2022-02/biomedicine',
          element: this.mappings.map(mapping => ({
            code: mapping.namaste_code,
            display: mapping.namaste_term,
            target: [{
              code: mapping.icd11_biomedicine_code,
              display: mapping.icd11_tm2_description,
              equivalence: 'equivalent',
              comment: `Confidence: ${mapping.confidence_score}`
            }]
          }))
        }
      ]
    };
  }

  // Process bulk upload and generate FHIR Bundle
  async processBulkUpload(mappings: NAMASTEMapping[]): Promise<{ bundle: FHIRBundle; downloadUrl: string }> {
    const startTime = Date.now();
    
    try {
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

      // Simulate creating download URL (in real implementation, this would create a ZIP file)
      const downloadUrl = `data:application/json;base64,${btoa(JSON.stringify(bundle, null, 2))}`;

      this.logAuditEntry({
        action: 'bulk_upload',
        resultCount: mappings.length,
        success: true,
        duration: Date.now() - startTime
      });

      return { bundle, downloadUrl };
    } catch (error) {
      this.logAuditEntry({
        action: 'bulk_upload',
        success: false,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  // ABHA Authentication (Mock)
  async authenticateABHA(abhaId: string, phoneNumber: string, otp: string): Promise<ABHAUser> {
    // Mock authentication - in real implementation, this would call ABHA APIs
    if (otp === '123456' || abhaId === 'demo') {
      return {
        ...this.mockUser,
        lastLogin: new Date().toISOString()
      };
    }
    throw new Error('Invalid credentials');
  }

  // Get audit log
  getAuditLog(page = 1, pageSize = 20) {
    const startIdx = (page - 1) * pageSize;
    const entries = this.auditLog
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(startIdx, startIdx + pageSize);
    
    return {
      entries,
      total: this.auditLog.length,
      page,
      pageSize
    };
  }

  private logAuditEntry(entry: Partial<AuditLogEntry>) {
    this.auditLog.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: this.mockUser.id,
      userName: this.mockUser.name,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
      ...entry
    } as AuditLogEntry);
  }

  // Get all mappings for display
  getAllMappings(filters?: { category?: string; chapter?: string }, page = 1, pageSize = 20) {
    let filteredMappings = [...this.mappings];
    
    if (filters?.category) {
      filteredMappings = filteredMappings.filter(m => m.category === filters.category);
    }
    
    if (filters?.chapter) {
      filteredMappings = filteredMappings.filter(m => 
        m.chapter_name.toLowerCase().includes(filters.chapter!.toLowerCase())
      );
    }
    
    const total = filteredMappings.length;
    const startIdx = (page - 1) * pageSize;
    const paginatedMappings = filteredMappings.slice(startIdx, startIdx + pageSize);
    
    return {
      mappings: paginatedMappings,
      total,
      page,
      pageSize
    };
  }

  // Get categories and chapters for filters
  getMetadata() {
    const categories = [...new Set(this.mappings.map(m => m.category))];
    const chapters = [...new Set(this.mappings.map(m => m.chapter_name))];
    
    return { categories, chapters };
  }
}

export const fhirService = new FHIRService();