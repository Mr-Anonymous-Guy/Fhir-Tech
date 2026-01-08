/**
 * Database initialization utilities
 * This script helps set up MongoDB with initial data and proper indexes
 */

import { mongoDbApiService as dbService } from '@/services/mongoDbApiService';
import { NAMASTEMapping } from '@/types/fhir';

/**
 * Initialize the database with sample data
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Connect to database
    await dbService.connect();

    // Check if database is already initialized
    const stats = await dbService.getMappingStats();
    if (stats.totalMappings > 0) {
      console.log(`Database already initialized with ${stats.totalMappings} mappings`);
      return;
    }

    // Load initial data
    await loadInitialMappings();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Load initial mapping data from CSV or fallback to sample data
 */
async function loadInitialMappings() {
  try {
    // Try to load from CSV first
    const response = await fetch('/data/ayush_icd11_mappings_200.csv');
    if (response.ok) {
      const csvText = await response.text();

      // Robust check for HTML error pages instead of CSV
      const isHtml = csvText.trim().startsWith('<') ||
        csvText.toLowerCase().includes('<!doctype html>') ||
        csvText.includes('The page could not be found');

      if (isHtml) {
        console.warn('⚠️ Received HTML instead of CSV mapping data. Falling back to sample data.');
        const sampleMappings = generateSampleMappings();
        await dbService.insertMappings(sampleMappings);
        return;
      }

      const mappings = parseCSVMappings(csvText);
      await dbService.insertMappings(mappings);
      console.log(`Loaded ${mappings.length} mappings from CSV`);
    } else {
      // Fall back to sample data
      const sampleMappings = generateSampleMappings();
      await dbService.insertMappings(sampleMappings);
      console.log(`Loaded ${sampleMappings.length} sample mappings`);
    }
  } catch (error) {
    console.error('Failed to load initial mappings:', error);
    // As a last resort, load minimal sample data
    const minimalMappings = generateMinimalSampleMappings();
    await dbService.insertMappings(minimalMappings);
    console.log(`Loaded ${minimalMappings.length} minimal sample mappings`);
  }
}

/**
 * Parse CSV mapping data
 */
function parseCSVMappings(csvText: string): NAMASTEMapping[] {
  const lines = csvText.split('\n').slice(1); // Skip header
  return lines
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        const [namaste_code, namaste_term, icd11_tm2_code, icd11_biomedicine_code, description] =
          line.split(',').map(field => field.trim().replace(/"/g, ''));

        // Validate required fields
        if (!namaste_code || !namaste_term) {
          throw new Error(`Missing required fields on line ${index + 2}`);
        }

        // Extract category from code prefix
        let category: 'Ayurveda' | 'Siddha' | 'Unani' = 'Ayurveda';
        if (namaste_code.startsWith('AYU-')) category = 'Ayurveda';
        else if (namaste_code.startsWith('SID-')) category = 'Siddha';
        else if (namaste_code.startsWith('UNA-')) category = 'Unani';

        // Generate chapter name from traditional term
        const chapter_name = generateChapterName(namaste_term);

        return {
          namaste_code,
          namaste_term,
          category,
          chapter_name,
          icd11_tm2_code: icd11_tm2_code || 'XF00000',
          icd11_tm2_description: description || namaste_term,
          icd11_biomedicine_code: icd11_biomedicine_code || 'BB00000',
          confidence_score: 0.95
        };
      } catch (error) {
        console.warn(`Skipping invalid line ${index + 2}: ${error}`);
        return null;
      }
    })
    .filter((mapping): mapping is NAMASTEMapping => mapping !== null);
}

/**
 * Generate chapter name based on traditional term
 */
function generateChapterName(term: string): string {
  const termLower = term.toLowerCase();

  if (termLower.includes('respiratory') || termLower.includes('cough') || termLower.includes('asthma') || termLower.includes('cold')) {
    return 'Respiratory System Disorders';
  } else if (termLower.includes('digestive') || termLower.includes('gastro') || termLower.includes('diarrhea') || termLower.includes('acidity')) {
    return 'Digestive System Disorders';
  } else if (termLower.includes('skin') || termLower.includes('dermatitis') || termLower.includes('rash')) {
    return 'Skin and Tissue Disorders';
  } else if (termLower.includes('fever') || termLower.includes('infection') || termLower.includes('viral')) {
    return 'Infectious Diseases';
  } else if (termLower.includes('diabetes') || termLower.includes('metabolic') || termLower.includes('thyroid')) {
    return 'Endocrine and Metabolic Disorders';
  } else if (termLower.includes('joint') || termLower.includes('arthritis') || termLower.includes('pain') || termLower.includes('muscle')) {
    return 'Musculoskeletal Disorders';
  } else if (termLower.includes('heart') || termLower.includes('cardiac') || termLower.includes('blood pressure')) {
    return 'Cardiovascular Disorders';
  } else if (termLower.includes('mental') || termLower.includes('anxiety') || termLower.includes('stress')) {
    return 'Mental Health Disorders';
  } else if (termLower.includes('women') || termLower.includes('pregnancy') || termLower.includes('menstrual')) {
    return 'Women\'s Health';
  } else if (termLower.includes('child') || termLower.includes('pediatric') || termLower.includes('infant')) {
    return 'Pediatric Disorders';
  }

  return 'General Medicine';
}

/**
 * Generate comprehensive sample mappings for demonstration
 */
function generateSampleMappings(): NAMASTEMapping[] {
  return [
    // Ayurveda mappings
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
      namaste_code: 'AYU-003',
      namaste_term: 'Madhumeha (Diabetes)',
      category: 'Ayurveda',
      chapter_name: 'Endocrine and Metabolic Disorders',
      icd11_tm2_code: 'XE94567',
      icd11_tm2_description: 'Traditional diabetes disorder',
      icd11_biomedicine_code: 'BC123',
      confidence_score: 0.98
    },
    {
      namaste_code: 'AYU-004',
      namaste_term: 'Sandhivata (Arthritis)',
      category: 'Ayurveda',
      chapter_name: 'Musculoskeletal Disorders',
      icd11_tm2_code: 'XF34521',
      icd11_tm2_description: 'Traditional joint disorder',
      icd11_biomedicine_code: 'BD456',
      confidence_score: 0.90
    },
    {
      namaste_code: 'AYU-005',
      namaste_term: 'Tvak Roga (Skin Disease)',
      category: 'Ayurveda',
      chapter_name: 'Skin and Tissue Disorders',
      icd11_tm2_code: 'XH78901',
      icd11_tm2_description: 'Traditional skin disorder',
      icd11_biomedicine_code: 'BE789',
      confidence_score: 0.87
    },

    // Siddha mappings
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

    // Unani mappings
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
    }
  ];
}

/**
 * Generate minimal sample mappings as fallback
 */
function generateMinimalSampleMappings(): NAMASTEMapping[] {
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

/**
 * Clear all data from database (use with caution)
 */
export async function clearDatabase() {
  try {
    console.log('Clearing database...');
    await dbService.clearMappings();
    await dbService.clearAuditLogs();
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Check database connection and status
 */
export async function checkDatabaseStatus() {
  try {
    if (!dbService.isConnectedDb()) {
      await dbService.connect();
    }

    const stats = await dbService.getMappingStats();
    const [categories, chapters] = await Promise.all([
      dbService.getCategories(),
      dbService.getChapters()
    ]);

    return {
      connected: true,
      totalMappings: stats.totalMappings,
      categories: categories.length,
      chapters: chapters.length,
      avgConfidenceScore: stats.avgConfidenceScore
    };
  } catch (error) {
    return {
      connected: false,
      error: (error as Error).message
    };
  }
}