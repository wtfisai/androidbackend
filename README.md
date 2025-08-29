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

## Requirements

- Android device with Termux
- Node.js 18+ 
- Network connection

## License

MIT

## Contributing

Pull requests are welcome! Please read the contributing guidelines first.

## Support

For issues or questions, please open an issue on GitHub.