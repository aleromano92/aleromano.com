import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

async function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { frontmatter: '', content: content };

    const frontmatter = match[1];
    const mainContent = content.slice(match[0].length).trim();
    return { frontmatter, content: mainContent };
}

async function translateWithClaude(content, fromLang, toLang) {
    const { frontmatter, content: mainContent } = await extractFrontmatter(content);

    // Prepare the prompt for Claude
    const prompt = `
You are a professional translator. Translate the following text from ${fromLang} to ${toLang}.

Rules:
1. DO NOT translate any code blocks (content between \`\`\` or \`).
2. DO NOT translate the word "DAJE" if present.
3. Keep all links and references intact.
4. Maintain the same markdown formatting.
5. For frontmatter (YAML between --- markers):
   - Translate only the title and description fields
   - Keep all other fields unchanged
   - Make sure to keep the same quotes and formatting
6. Preserve all HTML tags and their attributes.
7. Keep all emojis in their original form.

Here's the text to translate:

${content}

Please provide only the translated text, maintaining the exact same structure and formatting.`;

    try {
        // Use Cursor's built-in Claude access
        const { stdout, stderr } = await execAsync(`cursor --translate "${prompt}"`);

        if (stderr) {
            console.warn('Translation warning:', stderr);
        }

        return stdout.trim();
    } catch (error) {
        console.error('Translation failed:', error.message);
        throw new Error(`Translation failed: ${error.message}`);
    }
}

export async function translateMarkdownFile(filePath, fromLang, toLang) {
    try {
        console.log(`Reading file: ${filePath}`);
        const content = await readFile(filePath, 'utf-8');

        console.log(`Translating from ${fromLang} to ${toLang}...`);
        const translatedContent = await translateWithClaude(content, fromLang, toLang);

        if (!translatedContent) {
            throw new Error('Translation returned empty content');
        }

        return translatedContent;
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
        throw error;
    }
}