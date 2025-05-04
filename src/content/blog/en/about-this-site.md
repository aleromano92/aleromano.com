---
title: "This Site and My Return to Basics"
description: "Why I decided to use a VPS and adopt an AI-assisted workflow."
pubDate: 2025-04-10
author: "Alessandro Romano"
tags: ["Tech", "Web Development", "aleromano.com", "VPS", "AI"]
language: "en"
image:
    url: ../../../assets/blog/about-this-site/featured.jpg
    alt: Web development concept
---

Few people in the world are constantly searching for the "next big thing" as much as Software Engineers :smile:
Whether it's frameworks, SaaS, languages, or platforms, FOMO (Fear Of Missing Out) drives us to stay updated and try new things, paying a significant cost in terms of time. However, I realized that in trying to keep up with the latest trends, I was losing sight of the basics that make it all possible.

Even in my [bio on this site](/about), I wrote that I like to understand how things work. But as I used increasingly high-level tools, I became "scared" of finding myself so far removed from how these technologies actually work under the hood. I started feeling the need to return to a more "manual" and "primitive" approach to better understand the foundations upon which everything we do is built.

## Back to Basics with a VPS 🏗️

Recently, I decided to host this site on a **VPS** instead of using services like Vercel or Netlify. Don't get me wrong: these platforms offer incredible developer experiences that simplify deployment and hosting. But I realized I was gradually unlearning the basics of how the internet actually works.

Configuring a server, setting up nginx, managing SSL certificates, and handling deployments manually felt like diving back into my 18-year-old self. These are fundamental skills we often take for granted in the era of one-click deployments.

I chose Hetzner as it seemed the best value for money: I'm using a CX22 instance with 2 vCPUs (Intel), 4GB RAM, and 40GB SSD for €4 per month!

> If you want to try it, you can [use my link](https://hetzner.cloud/?ref=5R5wQFCPotUP) to get €20 in credits! 🚀

## Staying Hands-On 🧑‍🏭

As someone who transitioned into engineering management, it's easy to drift away from the technical details. However, I believe staying hands-on with technology is crucial; not just for maintaining credibility with my teams, but also for my personal satisfaction and continuous growth.

This site is my playground: a place where I can experiment, learn, and implement without worrying too much about breaking everything!

## AI-Assisted Development for the Time-Strapped 🤖

Being an Engineering Manager for three teams and a father of two doesn't leave much room for long coding sessions. The time I can dedicate is in small, often interrupted blocks, without hours of continuous focus.

This is where AI-assisted development made a difference. I used [Cursor](https://www.cursor.com/) to speed up my workflow, allowing me to make significant progress even in short, fragmented time blocks. The ability to express an intention and have the AI implement it for me in *Agent* mode reduced the energy cost of constant context switching.

(I'll write a dedicated post about this experience soon!)

## Tech Stack: Simplicity Matters 💻

For this site, I chose a simple yet powerful stack. I'm using [Astro](https://astro.build/) as the framework. It's perfect for content-focused sites thanks to its excellent static site generation capabilities. Then, although overkill for a solo project, I used **TypeScript**.

The post content, like this one you're reading, is written in **Markdown** and managed via Astro's `Content Collections`, making content organization and updates very straightforward. For styling, I opted for **pure CSS**, using CSS variables to implement features like light/dark theme, maintaining direct control over the appearance without additional dependencies.

I also implemented **multilingual support (i18n)** to reach a broader audience and an **RSS feed** to allow users to follow updates via their favorite readers.

Although not strictly necessary, I decided to use [Docker](https://www.docker.com/) for packaging and deployment. For a purely static site like this, it smells quite a bit like over-engineering, but:

- Docker is an industry standard I've rarely dealt with. Plus, a user [on X intrigued me with his posts](https://x.com/kkyrio/status/1861371736492572710) on the topic.
- I also wanted to use [Nginx](https://nginx.org/) to efficiently serve static content, so Docker Compose seemed the right choice.

Deployment happens on every commit to `main` via GitHub Actions, which run tests and build the site, then send everything to the remote server.

## The Cost Factor 💰

A motivation, albeit secondary, was also economic. I didn't want to spend $16 a month for [Super.so](https://super.so/) when I knew I could build and host something myself for a fraction of the cost. My VPS costs significantly less (€4.62 per month), and I have the added advantage of being able to host multiple projects on the same server (my next SaaS is just around the corner, too bad the Earth is round 😂).

## Should You Do It Too? 🤔

**TL;DR:** No. Unless your context and passions are similar to mine.

This approach isn't for everyone. If you're focused on rapidly shipping products or have no interest in the infrastructure side of web development, platforms like Vercel and Netlify are absolutely the right choice.

But there's a deep, intrinsic value in going back to basics and truly understanding how things work. Yes, even LLMs. As much as we're bombarded with micro-information and novelties, it's crucial not to lose sight of the foundations upon which everything we do is built.

Sometimes, to move forward, we need to take a step back and revisit what we might have forgotten along the way.