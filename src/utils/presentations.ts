import { getCollection, type CollectionEntry } from 'astro:content';
import type { SupportedLanguage } from '../types/i18n';

// Constants
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

/**
 * Extract blog post slug from a URL pathname
 * Handles trailing slashes and different URL structures robustly
 */
export function extractBlogPostSlugFromPathname(pathname: string): string {
  const pathParts = pathname.split('/').filter(part => part.length > 0);
  return pathParts[pathParts.length - 1]; // Last non-empty part
}

/**
 * Check if a presentation exists for a given blog post pathname and language
 */
export async function findPresentationByBlogPost(
  pathname: string, 
  language: SupportedLanguage
): Promise<PresentationInfo | null> {
  try {
    // Extract the blog post slug from the pathname
    const blogPostSlug = extractBlogPostSlugFromPathname(pathname);
    
    if (!blogPostSlug) {
      return null;
    }

    const presentations = await getCollection('presentations');
    
    // Only find exact language match - no fallbacks
    const presentation = presentations.find((p: CollectionEntry<'presentations'>) => 
      p.data.blogPostSlug === blogPostSlug && 
      p.data.language === language
    );
    
    if (!presentation) {
      return null;
    }
    
    // Found a matching presentation
    return {
      slug: presentation.slug,
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

/**
 * Parse markdown content into slides using --- delimiters
 */
export function parseSlides(markdownContent: string): string[] {
  // Split content by slide delimiters
  const slides = markdownContent
    .split(new RegExp(`^${SLIDE_DELIMITER}$`, 'gm'))
    .map(slide => slide.trim())
    .filter(slide => slide.length > 0);
  
  return slides;
}

/**
 * Generate presentation URL for a blog post
 */
export function getPresentationUrl(blogPostSlug: string, language: SupportedLanguage): string {
  const langPrefix = language === 'en' ? '' : `/${language}`;
  return `${langPrefix}/posts/${blogPostSlug}/present`;
}
