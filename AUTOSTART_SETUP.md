# Auto-Start Setup for Android Boot

## Method 1: Termux:Boot (Recommended)

### Install Termux:Boot
1. **Install from F-Droid**:
   - Open F-Droid app
   - Search for "Termux:Boot"
   - Install it

2. **Grant Permission**:
   - Open Android Settings
   - Go to Apps > Termux:Boot
   - Enable "Allow app to run at startup"

3. **Enable the service** (already configured):
   ```bash
   # The boot script is already created at:
   ~/.termux/boot/start-diagnostic-api.sh
   ```

### The server will now start automatically when Android boots!

## Method 2: Using Termux-services (for Termux session)

Enable the service:
```bash
sv-enable diagnostic-api
```

Check service status:
```bash
sv status diagnostic-api
```

Start/stop manually:
```bash
sv up diagnostic-api    # Start
sv down diagnostic-api  # Stop
```

## Method 3: Add to .bashrc (starts with Termux)

```bash
echo '
# Auto-start Diagnostic API
if ! pgrep -f "node server.js" > /dev/null; then
    cd ~/project && nohup npm start > ~/diagnostic-api.log 2>&1 &
fi
' >> ~/.bashrc
```

## Method 4: Using Tasker (Advanced)

If you have Tasker installed:
1. Create a new Profile: Event > System > Device Boot
2. Add Task: Plugin > Termux > Run Command
3. Command: `cd ~/project && npm start`

## Quick Management Commands

### Check if running:
```bash
pgrep -f "node server.js"
```

### View logs:
```bash
tail -f ~/diagnostic-api.log
```

### Stop the server:
```bash
pkill -f "node server.js"
```

### Manual start:
```bash
cd ~/project && npm start
```

## Verify Auto-start is Working

After setting up Termux:Boot:
1. Restart your Android device
2. Wait 30 seconds after boot
3. Open any browser
4. Go to: http://localhost:3000
5. The dashboard should be available!

## Important Notes

- **Battery Optimization**: Make sure Termux and Termux:Boot are excluded from battery optimization
- **Storage Permission**: Termux:Boot needs storage permission
- **Network Ready**: The boot script waits 10 seconds for network to be ready
- **API Key**: The key remains the same across restarts

## Troubleshooting

If server doesn't start on boot:

1. **Check Termux:Boot permissions**:
   - Settings > Apps > Special app access > Autostart
   - Enable for Termux:Boot

2. **Check boot script exists**:
   ```bash
   ls -la ~/.termux/boot/
   ```

3. **Test boot script manually**:
   ```bash
   ~/.termux/boot/start-diagnostic-api.sh
   ```

4. **Check logs after boot**:
   ```bash
   cat ~/diagnostic-api.log
   ```

## Current API Key
Your API key (saved in .env):
Check with: `grep API_KEY ~/project/.env`