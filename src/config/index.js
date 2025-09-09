const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || (() => {
    // Generate a secure random API key if none provided
    const crypto = require('crypto');
    const randomKey = crypto.randomBytes(32).toString('hex');
    console.warn(`⚠️  WARNING: No API_KEY environment variable set. Using generated key: ${randomKey}`);
    console.warn(`⚠️  Set API_KEY environment variable for production use!`);
    return randomKey;
  })(),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
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
