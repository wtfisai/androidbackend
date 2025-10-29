const config = require('../config');

const requestCounts = new Map();
const MAX_ENTRIES = 10000; // Maximum number of IPs to track

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const { windowMs, maxRequests } = config.rateLimit;

  // If we're approaching the limit, do aggressive cleanup
  if (requestCounts.size >= MAX_ENTRIES * 0.9) {
    cleanupExpiredEntries(now);
  }

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return next();
  }

  const requestData = requestCounts.get(ip);

  if (now > requestData.resetTime) {
    requestData.count = 1;
    requestData.resetTime = now + windowMs;
  } else {
    requestData.count++;
    if (requestData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
  }

  next();
};

// Helper function to clean up expired entries
function cleanupExpiredEntries(now) {
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  cleanupExpiredEntries(now);
  
  // If still too many entries, remove oldest ones
  if (requestCounts.size > MAX_ENTRIES) {
    const entries = Array.from(requestCounts.entries());
    entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
    
    const toRemove = entries.slice(0, requestCounts.size - MAX_ENTRIES);
    toRemove.forEach(([ip]) => requestCounts.delete(ip));
  }
}, 60000); // Clean every minute

module.exports = { rateLimit };
