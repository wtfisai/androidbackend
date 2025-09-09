const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const execAsync = promisify(exec);

// ADB command execution endpoint
router.post(
  '/adb/execute',
  authenticate,
  asyncHandler(async (req, res) => {
    const { command, force } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Command is required'
      });
    }

    // Check if command is safe
    const isSafe = config.adb.safeCommands.some(
      (safeCmd) => command.startsWith(safeCmd) || command === safeCmd
    );

    if (!isSafe && !force) {
      return res.status(403).json({
        error: 'Command not in whitelist. Use force:true to override (dangerous!)',
        whitelisted: config.adb.safeCommands
      });
    }

    try {
      const { stdout, stderr } = await execAsync(`adb ${command}`, {
        maxBuffer: config.shell.maxBuffer,
        timeout: config.shell.timeout
      });

      res.json({
        output: stdout,
        stderr: stderr,
        command: command,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        stderr: error.stderr,
        command: command
      });
    }
  })
);

// Shell command execution endpoint
router.post(
  '/shell',
  authenticate,
  asyncHandler(async (req, res) => {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Command is required'
      });
    }

    // Check for dangerous patterns
    if (config.shell.dangerousPatterns.some((pattern) => pattern.test(command))) {
      return res.status(403).json({
        error: 'Potentially dangerous command blocked',
        reason: 'Command matches dangerous pattern'
      });
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: config.shell.timeout,
        maxBuffer: config.shell.maxBuffer
      });

      res.json({
        output: stdout,
        stderr: stderr,
        command: command,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        stderr: error.stderr || '',
        command: command
      });
    }
  })
);

// Logcat endpoint
router.get(
  '/logcat',
  authenticate,
  asyncHandler(async (req, res) => {
    const { lines = 100, filter = '' } = req.query;

    // Validate and sanitize input parameters
    const linesNum = parseInt(lines);
    if (!Number.isInteger(linesNum) || linesNum < 1 || linesNum > 10000) {
      return res.status(400).json({
        error: 'Invalid lines parameter',
        message: 'Lines must be an integer between 1 and 10000'
      });
    }

    // Sanitize filter parameter - only allow alphanumeric, spaces, and common logcat tags
    let sanitizedFilter = '';
    if (filter && typeof filter === 'string') {
      // Remove dangerous characters and limit length
      sanitizedFilter = filter
        .replace(/[^a-zA-Z0-9\s:_-]/g, '') // Only allow alphanumeric, spaces, colons, underscores, hyphens
        .substring(0, 100) // Limit length
        .trim();
    }

    // Build command safely
    let command = `logcat -d -t ${linesNum}`;
    if (sanitizedFilter) {
      // Use grep for filtering instead of direct logcat filter to avoid injection
      command += ` | grep -i "${sanitizedFilter}"`;
    }

    try {
      const { stdout } = await execAsync(command, {
        maxBuffer: 5 * 1024 * 1024,
        timeout: 30000 // Add timeout for safety
      });

      const logLines = stdout.split('\n').filter(line => line.trim());
      
      res.json({
        logs: logLines,
        count: logLines.length,
        filter: sanitizedFilter || 'none',
        lines: linesNum,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get logs',
        message: error.message
      });
    }
  })
);

module.exports = router;
