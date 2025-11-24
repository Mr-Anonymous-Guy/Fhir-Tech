# NAMASTE-SYNC Project Documentation

## 📄 Project Overview
**NAMASTE-SYNC** is a specialized **Healthcare Terminology Mapping System** designed to facilitate the management and mapping of healthcare data standards, specifically focusing on **FHIR (Fast Healthcare Interoperability Resources) R4**. It provides a modern web interface for healthcare professionals to map medical terms between different coding systems securely and efficiently.

## 🛠️ Languages & Technologies

### Core Languages
- **TypeScript**: The primary language used for both Frontend and Backend, ensuring type safety and code quality.
- **JavaScript**: Used for build scripts and configuration files.
- **HTML5 & CSS3**: For structure and styling (via Tailwind CSS).

### Frontend Stack
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/) primitives.
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest).
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/).
- **Routing**: [React Router DOM](https://reactrouter.com/).

### Backend Stack
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using `mongoose` ODM).
- **Authentication**: JWT (JSON Web Tokens) and `bcryptjs` for password hashing.

### Infrastructure & Tools
- **Containerization**: Docker support (optional).
- **Cloud/BaaS**: Supabase client integration.
- **Linting**: ESLint.

## 📚 Key Terminologies

- **FHIR (Fast Healthcare Interoperability Resources)**: A standard for exchanging healthcare information electronically.
- **Terminology Mapping**: The process of linking concepts from one medical coding system to another (e.g., ICD-10 to SNOMED CT).
- **ODM (Object Data Modeling)**: Using Mongoose to model application data for MongoDB.
- **JWT (JSON Web Token)**: A compact, URL-safe means of representing claims to be transferred between two parties, used here for secure authentication.
- **SPA (Single Page Application)**: The architecture of the frontend where the page doesn't reload during use.

## ✨ Uniqueness & Key Features

1.  **Zero-Config Database Setup**:
    - Unlike traditional setups requiring manual database installation, this project features an **auto-managed MongoDB instance**. It automatically downloads and configures MongoDB binaries locally, making it "plug-and-play".

2.  **Local-First Architecture**:
    - Designed to store data locally (`mongodb-data` and `local-data` folders), ensuring data privacy and offline capability, which is critical in healthcare settings.

3.  **Hybrid Tech Approach**:
    - Combines a robust **Node.js/Express backend** with a modern **React/Vite frontend** in a single repository (Monorepo-like structure), streamlined with unified build scripts (e.g., `npm run dev:full`).

4.  **Healthcare-Specific Design**:
    - Tailored specifically for healthcare workflows, supporting complex data structures required by FHIR standards.
