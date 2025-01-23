import { writeFile, readdir, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { translateMarkdownFile } from './claude.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../src/content');

async function processFile(filePath, fromLang, toLang) {
    console.log(`Translating ${filePath} from ${fromLang} to ${toLang}...`);
    const translatedContent = await translateMarkdownFile(filePath, fromLang, toLang);

    const dir = dirname(filePath);
    const baseDir = dir.replace(`/${fromLang}/`, `/${toLang}/`);
    const fileName = basename(filePath);

    // Create target directory if it doesn't exist
    await mkdir(baseDir, { recursive: true });

    const targetPath = join(baseDir, fileName);
    await writeFile(targetPath, translatedContent);

    console.log(`Translated ${filePath} to ${targetPath}`);
}

async function translateFiles(fromLang = 'it', toLang = 'en') {
    // Process blog posts
    const blogDir = join(contentDir, 'blog', fromLang);
    const posts = await readdir(blogDir);

    for (const post of posts) {
        if (post.endsWith('.md')) {
            await processFile(join(blogDir, post), fromLang, toLang);
        }
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const fromLang = args[0] || 'it';
const toLang = args[1] || 'en';

translateFiles(fromLang, toLang).catch(console.error); 