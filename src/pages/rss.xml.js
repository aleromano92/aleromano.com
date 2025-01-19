import rss from '@astrojs/rss';

export async function GET(context) {
    const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
    return rss({
        title: 'Alessandro Romano\'s Blog',
        description: 'My journey learning and sharing about web development',
        site: context.site,
        items: posts.map((post) => ({
            title: post.frontmatter.title,
            pubDate: post.frontmatter.pubDate,
            description: post.frontmatter.description,
            link: post.url,
        })),
        customData: `<language>en-us</language>`,
    });
}

export const prerender = true; 