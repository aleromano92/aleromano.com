const WORDS_PER_MINUTE = 195;

export function stripHtmlToPlainText(content: string): string {
    const strippedHtml = content.replace(/<[^>]*>/g, ' ');

    return strippedHtml
        .replace(/[#*_~`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .trim();
}

export function getReadingTime(content: string): number {
    const cleanText = stripHtmlToPlainText(content);

    const words = cleanText.split(/\s+/).length;
    const minutes = Math.ceil(words / WORDS_PER_MINUTE);

    return Math.max(1, minutes);
} 