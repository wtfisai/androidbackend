# Android Backend - Remote Diagnostic API

A comprehensive REST API server for remotely monitoring and managing Android devices, designed to run on Termux.

## Features

- 🔍 **System Monitoring** - Real-time CPU, memory, battery, and network status
- 📱 **Device Information** - Android version, model, manufacturer details
- 🔧 **Remote Diagnostics** - Execute ADB and shell commands safely
- 📦 **Package Management** - View and inspect installed applications
- 💾 **Storage Monitoring** - Disk usage and filesystem information
- 📊 **Process Management** - View running processes and resource usage
- 🌐 **Web Dashboard** - Beautiful, responsive web interface
- 🔒 **Secure Access** - API key authentication and rate limiting

## Quick Start

### Installation

1. Install Termux from F-Droid
2. Clone this repository:

```bash
git clone https://github.com/yourusername/androidbackend.git
cd androidbackend
```

3. Run the installer:

```bash
chmod +x install.sh
./install.sh
```

4. Start the server:

```bash
npm start
```

### Access the Dashboard

- **Local (on Android):** http://localhost:3000
- **Remote (from network):** http://YOUR_DEVICE_IP:3000

Default API Key: `diagnostic-api-key-2024`

## API Endpoints

### Public Endpoints

- `GET /health` - Server health check
- `GET /api/info` - API information and key

### Authenticated Endpoints

All authenticated endpoints require `x-api-key` header.

- `GET /api/system` - System information
- `GET /api/device/properties` - Device properties
- `GET /api/device/battery` - Battery status
- `GET /api/device/network` - Network interfaces
- `GET /api/processes` - Running processes
- `GET /api/packages` - Installed packages
- `GET /api/storage` - Storage information
- `GET /api/logcat` - System logs
- `POST /api/shell` - Execute shell commands
- `POST /api/adb/execute` - Execute ADB commands

## Windows Client

Use the included PowerShell client for Windows:

```powershell
.\windows-client.ps1 -ServerUrl "http://DEVICE_IP:3000" -ApiKey "diagnostic-api-key-2024"
```

## Auto-Start Setup

### Method 1: Termux:Boot

1. Install Termux:Boot from F-Droid
2. Grant startup permission in Android settings
3. Server starts automatically on boot

### Method 2: Termux Services

```bash
sv-enable diagnostic-api
```

## Security

- API key authentication required for sensitive endpoints
- Command whitelisting for ADB operations
- Rate limiting (100 requests/minute per IP)
- Dangerous shell commands blocked

## Technologies

- Node.js & Express.js
- Bootstrap 5 (Web UI)
- Termux environment
- Android Debug Bridge (ADB)

## Docker Deployment

### Quick Start with Docker

```bash
# Build the image
docker build -t android-diagnostic-api .

# Run the container
docker run -d -p 3000:3000 --name android-api android-diagnostic-api

# Or use docker-compose
docker-compose up -d
```

### Docker Compose Setup

The project includes several Docker Compose configurations:

- `docker-compose.yml` - Production setup with Nginx and Redis
- `docker-compose.dev.yml` - Development setup with hot reload

```bash
# Production deployment
docker-compose up -d

# Development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables for Docker

Create a `.env` file for Docker deployment:

```env
API_KEY=your-secure-api-key
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com
```

### Docker Hub

Pull the pre-built image (when available):

```bash
docker pull yourusername/android-diagnostic-api:latest
```

### Kubernetes Deployment

For Kubernetes deployment, use the included manifests:

```bash
kubectl apply -f k8s/
```

## Requirements

### For Termux Installation

- Android device with Termux
- Node.js 18+
- Network connection

### For Docker

- Docker Engine 20.10+
- Docker Compose 2.0+ (optional)
- 512MB RAM minimum
- 100MB disk space

## License

MIT

## Contributing

Pull requests are welcome! Please read the contributing guidelines first.

## Support

For issues or questions, please open an issue on GitHub.
