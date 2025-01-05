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

To build the container, run `docker build -t aleromano.com .`

To run the container, run `docker run -p 4321:4321 aleromano.com`

> Note: keep CONTAINER and HOST port identical otherwise /_image

### Deploy to VPS

With Docker is quite easy to deploy on a remote machine instead of your own.

```bash
# Create new context for remote VPS
docker context create vps
--docker "host=ssh://user@<public-IP-address-of-your-server>"

# List available contexts
docker context ls

docker context use vps
# Run command on remote host
docker build -t aleromano.com .
docker run -p 4321:4321 aleromano.com

# Switch back to local when needed
docker context use default
```

**NOTE**: I've added 2 aliases to my `.zshrc` to switch between local and remote contexts:

```sh
alias dlocal="docker context use default"
alias dremote="docker context use vps"
```

> See https://x.com/kkyrio/status/1861371736492572710
