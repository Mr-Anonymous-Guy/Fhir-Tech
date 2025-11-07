# 🚀 Deploy NAMASTE-SYNC to Vercel

## One-Click Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/FallenDevil666/namaste-sync-33051&env=VITE_SUPABASE_PROJECT_ID,VITE_SUPABASE_PUBLISHABLE_KEY,VITE_SUPABASE_URL&envDescription=Required%20environment%20variables%20for%20NAMASTE-SYNC&envLink=https%3A%2F%2Fgithub.com%2FFallenDevil666%2Fnamaste-sync-33051%23environment-variables)

## Manual Vercel Deployment

### Prerequisites
- Vercel Account
- Supabase Project (for database)
- GitHub Repository

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Clone and Setup
```bash
git clone https://github.com/FallenDevil666/namaste-sync-33051.git
cd namaste-sync-33051
```

### Step 3: Configure Environment Variables
Create a `.env.local` file:
```bash
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
```

### Step 4: Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 5: Configure Environment Variables in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add the following variables:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `JWT_SECRET`

### Step 6: Redeploy
```bash
vercel --prod
```

## ✅ Deployment Complete!

Your NAMASTE-SYNC application is now live on Vercel with:
- ✅ Frontend hosted on Vercel Edge Network
- ✅ Serverless API functions
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom domain support
- ✅ Automatic deployments on git push

## Access Your Application
- **Main App**: `https://your-app.vercel.app`
- **Health Check**: `https://your-app.vercel.app/api/health`
- **API Docs**: `https://your-app.vercel.app/api`

## Features Enabled
- Serverless authentication
- FHIR terminology search
- Real-time data fetching
- Responsive design
- Dark/light theme
- Mobile optimized

## Support
For issues with Vercel deployment, check the [Vercel Documentation](https://vercel.com/docs).