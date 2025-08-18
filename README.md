# Alessandro Romano's personal website

## 🚀 Project Structure

This is a bilingual (English/Italian) personal blog built with **Astro 5** using:
- **SSR mode** with Node.js adapter for Docker deployment
- **Content Collections** for blog posts with strict TypeScript schemas
- **Custom i18n routing** with URL path prefixing (`/it/` for Italian, no prefix for English)
- **Docker-based deployment** to a Hetzner VPS with nginx reverse proxy

### 🌐 i18n URL Structure
- **English (default)**: `/blog`, `/posts/my-post`, `/about`
- **Italian**: `/it/blog`, `/posts/it/my-post`, `/it/about`
- **Blog posts** use different pattern: `/posts/{lang}/slug` vs `/posts/slug`

## 🧞 Essential Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:4321)
npm run build                  # Build with TypeScript checking
npm test                       # Run all Vitest tests
npm run test:watch            # Test watch mode

# Docker workflows
npm run docker:dev            # Full dev stack with nginx

# Content operations
npx astro check               # TypeScript validation for .astro files
```

## 🐳 Docker Magic

I've added Docker containerization to this project.

It means I've added the `node` adapter for Astro in order to run the Server Side Rendering. 

```diff
import { defineConfig } from 'astro/config';

+ import node from '@astrojs/node';
// https://astro.build/config
export default defineConfig({
+  output: 'server',
+  adapter: node({
+    mode: 'standalone'
+  })
});
```

## 🚀 Release Process

### DEPRECATED - Smart usage of Docker Context

> This is DEPRECATED

I've streamlined the release process using npm scripts. Here's how to deploy the website:

| Command | Action |
| :-- | :-- |
| `npm run docker:build` | Builds the Docker container locally |
| `npm run deploy` | Full deployment process on remote VPS |

The deployment process consists of these automated steps:
1. Switches to Hetzner context (`predeploy`)
2. Builds the Docker image on the remote server (`predeploy`)
3. Runs the container in detached mode on port 4321
4. Switches back to local Docker context

#### Docker Context Setup

With Docker is quite easy to deploy on a remote machine instead of your own.

```bash
# Create new context for remote VPS
docker context create vps
--docker "host=ssh://user@<public-IP-address-of-your-server>"

# List available contexts
docker context ls
```

**NOTE**: I've added 2 aliases to my `.zshrc` to switch between local and remote contexts:

```sh
alias dlocal="docker context use default"
alias dremote="docker context use vps"
```

> See https://x.com/kkyrio/status/1861371736492572710

To build the container: `docker build -t aleromano.com .`

To run the container: `docker run -p 4321:4321 aleromano.com`

> Note: keep CONTAINER and HOST port identical otherwise /_image won't render anything

### Using GitHub Actions

I've set up a GitHub Actions workflow to automate the deployment process. The workflow is defined in the `.github/workflows/deploy.yml` file and includes the following steps:

1. **Build**: Runs `npm run build` to build the Astro project (emitting "web" files).
2. **Docker Build**: Builds the Docker images using the `Dockerfile` in the root directory.
3. **Deploy**: SSH into Hetzner VPS and down and up the `docker-compose` production file.

> To trigger the deployment, simply push changes to the `main` branch or create a new release.

## 🔍 VPS Observability

The project includes a monitoring solution for the VPS that hosts the website. This observability daemon:

- Monitors Docker container status
- Checks Docker logs for errors
- Verifies website availability
- Sends alerts via Telegram when issues are detected

For detailed documentation, installation instructions, and configuration options, see the dedicated [Observability README](scripts/observability/README.md).
