const codesData = require('../data/namaste_icd_sample.json');

class CodesService {
    /**
     * Search for codes by query string
     * @param {string} query 
     * @returns {Array} List of matching codes
     */
    async searchCodes(query) {
        if (!query) return [];

        const lowerQuery = query.toLowerCase();
        return codesData.filter(item =>
            item.namasteLabel.toLowerCase().includes(lowerQuery) ||
            item.namasteCode.toLowerCase().includes(lowerQuery) ||
            item.icd11BioLabel.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Translate a Namaste code to full mapping details
     * @param {string} namasteCode 
     * @returns {Object|null} Mapping details or null if not found
     */
    async translateCode(namasteCode) {
        return codesData.find(item => item.namasteCode === namasteCode);
    }
}

module.exports = new CodesService();
