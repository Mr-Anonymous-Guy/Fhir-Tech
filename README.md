
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

## Color Reference

| Color             | Hex                                                                |
| ----------------- | ------------------------------------------------------------------ |
| Example Color | ![#0a192f](https://via.placeholder.com/10/0a192f?text=+) #0a192f |
| Example Color | ![#f8f8f8](https://via.placeholder.com/10/f8f8f8?text=+) #f8f8f8 |
| Example Color | ![#00b48a](https://via.placeholder.com/10/00b48a?text=+) #00b48a |
| Example Color | ![#00d1a0](https://via.placeholder.com/10/00b48a?text=+) #00d1a0 |


## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.


## Demo

Insert gif or link to demo


## Deployment

To deploy this project run

```bash
  npm run deploy
```


## Documentation

[Documentation](https://linktodocumentation)


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`API_KEY`

`ANOTHER_API_KEY`


## Used By

This project is used by the following companies:

- Company 1
- Company 2


# Project Title

A brief description of what this project does and who it's for

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
     
## Tech Stack

**Client:** React, Redux, TailwindCSS

**Server:** Node, Express


## Screenshots

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)


## Roadmap

- Additional browser support

- Add more integrations


## Optimizations

What optimizations did you make in your code? E.g. refactors, performance improvements, accessibility


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Installation

Install my-project with npm

```bash
  npm install my-project
  cd my-project
```
    
## Other Common Github Profile Sections
👩‍💻 I'm currently working on...

🧠 I'm currently learning...

👯‍♀️ I'm looking to collaborate on...

🤔 I'm looking for help with...

💬 Ask me about...

📫 How to reach me...

😄 Pronouns...

⚡️ Fun fact...


## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://katherineoelsner.com/)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/)
[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/)


# Hi, I'm Katherine! 👋


## 🚀 About Me
I'm a full stack developer...


## Feedback

If you have any feedback, please reach out to us at fake@fake.com


## Features

- Light/dark mode toggle
- Live previews
- Fullscreen mode
- Cross platform


## FAQ

#### Question 1

Answer 1

#### Question 2

Answer 2


## Usage/Examples

```javascript
import Component from 'my-project'

function App() {
  return <Component />
}
```


## Running Tests

To run tests, run the following command

```bash
  npm run test
```


## Support

For support, email fake@fake.com or join our Slack channel.


## Run Locally

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```


![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png)


## 🛠 Skills
Javascript, HTML, CSS...


## Lessons Learned

What did you learn while building this project? What challenges did you face and how did you overcome them?

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