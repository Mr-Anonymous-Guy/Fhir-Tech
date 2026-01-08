const express = require('express');
const router = express.Router();
const codesController = require('../controllers/codes.controller');

router.get('/search', codesController.search);
router.post('/translate', codesController.translate);

module.exports = router;
