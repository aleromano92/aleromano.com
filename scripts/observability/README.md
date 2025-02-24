# VPS Observability Daemon

A lightweight monitoring solution for your VPS that watches Docker containers, logs, and website availability, sending alerts via Telegram when issues are detected.

## Features

- **Docker Container Monitoring**: Detects stopped or unhealthy containers
- **Error Log Detection**: Scans Docker logs for errors, exceptions, and fatal messages
- **Website Health Checks**: Monitors website availability with response time tracking
- **Telegram Notifications**: Sends real-time alerts when issues are detected
- **Runs as a Daemon**: Operates continuously in the background as a systemd service

## Prerequisites

- Docker
- A Telegram bot token (create one via [@BotFather](https://t.me/botfather))
- Your Telegram chat ID (get it from [@userinfobot](https://t.me/userinfobot))

> Note: Node.js (v20 LTS) will be automatically installed by the installation script if it's not already present on your system.

## Installation

1. Make the installation script executable:

```sh
chmod +x scripts/observability/install.sh
```

2. Run the installation script as root:

```sh
sudo ./scripts/observability/install.sh
```

3. Follow the prompts to enter your Telegram bot token and chat ID.

The script will:
- Install Node.js if not already present
- Create a log file at `/var/log/observability.log` with proper permissions
- Make the monitoring script executable
- Create and configure a systemd service
- Start the monitoring daemon
- Send a test notification to your Telegram

## Configuration

You can customize the monitoring behavior by editing the `CONFIG` object in `scripts/observability/monitor.js`:

- **Monitoring Intervals**: Adjust how frequently each check runs
- **Website URL**: Change the website to monitor
- **Container List**: Specify which containers to monitor (empty array monitors all)
- **Log File Path**: Change where logs are stored

```js
const CONFIG = {
  containerCheckInterval: 60000,  // 1 minute
  logCheckInterval: 300000,       // 5 minutes
  websiteCheckInterval: 180000,   // 3 minutes
  
  website: {
    url: 'https://aleromano.com',
    timeout: 10000, // 10 seconds
  },
  
  containers: ['app-app-1', 'app-nginx-1'], // Empty array to monitor all
  
  // ... other settings
};
```

After making changes, restart the service:

```sh
sudo systemctl restart observability
```

## Service Management

Check service status:
```sh
sudo systemctl status observability
```

View logs:
```sh
sudo journalctl -u observability -f
```

Start the service:
```sh
sudo systemctl start observability
```

Stop the service:
```sh
sudo systemctl stop observability
```

Restart the service:
```sh
sudo systemctl restart observability
```

## Logs

The daemon logs to two locations:

1. **System Journal**: Access with `journalctl -u observability`
2. **Log File**: Located at `/var/log/observability.log`

## Uninstallation

To remove the observability daemon:

```sh
# Stop and disable the service
sudo systemctl stop observability
sudo systemctl disable observability

# Remove the service file
sudo rm /etc/systemd/system/observability.service

# Reload systemd
sudo systemctl daemon-reload

# Optionally remove the log file
sudo rm /var/log/observability.log
```

## Troubleshooting

### Service Won't Start

Check for errors in the logs:
```sh
sudo journalctl -u observability -n 50
```

Verify Node.js is installed:
```sh
node --version
```

Check log file permissions:
```sh
ls -la /var/log/observability.log
```

If the log file has incorrect permissions:
```sh
sudo chown deploy:deploy /var/log/observability.log
sudo chmod 644 /var/log/observability.log
```

### Not Receiving Telegram Notifications

Verify your bot token and chat ID:
```sh
# Test your Telegram configuration
curl -s -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -d chat_id="<YOUR_CHAT_ID>" \
  -d text="Test message"
```

Make sure your bot has permission to send messages to you (start a conversation with it).

### HTML Formatting Not Working in Telegram Messages

If HTML tags aren't rendering properly in Telegram messages, ensure:

1. The `parse_mode` parameter is set to "HTML" in the API request
2. You're using only [supported HTML tags](https://core.telegram.org/bots/api#html-style):
   - `<b>`, `<strong>` for bold
   - `<i>`, `<em>` for italic
   - `<u>` for underline
   - `<s>`, `<strike>`, `<del>` for strikethrough
   - `<a href="...">` for links
   - `<code>` for monospace
   - `<pre>` for blocks of fixed-width text

### Docker Monitoring Issues

Ensure the user running the service (deploy) has permission to access Docker:
```sh
sudo usermod -aG docker deploy
```

## Security Considerations

- The script runs with the permissions of the `deploy` user and the `docker` group
- Telegram bot tokens are stored in the systemd service file, which is readable only by root
- Consider using environment variables or a secure configuration file for sensitive information in production

## Extending the Script

You can extend the monitoring capabilities by adding new functions to `monitor.js`:

- **Database Monitoring**: Add checks for database connectivity and performance
- **Disk Space Monitoring**: Alert when disk space is running low
- **Memory/CPU Usage**: Monitor system resource utilization
- **SSL Certificate Expiry**: Check and alert on upcoming certificate expirations

## License

MIT 