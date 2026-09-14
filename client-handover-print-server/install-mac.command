#!/bin/bash

# Force the script to load your terminal profile so it finds NVM (Node Version Manager)
source ~/.zshrc 2>/dev/null || true
source ~/.bash_profile 2>/dev/null || true
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")"

echo "☕ Installing Dream Bean Cafe Print Server..."
echo "-------------------------------------------"

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed on this Mac."
    echo "Please download and install Node.js from https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_PATH=$(which node)
echo "📦 Installing required dependencies using Node at $NODE_PATH..."
npm install

PLIST_PATH="$HOME/Library/LaunchAgents/com.dreambeancafe.printdaemon.plist"
mkdir -p "$HOME/Library/LaunchAgents"

echo "⚙️  Configuring background service..."
cat << XML_EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dreambeancafe.printdaemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PWD/print-daemon.mjs</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>$PWD</string>
    <key>StandardErrorPath</key>
    <string>/tmp/dbc-print.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/dbc-print.out</string>
</dict>
</plist>
XML_EOF

launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "✅ Success! The Print Daemon is now running permanently in the background."
echo "You can now close this window."
read -p "Press Enter to exit..."
