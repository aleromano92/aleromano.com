---
title: "Back to the Metal"
description: "How AI-assisted development helped me abandon PaaS abstractions and go back to basics"
blogPostSlug: "about-this-site"
language: "en"
theme: "black"
transition: "slide"
---

<!-- .slide: data-background-image="/presentations/about-this-site/server-room.jpg" data-background-opacity="0.5" -->

## Back to the Metal

### AI-assisted dev and the return to basics

**Alessandro Romano** · Web Day Milano 2025

Note:
Welcome! Today I want to talk about the growing gap between what we build and what we actually understand. First, a question.

---

<!-- .slide: data-background-image="/presentations/about-this-site/developer-desk.jpg" data-background-opacity="0.45" -->

## When did you last configure a server?

Note:
Raise your hand if you've done it in the last year. Two years. Five? For many of us, the answer is "never" or "I can't remember."

---

<!-- .slide: data-background-image="/presentations/about-this-site/developer-desk.jpg" data-background-opacity="0.3" -->

## Vercel. <!-- .element: class="fragment" -->

## Netlify. <!-- .element: class="fragment" -->

## Heroku. <!-- .element: class="fragment" -->

*Deploy became a checkbox.* <!-- .element: class="fragment" -->

Note:
These platforms gave us an incredible gift. Push to main, done. Genuinely more productive. But magic always has a cost.

---

<!-- .slide: data-background-image="/presentations/about-this-site/iceberg.jpg" data-background-opacity="0.65" -->

## What's actually running?

Note:
An iceberg. We see the tip — our code, our framework, our deploy button. Underneath? Nginx, SSL termination, process managers, log aggregation. Layers we've stopped seeing.

---

<!-- .slide: data-background-image="/presentations/about-this-site/tunnel.jpg" data-background-opacity="0.55" -->

## Fear of what you don't understand.

Note:
This is the real cost. Not the subscription price. The fear. The paralysis when something goes wrong and you don't know where to look.

---

## Who Am I? 👋

<div class="container" style="display: flex; align-items: center; justify-content: space-around;">
    <h4 class="left">Alessandro Romano</h4>
    <div class="right" style="min-width: 300px;">
        <img src="/alepro.png" alt="Alessandro Romano" height="200" class="right"/>
    </div>
</div>

- Engineering Manager at Mollie 💳 <!-- .element: class="fragment" -->
- Father of 2 (time is scarce ⏱️) <!-- .element: class="fragment" -->
- "I like to understand how things work" 🔧 <!-- .element: class="fragment" -->

Note:
Quick intro. Engineering Manager at Mollie, father of two. My coding time comes in short, interrupted blocks. But I still love getting into the details.

---

<!-- .slide: data-background-image="/presentations/about-this-site/chess.jpg" data-background-opacity="0.5" -->

## The rules changed.

Note:
AI-assisted development made it possible to experiment faster than ever. If I can try a new solution in an afternoon instead of a weekend, I can afford to go lower-level and actually learn.

---

<!-- .slide: data-background-image="/presentations/about-this-site/keyboard.jpg" data-background-opacity="0.5" -->

## AI-Assisted Development

*Experiment more. Fear less.*

Note:
AI lowered the activation energy for learning new things. Let me show you three examples from my own site.

---

<!-- .slide: data-background-image="/presentations/about-this-site/data-center.jpg" data-background-opacity="0.4" -->

## aleromano.com

### VPS · Docker · No PaaS.

Note:
I rebuilt my site on a €4/month Hetzner VPS. Not because Vercel is bad — but because I wanted to remember how the internet actually works. Three experiments followed.

---

<!-- .slide: data-background-image="/presentations/about-this-site/server-room.jpg" data-background-opacity="0.35" -->

## Observability?

*A systemd script. 42 lines of bash.*

```bash
journalctl -u myapp | grep -i error | while read l; do
  curl -s "$TG_API/sendMessage" -d "chat_id=$CHAT&text=$l"
done
```

Note:
No Datadog. No Sentry. A bash script that reads systemd logs, filters errors, and sends me a Telegram message. Built with AI in an hour. Running for months.

---

<!-- .slide: data-background-image="/presentations/about-this-site/developer-desk.jpg" data-background-opacity="0.35" -->

## Analytics?

*SQLite. No dashboard. No SaaS.*

```js
db.run('INSERT INTO events VALUES (?, ?, ?)',
  ['pageview', url, Date.now()])
```

Note:
No Google Analytics. A small JS snippet that writes pageview events to SQLite on my VPS. I query it with SQL when curious.

---

<!-- .slide: data-background-image="/presentations/about-this-site/rocket.jpg" data-background-opacity="0.5" -->

## Deploy?

*GitHub Actions → Docker → VPS.* <!-- .element: class="fragment" -->

*One workflow file. Zero surprises.* <!-- .element: class="fragment" -->

Note:
On every push to main, a GitHub Action builds my Docker image, SSHs into the VPS, and restarts the container. I can read every line of what happens.

---

<!-- .slide: data-background-image="/presentations/about-this-site/sunrise.jpg" data-background-opacity="0.5" -->

## Less magic.

## More understanding.

Note:
Not "never use PaaS again." Use the right tool for the right job. But make a deliberate choice. AI can help you rebuild that understanding faster than ever.

---

<!-- .slide: data-background-image="/presentations/about-this-site/conference.jpg" data-background-opacity="0.5" -->

## More work, not less.

### For those who use AI **and** know the basics.

Note:
The engineers who will thrive use AI as a force multiplier on top of real understanding. The fundamentals are more valuable than ever — because AI can write the code, but you still need to understand what it's doing.

---

## Questions ❓

**Contact me:**
- **Blog**: aleromano.com 📝
- **Twitter/X**: @_aleromano 🐦
- **LinkedIn**: /in/aleromano92 💼

---

## Thank You!
<img src="https://media1.tenor.com/m/ET9__w0C-sgAAAAd/bow-bowing.gif" alt="Bowing GIF" height="300">
