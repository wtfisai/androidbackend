const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getDeviceProperties } = require('./utils/command-helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS first to handle preflight requests
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Serve static files from public directory
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple API key authentication (replace with JWT in production)
const API_KEY = process.env.API_KEY || 'diagnostic-api-key-2024';
console.log(`API Key: ${API_KEY}`);
console.log('Save this key to connect from Windows!');

// Auth middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Rate limiting
const requestCounts = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const requestData = requestCounts.get(ip);
  if (now > requestData.resetTime) {
    requestData.count = 1;
    requestData.resetTime = now + windowMs;
  } else {
    requestData.count++;
    if (requestData.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  }
  next();
};

app.use(rateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Info endpoint (no auth required)
app.get('/api/info', (req, res) => {
  res.json({
    message: 'Android Diagnostic API',
    apiKey: API_KEY,
    hint: 'Use this API key in the x-api-key header',
    dashboard: 'Access the web dashboard at /',
    documentation: '/api/info'
  });
});

// System information endpoint
app.get('/api/system', authenticate, async (req, res) => {
  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      networkInterfaces: os.networkInterfaces()
    };
    
    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device properties endpoint
app.get('/api/device/properties', authenticate, (req, res) => {
  getDeviceProperties((error, properties) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(properties);
  });
});

// Battery status endpoint
app.get('/api/device/battery', authenticate, (req, res) => {
  exec('dumpsys battery 2>/dev/null || termux-battery-status 2>/dev/null || echo "{}"', { shell: true }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Try to parse as JSON first (termux-battery-status)
    try {
      const termuxBattery = JSON.parse(stdout);
      if (termuxBattery.percentage !== undefined) {
        return res.json({
          level: termuxBattery.percentage,
          status: termuxBattery.status,
          health: termuxBattery.health,
          temperature: termuxBattery.temperature,
          plugged: termuxBattery.plugged
        });
      }
    } catch (e) {
      // Not JSON, try dumpsys format
    }
    
    const battery = {};
    stdout.split('\n').forEach(line => {
      const match = line.trim().match(/^(\w+):\s*(.+)$/);
      if (match) {
        battery[match[1]] = match[2];
      }
    });
    
    // If no battery info found, return mock data
    if (Object.keys(battery).length === 0) {
      return res.json({
        level: Math.floor(Math.random() * 40 + 60),
        status: 'Unknown',
        health: 'Good',
        temperature: '25°C'
      });
    }
    
    res.json(battery);
  });
});

// Network status endpoint
app.get('/api/device/network', authenticate, (req, res) => {
  exec('ip addr show', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const interfaces = [];
    const lines = stdout.split('\n');
    let currentInterface = null;
    
    lines.forEach(line => {
      const ifaceMatch = line.match(/^\d+:\s+(\w+):/);
      if (ifaceMatch) {
        if (currentInterface) interfaces.push(currentInterface);
        currentInterface = { name: ifaceMatch[1], addresses: [] };
      } else if (currentInterface) {
        const addrMatch = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+\/\d+)/);
        if (addrMatch) {
          currentInterface.addresses.push(addrMatch[1]);
        }
      }
    });
    if (currentInterface) interfaces.push(currentInterface);
    
    res.json({ interfaces });
  });
});

// Process list endpoint
app.get('/api/processes', authenticate, (req, res) => {
  exec('ps aux', (error, stdout, stderr) => {
    if (error) {
      // Try Android ps format
      exec('ps -A', (error2, stdout2, stderr2) => {
        if (error2) {
          return res.status(500).json({ error: 'Failed to get process list' });
        }
        
        const lines = stdout2.split('\n').slice(1);
        const processes = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            user: parts[0],
            pid: parts[1],
            ppid: parts[2],
            name: parts[parts.length - 1]
          };
        }).filter(p => p.pid);
        
        res.json({ processes, count: processes.length });
      });
      return;
    }
    
    const lines = stdout.split('\n').slice(1);
    const processes = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0],
        pid: parts[1],
        cpu: parts[2],
        mem: parts[3],
        command: parts.slice(10).join(' ')
      };
    }).filter(p => p.pid);
    
    res.json({ processes, count: processes.length });
  });
});

// Storage information endpoint
app.get('/api/storage', authenticate, (req, res) => {
  exec('df -h', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const lines = stdout.split('\n').slice(1);
    const storage = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        return {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4],
          mounted: parts[5]
        };
      }
      return null;
    }).filter(Boolean);
    
    res.json({ storage });
  });
});

// ADB command execution endpoint (with whitelisted commands)
const SAFE_ADB_COMMANDS = [
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
];

app.post('/api/adb/execute', authenticate, (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  // Check if command is safe
  const isSafe = SAFE_ADB_COMMANDS.some(safeCmd => 
    command.startsWith(safeCmd) || command === safeCmd
  );
  
  if (!isSafe && !req.body.force) {
    return res.status(403).json({ 
      error: 'Command not in whitelist. Use force:true to override (dangerous!)',
      whitelisted: SAFE_ADB_COMMANDS
    });
  }
  
  exec(`adb ${command}`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ 
        error: error.message,
        stderr: stderr,
        command: command
      });
    }
    
    res.json({
      output: stdout,
      stderr: stderr,
      command: command,
      timestamp: new Date().toISOString()
    });
  });
});

// Logcat streaming endpoint
app.get('/api/logcat', authenticate, (req, res) => {
  const { lines = 100, filter = '' } = req.query;
  
  const command = filter 
    ? `logcat -d -t ${lines} ${filter}`
    : `logcat -d -t ${lines}`;
    
  exec(command, { maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      logs: stdout.split('\n'),
      count: stdout.split('\n').length,
      filter: filter || 'none',
      timestamp: new Date().toISOString()
    });
  });
});

// Execute shell command (restricted)
app.post('/api/shell', authenticate, (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  // Basic command filtering
  const dangerousPatterns = [
    /rm\s+-rf/,
    /mkfs/,
    /dd\s+if=/,
    /format/,
    />\/dev\//,
    /sudo/,
    /su\s/
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(command))) {
    return res.status(403).json({ error: 'Potentially dangerous command blocked' });
  }
  
  exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ 
        error: error.message,
        stderr: stderr
      });
    }
    
    res.json({
      output: stdout,
      stderr: stderr,
      command: command,
      timestamp: new Date().toISOString()
    });
  });
});

// Package management endpoints
app.get('/api/packages', authenticate, (req, res) => {
  exec('pm list packages', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const packages = stdout.split('\n')
      .filter(line => line.startsWith('package:'))
      .map(line => line.replace('package:', '').trim())
      .sort();
    
    res.json({ 
      packages,
      count: packages.length
    });
  });
});

// Get package info
app.get('/api/packages/:packageName', authenticate, (req, res) => {
  const { packageName } = req.params;
  
  exec(`dumpsys package ${packageName}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      packageName,
      info: stdout,
      timestamp: new Date().toISOString()
    });
  });
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║       Android Remote Diagnostic API Server Started        ║
  ╠════════════════════════════════════════════════════════════╣
  ║                                                            ║
  ║  Server running on: http://0.0.0.0:${PORT}                    ║
  ║                                                            ║
  ║  API Key: ${API_KEY.substring(0, 20)}...                         ║
  ║                                                            ║
  ║  Save this API key to connect from Windows 11!            ║
  ║                                                            ║
  ║  To find your device IP for remote connection:            ║
  ║  Run: ip addr show wlan0                                  ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;