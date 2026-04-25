const skills = {
  $schema: 'https://agentskills.io/schema/v0.2.0/index.json',
  skills: [
    {
      name: 'llms-index',
      type: 'llms-txt',
      description: 'Index of all blog posts in LLM-friendly text format',
      url: 'https://aleromano.com/llms.txt',
    },
    {
      name: 'llms-full',
      type: 'llms-txt-full',
      description: 'Full markdown corpus of all blog posts',
      url: 'https://aleromano.com/llms-full.txt',
    },
    {
      name: 'rss-feed',
      type: 'rss',
      description: 'RSS feed for blog posts',
      url: 'https://aleromano.com/rss.xml',
    },
    {
      name: 'sitemap',
      type: 'sitemap',
      description: 'XML sitemap with per-post publication dates',
      url: 'https://aleromano.com/sitemap-index.xml',
    },
  ],
};

export function GET() {
  return new Response(JSON.stringify(skills, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export const prerender = true;
