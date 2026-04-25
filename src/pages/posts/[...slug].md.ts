import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');

  return posts.map((post) => {
    const [lang, ...slugParts] = post.id.split('/');
    const slug = slugParts.join('/');

    return {
      params: {
        slug: lang === 'en' ? slug : `${lang}/${slug}`,
      },
      props: { post },
    };
  });
}

export async function GET({ props }: { props: { post: { body?: string } } }) {
  const { post } = props;

  return new Response(post.body ?? '', {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

export const prerender = true;
