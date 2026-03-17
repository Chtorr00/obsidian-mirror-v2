
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'lib/data.ts');

function cleanup() {
    let content = fs.readFileSync(DATA_PATH, 'utf8');
    
    // Find the array part
    const arrayStart = content.indexOf('"articles": [');
    const arrayEnd = content.lastIndexOf('],');
    
    if (arrayStart === -1 || arrayEnd === -1) {
        console.error("Could not find articles array");
        return;
    }

    const header = content.substring(0, arrayStart + 13);
    const footer = content.substring(arrayEnd);
    const articlesStr = content.substring(arrayStart + 13, arrayEnd);

    // Split by article objects. This is tricky because of nested braces.
    // However, in this generated file, each article object starts at the beginning of a line with indentation.
    const articleBlocks = articlesStr.split(/\n\s{4}\{/);
    console.log(`Found ${articleBlocks.length} potential blocks`);

    const cleanedArticles = articleBlocks.map((block, index) => {
        if (!block.trim()) return "";
        
        let articleText = block.trim();
        if (!articleText.startsWith('{')) articleText = '{' + articleText;
        if (articleText.endsWith(',')) articleText = articleText.slice(0, -1);

        try {
            // Very risky but it's a controlled data file
            const article = eval('(' + articleText + ')');
            
            // --- CLEANING LOGIC ---
            article.order = index + (articleBlocks[0] === "" ? 0 : 1); 

            let body = article.body || "";
            // Remove Title, Image
            body = body.replace(/^# .*\n(\n)*/m, '');
            body = body.replace(/^!\[.*?\]\(.*?\)(\n)*/m, '');

            // Extract Source Meta
            const lines = body.split('\n');
            let metaLines = [];
            let foundUrl = false;
            let stopIdx = 0;

            for (let i = 0; i < Math.min(lines.length, 15); i++) {
                if (lines[i].trim().startsWith('http')) {
                    let j = i;
                    while (j + 1 < lines.length && (lines[j+1].trim().startsWith('http') || lines[j+1].trim() === '')) j++;
                    metaLines = lines.slice(0, j + 1);
                    stopIdx = j + 1;
                    foundUrl = true;
                    break;
                }
            }

            if (foundUrl) {
                const meta = {};
                const urls = metaLines.filter(l => l.trim().startsWith('http')).map(l => l.trim());
                const archiveUrl = urls.find(u => u.includes('archive.is') || u.includes('web.archive.org'));
                meta.url = archiveUrl || urls[0];

                const firstLine = metaLines.find(l => l.trim().length > 0)?.trim() || "";
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

                const nonUrl = metaLines.filter(l => l.trim().length > 0 && !l.trim().startsWith('http'));
                if (nonUrl.length >= 2) {
                    const pubDate = nonUrl[1].trim();
                    if (pubDate.includes(', ')) {
                        const parts = pubDate.split(', ');
                        meta.date = parts.pop();
                        meta.publication = parts.join(', ');
                    } else {
                        meta.publication = pubDate;
                    }
                }
                article.source_meta = meta;
                body = lines.slice(stopIdx).join('\n').trim();
            }

            // Remove boilerplate
            const boilerplate = /You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive\.\s*The Hindsight Filter has been applied to this artifact\./gi;
            body = body.replace(boilerplate, '').trim();

            // Preview
            let preview = body.replace(/\[\[(.*?)\]\]/g, '$1').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim();
            if (preview.length > 300) preview = preview.substring(0, 297) + "...";
            
            article.body = body;
            article.preview = preview;
            // --- END CLEANING ---

            return JSON.stringify(article, null, 2);
        } catch (e) {
            console.error(`Error processing article ${index}`, e);
            return articleText; 
        }
    });

    const newArticlesStr = "\n    " + cleanedArticles.filter(a => a.trim()).join(",\n    ");
    fs.writeFileSync(DATA_PATH, header + newArticlesStr + footer);
    console.log("Success! File rewriten.");
}

cleanup();
