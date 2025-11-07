// ===========================================
// NAMASTE-SYNC Health Check System
// ===========================================
// Comprehensive health monitoring for application,
// database, external services, and system resources

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';

// Health check interfaces
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  duration: number;
  details?: any;
  error?: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  details?: any;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  system: {
    memory: MemoryUsage;
    cpu: CpuUsage;
    disk: DiskUsage;
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface CpuUsage {
  usage: number;
  loadAverage: number[];
}

interface DiskUsage {
  used: number;
  total: number;
  percentage: number;
}

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 5000, // 5 seconds
  retries: 3,
  intervals: {
    database: 30000, // 30 seconds
    redis: 30000,
    external: 60000, // 1 minute
    system: 10000, // 10 seconds
  },
  thresholds: {
    memory: 80, // 80% memory usage warning
    cpu: 70, // 70% CPU usage warning
    disk: 85, // 85% disk usage warning
    responseTime: 1000, // 1 second response time warning
    errorRate: 5, // 5% error rate warning
  },
};

// Metrics storage
class HealthMetrics {
  private metrics = {
    totalRequests: 0,
    errorCount: 0,
    responseTimes: [] as number[],
    lastReset: Date.now(),
  };

  recordRequest(responseTime: number, isError: boolean = false) {
    this.metrics.totalRequests++;
    if (isError) {
      this.metrics.errorCount++;
    }
    this.metrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }

    // Reset metrics every hour
    if (Date.now() - this.metrics.lastReset > 3600000) {
      this.reset();
    }
  }

  getMetrics() {
    const averageResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    const errorRate = this.metrics.totalRequests > 0
      ? (this.metrics.errorCount / this.metrics.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      errorCount: this.metrics.errorCount,
      errorRate,
      averageResponseTime,
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      errorCount: 0,
      responseTimes: [],
      lastReset: Date.now(),
    };
  }
}

const healthMetrics = new HealthMetrics();

// Database health check
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: performance.now() - startTime,
        error: `MongoDB connection state: ${mongoose.connection.readyState}`,
      };
    }

    // Execute a simple query to test connectivity
    await mongoose.connection.db.admin().ping();

    // Check database stats
    const stats = await mongoose.connection.db.stats();

    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: {
        connectionState: mongoose.connection.readyState,
        database: mongoose.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// Redis health check
async function checkRedisHealth(redisClient?: Redis): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    if (!redisClient) {
      return {
        status: 'degraded',
        timestamp: new Date(),
        duration: performance.now() - startTime,
        error: 'Redis client not configured',
      };
    }

    // Test Redis connectivity
    const pong = await redisClient.ping();

    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    // Get Redis info
    const info = await redisClient.info('memory');
    const memoryInfo = parseRedisInfo(info);

    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: {
        connected: true,
        memory: memoryInfo.memory,
        usedMemory: memoryInfo.used_memory,
        maxMemory: memoryInfo.maxmemory,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

// External service health checks
async function checkExternalServicesHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const services = [];

  try {
    // Check Supabase (if configured)
    if (process.env.VITE_SUPABASE_URL) {
      const supabaseHealth = await checkSupabaseHealth();
      services.push({ name: 'supabase', ...supabaseHealth });
    }

    // Check external APIs (add more as needed)
    const externalApiHealth = await checkExternalApiHealth();
    services.push({ name: 'external_api', ...externalApiHealth });

    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: { services },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown external services error',
    };
  }
}

// Check Supabase health
async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Simple health check - adjust based on your Supabase setup
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: {
        url: supabaseUrl,
        status: response.status,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown Supabase error',
    };
  }
}

// Check external API health
async function checkExternalApiHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    // Add your external API health checks here
    // This is a placeholder for demonstration

    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: {
        message: 'No external APIs configured',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown external API error',
    };
  }
}

// System resource health check
function getSystemHealth(): HealthCheckResult {
  const startTime = performance.now();

  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = require('os').loadavg();

    const memory: MemoryUsage = {
      used: memUsage.rss,
      total: require('os').totalmem(),
      percentage: (memUsage.rss / require('os').totalmem()) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    };

    const cpu: CpuUsage = {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to milliseconds
      loadAverage: loadAvg,
    };

    // Determine overall status based on thresholds
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (memory.percentage > HEALTH_CHECK_CONFIG.thresholds.memory) {
      status = 'degraded';
    }

    if (cpu.loadAverage[0] > HEALTH_CHECK_CONFIG.thresholds.cpu) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      duration: performance.now() - startTime,
      details: { memory, cpu },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown system error',
    };
  }
}

// Parse Redis INFO response
function parseRedisInfo(info: string): any {
  const lines = info.split('\r\n');
  const result: any = {};

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      result[key] = value;
    }
  }

  return result;
}

// Health check controller
export class HealthCheckController {
  private redisClient?: Redis;

  constructor(redisClient?: Redis) {
    this.redisClient = redisClient;
  }

  // Basic health check endpoint
  async basicHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = performance.now();

      // Simple application health check
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: performance.now() - startTime,
      };

      res.status(200).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Readiness probe (for Kubernetes)
  async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = performance.now();
      const checks = [];

      // Check database connectivity
      const dbHealth = await checkDatabaseHealth();
      checks.push({ name: 'database', ...dbHealth });

      // Check Redis connectivity
      const redisHealth = await checkRedisHealth(this.redisClient);
      checks.push({ name: 'redis', ...redisHealth });

      // Determine overall readiness
      const unhealthyChecks = checks.filter(c => c.status === 'unhealthy');
      const isReady = unhealthyChecks.length === 0;

      const response = {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date(),
        checks,
        responseTime: performance.now() - startTime,
      };

      res.status(isReady ? 200 : 503).json(response);
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Liveness probe (for Kubernetes)
  async livenessCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = performance.now();

      // Simple liveness check - is the process responsive?
      const isAlive = process.uptime() > 0;

      const response = {
        status: isAlive ? 'alive' : 'not_alive',
        timestamp: new Date(),
        uptime: process.uptime(),
        responseTime: performance.now() - startTime,
      };

      res.status(isAlive ? 200 : 503).json(response);
    } catch (error) {
      res.status(503).json({
        status: 'not_alive',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Comprehensive health check
  async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = performance.now();
      const services: ServiceHealth[] = [];

      // Database health
      const dbHealth = await checkDatabaseHealth();
      services.push({
        name: 'database',
        status: dbHealth.status,
        responseTime: dbHealth.duration,
        lastCheck: dbHealth.timestamp,
        details: dbHealth.details,
        error: dbHealth.error,
      });

      // Redis health
      const redisHealth = await checkRedisHealth(this.redisClient);
      services.push({
        name: 'redis',
        status: redisHealth.status,
        responseTime: redisHealth.duration,
        lastCheck: redisHealth.timestamp,
        details: redisHealth.details,
        error: redisHealth.error,
      });

      // External services health
      const externalHealth = await checkExternalServicesHealth();
      services.push({
        name: 'external_services',
        status: externalHealth.status,
        responseTime: externalHealth.duration,
        lastCheck: externalHealth.timestamp,
        details: externalHealth.details,
        error: externalHealth.error,
      });

      // System health
      const systemHealth = getSystemHealth();
      services.push({
        name: 'system',
        status: systemHealth.status,
        responseTime: systemHealth.duration,
        lastCheck: systemHealth.timestamp,
        details: systemHealth.details,
        error: systemHealth.error,
      });

      // Determine overall status
      const unhealthyServices = services.filter(s => s.status === 'unhealthy');
      const degradedServices = services.filter(s => s.status === 'degraded');

      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (unhealthyServices.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      // Get application metrics
      const metrics = healthMetrics.getMetrics();

      const systemHealthReport: SystemHealth = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services,
        system: systemHealth.details || {
          memory: { used: 0, total: 0, percentage: 0, heapUsed: 0, heapTotal: 0, external: 0 },
          cpu: { usage: 0, loadAverage: [0, 0, 0] },
          disk: { used: 0, total: 0, percentage: 0 },
        },
        metrics,
      };

      const statusCode = overallStatus === 'healthy' ? 200 :
                        overallStatus === 'degraded' ? 200 : 503;

      res.status(statusCode).json(systemHealthReport);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Metrics endpoint for monitoring
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = healthMetrics.getMetrics();
      const systemMetrics = getSystemHealth();

      const response = {
        timestamp: new Date(),
        application: metrics,
        system: systemMetrics.details,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Middleware to record request metrics
export function healthMetricsMiddleware(req: Request, res: Response, next: any) {
  const startTime = performance.now();

  res.on('finish', () => {
    const responseTime = performance.now() - startTime;
    const isError = res.statusCode >= 400;
    healthMetrics.recordRequest(responseTime, isError);
  });

  next();
}

// Export health metrics instance for use in other parts of the application
export { healthMetrics };

// Export singleton instance
export const healthCheckController = new HealthCheckController();