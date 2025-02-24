# Alessandro Romano's personal website

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

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


### Docker Context Setup

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



## 🚀 Release Process

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

## 🔍 VPS Observability

The project includes a monitoring solution for the VPS that hosts the website. This observability daemon:

- Monitors Docker container status
- Checks Docker logs for errors
- Verifies website availability
- Sends alerts via Telegram when issues are detected

For detailed documentation, installation instructions, and configuration options, see the [Observability README](scripts/observability/README.md).
