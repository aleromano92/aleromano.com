const WORDS_PER_MINUTE = 195; // Average adult reading speed

export function getReadingTime(content: string): number {
    // Remove HTML tags
    const strippedHtml = content.replace(/<[^>]*>/g, ' ');
    
    // Remove markdown syntax and extra whitespace
    const cleanText = strippedHtml
        .replace(/[#*_~`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\[\[.*?\]\]/g, '') // Remove wiki-style links
        .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image references
        .trim();

    const words = cleanText.split(/\s+/).length;
    const minutes = Math.ceil(words / WORDS_PER_MINUTE);

    return Math.max(1, minutes); // Ensure at least 1 minute reading time
} 