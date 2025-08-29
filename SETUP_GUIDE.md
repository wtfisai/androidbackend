# Android Remote Diagnostic API - Setup Guide

## Overview

This API server allows you to remotely monitor, diagnose, and control your Android device from Windows 11 or any other computer.

## Prerequisites on Android (Termux)

1. **Install Termux** from F-Droid (recommended) or GitHub
2. **Install required packages**:

```bash
pkg update && pkg upgrade
pkg install nodejs npm
pkg install android-tools  # For ADB support
pkg install net-tools      # For network utilities
```

3. **Enable ADB (if not already enabled)**:
   - Go to Settings > Developer Options
   - Enable "USB Debugging"
   - Enable "Wireless debugging" (Android 11+)

## Setup on Android

1. **Navigate to project directory**:

```bash
cd /data/data/com.termux/files/home/project
```

2. **Install Node dependencies**:

```bash
npm install
```

3. **Configure environment** (optional):

```bash
cp .env.example .env
nano .env  # Edit with your preferred settings
```

4. **Start the server**:

```bash
npm start
```

5. **Note the API key** displayed when server starts - you'll need this for Windows connection!

6. **Find your Android device IP**:

```bash
ip addr show wlan0
# Look for inet line, e.g., 192.168.1.100
```

## Setup on Windows 11

### Method 1: PowerShell Client (Recommended)

1. **Download the PowerShell client**:
   - Save `windows-client.ps1` to your Windows machine

2. **Open PowerShell as Administrator**:
   - Right-click PowerShell > Run as Administrator

3. **Allow script execution** (one-time setup):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

4. **Run the client**:

```powershell
.\windows-client.ps1 -ServerUrl "http://YOUR_ANDROID_IP:3000" -ApiKey "YOUR_API_KEY"
```

Example:

```powershell
.\windows-client.ps1 -ServerUrl "http://192.168.1.100:3000" -ApiKey "abc123..."
```

### Method 2: Direct API Calls

You can also use curl, Postman, or any HTTP client:

```bash
# Test connection
curl http://192.168.1.100:3000/health

# Get system info (with authentication)
curl -H "x-api-key: YOUR_API_KEY" http://192.168.1.100:3000/api/system

# Execute ADB command
curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" \
  -d '{"command":"devices"}' \
  http://192.168.1.100:3000/api/adb/execute
```

### Method 3: Web Browser Extension

Use a REST client browser extension like:

- Postman
- Thunder Client
- REST Client

Set header: `x-api-key: YOUR_API_KEY`

## Available API Endpoints

### Public Endpoints

- `GET /health` - Server health check

### Authenticated Endpoints (require x-api-key header)

#### System Information

- `GET /api/system` - System information (CPU, memory, network)
- `GET /api/device/properties` - Android device properties
- `GET /api/device/battery` - Battery status
- `GET /api/device/network` - Network interfaces

#### Process & Package Management

- `GET /api/processes` - List running processes
- `GET /api/packages` - List installed packages
- `GET /api/packages/:packageName` - Get package details

#### Storage & Logs

- `GET /api/storage` - Storage information
- `GET /api/logcat?lines=100&filter=TAG` - View logcat

#### Command Execution

- `POST /api/adb/execute` - Execute ADB commands

  ```json
  {
    "command": "shell getprop",
    "force": false
  }
  ```

- `POST /api/shell` - Execute shell commands (use with caution!)
  ```json
  {
    "command": "ls -la"
  }
  ```

## Security Considerations

1. **API Key**: Keep your API key secret. It's displayed only once when server starts.

2. **Network Security**:
   - Use only on trusted networks
   - Consider using VPN for remote access
   - For production, set up HTTPS with certificates

3. **Command Whitelisting**: The server whitelists safe ADB commands. Use `force: true` to bypass (dangerous!).

4. **Rate Limiting**: Server implements rate limiting (100 requests/minute per IP).

## Troubleshooting

### Cannot connect from Windows

1. **Check firewall on Android**:

```bash
# In Termux
iptables -L  # Check if port 3000 is blocked
```

2. **Verify server is running**:

```bash
# In Termux
netstat -tulpn | grep 3000
```

3. **Test local connection first**:

```bash
# On Android in Termux
curl http://localhost:3000/health
```

4. **Ensure devices are on same network**:
   - Both devices should be on same WiFi network
   - Check router doesn't isolate clients

### ADB commands not working

1. **Enable ADB debugging**:
   - Settings > Developer Options > USB Debugging

2. **For wireless ADB**:

```bash
# In Termux
adb kill-server
adb start-server
adb devices
```

3. **Grant Termux permissions**:
   - May need to accept ADB authorization prompt

### Server crashes

1. **Check logs**:

```bash
npm start 2>&1 | tee server.log
```

2. **Increase memory if needed**:

```bash
node --max-old-space-size=512 server.js
```

## Advanced Usage

### Running server in background

Using `nohup`:

```bash
nohup npm start > server.log 2>&1 &
```

Using `screen`:

```bash
screen -S android-api
npm start
# Detach: Ctrl+A, D
# Reattach: screen -r android-api
```

### Auto-start on boot

Create a Termux boot script:

```bash
mkdir -p ~/.termux/boot/
echo '#!/data/data/com.termux/files/usr/bin/sh
cd /data/data/com.termux/files/home/project
npm start > /data/data/com.termux/files/home/server.log 2>&1' > ~/.termux/boot/start-api.sh
chmod +x ~/.termux/boot/start-api.sh
```

### Setting up HTTPS

1. Generate self-signed certificate:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

2. Update server.js to use HTTPS (requires code modification).

## Support

For issues or questions:

1. Check server logs: `npm start 2>&1 | tee debug.log`
2. Verify all prerequisites are installed
3. Test with minimal configuration first
4. Ensure proper network connectivity
