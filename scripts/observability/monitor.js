#!/usr/bin/env node

const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

const CONFIG = {
    containerCheckInterval: 60_000,
    logCheckInterval: 5 * 60_000,
    websiteCheckInterval: 3 * 60_000,

    website: {
        url: 'https://aleromano.com',
        timeout: 30_000,
    },

    containers: ['app-app-1', 'app-nginx-1', 'app-smtp-relay-1'],

    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
    },

    logFile: '/var/log/observability.log',
};

if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) {
    console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables must be set');
    process.exit(1);
}

const log = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (!CONFIG.logFile || process.env.NODE_ENV === 'development') {
        console.log(logMessage);
    }

    if (CONFIG.logFile) {
        fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
    }
};

const sendTelegramNotification = async (message) => {
    const { botToken, chatId } = CONFIG.telegram;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

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

            if (CONFIG.containers.length > 0 && !monitoredContainers.has(name)) {
                return;
            }

            foundMonitoredContainers++;

            if (!status.startsWith('Up')) {
                stoppedContainers.push({ name, status });
            }
        });

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

const checkDockerLogs = () => {
    log('Checking Docker logs for errors...');

    exec('docker ps --format "{{.Names}}"', (error, stdout, _stderr) => {
        if (error) {
            log(`Error getting container list: ${error.message}`, 'ERROR');
            return;
        }

        const containers = stdout.trim().split('\n');

        containers.forEach((containerName) => {
            if (CONFIG.containers.length > 0 && !CONFIG.containers.includes(containerName)) {
                return;
            }

            const since = Math.floor((Date.now() - CONFIG.logCheckInterval) / 1000);
            const command = `docker logs --since ${since} ${containerName} 2>&1 | grep -i "error\\|exception\\|fatal" | tail -n 10`;

            exec(command, (error, stdout, _stderr) => {
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

const checkWebsite = () => {
    log(`Checking website availability: ${CONFIG.website.url}`);
    const startTime = Date.now();

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

log('Starting VPS observability daemon...');

sendTelegramNotification(
    `🚀 <b>VPS Monitoring Started</b>\n\nMonitoring:\n- Docker containers\n- Error logs\n- Website availability`
);

setInterval(checkContainerStatus, CONFIG.containerCheckInterval);
setInterval(checkDockerLogs, CONFIG.logCheckInterval);
setInterval(checkWebsite, CONFIG.websiteCheckInterval);

checkContainerStatus();
checkDockerLogs();
checkWebsite();

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

log('Monitoring active. Press Ctrl+C to stop.'); 