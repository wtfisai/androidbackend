const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const { rateLimit } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const systemRoutes = require('./routes/system');
const deviceRoutes = require('./routes/device');
const commandRoutes = require('./routes/commands');
const packageRoutes = require('./routes/packages');

// Create Express app
const app = express();

// Middleware - CORS first to handle preflight requests
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key']
  })
);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimit);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: require('../package.json').version
  });
});

// API Info endpoint (no auth required)
app.get('/api/info', (req, res) => {
  res.json({
    message: 'Android Diagnostic API',
    version: require('../package.json').version,
    apiKey: config.apiKey,
    hint: 'Use this API key in the x-api-key header',
    dashboard: 'Access the web dashboard at /',
    documentation: 'https://github.com/wtfisai/androidbackend',
    endpoints: {
      health: 'GET /health',
      system: 'GET /api/system/*',
      device: 'GET /api/device/*',
      packages: 'GET /api/packages/*',
      commands: 'POST /api/shell, POST /api/adb/execute',
      logs: 'GET /api/logcat'
    }
  });
});

// Mount routes
app.use('/api', systemRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api', commandRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: ['/health', '/api/info']
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
