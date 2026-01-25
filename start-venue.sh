#!/bin/bash
#
# Music Bingo - Venue Startup Script
# One-click startup for running music bingo at venues
#
# Usage: ./start-venue.sh
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Music Bingo - Venue Startup${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Warning: ngrok not installed. iOS camera won't work.${NC}"
    echo "Install with: brew install ngrok"
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start API server
echo -e "${GREEN}Starting API server...${NC}"
cd "$PROJECT_DIR/musicbingo_api"
uvicorn musicbingo_api.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!
sleep 2

# Start ngrok if available
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}Starting ngrok tunnel...${NC}"
    ngrok http 8000 --log=stdout > /dev/null &
    NGROK_PID=$!
    sleep 3

    # Get ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; tunnels=json.load(sys.stdin).get('tunnels',[]); https=[t for t in tunnels if t.get('public_url','').startswith('https')]; print(https[0]['public_url'] if https else '')" 2>/dev/null || echo "")

    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}ngrok URL: ${YELLOW}$NGROK_URL${NC}"
    else
        echo -e "${YELLOW}Could not get ngrok URL. Check http://localhost:4040${NC}"
    fi
fi

# Start host app
echo -e "${GREEN}Starting host app...${NC}"
cd "$PROJECT_DIR/musicbingo_host"
npm start &
HOST_PID=$!

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}All services started!${NC}"
echo ""
echo -e "Host App:  ${YELLOW}http://localhost:3000${NC}"
echo -e "API:       ${YELLOW}http://localhost:8000${NC}"
if [ -n "$NGROK_URL" ]; then
    echo -e "ngrok:     ${YELLOW}$NGROK_URL${NC}"
fi
echo ""
echo -e "The QR code in the host app will auto-detect ngrok."
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services."
echo -e "${BLUE}======================================${NC}"
echo ""

# Wait for any process to exit
wait
