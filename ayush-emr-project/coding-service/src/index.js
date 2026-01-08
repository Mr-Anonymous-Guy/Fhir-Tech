/**
 * Coding Service Entry Point
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const codesRoutes = require('./routes/codes.routes');
const fhirRoutes = require('./routes/fhir.routes');
const patientRoutes = require('./routes/patient.routes');
const errorHandler = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/codes', codesRoutes);
app.use('/fhir', fhirRoutes);
app.use('/patient', patientRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'coding-service', timestamp: new Date() });
});

// Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Coding Service running on port ${PORT}`);
});

module.exports = app; // For testing
