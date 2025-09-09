const config = require('../config');

const requestCounts = new Map();
const MAX_ENTRIES = 10000; // Prevent memory exhaustion
let lastCleanup = Date.now();

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const { windowMs, maxRequests } = config.rateLimit;

  // Perform cleanup more frequently and with bounds checking
  if (now - lastCleanup > 30000 || requestCounts.size > MAX_ENTRIES) {
    cleanupExpiredEntries(now);
    lastCleanup = now;
  }

  if (!requestCounts.has(ip)) {
    // If we're at capacity, reject the request to prevent memory exhaustion
    if (requestCounts.size >= MAX_ENTRIES) {
      return res.status(429).json({
        error: 'Rate limiter at capacity',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
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

// More efficient cleanup function
function cleanupExpiredEntries(now) {
  const entriesToDelete = [];
  
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      entriesToDelete.push(ip);
    }
  }
  
  // Delete expired entries
  entriesToDelete.forEach(ip => requestCounts.delete(ip));
  
  console.log(`Rate limiter cleanup: removed ${entriesToDelete.length} expired entries, ${requestCounts.size} remaining`);
}

// Clean up old entries periodically as fallback
setInterval(() => {
  cleanupExpiredEntries(Date.now());
}, 60000); // Clean every minute as fallback

module.exports = { rateLimit };
