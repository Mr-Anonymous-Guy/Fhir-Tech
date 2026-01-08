const codesService = require('../services/codes.service');

class CodesController {
    async search(req, res, next) {
        try {
            const { query } = req.query;
            const results = await codesService.searchCodes(query);
            res.json(results);
        } catch (error) {
            next(error);
        }
    }

    async translate(req, res, next) {
        try {
            const { namasteCode } = req.body;
            if (!namasteCode) {
                return res.status(400).json({ error: 'namasteCode is required' });
            }

            const result = await codesService.translateCode(namasteCode);
            if (!result) {
                return res.status(404).json({ error: 'Code not found' });
            }

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CodesController();
