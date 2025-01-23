import { writeFile, readdir, access, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { translateMarkdownFile } from './claude.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../src/content');

async function fileExists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

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

async function findMissingTranslations() {
    const languages = ['en', 'it'];
    const contentTypes = ['blog'];

    for (const contentType of contentTypes) {
        for (const sourceLang of languages) {
            const targetLang = sourceLang === 'en' ? 'it' : 'en';

            const sourceDir = join(contentDir, contentType, sourceLang);
            const files = await readdir(sourceDir);

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                const sourcePath = join(sourceDir, file);
                const targetPath = join(contentDir, contentType, targetLang, file);

                if (!(await fileExists(targetPath))) {
                    console.log(`Found missing translation: ${targetPath}`);
                    await processFile(sourcePath, sourceLang, targetLang);
                }
            }
        }
    }
}

findMissingTranslations().catch(console.error); 