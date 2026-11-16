#!/bin/bash
# Read-only check of the KOT printing setup. Run on the cafe Mac:  bash diagnose.sh
HOST="$(node -e "try{console.log(require('./printer.json').host)}catch(e){}" 2>/dev/null)"
HOST="${PRINTER_HOST:-$HOST}"

echo "== Print agent (this Mac, port 5050)"
if curl -s -m 3 http://127.0.0.1:5050/status; then echo; else echo "NOT RUNNING. Start it:  node server.js"; fi

echo; echo "== Printer address from printer.json: ${HOST:-none set}"
if [ -n "$HOST" ]; then
  nc -z -G 3 "$HOST" 9100 && echo "$HOST:9100 reachable" || echo "$HOST:9100 NOT reachable (wrong IP, printer off, or different Wi-Fi)"
fi

echo; echo "== Mac print queue (only used when printer.json has no host)"
lpstat -v 2>&1 | head -5
echo "-- jobs stuck in the queue:"; lpstat -o 2>&1 | head -5; [ -z "$(lpstat -o 2>/dev/null)" ] && echo "none"

echo; echo "== This Mac's address"; ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1
