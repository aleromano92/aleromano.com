# Alessandro Romano's personal website

## 🚀 Project Structure

This is a bilingual (English/Italian) personal blog built with **Astro 5** using:
- **SSR mode** with Node.js adapter for Docker deployment
- **Content Collections** for blog posts and presentations with strict TypeScript schemas
- **Presentation Mode** with reveal.js integration and speaker notes support
- **Custom i18n routing** with URL path prefixing (`/it/` for Italian, no prefix for English)
- **Docker-based deployment** to a Hetzner VPS with nginx reverse proxy
- **SQLite database** for persistent caching of API responses (Twitter, etc.)

### 🌐 i18n URL Structure
- **English (default)**: `/blog`, `/posts/my-post`, `/about`
- **Italian**: `/it/blog`, `/posts/it/my-post`, `/it/about`
- **Blog posts** use different pattern: `/posts/{lang}/slug` vs `/posts/slug`

### 🎤 Presentation Mode
Blog posts can have associated presentations powered by reveal.js:
- **Presentation URL**: `/posts/[slug]/present`
- **Speaker Notes**: Press `S` key to open speaker notes window  
- **PDF Export**: Click "Print PDF" button in top-right corner
- **Full keyboard navigation**: Arrow keys, overview mode (`O`), help (`?`)
- **Content**: Defined in `src/content/presentations/` with markdown
- **Speaker Notes**: Add `Note:` sections for private presenter notes

#### What are Speaker Notes?

Speaker notes are private notes that only you (the presenter) can see. They appear in a separate browser window that shows:
- Your current slide
- Preview of the next slide  
- Your private notes
- Timer and clock
- Slide navigation controls

##### How to Add Speaker Notes

In your presentation markdown file (in `src/content/presentations/`), add notes using the `Note:` delimiter:

```markdown
## Your Slide Title

- Bullet point 1
- Bullet point 2
- Bullet point 3

Note:
These are your private speaker notes. Only you will see this content in the speaker view. You can include:
- Talking points and reminders
- Statistics or data to mention
- Transitions to the next slide
- Personal anecdotes or examples
```

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

## 💾 SQLite Database & Caching

The website uses SQLite for persistent caching to reduce API calls and improve performance. The cache survives container restarts and deployments.

### Configuration

The database path is configured via the `DATABASE_PATH` environment variable (**required**).

**Important**: `DATABASE_PATH` must be set - there is no default fallback value.

To configure the database location:

```bash
# Local development - create .env file
DATABASE_PATH=./data/main.db

# Or set directly
DATABASE_PATH=/custom/path/to/database.db npm run dev
```

In Docker environments, the path is set in `docker-compose.yml`.

### What's Cached

- **Twitter API responses**: Cached for 36 hours to stay within API rate limits
- The cache automatically handles expiration and provides stale data fallback when APIs are unavailable

### Database Backup

In production, you can backup the database:

```bash
# From inside container
docker exec aleromano-app-1 cp /app/data/main.db /app/data/main.db.backup

# From host
cp /var/docker/aleromano.com/app/data/main.db /var/docker/aleromano.com/app/data/main.db.backup
```

## Troubleshooting

### Checking Production Logs

To check the logs for a specific container in the production environment, use the following commands from your server:

```bash
# Follow the live logs for a specific service (e.g., nginx)
docker-compose -f docker-compose.prod.yml logs -f nginx

# Show the last 100 lines of logs for the app container
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Show logs for all services
docker-compose -f docker-compose.prod.yml logs
```

Replace `nginx` or `app` with the desired service name from your `docker-compose.prod.yml` file.

### Checking Older Error Logs

To search through all stored logs for specific errors, you can pipe the output to `grep`.

```bash
# Search all nginx logs for errors, warnings, or emergencies (case-insensitive)
docker-compose -f docker-compose.prod.yml logs nginx | grep -i -E 'error|warn|emerg'

# Search all app logs for the word "error"
docker-compose -f docker-compose.prod.yml logs app | grep -i 'error'
```

For `nginx`, you can also view the raw log files directly on the host server, as they are mounted in a volume:
```bash
# View the full error log file on the host
cat /var/docker/aleromano.com/nginx/logs/error.log
```
