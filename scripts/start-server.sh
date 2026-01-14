#!/bin/bash
# Music Bingo Local Server Startup
#
# This script starts the Music Bingo API server bound to all network interfaces,
# making it accessible from other devices on the same WiFi network (e.g., phone scanner).

# Determine script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Get local IP address using Python (same method as the API uses)
LOCAL_IP=$(python3 -c "
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 80))
    print(s.getsockname()[0])
    s.close()
except Exception:
    print('localhost')
" 2>/dev/null || echo "localhost")

PORT=8000

echo ""
echo "======================================"
echo "  Music Bingo Server Starting..."
echo "======================================"
echo ""
echo "  Connect your phone scanner to:"
echo ""
echo "    http://${LOCAL_IP}:${PORT}"
echo ""
echo "  API docs available at:"
echo "    http://${LOCAL_IP}:${PORT}/docs"
echo ""
echo "  Network info endpoint:"
echo "    http://${LOCAL_IP}:${PORT}/api/network/info"
echo ""
echo "======================================"
echo ""
echo "  Press Ctrl+C to stop the server"
echo ""

# Change to project root (where musicbingo_api module is importable)
cd "$PROJECT_ROOT"

# Start server bound to all interfaces (0.0.0.0)
# --reload enables auto-restart on code changes (useful during development)
python3 -m uvicorn musicbingo_api.main:app --host 0.0.0.0 --port $PORT --reload
