---
title: "DIY in the AI era: farewell Vercel"
description: "How AI-assisted development helped me abandon PaaS abstractions and go back to basics"
blogPostSlug: "about-this-site"
language: "en"
theme: "black"
transition: "slide"
---

# DIY in the AI era: farewell Vercel

Note:
Vercel = PaaS

---

## When did you last configure a server?

<br>

*Last year?* <!-- .element: class="fragment" -->

*5 years ago?* <!-- .element: class="fragment" -->

*Never?* <!-- .element: class="fragment" -->

Note:
Raise your hand. Most engineers today have never configured a server. That's not a failure — it's a sign of how effective the tools have become. But it comes with a cost.

---

## What PaaS gave us ✅

- Zero server configuration <!-- .element: class="fragment" -->
- Instant SSL, CDN, previews <!-- .element: class="fragment" -->
- Focus on product, not infrastructure <!-- .element: class="fragment" -->
- Push to `main`. Done. <!-- .element: class="fragment" -->

Note:
This is real. PaaS platforms democratized software deployment. They allowed smaller teams to ship production-quality software without a dedicated ops team.

---

## But.

<br>

<img src="/presentations/about-this-site/iceberg.jpg" alt="Iceberg" style="height: 350px; border-radius: 8px;" />

Note:
An iceberg. We see the deploy button. Underneath? Nginx, Docker, SSL termination, process managers, log rotation, health checks, load balancers...

---

## What we stopped seeing

- How an HTTP server routes traffic <!-- .element: class="fragment" -->
- How SSL certificates are renewed <!-- .element: class="fragment" -->
- How processes restart after a crash <!-- .element: class="fragment" -->
- How logs are collected and stored <!-- .element: class="fragment" -->
- How deployments actually happen <!-- .element: class="fragment" -->

Note:
These aren't obscure topics. They're the foundations of how the internet works. And most engineers working today have never touched them.

---

## Fear of what you don't understand.

<br>

<img src="/presentations/about-this-site/tunnel.jpg" alt="Dark tunnel" style="height: 300px; border-radius: 8px;" />

Note:
It is human to fear what you understand. And the (ab)use of PaaS will keep you distant fromt hese topics not allowing you to gain knowledge. It's a vitious cycle.

---

## Who Am I? 👋

<div class="container" style="display: flex; align-items: center; justify-content: space-around;">
    <h4 class="left">Alessandro Romano</h4>
    <div class="right" style="min-width: 300px;">
        <img src="/alepro.png" alt="Alessandro Romano" height="200" class="right"/>
    </div>
</div>

- Senior Engineering Manager at Mollie 💳 <!-- .element: class="fragment" -->
- Father of 2 <!-- .element: class="fragment" -->
- "I like to understand how things work" 🔧 <!-- .element: class="fragment" -->

Note:
Quick intro. Engineering Manager at Mollie, father of two. I don't have long uninterrupted coding sessions. But I still love getting into the details. That's the mindset that led me to an experiment.

---

## The rules changed.

<br>

AI-assisted development made it possible to **experiment faster** than ever.

Note:
If I can try something, without being an expert, in an afternoon instead of a weekend, I can afford to go lower level. The cost of learning dropped dramatically. AI is the enabler.

---

## AI-Assisted Development

*Not just faster code.*

*Lower activation energy for learning new things.* <!-- .element: class="fragment" -->

*Explore and deep dive.* <!-- .element: class="fragment" -->

Note:
I could try things I'd been avoiding because the failure cost felt too high. "I don't know Docker well enough" — now you can learn Docker in an afternoon with AI alongside you. Let me take you on a quick trip.

---

## I've been here before.

*2006. A PHP site. A dream.*

<img src="/presentations/about-this-site/php-code.jpg" alt="LAMP Stack" style="height: 380px; border-radius: 8px;" />

<pre><code data-trim data-line-numbers="1" class="php">
&lt;?php echo "Hello, World!"; ?&gt;
</code></pre>

Note:
Before PaaS existed, we did all of this ourselves. Not because we were brave — because there was no other way. PHP was the web. If you wanted a dynamic site in 2000's, you wrote PHP. No frameworks, no npm, no build step. A text editor, an FTP client, and a dream. I built forums, guestbooks, countdown timers. Everything felt possible.

---

<img src="/presentations/about-this-site/vintage-computer.jpg" alt="Vintage computer" style="height: 380px; border-radius: 8px;" />

## FileZilla 

*Drag & Drop* <!-- .element: class="fragment" -->

*Pray 🙏* <!-- .element: class="fragment" -->

Note:
Deploying meant opening FileZilla, connecting to your host via FTP, and dragging files from the left panel to the right. You'd watch the progress bar and pray you didn't overwrite the wrong file. No rollbacks. No previews. No CI. Just vibes. And it worked.

---

<img src="/presentations/about-this-site/old-computers.jpg" alt="Old computers" style="height: 350px; border-radius: 8px;" />

## My tower PC* 

*<img src="/presentations/about-this-site/dyndns.svg" alt="DynDNS logo" style="height: 40px; margin: 0;" /> DynDNS* <!-- .element: class="fragment" -->

*From Home 🏠* <!-- .element: class="fragment" -->

Note:
For a while, I hosted my site from my own bedroom. My ISP gave me a dynamic IP, so I used DynDNS to keep a domain pointed at it. Apache was the web server. My tower PC was the server. It went down every time there was a power cut. But I knew exactly how it worked — because I had built every piece of it myself.

---

## My new playground: <a href="https://aleromano.com" target="_blank">aleromano.com</a>

<br>

*1 month paternity leave*

*€4/month Hetzner VPS* <!-- .element: class="fragment" -->

*No PaaS* <!-- .element: class="fragment" -->

Note:
I rebuilt my personal site on a Hetzner CX22 VPS. 2 vCPUs, 4GB RAM, 40GB SSD. €4 per month. I had 1 month of Paternity leave as my second child was born. Let me show you my 4 pillars of DIY.

---

## 4 pillars

1. **Observability** <!-- .element: class="fragment" --> 
2. **Analytics** <!-- .element: class="fragment" -->
3. **Deploy** <!-- .element: class="fragment" -->
4. **Security** <!-- .element: class="fragment" -->

Note:
Four areas where I replaced PaaS/SaaS/vendor tools with simple self-built solutions. In each case, AI helped me build it fast. In each case, I came out understanding something I didn't before.

---

## 1 / Observability

### systemd + Node.js + Telegram 🔔

Note:
How do you know when your app crashes at 3am? I wrote a Node.js daemon. Here's how it works.

---

## What it monitors

<pre><code data-trim data-line-numbers="2-4|6-7|8-11" class="javascript">
const CONFIG = {
  containerCheckInterval: 60000,  // every 1 min
  logCheckInterval:       300000, // every 5 min
  websiteCheckInterval:   180000, // every 3 min

  website: { url: 'https://aleromano.com' },
  containers: ['app-app-1', 'app-nginx-1', 'app-smtp-relay-1'],
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId:   process.env.TELEGRAM_CHAT_ID,
  },
};
</code></pre>

Note:
Three independent checks on independent intervals: Docker container health, Docker log errors, and website availability. All configured in one place. The Telegram credentials come from environment variables — never hardcoded.

---

## Docker logs → Telegram

<pre><code data-trim data-line-numbers="1-3|5-9" class="javascript">
const since = Math.floor((Date.now() - CONFIG.logCheckInterval) / 1000);
const cmd = `docker logs --since ${since} ${containerName} 2>&1 \
  | grep -i "error|exception|fatal" | tail -n 10`;

exec(cmd, (_, stdout) => {
  if (stdout.trim())
    sendTelegramNotification(
      `📋 &lt;b&gt;Errors in ${containerName}&lt;/b&gt;\n\n&lt;pre&gt;${stdout}&lt;/pre&gt;`
    );
});
</code></pre>

Note:
Every 5 minutes it asks Docker for recent logs from each container, pipes them through grep, and if anything matches — it sends a formatted Telegram message with the error lines. No log aggregation service. No agent to install. Just Node.js calling docker.

---

<img src="/presentations/about-this-site/telegram-o11y.png" alt="Screenshot from my Telegram bot" style="height: 650px; border-radius: 8px;" />

---

## The systemd unit

<pre><code data-trim data-line-numbers="1-4|6-10|11-12|13-14|15" class="ini">
[Unit]
Description=VPS Observability Daemon
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
Group=docker
ExecStart=/usr/bin/node /opt/scripts/monitor.js
Restart=always
RestartSec=10
Environment=TELEGRAM_BOT_TOKEN=...
Environment=TELEGRAM_CHAT_ID=...
StandardOutput=append:/var/log/observability.log
</code></pre>

Note:
The install.sh generates this unit and runs systemctl enable + start. The daemon starts on boot, requires Docker to be up first, restarts automatically on crash with a 10-second delay, and appends its own output to a log file. Everything in one config file — no platform, no agent, no subscription.

---

## But what if you need graphs?

*Dashboards? Retention? Alerting rules?* <!-- .element: class="fragment" -->

*You need Prometheus + Loki + Grafana.* <!-- .element: class="fragment" -->

*Sounds scary?* <!-- .element: class="fragment" -->

Note:
The bash script is great for "tell me when something breaks." But what if you want to understand trends? Memory usage over time? Request latency? You need the Grafana stack. And yes, it sounds intimidating.

---

## Grafana stack in docker-compose

<pre><code data-trim data-line-numbers="2-5|7-9|11-12" class="yaml">
services:
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    volumes: [grafana-data:/var/lib/grafana]

  prometheus:
    image: prom/prometheus:latest
    volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]

  loki:
    image: grafana/loki:latest
</code></pre>

Note:
Three services. One docker-compose file. AI can generate the prometheus.yml scrape config and the Loki datasource config in minutes. You can have this running on your VPS in an afternoon. And once you've set it up — you understand what Datadog is actually doing for you.

---

## 2 / Analytics

### TypeScript + SQLite + no cookies 📊

Note:
How many people visited your site today? What pages do they read? No Google Analytics. No consent banners. Here's what I built instead.

---

## Client side: fire and forget

<pre><code data-trim data-line-numbers="2-7|6|7|10-15" class="typescript">
function sendEvent(event: AnalyticsEvent): void {
  fetch('/api/analytics/collect', {
    method: 'POST',
    body: JSON.stringify(event),
    headers: { 'Content-Type': 'application/json' },
    keepalive: true, // survives tab close
  }).catch(() => {}); // never break the UX
}

// Respects DNT and Global Privacy Control
if (!shouldRespectPrivacy()) {
  sendPageView();
  initClickTracking();
  initTimeTracking();
}
</code></pre>

Note:
Three event types: page_view, click, time_on_page. The keepalive flag ensures the request completes even if the user closes the tab. And before sending anything, it checks for Do Not Track and Global Privacy Control — if the user has opted out, nothing is sent. No consent banner needed.

---

## Server side: privacy by design

<pre><code data-trim data-line-numbers="3|4|5|6" class="typescript">
// Hash = SHA256(IP + UserAgent + Date + Salt)
// Rotates daily — no cross-day tracking, no cookies
function generateVisitorHash(ip: string, userAgent: string): string {
  const today = new Date().toISOString().split('T')[0];
  const input = `${ip}|${userAgent}|${today}|${HASH_SALT}`;
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}
</code></pre>

Note:
No IP addresses stored. No cookies. The visitor hash is a SHA256 of IP + UserAgent + date + a secret salt. It resets every day, so you can count unique visitors per day without tracking anyone across sessions. This is privacy by design, not privacy by policy.

---

<img src="/presentations/about-this-site/admin-analytics.png" alt="Screenshot from my Telegram bot" style="height: 650px; border-radius: 8px;" />

Note:
The database is two tables: analytics_visits and analytics_events. I added a simple admin page at /admin/analytics to see the results.

---

## 3 / Deploy

### GitHub Actions + Docker 🐳 

Note:
Every commit to main should trigger a deployment. How?

---

## Step 1: checkout &amp; authenticate

<pre><code data-trim data-line-numbers="1-2|4-9" class="yaml">
- name: Checkout repository
  uses: actions/checkout@v4

- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
</code></pre>

Note:
The workflow starts by fetching the repo at the current commit SHA, then authenticating to GHCR using the built-in GITHUB_TOKEN — no extra secret needed for the registry login.

---

## Step 2: build &amp; push to GHCR

<pre><code data-trim data-line-numbers="1-6|7-8" class="yaml">
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
</code></pre>

Note:
Every push to main triggers CI. GitHub Actions builds the Docker image and pushes it to the GitHub Container Registry. GHA cache means rebuilds are fast — only changed layers get rebuilt.

---

## Step 2: SSH into Hetzner &amp; deploy

<pre><code data-trim data-line-numbers="1-5|7-8|9|10-13|14" class="yaml">
- name: Deploy to Hetzner
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HETZNER_HOST }}
    key: ${{ secrets.HETZNER_SSH_KEY }}
    script: |
      cd ~/app
      git reset --hard origin/main
      docker pull ghcr.io/${{ github.repository }}:latest
      docker-compose -f docker-compose.yml \
        -f docker-compose.prod.yml down
      docker-compose -f docker-compose.yml \
        -f docker-compose.prod.yml up -d
      docker image prune -f
</code></pre>

Note:
The deploy job SSHes into the Hetzner VPS, pulls the freshly built image from GHCR, and restarts with docker-compose. No magic platform button — just a script I can read line by line. Rollback is `git reset` + redeploy.

---

## What you learn by doing this

- What Docker actually does in production <!-- .element: class="fragment" -->
- How SSH keys work for automation <!-- .element: class="fragment" -->
- What a container restart policy means <!-- .element: class="fragment" -->
- How rollbacks work without a UI <!-- .element: class="fragment" -->

Note:
These are things you never learn when Vercel handles deployment for you. Not because Vercel is bad — but because it abstracts them away. Doing it yourself once means you understand the abstraction forever.

---

## 4 / Security

### nginx rules, no Cloudflare 🛡️

Note:
One more experiment. This one started by accident — I just opened my access logs.

---

## Open your access logs.

<pre><code data-trim data-line-numbers="1|2|3|4" class="plaintext">
188.245.236.17 "GET /wp-admin/setup-config.php" 444
45.33.32.156   "GET /phpmyadmin/index.php" 444
91.212.166.22  "GET /.env" 444
185.220.101.4  "GET /?id=1 UNION SELECT username,password FROM users" 444
</code></pre>

*Your site runs Astro. They're looking for WordPress.* <!-- .element: class="fragment" -->

Note:
Within days of going live, the logs filled up with this. Bots scanning the entire internet, probing every server for WordPress, phpMyAdmin, exposed .env files, SQL injection entry points. This is the ambient noise of the internet. Most "traffic" is not humans.

---

## The internet is mostly bots. 🤖

- WordPress scanners (your site runs Astro) <!-- .element: class="fragment" -->
- SQL injection on a static blog <!-- .element: class="fragment" -->
- `.env` hunters looking for leaked secrets <!-- .element: class="fragment" -->
- Vulnerability scanners probing every port <!-- .element: class="fragment" -->

*Cloudflare hides this from you.* <!-- .element: class="fragment" -->

*nginx shows you the truth.* <!-- .element: class="fragment" -->

Note:
This is actually fascinating. When you run your own server, you see the raw internet. Every probe, every scan, every bot. Your platform providers have been quietly absorbing this on your behalf, invisibly.

---

## 444 — the silent drop

<pre><code data-trim data-line-numbers="1-7|9-12|14-17" class="nginx">
# Requests via IP (not domain) → connection closed, no response
server {
    listen 80 default_server;
    listen 443 default_server;
    ssl_reject_handshake on;
    return 444;
}

# WordPress/phpmyadmin hunters
location ~* /(wp-admin|phpmyadmin|cpanel) {
    return 444;
}

# PHP probes on a Node.js server
location ~* \.(php|asp|jsp|cgi)$ {
    return 444;
}
</code></pre>

Note:
HTTP 444 is nginx-specific: close the connection without sending a response. No 404, no error page. Silence. Bots get nothing — they don't even know the server exists. These three blocks eliminate 99% of the noise.

---

## SQL injection on a static blog 😂

<pre><code data-trim data-line-numbers="1|2" class="nginx">
location ~* \?(.*)(select|union|insert|drop|delete)(.*)$ {
    return 444;
}
</code></pre>

<br>

*Someone tried to `DROP TABLE` my blog posts.*

Note:
This is my favorite. SQL injection against a site with no SQL endpoint exposed in query strings. You block it anyway — because one day you might add an API, and the rule is already there.

---

## Rate limiting without a WAF

<pre><code data-trim data-line-numbers="1-2|4-7" class="nginx">
# 5 requests/minute per IP on /admin
limit_req_zone $binary_remote_addr zone=ADMIN:1m rate=5r/m;

location /admin {
    limit_req zone=ADMIN burst=2 nodelay;
    limit_req_status 429;
}
</code></pre>

*Enough for you. Nothing for a brute force attack.* <!-- .element: class="fragment" -->

Note:
One directive to define the zone, one to apply it. Brute force needs thousands of requests per minute. You need five. No WAF subscription. No vendor. Just config.

---

## What you get without Cloudflare

- HTTPS with Let's Encrypt (free) <!-- .element: class="fragment" -->
- Bot blocking at the nginx layer <!-- .element: class="fragment" -->
- Rate limiting on sensitive routes <!-- .element: class="fragment" -->
- Security headers: HSTS, CSP, X-Frame-Options <!-- .element: class="fragment" -->
- Zero vendor dependency <!-- .element: class="fragment" -->

*Not better than Cloudflare.* <!-- .element: class="fragment" -->
*But you built it. You understand it.* <!-- .element: class="fragment" -->

Note:
Cloudflare's DDoS protection and global CDN are world-class. Use them for production. But for a side project? You can implement the basics yourself in an afternoon. And when you do, you understand what Cloudflare is doing for you.

---

## Less magic.

## More understanding.

Note:
That's the thesis. Not "never use PaaS again." Choose deliberately. Use Vercel for your startup. Use a VPS for your side project. But know what each choice costs you in understanding.

---

## The opportunity

AI + fundamentals = **more work, not less.**

<br>

*For those who use AI **and** know the basics.* <!-- .element: class="fragment" -->

Note:
The engineers who will thrive are not the ones who only know how to prompt. They're the ones who use AI as a force multiplier on top of real understanding. The fundamentals are more valuable than ever — because AI can write the code, but you still need to know if it's right.

---

## Go break something.

*On a €4 VPS.* <!-- .element: class="fragment" -->

*With AI alongside you.* <!-- .element: class="fragment" -->

Note:
That's the call to action. Spin up a cheap VPS. Try to deploy something. Break it. Fix it. You'll understand more in a weekend than in years of using platforms. And now you have AI to help you through the hard parts.

---

## Questions ❓

- **Blog**: aleromano.com
- **X**: @_aleromano
- **LinkedIn**: /in/aleromano92

---

## Thank You!
<img src="https://media1.tenor.com/m/ET9__w0C-sgAAAAd/bow-bowing.gif" alt="Bowing GIF" height="300">
