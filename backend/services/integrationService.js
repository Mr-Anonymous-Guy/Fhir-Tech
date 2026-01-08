/**
 * Integration Service
 * Handles external API integrations for ABHA and ICD-11
 */

const database = require('../database');
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in Node 18+

class IntegrationService {
    constructor() {
        this.abhaConfig = {
            baseUrl: process.env.ABHA_BASE_URL || 'https://dev.abdm.gov.in/api/v1',
            clientId: process.env.ABHA_CLIENT_ID,
            clientSecret: process.env.ABHA_CLIENT_SECRET
        };

        this.icd11Config = {
            apiUrl: process.env.ICD11_API_URL || 'https://id.who.int/icd/entity',
            tokenUrl: 'https://icdaccessmanagement.who.int/connect/token',
            clientId: process.env.ICD11_CLIENT_ID,
            clientSecret: process.env.ICD11_CLIENT_SECRET
        };

        this.icdToken = null;
        this.icdTokenExpiry = null;
    }

    // ==========================================
    // ABHA Integration Methods
    // ==========================================

    async verifyAbhaId(healthId) {
        // Mock implementation for now - requires actual API credentials to function
        console.log(`Verifying ABHA ID: ${healthId}`);

        // TODO: Implement actual API call to ABHA/NDHM
        // const response = await fetch(`${this.abhaConfig.baseUrl}/search/searchByHealthId`, { ... });

        // Return mock success for demonstration
        return {
            valid: true,
            healthId: healthId,
            name: "Mock User",
            status: "ACTIVE"
        };
    }

    async linkAbhaProfile(userId, abhaData) {
        try {
            const profileData = {
                userId,
                abhaAddress: abhaData.healthId, // Assuming healthId is the address
                healthIdNumber: abhaData.healthIdNumber,
                name: abhaData.name,
                status: 'LINKED',
                linkedAt: new Date()
            };

            const result = await database.createAbhaProfile(profileData);
            return { success: true, result };
        } catch (error) {
            console.error('Link ABHA profile error:', error);
            throw new Error('Failed to link ABHA profile');
        }
    }

    // ==========================================
    // ICD-11 Integration Methods
    // ==========================================

    async getIcd11Token() {
        if (this.icdToken && this.icdTokenExpiry > new Date()) {
            return this.icdToken;
        }

        try {
            // Mock token for now if no credentials
            if (!this.icd11Config.clientId || !this.icd11Config.clientSecret) {
                console.warn('⚠️ Missing ICD-11 credentials, using mock token');
                return 'mock-icd-token';
            }

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.icd11Config.clientId);
            params.append('client_secret', this.icd11Config.clientSecret);
            params.append('scope', 'icdapi_access');

            const response = await fetch(this.icd11Config.tokenUrl, {
                method: 'POST',
                body: params
            });

            const data = await response.json();
            if (data.access_token) {
                this.icdToken = data.access_token;
                // Set expiry slightly before actual expiry (e.g., 3500s instead of 3600s)
                this.icdTokenExpiry = new Date(Date.now() + (data.expires_in - 100) * 1000);
                return this.icdToken;
            } else {
                throw new Error('Failed to obtain ICD-11 token');
            }
        } catch (error) {
            console.error('Get ICD-11 token error:', error);
            throw error;
        }
    }

    async searchIcd11(query) {
        try {
            const token = await this.getIcd11Token();

            // If using mock token, return mock results
            if (token === 'mock-icd-token') {
                return {
                    destinationEntities: [
                        { title: `Mock Result for ${query} 1`, code: '1A00', id: 'http://id.who.int/icd/entity/12345' },
                        { title: `Mock Result for ${query} 2`, code: '1A01', id: 'http://id.who.int/icd/entity/67890' }
                    ]
                };
            }

            const url = `${this.icd11Config.apiUrl}/search?q=${encodeURIComponent(query)}&useFlexisearch=true`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'en',
                    'API-Version': 'v2'
                }
            });

            if (!response.ok) {
                throw new Error(`ICD-11 API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Search ICD-11 error:', error);
            throw error;
        }
    }

    async linkNamasteToIcd11(namasteCode, icd11Uri) {
        try {
            // 1. Fetch details from ICD-11 API to ensure validity and get metadata
            // For now, we'll assume the URI is valid and just store it
            // In a real scenario, we'd call: await this.getIcd11Entity(icd11Uri);

            const icd11Data = {
                uri: icd11Uri,
                code: icd11Uri.split('/').pop(), // Naive extraction
                title: 'Linked ICD-11 Entity', // Should be fetched
                metadata: { source: 'manual_link' }
            };

            const result = await database.createIcdLink(namasteCode, icd11Data);
            return { success: true, result };
        } catch (error) {
            console.error('Link Namaste to ICD-11 error:', error);
            throw error;
        }
    }

    // ==========================================
    // Fetch All Data Methods
    // ==========================================

    /**
     * Fetch all available ICD-11 entities (limited sample for demo)
     * In production, this would paginate through the ICD-11 API
     */
    async fetchAllIcd11Entities() {
        try {
            const token = await this.getIcd11Token();

            // If using mock token, return comprehensive mock data
            if (token === 'mock-icd-token') {
                return [
                    { code: '1A00', title: 'Cholera', uri: 'http://id.who.int/icd/entity/1435254666' },
                    { code: '1A01', title: 'Intestinal infectious diseases', uri: 'http://id.who.int/icd/entity/1630407678' },
                    { code: 'FA20.0', title: 'Rheumatoid arthritis', uri: 'http://id.who.int/icd/entity/1712083736' },
                    { code: 'MG26', title: 'Fever of other and unknown origin', uri: 'http://id.who.int/icd/entity/1766440644' },
                    { code: 'MD10', title: 'Cough', uri: 'http://id.who.int/icd/entity/1918005530' }
                ];
            }

            // Real API call would go here
            // For now, return empty array if credentials are available but we don't want to make actual calls
            console.log('⚠️ Real ICD-11 API integration not fully implemented');
            return [];
        } catch (error) {
            console.error('Fetch all ICD-11 entities error:', error);
            throw error;
        }
    }

    /**
     * Fetch all NAMASTE codes from the NAMASTE API
     * Mock implementation - replace with actual API when available
     */
    async fetchAllNamasteCodes() {
        try {
            // Mock NAMASTE API data
            // In production, this would call the actual NAMASTE/AYUSH API
            return [
                { code: 'AY-001', term: 'Amavata', category: 'Ayurveda', description: 'Rheumatoid arthritis equivalent' },
                { code: 'AY-002', term: 'Jvara', category: 'Ayurveda', description: 'Fever' },
                { code: 'AY-003', term: 'Kasa', category: 'Ayurveda', description: 'Cough' },
                { code: 'AY-004', term: 'Atisara', category: 'Ayurveda', description: 'Diarrhoea' },
                { code: 'AY-005', term: 'Pandu', category: 'Ayurveda', description: 'Anaemia' },
                { code: 'YG-001', term: 'Pranayama', category: 'Yoga', description: 'Breathing exercises' },
                { code: 'UN-001', term: 'Hijama', category: 'Unani', description: 'Cupping therapy' }
            ];
        } catch (error) {
            console.error('Fetch all NAMASTE codes error:', error);
            throw error;
        }
    }

    /**
     * Fetch and merge all mappings from both APIs
     * This creates a comprehensive view of available codes
     */
    async fetchAllMappings() {
        try {
            const [icd11Entities, namasteCodes] = await Promise.all([
                this.fetchAllIcd11Entities(),
                this.fetchAllNamasteCodes()
            ]);

            // Create mappings by combining data
            const mappings = [];

            // Add NAMASTE codes with potential ICD-11 matches
            for (const namasteCode of namasteCodes) {
                // Check if there's an existing link in database
                const existingLink = await database.getIcdLink(namasteCode.code);

                mappings.push({
                    namaste_code: namasteCode.code,
                    namaste_term: namasteCode.term,
                    category: namasteCode.category,
                    description: namasteCode.description,
                    icd11_code: existingLink?.icd11Code || null,
                    icd11_title: existingLink?.icd11Title || null,
                    icd11_uri: existingLink?.icd11Uri || null,
                    linked: !!existingLink,
                    source: 'api_fetch'
                });
            }

            return {
                total: mappings.length,
                mappings,
                icd11Available: icd11Entities.length,
                namasteAvailable: namasteCodes.length
            };
        } catch (error) {
            console.error('Fetch all mappings error:', error);
            throw error;
        }
    }
}

module.exports = new IntegrationService();
