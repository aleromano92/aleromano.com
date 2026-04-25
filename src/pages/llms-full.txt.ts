import { getCollection } from 'astro:content';
import { getLocalizedPostUrl } from '../utils/posts';

export async function GET(context: { site: URL | undefined }) {
  const posts = await getCollection('blog', ({ data }) => data.language === 'en');
  const sorted = posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const site = context.site?.origin ?? 'https://aleromano.com';
  const sections: string[] = [];

  for (const post of sorted) {
    const url = getLocalizedPostUrl(post);
    const header = `# ${post.data.title}\n\nURL: ${site}${url}\nDate: ${post.data.pubDate.toISOString().slice(0, 10)}\n\n`;
    sections.push(header + (post.body ?? ''));
  }

  return new Response(sections.join('\n\n---\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export const prerender = true;
