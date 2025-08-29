# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Android Remote Diagnostic API - A REST API server for remotely monitoring and managing Android devices via Termux. The server provides system diagnostics, device information, package management, and remote command execution capabilities with a web dashboard.

## Commands

### Development
- `npm start` - Start the server (runs src/server.js on port 3000)
- `npm run dev` - Start with nodemon for auto-reload
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format all JS/JSON/MD files with Prettier
- `npm run format:check` - Check formatting without modifying files
- `npm test` - Run linting and format checks (no unit tests configured)

### Termux Service Management
- `sv-enable diagnostic-api` - Enable auto-start on boot
- `sv restart diagnostic-api` - Restart the service

## Architecture

### Core Structure
- **src/server.js** - Entry point, handles server startup and graceful shutdown
- **src/app.js** - Express app configuration, middleware setup, and route mounting
- **src/config/index.js** - Centralized configuration using environment variables

### Route Modules
- **routes/system.js** - System monitoring endpoints (CPU, memory, processes)
- **routes/device.js** - Device properties, battery status, network interfaces
- **routes/packages.js** - Package listing and management
- **routes/commands.js** - Shell and ADB command execution endpoints

### Middleware
- **middleware/auth.js** - API key authentication (header: x-api-key)
- **middleware/rateLimit.js** - Rate limiting (100 req/min per IP)
- **middleware/errorHandler.js** - Centralized error handling

### Key Dependencies
- **nedb** - Lightweight embedded database for data persistence
- **nodemon** - Development server with auto-reload (dev dependency)

## Important Configuration

### Environment Variables
- `API_KEY` - Authentication key (default: "diagnostic-api-key-2024")
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

### Security Features
- API key required for all `/api` endpoints except `/health` and `/api/info`
- Command whitelisting for ADB operations
- Dangerous shell commands blocked
- Rate limiting enforced globally

## Development Notes

- The server binds to `0.0.0.0` to allow remote connections
- Public static files served from `/public` directory
- Web dashboard available at root path `/`
- All API responses use JSON format
- Graceful shutdown handles SIGTERM and SIGINT signals
- commit CLAUDE.md to memory