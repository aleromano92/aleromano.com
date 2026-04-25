import { getCollection } from 'astro:content';
import { getLocalizedPostUrl } from '../utils/posts';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => data.language === 'en');
  const sorted = posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines: string[] = [
    '# Alessandro Romano',
    '',
    "> Alessandro Romano's thoughts.",
    '',
    '## Blog Posts',
    '',
  ];

  for (const post of sorted) {
    const url = getLocalizedPostUrl(post);
    lines.push(`- [${post.data.title}](${url}.md): ${post.data.description}`);
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export const prerender = true;
