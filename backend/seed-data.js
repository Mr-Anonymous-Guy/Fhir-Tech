/**
 * Seed Data for NAMASTE-SYNC
 * Contains all initial mapping data
 */

const MAPPINGS = [
    // Ayurveda - Respiratory System (5 mappings)
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
        confidence_score: 0.88
    },
    {
        namaste_code: 'AYU-004',
        namaste_term: 'Prashvasa (Dyspnea)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78175',
        icd11_tm2_description: 'Traditional shortness of breath',
        icd11_biomedicine_code: 'BB501',
        confidence_score: 0.91
    },
    {
        namaste_code: 'AYU-005',
        namaste_term: 'Peenasa (Rhinitis)',
        category: 'Ayurveda',
        chapter_name: 'Respiratory System Disorders',
        icd11_tm2_code: 'XF78176',
        icd11_tm2_description: 'Traditional nasal inflammation',
        icd11_biomedicine_code: 'BB502',
        confidence_score: 0.89
    },

    // Ayurveda - Metabolic Disorders (3 mappings)
    {
        namaste_code: 'AYU-006',
        namaste_term: 'Madhumeha (Diabetes)',
        category: 'Ayurveda',
        chapter_name: 'Metabolic Disorders',
        icd11_tm2_code: 'XE1B2',
        icd11_tm2_description: 'Sweet urine - Diabetes',
        icd11_biomedicine_code: 'BA40',
        confidence_score: 0.96
    },
    {
        namaste_code: 'AYU-007',
        namaste_term: 'Prameha (Pre-diabetes)',
        category: 'Ayurveda',
        chapter_name: 'Metabolic Disorders',
        icd11_tm2_code: 'XE1B3',
        icd11_tm2_description: 'Excessive discharge condition',
        icd11_biomedicine_code: 'BA41',
        confidence_score: 0.87
    },
    {
        namaste_code: 'AYU-008',
        namaste_term: 'Medoroga (Obesity)',
        category: 'Ayurveda',
        chapter_name: 'Metabolic Disorders',
        icd11_tm2_code: 'XE3C4',
        icd11_tm2_description: 'Fat tissue disorder',
        icd11_biomedicine_code: 'BA42',
        confidence_score: 0.92
    },

    // Siddha - Fever Disorders (2 mappings)
    {
        namaste_code: 'SID-001',
        namaste_term: 'Suram (Fever)',
        category: 'Siddha',
        chapter_name: 'Fever Disorders',
        icd11_tm2_code: 'XA1P75',
        icd11_tm2_description: 'Fever - Traditional classification',
        icd11_biomedicine_code: 'BA00',
        confidence_score: 0.94
    },
    {
        namaste_code: 'SID-002',
        namaste_term: 'Maruthuvam (Wind Disorder)',
        category: 'Siddha',
        chapter_name: 'Fever Disorders',
        icd11_tm2_code: 'XA1P76',
        icd11_tm2_description: 'Traditional vata disorder',
        icd11_biomedicine_code: 'BA01',
        confidence_score: 0.85
    },

    // Unani - Joint Disorders (2 mappings)
    {
        namaste_code: 'UNA-001',
        namaste_term: 'Waja-ul-Mafasil (Arthritis)',
        category: 'Unani',
        chapter_name: 'Joint Disorders',
        icd11_tm2_code: 'BA43',
        icd11_tm2_description: 'Pain in joints',
        icd11_biomedicine_code: 'BA44',
        confidence_score: 0.90
    },
    {
        namaste_code: 'UNA-002',
        namaste_term: 'Niqras (Gout)',
        category: 'Unani',
        chapter_name: 'Joint Disorders',
        icd11_tm2_code: 'BA45',
        icd11_tm2_description: 'Gout condition',
        icd11_biomedicine_code: 'BA46',
        confidence_score: 0.88
    },

    // Mixed System - Digestive Disorders (3 mappings)
    {
        namaste_code: 'AYU-009',
        namaste_term: 'Arsha (Hemorrhoids)',
        category: 'Ayurveda',
        chapter_name: 'Digestive Disorders',
        icd11_tm2_code: 'DA93',
        icd11_tm2_description: 'Hemorrhoid condition',
        icd11_biomedicine_code: 'BA47',
        confidence_score: 0.91
    },
    {
        namaste_code: 'SID-003',
        namaste_term: 'Pitham (Bilious Disorder)',
        category: 'Siddha',
        chapter_name: 'Digestive Disorders',
        icd11_tm2_code: 'DA94',
        icd11_tm2_description: 'Bile-related digestive disorder',
        icd11_biomedicine_code: 'BA48',
        confidence_score: 0.86
    },
    {
        namaste_code: 'UNA-003',
        namaste_term: 'Humar-e-Balgham (Phlegm)',
        category: 'Unani',
        chapter_name: 'Digestive Disorders',
        icd11_tm2_code: 'DA95',
        icd11_tm2_description: 'Excessive phlegm condition',
        icd11_biomedicine_code: 'BA49',
        confidence_score: 0.84
    }
];

const AUDIT_LOGS = [
    {
        action: 'initialize',
        query: 'System initialized with 15 mappings',
        resultCount: 15,
        success: true,
        duration: 150,
        timestamp: new Date().toISOString(),
        userId: 'system'
    },
    {
        action: 'search',
        query: 'kasa',
        resultCount: 1,
        success: true,
        duration: 45,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'demo-user'
    },
    {
        action: 'search',
        query: 'diabetes',
        resultCount: 2,
        success: true,
        duration: 52,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: 'demo-user'
    }
];

module.exports = {
    MAPPINGS,
    AUDIT_LOGS
};
