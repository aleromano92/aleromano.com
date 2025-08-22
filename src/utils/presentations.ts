import { getCollection, type CollectionEntry } from 'astro:content';
import type { SupportedLanguage } from '../types/i18n';

export interface PresentationInfo {
  slug: string;
  title: string;
  description?: string;
  language: SupportedLanguage;
  theme?: string;
  transition?: string;
}

/**
 * Check if a presentation exists for a given blog post slug and language
 */
export async function findPresentationByBlogPost(
  blogPostSlug: string, 
  language: SupportedLanguage
): Promise<PresentationInfo | null> {
  try {
    const presentations = await getCollection('presentations');
    
    const presentation = presentations.find((p: CollectionEntry<'presentations'>) => 
      p.data.blogPostSlug === blogPostSlug && 
      p.data.language === language
    );
    
    if (!presentation) {
      return null;
    }
    
    return {
      slug: presentation.slug,
      title: presentation.data.title,
      description: presentation.data.description,
      language: presentation.data.language as SupportedLanguage,
      theme: presentation.data.theme,
      transition: presentation.data.transition,
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
  // Split content by --- delimiters
  const slides = markdownContent
    .split(/^---$/gm)
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
