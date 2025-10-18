# NAMASTE-SYNC: FHIR R4 Terminology Service

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/FallenDevil666/namaste-sync-33051)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)](https://www.mongodb.com/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-orange.svg)](http://hl7.org/fhir/)

A comprehensive FHIR R4-compliant terminology service for Indian traditional medicine (AYUSH) with ICD-11 mappings. This application provides standardized terminology mapping between NAMASTE traditional medicine codes and ICD-11 TM2 + Biomedicine codes.

## ✨ Features

### 🏥 Medical Terminology
- **NAMASTE to ICD-11 Mapping**: Comprehensive mapping between traditional Indian medicine and international standards
- **Multi-System Support**: Ayurveda, Siddha, and Unani medicine systems
- **FHIR R4 Compliance**: Full FHIR resource generation and validation
- **Dual Coding**: TM2 (Traditional Medicine 2) and Biomedicine code mappings

### 🚀 Performance & Storage
- **MongoDB Integration**: High-performance local data storage with indexing
- **Full-Text Search**: Advanced search with relevance scoring and highlighting
- **Hybrid Architecture**: MongoDB for local storage + Supabase for dynamic management
- **Data Persistence**: No data loss across application restarts

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

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching

### Backend & Database
- **MongoDB** for local data storage
- **Supabase** for authentication and dynamic data
- **Node.js** compatible runtime

### Standards & Compliance
- **FHIR R4** specification compliance
- **ICD-11** TM2 and Biomedicine
- **NAMASTE** traditional medicine terminology
- **India EHR Standards 2016**

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (v6 or higher)
3. **npm** or **yarn** package manager

### Installation

```bash
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
```

### Environment Setup

Create a `.env` file with the following configuration:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# MongoDB Configuration
VITE_MONGODB_URI="mongodb://localhost:27017/namaste-sync"
VITE_MONGODB_DB_NAME="namaste-sync"
```

## 📊 Database Schema

### Mappings Collection
```javascript
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
```

### Performance Indexes
- Unique index on `namaste_code`
- Full-text search on `namaste_term` and `icd11_tm2_description`
- Category and chapter filtering indexes
- Confidence score sorting index

## 🔌 API Reference

### FHIR Operations

#### $lookup - Search for codes
```typescript
const results = await fhirService.lookup('kasa', 1, 10);
// Returns: SearchResult[] with highlighted matches
```

#### $translate - Convert between code systems
```typescript
const translation = await fhirService.translate(
  'AYU-001', 
  'namaste', 
  'icd11-tm2'
);
```

#### Generate FHIR Resources
```typescript
const codeSystem = await fhirService.generateCodeSystem();
const conceptMap = await fhirService.generateConceptMap();
```

### Data Management

#### Bulk Upload
```typescript
const result = await fhirService.processBulkUpload(mappings);
// Returns: { bundle: FHIRBundle, downloadUrl: string }
```

#### Audit Logging
```typescript
const logs = await fhirService.getAuditLog(1, 20, {
  action: 'search',
  userId: 'user123'
});
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@namaste-sync.dev
- 🐛 **Issues**: [GitHub Issues](https://github.com/FallenDevil666/namaste-sync-33051/issues)
- 📖 **Documentation**: [Wiki](https://github.com/FallenDevil666/namaste-sync-33051/wiki)

## 🙏 Acknowledgments

- **Ministry of AYUSH** - Government of India
- **ICD-11** - World Health Organization
- **FHIR Community** - HL7 International
- **Open Source Community** - For the amazing tools and libraries

---

**Built with ❤️ for the advancement of traditional medicine interoperability**
