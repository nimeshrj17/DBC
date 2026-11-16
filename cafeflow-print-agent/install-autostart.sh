#!/bin/bash
# Starts the print agent automatically when you log in to this Mac, and restarts it if it stops.
# Run once on the cafe Mac:  bash install-autostart.sh      Undo:  bash install-autostart.sh remove
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.cafeflow.printagent.plist"
if [ "$1" = "remove" ]; then launchctl unload "$PLIST" 2>/dev/null || true; rm -f "$PLIST"; echo "Removed."; exit 0; fi
NODE="$(command -v node)"; [ -n "$NODE" ] || { echo "Node.js not found"; exit 1; }
[ -d "$DIR/node_modules" ] || (cd "$DIR" && npm install --silent)
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.cafeflow.printagent</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$DIR/server.js</string></array>
  <key>WorkingDirectory</key><string>$DIR</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$DIR/agent.log</string>
  <key>StandardErrorPath</key><string>$DIR/agent.log</string>
</dict></plist>
PL
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed. The agent now starts at login. Log: $DIR/agent.log"
