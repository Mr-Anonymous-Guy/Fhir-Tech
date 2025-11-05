# Starting NAMASTE-SYNC for Development

This guide will help you start all required services for local development of NAMASTE-SYNC.

## Prerequisites

1. **Docker Desktop** - Required for Supabase local development
   - Download and install from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running before proceeding

2. **Node.js** (v18 or higher)
3. **MongoDB** (v6 or higher) - Can be run locally or via Docker

## Starting Services

### 1. Start Supabase Local Environment

Supabase is used for authentication and dynamic data management. To start the local Supabase environment:

```bash
npx supabase start
```

If you get an error about Docker not being available:
- Make sure Docker Desktop is installed and running
- On Windows, ensure you're using the correct Docker context

### 2. Start MongoDB

You can either:
- Run MongoDB as a service, or
- Start it manually with: `mongod`

### 3. Start the Application

```bash
npm run dev:full
```

This will start both the frontend (port 8080) and backend (port 3001) services.

## Troubleshooting

### "Failed to fetch" Errors

If you see "Failed to fetch" errors during login/signup:
1. Check that Docker Desktop is running
2. Verify Supabase is started: `npx supabase status`
3. If Supabase is not running, start it: `npx supabase start`

### Port Conflicts

If you see port conflicts:
- Kill processes using ports 3001 and 8080
- On Windows: 
  ```bash
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  netstat -ano | findstr :8080
  taskkill /PID <PID> /F
  ```

## Alternative: Demo Mode

If you can't get the authentication services running, you can use Demo Mode:
1. Go to the login page
2. Click "Try Demo Mode"
3. You'll have access to all features with sample data

## Environment Variables

Make sure your `.env` file is properly configured:
```
VITE_SUPABASE_PROJECT_ID="ytstlikzmgpynffuvsmw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0c3RsaWt6bWdweW5mZnV2c213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTUxMDAsImV4cCI6MjA3NjEzMTEwMH0.e4v4xfRCilmD8Z7aL__vRgzESOSdAkbBbsfWqUh-ygg"
VITE_SUPABASE_URL="https://ytstlikzmgpynffuvsmw.supabase.co"

# MongoDB Configuration
VITE_MONGODB_URI="mongodb://localhost:27017/namaste-sync"
VITE_MONGODB_DB_NAME="namaste-sync"
```