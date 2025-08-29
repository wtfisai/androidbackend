#!/data/data/com.termux/files/usr/bin/bash

# Android Remote Diagnostic API - Installation Script
# For Termux on Android

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Android Remote Diagnostic API - Installation Script    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Update package lists
echo "📦 Updating package lists..."
pkg update -y

# Install required packages
echo "📦 Installing Node.js and npm..."
pkg install -y nodejs npm

echo "📦 Installing Android tools..."
pkg install -y android-tools

echo "📦 Installing network utilities..."
pkg install -y net-tools

echo "📦 Installing process utilities..."
pkg install -y procps

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate a random API key
    API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    sed -i "s/your-secure-api-key-here/$API_KEY/" .env
    
    echo ""
    echo "🔑 Generated API Key: $API_KEY"
    echo "   Save this key! You'll need it to connect from Windows."
    echo ""
fi

# Get device IP
echo "🌐 Network Information:"
echo "-------------------"
ip addr show wlan0 2>/dev/null | grep "inet " | awk '{print "WiFi IP: " $2}' | cut -d/ -f1
ip addr show rndis0 2>/dev/null | grep "inet " | awk '{print "USB Tethering IP: " $2}' | cut -d/ -f1
ip addr show rmnet_data0 2>/dev/null | grep "inet " | awk '{print "Mobile Data IP: " $2}' | cut -d/ -f1

# Create start script
echo "📝 Creating start script..."
cat > start-server.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
npm start
EOF
chmod +x start-server.sh

# Create background start script
cat > start-background.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
nohup npm start > server.log 2>&1 &
echo "Server started in background with PID: $!"
echo "Check server.log for output"
EOF
chmod +x start-background.sh

echo ""
echo "✅ Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the server: npm start"
echo "2. Or run in background: ./start-background.sh"
echo "3. Note your device's IP address above"
echo "4. On Windows, run the PowerShell client with:"
echo "   .\\windows-client.ps1 -ServerUrl \"http://YOUR_IP:3000\" -ApiKey \"$API_KEY\""
echo ""
echo "📖 See SETUP_GUIDE.md for detailed instructions"
echo ""

# Ask if user wants to start the server now
read -p "Start the server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting server..."
    npm start
fi