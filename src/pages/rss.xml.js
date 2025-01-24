import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getLocalizedPostUrl } from '../utils/posts';

export async function GET(context) {
    const blog = await getCollection('blog');
    const items = blog.map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: context.site + getLocalizedPostUrl(post).slice(1), // Remove leading slash and append to site URL
        customData: `<language>${post.data.language}</language>`,
    }));

    return rss({
        title: 'Alessandro Romano\'s Blog',
        description: 'My journey learning and sharing about web development',
        site: context.site,
        items,
        customData: `<language>en-us</language>`,
    });
}

export const prerender = true; 