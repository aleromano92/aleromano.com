#!/usr/bin/env node

/**
 * CV Generation Script
 * Generates a PDF CV from the work experience data in BaseAbout.astro
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract work experience data from BaseAbout.astro
 */
function extractWorkExperienceFromAstro() {
    const astroFilePath = path.join(__dirname, '..', 'src', 'components', 'pages', 'BaseAbout.astro');
    const content = fs.readFileSync(astroFilePath, 'utf-8');

    // Extract the aboutTranslations object
    const translationsMatch = content.match(/export const aboutTranslations[^=]*=\s*([\s\S]*?);(?=\s*(?:export|const|let|var|function|class|$))/);
    if (!translationsMatch) {
        throw new Error('Could not find aboutTranslations object in BaseAbout.astro');
    }

    // Parse the translations object as JavaScript
    let translationsObject;
    try {
        // Create a safe evaluation context
        const translationsCode = `const aboutTranslations = ${translationsMatch[1]}; aboutTranslations;`;
        translationsObject = eval(translationsCode);
    } catch (error) {
        throw new Error(`Failed to parse aboutTranslations object: ${error.message}`);
    }

    // Get English translations
    const en = translationsObject.en;
    if (!en) {
        throw new Error('Could not find English translations in aboutTranslations object');
    }

    // Extract job data using the parsed object
    const jobs = [];

    // Extract Mollie data
    if (en.mollieTitle && en.mollieRole && en.molliePeriod && en.mollieDescription) {
        jobs.push({
            company: en.mollieTitle,
            role: en.mollieRole,
            period: en.molliePeriod,
            description: en.mollieDescription,
            achievements: en.mollieAchievements || [],
            isCurrent: true
        });
    }

    // Extract Banca AideXa data
    if (en.bancaAideXaTitle && en.bancaAideXaRole && en.bancaAideXaPeriod && en.bancaAideXaDescription) {
        jobs.push({
            company: en.bancaAideXaTitle,
            role: en.bancaAideXaRole,
            period: en.bancaAideXaPeriod,
            description: en.bancaAideXaDescription,
            achievements: en.bancaAideXaAchievements || [],
            isCurrent: false
        });
    }

    // Extract lastminute.com data
    if (en.lastminuteTitle && en.lastminuteRole && en.lastminutePeriod && en.lastminuteDescription) {
        jobs.push({
            company: en.lastminuteTitle,
            role: en.lastminuteRole,
            period: en.lastminutePeriod,
            description: en.lastminuteDescription,
            achievements: en.lastminuteAchievements || [],
            isCurrent: false
        });
    }

    return { jobs };
}

/**
 * Escape special characters for PDF
 */
function escapePdfString(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/'/g, "'")
        .replace(/"/g, '"')
        .substring(0, 120); // Limit length for PDF
}

/**
 * Generate PDF content
 */
function generatePDF(data) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });

    // Calculate content length for PDF structure
    let contentLength = 1500; // Base content
    data.jobs.forEach(job => {
        contentLength += job.company.length + job.role.length + job.period.length + job.description.length;
        contentLength += job.achievements.reduce((acc, achievement) => acc + achievement.length, 0);
    });

    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${contentLength}
>>
stream
BT
/F1 24 Tf
50 750 Td
(Alessandro Romano) Tj
0 -25 Td
/F2 12 Tf
(Engineering Manager | Software Engineer | Team Leader) Tj
0 -15 Td
(Email: hello@aleromano.com) Tj
0 -12 Td
(Website: aleromano.com | X: @_aleromano) Tj
0 -12 Td
(LinkedIn: linkedin.com/in/alessandroromano92) Tj
0 -25 Td
(Generated: ${currentDate}) Tj
0 -35 Td
/F1 16 Tf
(Professional Experience) Tj
${data.jobs.map((job) => {
        const isCurrentText = job.isCurrent ? ' (Current)' : '';
        return `
0 -25 Td
/F1 14 Tf
(${escapePdfString(job.company)} - ${escapePdfString(job.role)}${isCurrentText}) Tj
0 -15 Td
/F2 10 Tf
(${escapePdfString(job.period)}) Tj
0 -12 Td
(${escapePdfString(job.description)}) Tj
${job.achievements.slice(0, 4).map((achievement) => `
0 -12 Td
(• ${escapePdfString(achievement)}) Tj`).join('')}`;
    }).join('')}
0 -30 Td
/F1 14 Tf
(Core Skills & Technologies) Tj
0 -15 Td
/F2 10 Tf
(Engineering Management, Team Leadership, Software Architecture) Tj
0 -12 Td
(TypeScript, JavaScript, Node.js, Cloud Architecture, Azure) Tj
0 -12 Td
(System Design, Microservices, DevOps, CI/CD Pipelines) Tj
0 -12 Td
(Mentoring, Technical Strategy, Cross-functional Collaboration) Tj
0 -25 Td
/F1 14 Tf
(Languages) Tj
0 -15 Td
/F2 10 Tf
(Italian \\(Native\\), English \\(Fluent\\)) Tj
0 -25 Td
/F1 14 Tf
(Location) Tj
0 -15 Td
/F2 10 Tf
(Busto Arsizio, Italy \\(Near Milan\\)) Tj
0 -25 Td
/F2 8 Tf
(This CV is automatically generated from aleromano.com/about) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000245 00000 n 
${1000 + contentLength} 00000 n 
${1080 + contentLength} 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
${1150 + contentLength}
%%EOF`;

    return pdfContent;
}

try {
    console.log('📄 Extracting work experience data from BaseAbout.astro...');
    const workExperienceData = extractWorkExperienceFromAstro();

    console.log(`✅ Found ${workExperienceData.jobs.length} job entries:`);
    workExperienceData.jobs.forEach(job => {
        console.log(`   - ${job.company} (${job.role}) - ${job.achievements.length} achievements`);
    });

    console.log('📄 Generating PDF...');
    const pdfContent = generatePDF(workExperienceData);

    // Write to public directory
    const publicDir = path.join(__dirname, '..', 'public');
    const cvPath = path.join(publicDir, 'cv-alessandro-romano.pdf');

    fs.writeFileSync(cvPath, pdfContent);
    console.log('✅ CV generated successfully at:', cvPath);

} catch (error) {
    console.error('❌ Error generating CV:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
