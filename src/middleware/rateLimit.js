const config = require('../config');

// Use a more memory-efficient approach with automatic cleanup
class RateLimiter {
  constructor() {
    this.requestCounts = new Map();
    this.maxEntries = 10000; // Prevent unbounded growth
    this.cleanupInterval = null;
    this.startCleanup();
  }

  startCleanup() {
    // Clean up every 30 seconds instead of 60
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  cleanup() {
    const now = Date.now();
    const { windowMs } = config.rateLimit;
    
    // If we have too many entries, do aggressive cleanup
    if (this.requestCounts.size > this.maxEntries) {
      console.warn(`Rate limiter has ${this.requestCounts.size} entries, performing aggressive cleanup`);
      
      // Remove all expired entries and oldest 20% of active entries
      const entries = Array.from(this.requestCounts.entries());
      const expiredCount = entries.filter(([ip, data]) => now > data.resetTime).length;
      const toRemove = Math.max(expiredCount, Math.floor(this.requestCounts.size * 0.2));
      
      // Sort by reset time and remove oldest entries
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.requestCounts.delete(entries[i][0]);
      }
    } else {
      // Normal cleanup - only remove expired entries
      for (const [ip, data] of this.requestCounts.entries()) {
        if (now > data.resetTime) {
          this.requestCounts.delete(ip);
        }
      }
    }
  }

  checkLimit(ip) {
    const now = Date.now();
    const { windowMs, maxRequests } = config.rateLimit;

    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const requestData = this.requestCounts.get(ip);

    if (now > requestData.resetTime) {
      // Reset the window
      requestData.count = 1;
      requestData.resetTime = now + windowMs;
      requestData.firstRequest = now;
      return { allowed: true, remaining: maxRequests - 1 };
    } else {
      requestData.count++;
      if (requestData.count > maxRequests) {
        return {
          allowed: false,
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
          remaining: 0
        };
      }
      return { allowed: true, remaining: maxRequests - requestData.count };
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requestCounts.clear();
  }
}

// Create a single instance
const rateLimiter = new RateLimiter();

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const result = rateLimiter.checkLimit(ip);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
      remaining: result.remaining
    });
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': config.rateLimit.maxRequests,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': new Date(Date.now() + (config.rateLimit.windowMs)).toISOString()
  });

  next();
};

// Graceful shutdown
process.on('SIGTERM', () => rateLimiter.destroy());
process.on('SIGINT', () => rateLimiter.destroy());

module.exports = { rateLimit };
