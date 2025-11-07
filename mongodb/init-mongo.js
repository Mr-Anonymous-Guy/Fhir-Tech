// ===========================================
// NAMASTE-SYNC MongoDB Initialization Script
// ===========================================
// This script initializes MongoDB with security, users,
// collections, indexes, and validation rules

// Global variables
const dbName = 'namaste-sync';
const appUsername = 'namaste_app';
const exporterUsername = 'mongodb_exporter';
const backupUsername = 'backup_user';

// Initialize function
function initializeDatabase() {
    print('Starting NAMASTE-SYNC MongoDB initialization...');

    try {
        // Switch to admin database to create users
        db = db.getSiblingDB('admin');

        // Create application database
        print(`Creating database: ${dbName}`);
        db.getSiblingDB(dbName);

        // Create application user with specific privileges
        print('Creating application user...');
        db.createUser({
            user: appUsername,
            pwd: passwordPrompt(), // Will be replaced by Docker secrets
            roles: [
                {
                    role: 'readWrite',
                    db: dbName
                }
            ]
        });

        // Create monitoring user for MongoDB exporter
        print('Creating monitoring user...');
        db.createUser({
            user: exporterUsername,
            pwd: passwordPrompt(), // Will be replaced by Docker secrets
            roles: [
                {
                    role: 'clusterMonitor',
                    db: 'admin'
                },
                {
                    role: 'read',
                    db: dbName
                }
            ]
        });

        // Create backup user
        print('Creating backup user...');
        db.createUser({
            user: backupUsername,
            pwd: passwordPrompt(), // Will be replaced by Docker secrets
            roles: [
                {
                    role: 'backup',
                    db: 'admin'
                },
                {
                    role: 'read',
                    db: dbName
                }
            ]
        });

        // Switch to application database
        db = db.getSiblingDB(dbName);

        // Create collections with validation rules
        createCollectionsWithValidation();

        // Create indexes for performance optimization
        createIndexes();

        // Initialize collections with default data if needed
        initializeDefaultData();

        // Set up database configuration
        configureDatabase();

        print('MongoDB initialization completed successfully!');

    } catch (error) {
        print(`Error during initialization: ${error}`);
        throw error;
    }
}

// Create collections with validation rules
function createCollectionsWithValidation() {
    print('Creating collections with validation rules...');

    // Users collection with comprehensive validation
    db.createCollection('users', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'User',
                required: ['email', 'createdAt', 'updatedAt'],
                properties: {
                    email: {
                        bsonType: 'string',
                        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                        description: 'Must be a valid email address'
                    },
                    password: {
                        bsonType: 'string',
                        minLength: 8,
                        description: 'Password must be at least 8 characters long'
                    },
                    firstName: {
                        bsonType: 'string',
                        maxLength: 50,
                        description: 'First name must be a string'
                    },
                    lastName: {
                        bsonType: 'string',
                        maxLength: 50,
                        description: 'Last name must be a string'
                    },
                    role: {
                        enum: ['user', 'admin', 'practitioner'],
                        description: 'Role must be one of: user, admin, practitioner'
                    },
                    isActive: {
                        bsonType: 'bool',
                        description: 'User active status'
                    },
                    lastLogin: {
                        bsonType: 'date',
                        description: 'Last login timestamp'
                    },
                    createdAt: {
                        bsonType: 'date',
                        description: 'Account creation timestamp'
                    },
                    updatedAt: {
                        bsonType: 'date',
                        description: 'Last update timestamp'
                    },
                    profile: {
                        bsonType: 'object',
                        properties: {
                            phone: {
                                bsonType: 'string',
                                pattern: '^\\+?[1-9]\\d{1,14}$',
                                description: 'Phone number in E.164 format'
                            },
                            dateOfBirth: {
                                bsonType: 'date',
                                description: 'Date of birth'
                            },
                            gender: {
                                enum: ['male', 'female', 'other', 'unknown'],
                                description: 'Gender identity'
                            },
                            address: {
                                bsonType: 'object',
                                properties: {
                                    street: { bsonType: 'string' },
                                    city: { bsonType: 'string' },
                                    state: { bsonType: 'string' },
                                    postalCode: { bsonType: 'string' },
                                    country: { bsonType: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        validationLevel: 'moderate',
        validationAction: 'error'
    });

    // FHIR Data collection with structure validation
    db.createCollection('fhirdata', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'FHIR Resource',
                required: ['resourceType', 'id', 'meta'],
                properties: {
                    resourceType: {
                        enum: ['Patient', 'Observation', 'Condition', 'Medication', 'Practitioner', 'Organization'],
                        description: 'FHIR resource type'
                    },
                    id: {
                        bsonType: 'string',
                        pattern: '^[a-zA-Z0-9\\-\\.]{1,64}$',
                        description: 'FHIR resource ID'
                    },
                    meta: {
                        bsonType: 'object',
                        required: ['lastUpdated'],
                        properties: {
                            lastUpdated: {
                                bsonType: 'date',
                                description: 'Last updated timestamp'
                            },
                            versionId: {
                                bsonType: 'string',
                                description: 'Version ID'
                            },
                            profile: {
                                bsonType: 'array',
                                items: { bsonType: 'string' },
                                description: 'FHIR profile URLs'
                            }
                        }
                    },
                    text: {
                        bsonType: 'object',
                        properties: {
                            status: {
                                enum: ['generated', 'extensions', 'additional', 'empty'],
                                description: 'Text status'
                            },
                            div: {
                                bsonType: 'string',
                                description: 'XHTML representation'
                            }
                        }
                    }
                }
            }
        },
        validationLevel: 'moderate',
        validationAction: 'error'
    });

    // Patient Data collection
    db.createCollection('patientdata', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'Patient Data',
                required: ['patientId', 'createdAt'],
                properties: {
                    patientId: {
                        bsonType: 'string',
                        description: 'Reference to patient resource'
                    },
                    dataType: {
                        enum: ['vitals', 'medications', 'allergies', 'history', 'immunizations'],
                        description: 'Type of patient data'
                    },
                    data: {
                        bsonType: 'object',
                        description: 'Actual patient data'
                    },
                    recordedBy: {
                        bsonType: 'string',
                        description: 'User who recorded the data'
                    },
                    recordedAt: {
                        bsonType: 'date',
                        description: 'When the data was recorded'
                    },
                    createdAt: {
                        bsonType: 'date',
                        description: 'Record creation timestamp'
                    },
                    updatedAt: {
                        bsonType: 'date',
                        description: 'Record update timestamp'
                    }
                }
            }
        },
        validationLevel: 'moderate',
        validationAction: 'error'
    });

    // Audit Log collection
    db.createCollection('auditlogs', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'Audit Log',
                required: ['action', 'resourceType', 'userId', 'timestamp'],
                properties: {
                    action: {
                        enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export'],
                        description: 'Action performed'
                    },
                    resourceType: {
                        enum: ['User', 'Patient', 'Observation', 'Medication', 'System'],
                        description: 'Type of resource accessed'
                    },
                    resourceId: {
                        bsonType: 'string',
                        description: 'ID of the resource'
                    },
                    userId: {
                        bsonType: 'string',
                        description: 'User who performed the action'
                    },
                    userAgent: {
                        bsonType: 'string',
                        description: 'User agent string'
                    },
                    ipAddress: {
                        bsonType: 'string',
                        pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
                        description: 'IP address'
                    },
                    details: {
                        bsonType: 'object',
                        description: 'Additional details about the action'
                    },
                    timestamp: {
                        bsonType: 'date',
                        description: 'When the action occurred'
                    },
                    success: {
                        bsonType: 'bool',
                        description: 'Whether the action was successful'
                    }
                }
            }
        },
        validationLevel: 'strict',
        validationAction: 'error'
    });

    // System Configuration collection
    db.createCollection('systemconfig', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'System Configuration',
                required: ['key', 'value', 'updatedAt'],
                properties: {
                    key: {
                        bsonType: 'string',
                        uniqueItems: true,
                        description: 'Configuration key'
                    },
                    value: {
                        bsonType: ['string', 'number', 'bool', 'object', 'array'],
                        description: 'Configuration value'
                    },
                    description: {
                        bsonType: 'string',
                        description: 'Description of the configuration'
                    },
                    category: {
                        enum: ['security', 'performance', 'features', 'integration', 'backup'],
                        description: 'Configuration category'
                    },
                    isSecret: {
                        bsonType: 'bool',
                        description: 'Whether this value contains sensitive information'
                    },
                    updatedAt: {
                        bsonType: 'date',
                        description: 'Last update timestamp'
                    },
                    updatedBy: {
                        bsonType: 'string',
                        description: 'User who updated the configuration'
                    }
                }
            }
        },
        validationLevel: 'moderate',
        validationAction: 'error'
    });

    print('Collections created successfully');
}

// Create indexes for performance optimization
function createIndexes() {
    print('Creating database indexes...');

    // Users collection indexes
    db.users.createIndex({ email: 1 }, { unique: true, background: true });
    db.users.createIndex({ "profile.phone": 1 }, { sparse: true, background: true });
    db.users.createIndex({ role: 1, isActive: 1 }, { background: true });
    db.users.createIndex({ createdAt: 1 }, { background: true });
    db.users.createIndex({ lastLogin: 1 }, { background: true });

    // FHIR Data collection indexes
    db.fhirdata.createIndex({ resourceType: 1, id: 1 }, { unique: true, background: true });
    db.fhirdata.createIndex({ "meta.lastUpdated": -1 }, { background: true });
    db.fhirdata.createIndex({ resourceType: 1, "meta.lastUpdated": -1 }, { background: true });

    // Create text index for searching FHIR resources
    db.fhirdata.createIndex(
        {
            "text.div": "text",
            "name": "text",
            "resourceType": "text"
        },
        {
            weights: {
                "text.div": 10,
                "name": 8,
                "resourceType": 5
            },
            background: true
        }
    );

    // Patient Data collection indexes
    db.patientdata.createIndex({ patientId: 1, dataType: 1 }, { background: true });
    db.patientdata.createIndex({ recordedAt: -1 }, { background: true });
    db.patientdata.createIndex({ recordedBy: 1, recordedAt: -1 }, { background: true });

    // Audit Logs collection indexes (TTL and query optimization)
    db.auditlogs.createIndex({ timestamp: -1 }, { background: true });
    db.auditlogs.createIndex({ userId: 1, timestamp: -1 }, { background: true });
    db.auditlogs.createIndex({ action: 1, resourceType: 1, timestamp: -1 }, { background: true });

    // TTL index for audit logs (keep 1 year)
    db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 31536000, background: true });

    // System Configuration collection indexes
    db.systemconfig.createIndex({ key: 1 }, { unique: true, background: true });
    db.systemconfig.createIndex({ category: 1 }, { background: true });
    db.systemconfig.createIndex({ updatedAt: -1 }, { background: true });

    print('Indexes created successfully');
}

// Initialize collections with default data
function initializeDefaultData() {
    print('Initializing default data...');

    // Insert default system configuration
    db.systemconfig.insertMany([
        {
            key: 'app_version',
            value: '1.0.0',
            description: 'Current application version',
            category: 'features',
            isSecret: false,
            updatedAt: new Date(),
            updatedBy: 'system'
        },
        {
            key: 'max_login_attempts',
            value: 5,
            description: 'Maximum failed login attempts before account lock',
            category: 'security',
            isSecret: false,
            updatedAt: new Date(),
            updatedBy: 'system'
        },
        {
            key: 'session_timeout_minutes',
            value: 30,
            description: 'User session timeout in minutes',
            category: 'security',
            isSecret: false,
            updatedAt: new Date(),
            updatedBy: 'system'
        },
        {
            key: 'backup_retention_days',
            value: 30,
            description: 'Number of days to retain backup files',
            category: 'backup',
            isSecret: false,
            updatedAt: new Date(),
            updatedBy: 'system'
        },
        {
            key: 'maintenance_mode',
            value: false,
            description: 'Whether the application is in maintenance mode',
            category: 'features',
            isSecret: false,
            updatedAt: new Date(),
            updatedBy: 'system'
        }
    ]);

    // Create initial admin user (will be overridden by actual admin creation)
    // This is just a placeholder to ensure the collection structure
    db.users.insertOne({
        email: 'admin@namaste-sync.local',
        password: '$2b$12$placeholder_hash_will_be_replaced', // Placeholder
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    print('Default data initialized successfully');
}

// Configure database settings
function configureDatabase() {
    print('Configuring database settings...');

    // Set database profiler level (1 for slow operations, 2 for all operations)
    db.setProfilingLevel(1, { slowms: 100 });

    // Create custom roles if needed (optional)
    // This can be expanded based on specific requirements

    print('Database configuration completed');
}

// Run the initialization
initializeDatabase();