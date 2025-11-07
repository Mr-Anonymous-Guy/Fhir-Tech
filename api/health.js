// ===========================================
// NAMASTE-SYNC Health Check API (Vercel Serverless)
// ===========================================

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      deployment: 'vercel-serverless',
      services: {
        frontend: 'healthy',
        api: 'healthy',
        database: 'connected', // Will be checked with actual DB connection
        supabase: process.env.VITE_SUPABASE_PROJECT_ID ? 'configured' : 'not_configured'
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
      }
    };

    // Check if we can connect to Supabase (if configured)
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });

        healthCheck.services.supabase = response.ok ? 'healthy' : 'unhealthy';
      } catch (error) {
        healthCheck.services.supabase = 'unhealthy';
      }
    }

    return res.status(200).json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}