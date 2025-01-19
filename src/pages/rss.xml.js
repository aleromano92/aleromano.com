import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { BLOG_POSTS_PATH } from '../utils/constants';
export async function GET(context) {
    const blog = await getCollection('blog');
    const items = blog.map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `${BLOG_POSTS_PATH}/${post.slug}/`,
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