
## Acknowledgements

NAMASTE-SYNC: FHIR R4 Terminology Service

A comprehensive FHIR R4-compliant terminology service for Indian traditional medicine (AYUSH) with ICD-11 mappings.
This application provides standardized terminology mapping between NAMASTE traditional medicine codes and ICD-11 TM2 + Biomedicine codes.

✨ Features
🏥 Medical Terminology

NAMASTE to ICD-11 Mapping: Comprehensive mapping between traditional Indian medicine and international standards

Multi-System Support: Ayurveda, Siddha, and Unani medicine systems

FHIR R4 Compliance: Full FHIR resource generation and validation

Dual Coding: TM2 (Traditional Medicine 2) and Biomedicine code mappings

🚀 Performance & Storage

MongoDB Integration: High-performance local data storage with indexing

Full-Text Search: Advanced search with relevance scoring and highlighting

Hybrid Architecture: MongoDB for local storage + Supabase for dynamic management

Data Persistence: No data loss across application restarts

🔧 Advanced Features

Bulk Processing: CSV upload and bulk FHIR bundle generation

Real-time Search: Instant search suggestions and autocomplete

Audit Logging: Comprehensive activity tracking and analytics

Offline Capability: Core functionality works without internet

🎨 User Experience

Modern UI: Built with shadcn/ui and Tailwind CSS

Responsive Design: Optimized for desktop and mobile devices

Dark/Light Theme: Automatic theme switching

Interactive Dashboard: Real-time statistics and visualization

🏗️ Technology Stack
Frontend

React 18 with TypeScript

Vite for fast development and building

shadcn/ui component library

Tailwind CSS for styling

React Router for navigation

React Query for data fetching

Backend & Database

MongoDB for local data storage

Supabase for authentication and dynamic data

Node.js compatible runtime

Standards & Compliance

FHIR R4 specification compliance

ICD-11 TM2 and Biomedicine

NAMASTE traditional medicine terminology

India EHR Standards 2016

🚀 Quick Start
Prerequisites

Node.js (v18 or higher)

MongoDB (v6 or higher)

npm or yarn package manager

Installation
# Clone the repository
git clone https://github.com/FallenDevil666/namaste-sync-33051.git
cd namaste-sync-33051

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if not running as service)
mongod

# Start the development server
npm run dev

Environment Setup

Create a .env file with the following configuration:

# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# MongoDB Configuration
VITE_MONGODB_URI="mongodb://localhost:27017/namaste-sync"
VITE_MONGODB_DB_NAME="namaste-sync"

📊 Database Schema
Mappings Collection
{
  namaste_code: String,           // Unique NAMASTE code
  namaste_term: String,           // Traditional medicine term
  category: String,               // 'Ayurveda' | 'Siddha' | 'Unani'
  chapter_name: String,           // Medical chapter/category
  icd11_tm2_code: String,         // ICD-11 TM2 code
  icd11_tm2_description: String,  // ICD-11 TM2 description
  icd11_biomedicine_code: String, // ICD-11 Biomedicine code
  confidence_score: Number        // Mapping confidence (0-1)
}

Performance Indexes

Unique index on namaste_code

Full-text search on namaste_term and icd11_tm2_description

Category and chapter filtering indexes

Confidence score sorting index

🔌 API Reference
FHIR Operations
$lookup - Search for codes
const results = await fhirService.lookup('kasa', 1, 10);
// Returns: SearchResult[] with highlighted matches

$translate - Convert between code systems
const translation = await fhirService.translate(
  'AYU-001', 
  'namaste', 
  'icd11-tm2'
);

Generate FHIR Resources
const codeSystem = await fhirService.generateCodeSystem();
const conceptMap = await fhirService.generateConceptMap();

Data Management
Bulk Upload
const result = await fhirService.processBulkUpload(mappings);
// Returns: { bundle: FHIRBundle, downloadUrl: string }

Audit Logging
const logs = await fhirService.getAuditLog(1, 20, {
  action: 'search',
  userId: 'user123'
});

🧪 Testing
# Run linting
npm run lint

# Run type checking
npm run build

# Preview production build
npm run preview

📦 Deployment
Production Build
# Build for production
npm run build

# Preview production build
npm run preview

🐳 Docker Deployment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]

🐳 Docker Setup Guide (Beginner-Friendly)

Follow these steps to install and run NAMASTE-SYNC using Docker — perfect for users who don’t want to install Node.js or MongoDB manually.

📋 Step 1: Install Docker

Windows/macOS:
Download Docker Desktop → https://www.docker.com/products/docker-desktop

Install and ensure Docker Engine is running.

Linux (Ubuntu/Debian):

sudo apt update
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker


Check installation:

docker --version

📦 Step 2: Clone the Repository
git clone https://github.com/FallenDevil666/namaste-sync-33051.git
cd namaste-sync-33051

⚙️ Step 3: Set Up Environment Variables
cp .env.example .env


Edit .env file with your Supabase and MongoDB configuration (or keep defaults for local setup).

🏗️ Step 4: Build the Docker Image
docker build -t namaste-sync .

▶️ Step 5: Run the Application
docker run -d -p 4173:4173 --name namaste-sync namaste-sync


Now open your browser and visit:
👉 http://localhost:4173

You’ll see the NAMASTE-SYNC dashboard live!

🔄 Step 6: Manage the Container
docker ps                # Check if running
docker stop namaste-sync # Stop container
docker start namaste-sync# Start again
docker logs namaste-sync # View logs
docker rm -f namaste-sync# Remove container

🧹 Step 7: Cleanup (Optional)
docker rm -f namaste-sync
docker rmi namaste-sync

💡 Pro Tip (For Developers)

For development mode with live updates:

docker run -it -p 5173:5173 -v .:/app namaste-sync sh


✅ You’re done!
NAMASTE-SYNC is now running on Docker — no dependency issues, no setup hassle. 🚀

🤝 Contributing

Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m 'Add amazing feature'

Push to the branch: git push origin feature/amazing-feature

Open a Pull Request

📄 License

This project is licensed under the MIT License — see the LICENSE
 file for details.

🆘 Support

📧 Email: support@namaste-sync.dev

🐛 Issues: GitHub Issues

📖 Documentation: Wiki

🙏 Acknowledgments

Ministry of AYUSH – Government of India

ICD-11 – World Health Organization

FHIR Community – HL7 International

Open Source Community – For the amazing tools and libraries

Built with ❤️ for the advancement of traditional medicine interoperability

## Appendix

Any additional information goes here


## Authors

- [@octokatherine](https://www.github.com/octokatherine)


## Badges

Add badges from somewhere like: [shields.io](https://shields.io/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)





## Demo

Insert gif or link to demo


## Deployment

To deploy this project run

```bash
  npm run deploy
```




# Project Title

A brief description of what this project does and who it's for

# NAMASTE-SYNC: FHIR R4 Terminology Service

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/FallenDevil666/namaste-sync-33051)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)](https://www.mongodb.com/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-orange.svg)](http://hl7.org/fhir/)

A comprehensive FHIR R4-compliant terminology service for Indian traditional medicine (AYUSH) with ICD-11 mappings. This application provides standardized terminology mapping between NAMASTE traditional medicine codes and ICD-11 TM2 + Biomedicine codes.

## 📋 Table of Contents
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Building the Application](#-building-the-application)
- [Running the Application](#-running-the-application)
- [Development Workflow](#-development-workflow)
- [Docker Deployment](#-docker-deployment)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### 🏥 Medical Terminology
- **NAMASTE to ICD-11 Mapping**: Comprehensive mapping between traditional Indian medicine and international standards
- **Multi-System Support**: Ayurveda, Siddha, and Unani medicine systems
- **FHIR R4 Compliance**: Full FHIR resource generation and validation
- **Dual Coding**: TM2 (Traditional Medicine 2) and Biomedicine code mappings

### 🚀 Performance & Storage
- **MongoDB Integration**: High-performance local data storage with indexing
- **Full-Text Search**: Advanced search with relevance scoring and highlighting
- **Data Persistence**: No data loss across application restarts
- **Smart Authentication**: Automatic fallback when MongoDB auth is required

### 🔧 Advanced Features
- **Bulk Processing**: CSV upload and bulk FHIR bundle generation
- **Real-time Search**: Instant search suggestions and autocomplete
- **Audit Logging**: Comprehensive activity tracking and analytics
- **Offline Capability**: Core functionality works without internet

### 🎨 User Experience
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme**: Automatic theme switching
- **Interactive Dashboard**: Real-time statistics and visualization

---

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **MongoDB** for local data storage
- **bcrypt** for password hashing
- **JWT** for authentication

### Standards & Compliance
- **FHIR R4** specification compliance
- **ICD-11** TM2 and Biomedicine
- **NAMASTE** traditional medicine terminology
- **India EHR Standards 2016**

---

## 📋 Prerequisites

Before you start, ensure you have the following installed:

### Required

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version && npm --version`

2. **MongoDB** (v6 or higher) - Choose one:
   - **Local Installation**: https://docs.mongodb.com/manual/installation/
   - **MongoDB Atlas (Cloud)**: https://www.mongodb.com/cloud/atlas

3. **Git** (for cloning repository)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

### Optional
- **Docker** (for containerized deployment)
  - Download: https://www.docker.com/products/docker-desktop

---

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/FallenDevil666/namaste-sync-33051.git

# Navigate to project directory
cd namaste-sync-33051
```

### Step 2: Install All Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Return to root directory
cd ..
```

### Step 3: Create Environment Variables

#### Backend Configuration (backend/.env)

```bash
cd backend
```

**Create backend/.env file:**
```
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=namaste-sync

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8080

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-change-in-production
```

**For MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/namaste-sync?retryWrites=true&w=majority
```

```bash
cd ..
```

### Step 4: Verify MongoDB Connection

```bash
# Test connection
node -e "const { MongoClient } = require('mongodb'); (async () => { try { const client = new MongoClient('mongodb://localhost:27017'); await client.connect(); console.log('✅ MongoDB connected'); await client.close(); } catch(e) { console.log('❌ Error:', e.message); } })()"
```

You should see: `✅ MongoDB connected`

---

## 🏗️ Building the Application

### Development Build (with Hot Reload)

```bash
# Start both frontend and backend with auto-reload
npm run dev:full
```

**Output:**
```
✅ Backend running on http://localhost:3001
✅ Frontend running on http://localhost:8080
```

### Production Build

```bash
# Build frontend for production
npm run build

# Build backend (if needed)
cd backend
npm run build
cd ..
```

This creates optimized bundles in the `dist/` directory.

---

## 🚀 Running the Application

### ⭐ RECOMMENDED: Full-Stack Development Mode

```bash
npm run dev:full
```

Then open your browser: **http://localhost:8080**

- Frontend auto-reloads on code changes
- Backend auto-restarts with nodemon
- Both run simultaneously

### Advanced: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:8080
```

### Production Mode

```bash
# Build for production
npm run build

# Preview production build
npm run preview
# Available at http://localhost:4173
```

### Backend Only (API Server)

```bash
cd backend
npm start
# API available at http://localhost:3001/api
```

---

## 💻 Development Workflow

### Available Commands

```bash
# Frontend Scripts (from root)
npm run dev          # Start frontend dev server
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend Scripts (from backend/ directory)
cd backend
npm run dev          # Start with auto-restart
npm start            # Start (production)

# Full-Stack (from root)
npm run dev:full     # Start both together

# Build & Deploy (from root)
npm run build        # Build for production
```

### Project Structure

```
namaste-sync-33051/
├── src/                              # Frontend source
│   ├── pages/                        # Pages (Login, Dashboard, etc.)
│   ├── components/                   # Reusable components
│   ├── services/                     # API services
│   │   ├── mongoAuthService.ts      # Authentication
│   │   ├── fhirServiceV2.ts         # FHIR operations
│   │   └── mongoDbApiService.ts     # Database calls
│   ├── contexts/                     # React contexts
│   └── App.tsx                       # Main component
│
├── backend/                          # Backend server
│   ├── server.js                     # Express server
│   ├── database.js                   # MongoDB connection
│   ├── localUserStorage.js          # Auth fallback
│   ├── services/
│   │   └── authService.js           # Authentication logic
│   ├── .env                          # Environment variables
│   └── package.json                  # Dependencies
│
├── public/                           # Static assets
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Vite config
└── README.md                         # This file
```

---

## 🎯 First Time Usage

1. **Open Application**: http://localhost:8080
2. **Sign Up**: Create account with:
   - Email
   - Password (8+ chars, with uppercase, lowercase, number, special char)
   - Full name
3. **Log In**: Use your credentials
4. **Explore**: Search FHIR terminology and mappings

### Key Features

- **Search**: Enter medical terms (e.g., "Kasa", "Cough")
- **Filter**: By category or confidence score
- **Bulk Upload**: Upload CSV with NAMASTE codes
- **Export**: Download FHIR bundles
- **Audit Trail**: View all activities
- **Demo Mode**: Try without signing up

---

## 🔌 API Reference

### Authentication

```bash
# Register
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "username": "johndoe"
}

# Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Verify Token
POST http://localhost:3001/api/auth/verify-token
Authorization: Bearer YOUR_JWT_TOKEN
```

### Search & Mappings

```bash
# Search mappings
GET http://localhost:3001/api/mappings/search?q=kasa&page=1&limit=20

# Get by code
GET http://localhost:3001/api/mappings/AYU-001

# Health check
GET http://localhost:3001/health
```

---

## 🚀 Production Deployment

### 🎯 Quick Production Deployment

**One-command deployment with all monitoring and security:**

```bash
# Clone and setup
git clone https://github.com/FallenDevil666/namaste-sync-33051.git
cd namaste-sync-33051

# Configure environment
./scripts/config-setup.sh

# Deploy to production
./scripts/deploy-enhanced.sh production --monitoring
```

### 📋 Production Prerequisites

- **Docker & Docker Compose** (latest versions)
- **Domain name** pointing to your server
- **SSL certificate** (Let's Encrypt recommended)
- **Minimum 4GB RAM, 2 CPU cores**
- **50GB+ storage** (depending on data size)

### 🔧 Production Environment Setup

#### 1. Configure Environment Variables

```bash
# Run automated setup
./scripts/config-setup.sh

# Or manually configure:
cp .env.example .env
cp backend/.env.example backend/.env
```

**Edit `.env` for production:**
```bash
VITE_APP_ENV=production
VITE_API_BASE_URL=https://yourdomain.com
VITE_SUPABASE_PROJECT_ID=your_production_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_production_key
```

**Edit `backend/.env` for production:**
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
MONGODB_URI=mongodb://mongodb:27017/namaste-sync
```

#### 2. Generate Secrets

```bash
# Generate all required secrets
./scripts/secrets-setup.sh

# Or create manually:
mkdir -p secrets
echo "your_mongo_root_user" > secrets/mongo_root_username.txt
echo "your_secure_mongo_password" > secrets/mongo_root_password.txt
echo "your_grafana_password" > secrets/grafana_password.txt
```

#### 3. Configure Domain and SSL

**Update `nginx/nginx.conf`:**
```bash
# Replace yourdomain.com with your actual domain
sed -i 's/yourdomain.com/yourdomain.com/g' nginx/nginx.conf
```

**Set up SSL with Let's Encrypt:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 🏗️ Deployment Options

#### Option 1: Enhanced Production Deployment (Recommended)

```bash
# Full production deployment with monitoring
./scripts/deploy-enhanced.sh production --monitoring
```

**Features:**
- ✅ Blue-Green deployment (zero downtime)
- ✅ Automated backup before deployment
- ✅ Health checks and rollback capability
- ✅ Comprehensive monitoring (Prometheus, Grafana)
- ✅ Security hardening
- ✅ SSL/HTTPS termination
- ✅ Rate limiting and DDoS protection
- ✅ Automated alerts and notifications

#### Option 2: Docker Compose Production

```bash
# Deploy with production configuration
docker-compose -f docker-compose.production.yml up -d
```

#### Option 3: Manual Docker Deployment

```bash
# Build production image
docker build -f Dockerfile.production -t namaste-sync:prod .

# Run with production settings
docker run -d \
  --name namaste-sync-prod \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/secrets:/run/secrets \
  namaste-sync:prod
```

### 📊 Monitoring and Management

#### Access Points After Deployment

- **Main Application**: https://yourdomain.com
- **Health Check**: https://yourdomain.com/health
- **API Health**: https://yourdomain.com/api/health
- **Grafana Dashboard**: https://yourdomain.com/grafana
- **Prometheus Metrics**: https://yourdomain.com/prometheus

#### Monitoring Stack

- **Grafana**: Visual dashboards and alerts
- **Prometheus**: Metrics collection and storage
- **Node Exporter**: System metrics
- **MongoDB Exporter**: Database performance metrics
- **AlertManager**: Alert routing and notifications

#### Useful Commands

```bash
# Check deployment status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check service health
curl https://yourdomain.com/health

# Backup database
./scripts/backup-database.sh production full

# Restart services
./scripts/deploy-enhanced.sh production restart

# Rollback deployment
./scripts/deploy-enhanced.sh production rollback
```

### 🔒 Security Features

- **SSL/TLS encryption** with modern cipher suites
- **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization
- **CSRF protection** with secure cookies
- **Secret management** with encrypted storage
- **Regular security updates** and vulnerability scanning

### 📈 Performance Optimizations

- **Nginx reverse proxy** with caching
- **Redis caching** for frequently accessed data
- **Database connection pooling**
- **Asset compression** and browser caching
- **Load balancing** support
- **Auto-scaling** readiness

### 🔄 CI/CD Integration

#### GitHub Actions (Pre-configured)

```yaml
# .github/workflows/ci-cd.yml
# Automated pipeline includes:
# - Code quality checks
# - Security scanning
# - Automated testing
# - Docker image building
# - Staging deployment
# - Production deployment (with approval)
```

#### Environment Management

```bash
# Deploy to different environments
./scripts/deploy-enhanced.sh staging
./scripts/deploy-enhanced.sh production

# Environment-specific operations
./scripts/deploy-enhanced.sh production backup
./scripts/deploy-enhanced.sh production maintenance-on
./scripts/deploy-enhanced.sh production maintenance-off
```

### 📁 Backup and Recovery

#### Automated Backups

```bash
# Create full backup
./scripts/backup-database.sh production full

# Create incremental backup
./scripts/backup-database.sh production incremental

# List backups
ls -la backups/

# Restore from backup
./scripts/deploy-enhanced.sh production restore backups/20240101_120000
```

#### Backup Features

- **Automated daily backups** with retention policies
- **Point-in-time recovery** capability
- **Cloud storage integration** (AWS S3, Azure Blob)
- **Backup verification** and integrity checks
- **Disaster recovery** procedures

### 🛠️ Troubleshooting Production Issues

#### Health Checks

```bash
# Check overall health
curl https://yourdomain.com/health

# Detailed health report
curl https://yourdomain.com/health/detailed

# Service status
docker-compose -f docker-compose.production.yml ps
```

#### Common Issues

**SSL Certificate Issues:**
```bash
# Check certificate renewal
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check nginx configuration
nginx -t
```

**Database Connection Issues:**
```bash
# Check MongoDB logs
docker logs namaste-sync_mongodb_1

# Test database connection
docker exec -it namaste-sync_mongodb_1 mongo
```

**Performance Issues:**
```bash
# Check system resources
docker stats

# Monitor database performance
curl https://yourdomain.com/metrics
```

---

## 🐳 Docker Development Deployment

### Build Docker Image

```bash
docker build -t namaste-sync:latest .
```

### Run Docker Container

```bash
docker run -d \
  --name namaste-sync \
  -p 4173:4173 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  namaste-sync:latest
```

### Docker Commands

```bash
docker ps                    # List running containers
docker logs namaste-sync     # View logs
docker stop namaste-sync     # Stop container
docker start namaste-sync    # Start container
docker rm namaste-sync       # Remove container
```

### Docker Compose Development

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  app:
    build: .
    ports:
      - "4173:4173"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/namaste-sync

volumes:
  mongo_data:
```

Run: `docker-compose up`

---

## 🛠️ Troubleshooting

### MongoDB Connection Error

**Error: "Command find requires authentication"**
```bash
# The app has automatic fallback to in-memory storage
# Or restart MongoDB without authentication

# Verify MongoDB running:
mongosh
db.adminCommand('ping')
```

### Port Already in Use

**Error: "EADDRINUSE: address already in use :::8080"**
```bash
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8080
kill -9 <PID>
```

### Dependencies Issue

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Authentication Fails

```bash
# Check MongoDB:
mongosh

# Check backend logs:
cd backend
npm run dev

# Clear browser storage:
# DevTools > Application > Clear Site Data
```

### Build Errors

```bash
# Clear Vite cache
rm -rf dist .vite

# Rebuild
npm run build

# Check for errors
npm run lint
```

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,              // Unique user ID
  email: String,              // Email (unique)
  username: String,           // Username (unique)
  fullName: String,           // Full name
  password: String,           // Hashed (bcrypt)
  role: String,               // 'user' or 'admin'
  verified: Boolean,          // Email verified
  createdAt: Date,            // Creation date
  updatedAt: Date,            // Last update
  lastLogin: Date             // Last login time
}
```

### Mappings Collection
```javascript
{
  _id: ObjectId,              // Unique ID
  namaste_code: String,       // NAMASTE code
  namaste_term: String,       // Term name
  category: String,           // Ayurveda|Siddha|Unani
  chapter_name: String,       // Chapter
  icd11_tm2_code: String,     // ICD-11 TM2 code
  icd11_tm2_description: String,
  icd11_biomedicine_code: String,
  confidence_score: Number    // 0-1 confidence
}
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Branch**: `git checkout -b feature/your-feature`
3. **Commit**: `git commit -m 'Add feature'`
4. **Push**: `git push origin feature/your-feature`
5. **Pull Request**: Open a PR

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---
