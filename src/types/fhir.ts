// FHIR R4 TypeScript definitions for NAMASTE-ICD11 terminology service

export interface NAMASTEMapping {
  namaste_code: string;
  namaste_term: string;
  category: 'Ayurveda' | 'Siddha' | 'Unani';
  chapter_name: string;
  icd11_tm2_code: string;
  icd11_tm2_description: string;
  icd11_biomedicine_code: string;
  confidence_score: number;
}

export interface FHIRCodeSystem {
  resourceType: 'CodeSystem';
  id: string;
  url: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  version: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired';
  experimental?: boolean;
  date: string;
  publisher: string;
  description: string;
  purpose?: string;
  copyright?: string;
  content: 'not-present' | 'example' | 'fragment' | 'complete' | 'supplement';
  count?: number;
  concept?: Array<{
    code: string;
    display: string;
    definition?: string;
    property?: Array<{
      code: string;
      valueString?: string;
      valueCode?: string;
      valueCoding?: FHIRCoding;
    }>;
  }>;
}

export interface FHIRCoding {
  system: string;
  version?: string;
  code: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRConceptMap {
  resourceType: 'ConceptMap';
  id: string;
  url: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  version: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired';
  experimental?: boolean;
  date: string;
  publisher: string;
  description: string;
  purpose?: string;
  copyright?: string;
  sourceUri?: string;
  targetUri?: string;
  group: Array<{
    source: string;
    target: string;
    element: Array<{
      code: string;
      display?: string;
      target: Array<{
        code: string;
        display?: string;
        equivalence: 'relatedto' | 'equivalent' | 'equal' | 'wider' | 'subsumes' | 'narrower' | 'specializes' | 'inexact' | 'unmatched' | 'disjoint';
        comment?: string;
      }>;
    }>;
  }>;
}

export interface FHIRValueSet {
  resourceType: 'ValueSet';
  id: string;
  url: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  version: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired';
  experimental?: boolean;
  date: string;
  publisher: string;
  description: string;
  purpose?: string;
  copyright?: string;
  compose?: {
    include: Array<{
      system: string;
      version?: string;
      concept?: Array<{
        code: string;
        display?: string;
      }>;
    }>;
  };
  expansion?: {
    identifier: string;
    timestamp: string;
    total?: number;
    contains: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  meta?: {
    profile?: string[];
    lastUpdated?: string;
  };
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  clinicalStatus: {
    coding: FHIRCoding[];
  };
  verificationStatus?: {
    coding: FHIRCoding[];
  };
  category?: Array<{
    coding: FHIRCoding[];
  }>;
  severity?: {
    coding: FHIRCoding[];
  };
  code: {
    coding: FHIRCoding[];
    text?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
  };
  onsetDateTime?: string;
  recordedDate?: string;
  recorder?: {
    reference: string;
    display?: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  meta?: {
    lastUpdated?: string;
  };
  identifier?: {
    system: string;
    value: string;
  };
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  entry: Array<{
    id?: string;
    fullUrl?: string;
    resource: FHIRCondition | FHIRCodeSystem | FHIRConceptMap | FHIRValueSet;
    request?: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
    };
  }>;
}

export interface SearchResult {
  namaste: NAMASTEMapping;
  highlights?: {
    term?: string;
    description?: string;
  };
  relevanceScore: number;
}

export interface LookupResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

export interface TranslationResponse {
  sourceCode: string;
  sourceSystem: string;
  translations: Array<{
    targetCode: string;
    targetSystem: string;
    targetDisplay: string;
    equivalence: string;
    confidence: number;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'search' | 'translate' | 'encounter_upload' | 'bulk_upload' | 'fhir_generation';
  resource?: string;
  query?: string;
  resultCount?: number;
  success: boolean;
  duration: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ABHAUser {
  id: string;
  abhaId: string;
  phoneNumber: string;
  name: string;
  email?: string;
  verified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface DemoMode {
  enabled: boolean;
  mockUser: ABHAUser;
}