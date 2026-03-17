
import { SYNO_DATA } from '../lib/data';
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(process.cwd(), 'lib', 'data.ts');

function cleanup() {
  console.log("Starting data cleanup...");
  const articles = SYNO_DATA.articles as any[];
  const total = articles.length;

  articles.forEach((article: any, index: number) => {
    // 1. Assign sequential order (1 to total)
    // Order 1 is the first entry in array, total is last.
    // We will show total down to 1 on the site.
    article.order = index + 1;

    // 2. Clean the body and extract source meta
    let body = article.body || "";

    // Remove leading H1 and Image
    // Use a multi-line regex for robust removal
    body = body.replace(/^# .*\n(\n)*/m, '');
    body = body.replace(/^!\[.*?\]\(.*?\)(\n)*/m, '');
    
    const lines = body.split('\n');
    let metaLines: string[] = [];
    let cleanBodyLines: string[] = [];
    let foundMeta = false;
    let stopIdx = 0;

    // Search for the URL to delimit metadata
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
        const line = lines[i].trim();
        if (line.startsWith('http')) {
            // Check if next line is also a URL
            let currentIdx = i;
            while (currentIdx + 1 < lines.length && (lines[currentIdx+1].trim().startsWith('http') || lines[currentIdx+1].trim() === '')) {
                currentIdx++;
            }
            metaLines = lines.slice(0, currentIdx + 1);
            stopIdx = currentIdx + 1;
            foundMeta = true;
            break;
        }
    }

    if (foundMeta) {
        cleanBodyLines = lines.slice(stopIdx);
        
        // Parse the meta lines
        const meta: any = {};
        const urls = metaLines.filter(l => l.trim().startsWith('http')).map(l => l.trim());
        const archiveUrl = urls.find(u => u.includes('archive.is') || u.includes('web.archive.org'));
        meta.url = archiveUrl || urls[0];

        // Guess Title/Author (usually the first non-empty line after title removal)
        // Note: the removal above doesn't always catch everything if there's leading whitespace
        const firstLine = metaLines.find(l => l.trim().length > 0)?.trim() || "";
        if (firstLine) {
            if (firstLine.includes(', by ')) {
                const parts = firstLine.split(', by ');
                meta.title = parts[0];
                meta.author = parts[1];
            } else if (firstLine.includes(', By ')) {
                const parts = firstLine.split(', By ');
                meta.title = parts[0];
                meta.author = parts[1];
            } else {
                meta.title = firstLine;
            }
        }

        // Guess Publication/Date (usually the second line)
        const nonUrlMeta = metaLines.filter(l => l.trim().length > 0 && !l.trim().startsWith('http'));
        if (nonUrlMeta.length >= 2) {
            const pubLine = nonUrlMeta[1].trim();
            if (pubLine.includes(', ')) {
                const parts = pubLine.split(', ');
                meta.date = parts.pop();
                meta.publication = parts.join(', ');
            } else {
                meta.publication = pubLine;
            }
        }

        article.source_meta = meta;
        body = cleanBodyLines.join('\n').trim();
    }

    // 3. Remove "archaeological diagnostic" and "Hindsight Filter" boilerplate
    // Also remove the "Here is the constellation of this history" if needed? User didn't ask but good for clean body
    const boilerplateRegex = /You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive\.\s*The Hindsight Filter has been applied to this artifact\./gi;
    body = body.replace(boilerplateRegex, '').trim();

    // 4. Update preview from CLEAN body
    let cleanPreview = body
      .replace(/\[\[(.*?)\]\]/g, '$1') 
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/[*_#`>]/g, '') 
      .replace(/\s+/g, ' ') 
      .trim();
    
    if (cleanPreview.length > 300) {
      cleanPreview = cleanPreview.substring(0, 297) + "...";
    }
    article.preview = cleanPreview;
    article.body = body;
  });

  const newContent = `export const SYNO_DATA = ${JSON.stringify(SYNO_DATA, null, 2)};\n`;
  fs.writeFileSync(DATA_PATH, newContent);
  console.log(`Success! Cleaned ${total} articles.`);
}

cleanup();
