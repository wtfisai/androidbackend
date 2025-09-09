const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || 'diagnostic-api-key-2024',
  nodeEnv: process.env.NODE_ENV || 'development',
  // If ALLOWED_ORIGINS is not defined we default to '*', otherwise we split the comma-separated list.
  // Express-CORS treats the string '*' as a proper wildcard, but *not* an array containing it.
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*',
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  },
  adb: {
    safeCommands: [
      'devices',
      'get-state',
      'get-serialno',
      'shell getprop',
      'shell dumpsys battery',
      'shell dumpsys meminfo',
      'shell dumpsys cpuinfo',
      'shell dumpsys wifi',
      'shell pm list packages',
      'shell settings list',
      'logcat -d -t 100'
    ]
  },
  shell: {
    dangerousPatterns: [/rm\s+-rf/, /mkfs/, /dd\s+if=/, /format/, />\/dev\//, /sudo/, /su\s/],
    timeout: 30000,
    maxBuffer: 1024 * 1024
  }
};

module.exports = config;
