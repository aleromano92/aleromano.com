export async function GET() {
    const robotsContent = `User-agent: *
Allow: /

# Block API endpoints
Disallow: /api/

# Sitemap location
Sitemap: https://aleromano.com/sitemap-index.xml

# Crawl-delay for politeness
Crawl-delay: 1`;

    return new Response(robotsContent, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}

export const prerender = true;