# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js Express API backend designed to run on an Android device using Termux. The project is configured as a simple REST API server.

## Commands

### Development

- `npm start` - Start the server (runs server.js)
- `npm run dev` - Start the server in development mode (same as npm start currently)
- `npm install` - Install dependencies

## Architecture

This is a basic Express.js API backend with the following key dependencies:

- **express**: Web framework for handling HTTP requests
- **cors**: Middleware for handling Cross-Origin Resource Sharing
- **body-parser**: Middleware for parsing request bodies
- **dotenv**: Environment variable management

## Important Notes

- The project runs in a Termux environment on Android (path: /data/data/com.termux/files/home/)
- Main entry point is `server.js` (needs to be created if not present)
- No test framework is currently configured
- No linting or type checking is set up
