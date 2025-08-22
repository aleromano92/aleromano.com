#!/usr/bin/env node

/**
 * VPS Observability Script
 * 
 * This script monitors:
 * 1. Docker container status
 * 2. Docker logs for errors
 * 3. Website availability via HTTP requests
 * 
 * It sends notifications via Telegram when issues are detected.
 */

const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

// Configuration
const CONFIG = {
    // Monitoring intervals (in milliseconds)
    containerCheckInterval: 60000, // 1 minute
    logCheckInterval: 300000,      // 5 minutes
    websiteCheckInterval: 180000,  // 3 minutes

    // Website to monitor
    website: {
        url: 'https://aleromano.com',
        timeout: 30000, // 30 seconds
    },

    // Containers to monitor (leave empty to monitor all)
    containers: ['app-app-1', 'app-nginx-1', 'app-smtp-relay-1'],

    // Telegram configuration
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
    },

    // Log file for this script
    logFile: '/var/log/observability.log',
};

// Ensure we have the required environment variables
if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) {
    console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables must be set');
    process.exit(1);
}

// Setup logging
const log = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // Only log to console if we're not also logging to a file
    // This prevents duplicate logs when stdout/stderr are redirected to the same log file
    if (!CONFIG.logFile || process.env.NODE_ENV === 'development') {
        console.log(logMessage);
    }

    // Log to file if specified
    if (CONFIG.logFile) {
        fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
    }
};

// Send a message to Telegram
const sendTelegramNotification = async (message) => {
    const { botToken, chatId } = CONFIG.telegram;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Use URL-encoded form data instead of JSON
    const postData = new URLSearchParams({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    }).toString();

    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                },
            },
            (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (response.ok) {
                            log('Telegram notification sent successfully');
                            resolve(response);
                        } else {
                            log(`Failed to send Telegram notification: ${response.description}`, 'ERROR');
                            reject(new Error(response.description));
                        }
                    } catch (error) {
                        log(`Error parsing Telegram API response: ${error.message}`, 'ERROR');
                        reject(error);
                    }
                });
            }
        );
        req.on('error', (error) => {
            log(`Error sending Telegram notification: ${error.message}`, 'ERROR');
            reject(error);
        });
        req.write(postData);
        req.end();
    });
};

// Check Docker container status
const checkContainerStatus = () => {
    log('Checking container status...');

    exec('docker ps -a --format "{{.Names}}|{{.Status}}"', (error, stdout, stderr) => {
        if (error) {
            log(`Error checking container status: ${error.message}`, 'ERROR');
            sendTelegramNotification(`❌ <b>Error checking container status</b>\n\n${error.message}`);
            return;
        }

        if (stderr) {
            log(`Error in docker ps command: ${stderr}`, 'ERROR');
            return;
        }

        const containers = stdout.trim().split('\n');
        const stoppedContainers = [];
        const monitoredContainers = new Set(CONFIG.containers);
        let foundMonitoredContainers = 0;

        containers.forEach((container) => {
            const [name, status] = container.split('|');

            // Skip if we're only monitoring specific containers and this isn't one of them
            if (CONFIG.containers.length > 0 && !monitoredContainers.has(name)) {
                return;
            }

            // Count how many monitored containers we found
            foundMonitoredContainers++;

            if (!status.startsWith('Up')) {
                stoppedContainers.push({ name, status });
            }
        });

        // Check if any monitored containers are missing entirely
        if (CONFIG.containers.length > 0 && foundMonitoredContainers < CONFIG.containers.length) {
            const foundContainerNames = new Set(containers.map(c => c.split('|')[0]));
            const missingContainers = CONFIG.containers.filter(name => !foundContainerNames.has(name));

            missingContainers.forEach(name => {
                stoppedContainers.push({ name, status: 'Missing (not found in docker ps output)' });
            });
        }

        if (stoppedContainers.length > 0) {
            const message = stoppedContainers
                .map(({ name, status }) => `❌ <b>${name}</b>: ${status}`)
                .join('\n');

            log(`Found stopped containers: ${stoppedContainers.map(c => c.name).join(', ')}`, 'WARNING');
            sendTelegramNotification(`🐳 <b>Container Status Alert</b>\n\n${message}`);
        } else {
            log('All monitored containers are running');
        }
    });
};

// Check Docker logs for errors
const checkDockerLogs = () => {
    log('Checking Docker logs for errors...');

    // Get the list of containers to check
    exec('docker ps --format "{{.Names}}"', (error, stdout, _stderr) => {
        if (error) {
            log(`Error getting container list: ${error.message}`, 'ERROR');
            return;
        }

        const containers = stdout.trim().split('\n');

        containers.forEach((containerName) => {
            // Skip if we're only monitoring specific containers and this isn't one of them
            if (CONFIG.containers.length > 0 && !CONFIG.containers.includes(containerName)) {
                return;
            }

            // Check logs from the last 5 minutes for errors
            const since = Math.floor((Date.now() - CONFIG.logCheckInterval) / 1000);
            const command = `docker logs --since ${since} ${containerName} 2>&1 | grep -i "error\\|exception\\|fatal" | tail -n 10`;

            exec(command, (error, stdout, _stderr) => {
                // grep returns exit code 1 if no matches, which causes exec to return an error
                // We only care about actual errors, not the absence of matches
                if (error && error.code !== 1) {
                    log(`Error checking logs for ${containerName}: ${error.message}`, 'ERROR');
                    return;
                }

                if (stdout.trim()) {
                    const errorLogs = stdout.trim();
                    log(`Found errors in ${containerName} logs`, 'WARNING');

                    sendTelegramNotification(
                        `📋 <b>Error Logs Detected in ${containerName}</b>\n\n<pre>${errorLogs}</pre>`
                    );
                } else {
                    log(`No errors found in ${containerName} logs`);
                }
            });
        });
    });
};

// Check website availability
const checkWebsite = () => {
    log(`Checking website availability: ${CONFIG.website.url}`);
    const startTime = Date.now();

    // Create options for the request
    const url = new URL(CONFIG.website.url);
    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: CONFIG.website.timeout,
        headers: {
            'User-Agent': 'VPS-Observability-Monitor/1.0'
        }
    };

    const request = https.request(options, (response) => {
        const responseTime = Date.now() - startTime;

        // Consume the response data to free up memory
        response.resume();

        if (response.statusCode >= 200 && response.statusCode < 400) {
            log(`Website is up. Status: ${response.statusCode}, Response time: ${responseTime}ms`);
        } else {
            log(`Website returned error status: ${response.statusCode}`, 'WARNING');
            sendTelegramNotification(
                `🌐 <b>Website Status Alert</b>\n\nURL: ${CONFIG.website.url}\nStatus: ${response.statusCode}\nResponse time: ${responseTime}ms`
            );
        }
    });

    request.on('timeout', () => {
        log(`Website check timed out after ${CONFIG.website.timeout}ms`, 'WARNING');
        request.destroy();

        // Try a simple curl command to see if the website is reachable
        exec(`curl -s -o /dev/null -w "%{http_code}" -m 10 ${CONFIG.website.url}`, (error, stdout, _stderr) => {
            if (!error && stdout.trim() >= 200 && stdout.trim() < 400) {
                log(`Curl check succeeded with status ${stdout.trim()} despite timeout in Node.js request`, 'WARNING');
                sendTelegramNotification(
                    `🌐 <b>Website Timeout Alert</b>\n\nURL: ${CONFIG.website.url}\nTimeout after ${CONFIG.website.timeout}ms\n\nNote: Site appears reachable via curl (status ${stdout.trim()})`
                );
            } else {
                sendTelegramNotification(
                    `🌐 <b>Website Timeout Alert</b>\n\nURL: ${CONFIG.website.url}\nTimeout after ${CONFIG.website.timeout}ms`
                );
            }
        });
    });

    request.on('error', (error) => {
        log(`Error checking website: ${error.message}`, 'ERROR');

        sendTelegramNotification(
            `🌐 <b>Website Error Alert</b>\n\nURL: ${CONFIG.website.url}\nError: ${error.message}`
        );
    });

    request.end();
};

// Start monitoring
log('Starting VPS observability daemon...');

// Send a startup notification
sendTelegramNotification(
    `🚀 <b>VPS Monitoring Started</b>\n\nMonitoring:\n- Docker containers\n- Error logs\n- Website availability`
);

// Schedule regular checks
setInterval(checkContainerStatus, CONFIG.containerCheckInterval);
setInterval(checkDockerLogs, CONFIG.logCheckInterval);
setInterval(checkWebsite, CONFIG.websiteCheckInterval);

// Run initial checks
checkContainerStatus();
checkDockerLogs();
checkWebsite();

// Handle process termination
process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...', 'INFO');
    sendTelegramNotification('🛑 <b>VPS Monitoring Stopped</b>')
        .finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...', 'INFO');
    sendTelegramNotification('🛑 <b>VPS Monitoring Stopped</b>')
        .finally(() => process.exit(0));
});

// Keep the process running
log('Monitoring active. Press Ctrl+C to stop.'); 