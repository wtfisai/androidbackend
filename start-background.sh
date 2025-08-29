#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
nohup npm start > server.log 2>&1 &
echo "Server started in background with PID: $!"
echo "Check server.log for output"
