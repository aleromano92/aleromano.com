---
title: "Back to the Metal"
description: "How AI-assisted development helped me abandon PaaS abstractions and go back to basics"
blogPostSlug: "about-this-site"
language: "en"
theme: "black"
transition: "slide"
---

## Back to the Metal

### AI-assisted dev and the return to basics

**Alessandro Romano** · Web Day Milano 2025

Note:
Welcome. Today I want to talk about the growing gap between what we build and what we actually understand. Let's start with an honest question.

---

## When did you last configure a server?

<br>

*Last year?* <!-- .element: class="fragment" -->

*5 years ago?* <!-- .element: class="fragment" -->

*Never?* <!-- .element: class="fragment" -->

Note:
Raise your hand. Most engineers today have never configured a server. That's not a failure — it's a sign of how effective the tools have become. But it comes with a cost.

---

## The PaaS Revolution 🚀

- Vercel · Netlify · Heroku <!-- .element: class="fragment" -->
- Railway · Render · Fly.io <!-- .element: class="fragment" -->
- Push to `main`. Done. <!-- .element: class="fragment" -->

Note:
These platforms are genuinely incredible. They removed so much friction. A developer can go from idea to production in minutes. That's real value — and I don't want to dismiss it.

---

## What PaaS gave us ✅

- Zero server configuration <!-- .element: class="fragment" -->
- Instant SSL, CDN, previews <!-- .element: class="fragment" -->
- Focus on product, not infrastructure <!-- .element: class="fragment" -->
- Lower barrier to shipping <!-- .element: class="fragment" -->

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

- How nginx routes traffic <!-- .element: class="fragment" -->
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
This is the real cost. When something breaks at 3am and you don't know what's underneath, you're stuck. The platform is a black box. You file a support ticket and hope.

---

## Who Am I? 👋

<div class="container" style="display: flex; align-items: center; justify-content: space-around;">
    <h4 class="left">Alessandro Romano</h4>
    <div class="right" style="min-width: 300px;">
        <img src="/alepro.png" alt="Alessandro Romano" height="200" class="right"/>
    </div>
</div>

- Engineering Manager at Mollie 💳 <!-- .element: class="fragment" -->
- Father of 2 (coding time is fragmented ⏱️) <!-- .element: class="fragment" -->
- "I like to understand how things work" 🔧 <!-- .element: class="fragment" -->

Note:
Quick intro. Engineering Manager at Mollie, father of two. I don't have long uninterrupted coding sessions. But I still love getting into the details. That's the mindset that led me to an experiment.

---

## The rules changed.

<br>

AI-assisted development made it possible to **experiment faster** than ever.

Note:
If I can try something in an afternoon instead of a weekend, I can afford to go lower level. The cost of learning dropped dramatically. AI is the enabler.

---

## AI-Assisted Development

*Not just faster code.*

*Lower activation energy for learning new things.* <!-- .element: class="fragment" -->

Note:
I could try things I'd been avoiding because the failure cost felt too high. "I don't know Docker well enough" — now you can learn Docker in an afternoon with AI alongside you. Let me show you three experiments.

---

## My playground: aleromano.com

<br>

**€4/month Hetzner VPS** · Docker · No PaaS.

Note:
I rebuilt my personal site on a Hetzner CX22 VPS. 2 vCPUs, 4GB RAM, 40GB SSD. €4 per month. Not because Vercel is bad — it's great. Because I wanted to remember how the internet actually works.

---

## 4 experiments

1. **Observability** — systemd + bash + Telegram 🔔
2. **Analytics** — SQLite + vanilla JS 📊
3. **Deploy** — GitHub Actions + Docker + VPS 🐳
4. **Security** — nginx rules, no Cloudflare 🛡️

Note:
Four areas where I replaced PaaS/SaaS/vendor tools with simple self-built solutions. In each case, AI helped me build it fast. In each case, I came out understanding something I didn't before.

---

## 1 / Observability

Note:
How do you know when your app crashes at 3am?

---

## The baseline: 42 lines of bash

```bash
#!/bin/bash
SERVICE="myapp"

while true; do
  journalctl -u $SERVICE --since "1 minute ago" \
    | grep -Ei "error|fatal|exception" \
    | while IFS= read -r line; do
        MSG="🚨 $(hostname): $line"
        curl -s "$TG_API/sendMessage" \
          -d "chat_id=$CHAT_ID" \
          --data-urlencode "text=$MSG" > /dev/null
      done
  sleep 60
done
```

Note:
That's it. A while loop that reads systemd logs, greps for errors, and sends me a Telegram message. Built with AI in one session. It's been running for months with zero maintenance. I understand every single line.

---

## The systemd unit

```ini
[Unit]
Description=Error monitor for myapp
After=myapp.service

[Service]
ExecStart=/opt/scripts/monitor.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Note:
Register it as a systemd service and it starts on boot, restarts on crash, and logs its own output to journalctl. This is the Linux process model. Things you never learn behind a PaaS.

---

## But what if you need graphs?

*Dashboards? Retention? Alerting rules?* <!-- .element: class="fragment" -->

*You need Prometheus + Loki + Grafana.* <!-- .element: class="fragment" -->

*Sounds scary?* <!-- .element: class="fragment" -->

Note:
The bash script is great for "tell me when something breaks." But what if you want to understand trends? Memory usage over time? Request latency? You need the Grafana stack. And yes, it sounds intimidating.

---

## Grafana stack in docker-compose

```yaml
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
```

Note:
Three services. One docker-compose file. AI can generate the prometheus.yml scrape config and the Loki datasource config in minutes. You can have this running on your VPS in an afternoon. And once you've set it up — you understand what Datadog is actually doing for you.

---

## 2 / Analytics

Note:
How many people visited your site today? What pages do they read?

---

## The solution: SQLite

```js
// Client-side: fire and forget
fetch('/api/event', {
  method: 'POST',
  body: JSON.stringify({ type: 'pageview', page: location.pathname })
})

// Server-side: one insert
db.run('INSERT INTO events VALUES (?, ?, datetime("now"))',
  ['pageview', req.body.page])
```

Note:
No Google Analytics. No Plausible. No privacy consent banners. A small JS snippet fires a POST on page load. The server inserts a row into SQLite. I query it with SQL when I'm curious. Total code: ~40 lines.

---

## When you need more

```sql
SELECT page, COUNT(*) as views,
       COUNT(DISTINCT ip) as uniques
FROM events
WHERE ts > datetime('now', '-30 days')
GROUP BY page
ORDER BY views DESC;
```

Note:
SQL is the dashboard. You know exactly what data you have, where it lives, and how to query it. No vendor lock-in. No pricing tiers. No data leaving your server.

---

## 3 / Deploy

Note:
Every commit to main should trigger a deployment. How?

---

## GitHub Actions → Docker → VPS

```yaml
- name: Deploy to VPS
  run: |
    docker build -t myapp:${{ github.sha }} .
    docker save myapp:${{ github.sha }} | \
      ssh user@vps "docker load"
    ssh user@vps "
      docker stop myapp || true
      docker run -d --name myapp \
        -p 3000:3000 myapp:${{ github.sha }}
    "
```

Note:
On every push to main: build the image locally in CI, ship it to the VPS via SSH, restart the container. I can read every line. I know exactly what's happening. No magic. No platform-specific lock-in.

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

Note:
One more experiment. This one started by accident — I just opened my access logs.

---

## Open your access logs.

```
188.245.236.17 "GET /wp-admin/setup-config.php" 444
45.33.32.156   "GET /phpmyadmin/index.php" 444
91.212.166.22  "GET /.env" 444
185.220.101.4  "GET /?id=1 UNION SELECT username,password FROM users" 444
```

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

```nginx
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
```

Note:
HTTP 444 is nginx-specific: close the connection without sending a response. No 404, no error page. Silence. Bots get nothing — they don't even know the server exists. These three blocks eliminate 99% of the noise.

---

## SQL injection on a static blog 😂

```nginx
location ~* \?(.*)(select|union|insert|drop|delete)(.*)$ {
    return 444;
}
```

<br>

*Someone tried to `DROP TABLE` my blog posts.*

Note:
This is my favorite. SQL injection against a site with no SQL endpoint exposed in query strings. You block it anyway — because one day you might add an API, and the rule is already there.

---

## Rate limiting without a WAF

```nginx
# 5 requests/minute per IP on /admin
limit_req_zone $binary_remote_addr zone=ADMIN:1m rate=5r/m;

location /admin {
    limit_req zone=ADMIN burst=2 nodelay;
    limit_req_status 429;
}
```

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
