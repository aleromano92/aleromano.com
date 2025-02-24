#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored output
status() {
    echo -e "${GREEN}[+]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[!]${NC} $1"
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root (sudo ./install.sh)"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    status "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    status "Node.js installed: $(node -v)"
else
    status "Node.js is already installed: $(node -v)"
fi

# Get Telegram bot token
read -p "Enter your Telegram bot token: " TELEGRAM_BOT_TOKEN
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    error "Telegram bot token cannot be empty"
    exit 1
fi

# Get Telegram chat ID
read -p "Enter your Telegram chat ID: " TELEGRAM_CHAT_ID
if [ -z "$TELEGRAM_CHAT_ID" ]; then
    error "Telegram chat ID cannot be empty"
    exit 1
fi

# Set up log file
LOG_FILE="/var/log/observability.log"
status "Setting up log file at $LOG_FILE"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Determine the location of the monitor script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/monitor.js"

# Set proper ownership for the log file
status "Setting proper permissions for log file"
chown deploy:deploy "$LOG_FILE"
status "Log file permissions set"

# Make the script executable
status "Making the monitor script executable"
chmod +x "$MONITOR_SCRIPT"
status "Monitor script is now executable"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/observability.service"
status "Creating systemd service file at $SERVICE_FILE"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=VPS Observability Daemon
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
Group=docker
ExecStart=$(which node) $MONITOR_SCRIPT
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
Environment=TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

[Install]
WantedBy=multi-user.target
EOF

# Set permissions for the service file
chmod 644 "$SERVICE_FILE"
status "Service file created"

# Reload systemd, enable and start the service
status "Reloading systemd daemon"
systemctl daemon-reload

status "Enabling observability service to start on boot"
systemctl enable observability

status "Starting observability service"
systemctl start observability

# Check if service is running
sleep 3
if systemctl is-active --quiet observability; then
    status "Observability daemon is now running!"
    status "You can check its status with: sudo systemctl status observability"
    status "View logs with: sudo tail -f $LOG_FILE"
    
    # Send a test notification
    status "Sending test notification to Telegram..."
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d parse_mode="HTML" \
        -d text="🚀 <b>VPS Monitoring Started</b>

Monitoring:
- Docker containers
- Error logs
- Website availability

Installation completed successfully!"
    
    status "Setup complete! The observability daemon is now monitoring your VPS."
else
    error "Service failed to start. Check logs with: sudo journalctl -u observability -n 50"
fi 