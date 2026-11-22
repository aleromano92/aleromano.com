import { getCollection, type CollectionEntry } from 'astro:content';
import type { SupportedLanguage } from '../types/i18n';

export const SLIDE_DELIMITER = '---';

export interface PresentationInfo {
  slug: string;
  title: string;
  description?: string;
  language: SupportedLanguage;
  theme?: string;
  transition?: string;
  url: string;
}

export function extractBlogPostSlugFromPathname(pathname: string): string {
  const pathParts = pathname.split('/').filter(part => part.length > 0);
  return pathParts[pathParts.length - 1];
}

export async function findPresentationByBlogPost(
  pathname: string, 
  language: SupportedLanguage
): Promise<PresentationInfo | null> {
  try {
    const blogPostSlug = extractBlogPostSlugFromPathname(pathname);
    
    if (!blogPostSlug) {
      return null;
    }

    const presentations = await getCollection('presentations');
    
    const presentation = presentations.find((p: CollectionEntry<'presentations'>) => 
      p.data.blogPostSlug === blogPostSlug && 
      p.data.language === language
    );
    
    if (!presentation) {
      return null;
    }
    
    return {
      slug: presentation.id,
      title: presentation.data.title,
      description: presentation.data.description,
      language: presentation.data.language as SupportedLanguage,
      theme: presentation.data.theme,
      transition: presentation.data.transition,
      url: getPresentationUrl(blogPostSlug, language)
    };
  } catch (error) {
    console.warn(`Error checking for presentation: ${error}`);
    return null;
  }
}

export function parseSlides(markdownContent: string): string[] {
  const slides = markdownContent
    .split(new RegExp(`^${SLIDE_DELIMITER}$`, 'gm'))
    .map(slide => slide.trim())
    .filter(slide => slide.length > 0);
  
  return slides;
}

export function getPresentationUrl(blogPostSlug: string, language: SupportedLanguage): string {
  const langPrefix = language === 'en' ? '' : `/${language}`;
  return `${langPrefix}/posts/${blogPostSlug}/present`;
}
