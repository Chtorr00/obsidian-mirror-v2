import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * ----------------------------------------------------------------------------
 * OBSIDIAN MIRROR MASTER SYNC ENGINE (v2.1)
 * ----------------------------------------------------------------------------
 * Unified Pipeline:
 * 1. Ingest: Auto-scan om_docs/Obsidian Mirror/ for new .md batches.
 * 2. Propagate: Sync from Archive Vault to local project (content/sources).
 * 3. Sync: Harmonize, Extract Meta, Re-index, and Generate lib/data.ts.
 * 4. Finalize: Archive source batch to permanent storage (explicit --finalize).
 * ----------------------------------------------------------------------------
 */

const WORKING_COPY_DIR = path.join(process.cwd(), 'om_docs', 'Obsidian Mirror');
const LOCAL_ARCHIVE_ROOT = 'C:\\Users\\markj\\OneDrive\\Documents\\ObsidianArchive\\Mirror\\2026\\Weblog-Sources';
const ARCHIVE_VAULT_BATCHES = 'C:\\Users\\markj\\OneDrive\\Documents\\ObsidianArchive\\Obsidian Mirror\\';
const PROJECT_SOURCES_DIR = path.join(process.cwd(), 'content', 'sources');
const DATA_PATH = path.join(process.cwd(), 'lib', 'data.ts');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images');

const monthMap: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

function slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
}

/**
 * Extracts source metadata from a text block
 */
function extractSourceMeta(body: string) {
    const lines = body.split('\n');
    let title = "";
    let author = "";
    let pub = "";
    let date = "";
    let url = "";
    let sourceStartIndex = -1;
    let sourceEndIndex = -1;

    for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const rawLine = lines[i].trim().replace(/\r/g, '');
        if (rawLine.match(/https?:\/\//)) {
            url = rawLine.match(/(https?:\/\/[^\s\)\],]+)/)?.[1] || rawLine;
            sourceEndIndex = i;

            let firstLineOfBlock = i;
            for (let j = i - 1; j >= 0; j--) {
                const l = lines[j].trim().replace(/\r/g, '');
                if (l.length === 0) continue;
                if (l.startsWith('#') || l.startsWith('![')) break;
                firstLineOfBlock = j;
                if (j < i - 4) break;
            }
            sourceStartIndex = firstLineOfBlock;
            
            const blockLines = lines.slice(sourceStartIndex, sourceEndIndex).map(l => l.trim().replace(/\r/g, ''));
            
            if (blockLines.length >= 2) {
                const pubDateLine = blockLines[blockLines.length - 1];
                if (pubDateLine.includes(',')) {
                    const parts = pubDateLine.split(',');
                    const lastPart = parts.pop()?.trim() || "";
                    if (lastPart.match(/\d{4}/)) {
                        date = lastPart;
                        pub = parts.join(',').trim();
                    } else {
                        pub = pubDateLine;
                    }
                } else {
                    pub = pubDateLine;
                }

                const authorLine = blockLines[0].replace(/[\*#]/g, '').trim();
                if (authorLine.match(/, [Bb]y /)) {
                    const parts = authorLine.split(/, [Bb]y /);
                    title = parts[0].trim();
                    author = parts[1].trim();
                } else if (authorLine.match(/^[Bb]y /)) {
                    author = authorLine.replace(/^[Bb]y /i, '').trim();
                    title = blockLines.length > 2 ? blockLines[0] : "";
                } else {
                    author = authorLine;
                }
            } else if (blockLines.length === 1) {
                author = blockLines[0].replace(/[\*#]/g, '').trim();
            }
            break;
        }
    }

    return {
        meta: { url, title, author, publication: pub, date },
        sourceStartIndex,
        sourceEndIndex
    };
}

function harmonizeContent(content: string): string {
    let body = content;
    body = body.replace(/^\s*(\* )?(\*\*)?Act ([0-9IVX]+)[:.]?\s*([^\n\*]+)\s*(\*\*)?.*$/gm, '### Act $3: $4');
    body = body.replace(/^(### Act [0-9IVX]+:[^\n]+)\.?\n([^\n])/gm, '$1\n\n$2');
    body = body.replace(/^#+ (### Act)/gm, '$1');
    return body.trim();
}

/**
 * PHASE 1: Ingestion from om_docs/
 */
function ingestFromWorkingCopy(targetMonth: string, imagesDir?: string) {
    console.log("\n🔍 Phase 1: Discovering new batches in om_docs...");
    if (!fs.existsSync(WORKING_COPY_DIR)) {
        console.warn(`⚠️ Working copy directory not found: ${WORKING_COPY_DIR}`);
        return [];
    }

    const batches = fs.readdirSync(WORKING_COPY_DIR).filter(f => f.endsWith('.md'));
    if (batches.length === 0) {
        console.log("  - No new markdown batches found.");
        return [];
    }

    const vaultArticlesDir = path.join(LOCAL_ARCHIVE_ROOT, 'articles');
    if (!fs.existsSync(vaultArticlesDir)) fs.mkdirSync(vaultArticlesDir, { recursive: true });

    for (const batch of batches) {
        console.log(`📥 Ingesting batch: ${batch}`);
        const batchPath = path.join(WORKING_COPY_DIR, batch);
        const sourceContent = fs.readFileSync(batchPath, 'utf-8').replace(/\r\n/g, '\n');
        
        // Fix: Use a more specific split to avoid fragmenting articles at "Act" or sub-headers
        // We look for headers that are NOT Acts or numbered lists
        let chunks = sourceContent.split(/\n(?=###?\s(?!\*\*?Act|I\.|II\.|III\.|IV\.|V\.))/);
        
        // Alternative: If articles are always separated by ---, we could use that,
        // but often the batch files use ### as the primary delimiter.
        
        if (chunks[0] && !chunks[0].trim().includes('###')) chunks.shift();

        for (let chunk of chunks) {
            chunk = chunk.trim();
            if (chunk.length < 100) continue;

            const lines = chunk.split('\n');
            const titleLine = lines.find(l => l.startsWith('#')) || "# Unknown Title";
            const title = titleLine.replace(/^#+\s+/, '').replace(/\*\*/g, '').trim();
            const slug = slugify(title);
            const outPath = path.join(vaultArticlesDir, `${slug}.md`);

            let matchedImage = "";
            if (imagesDir && fs.existsSync(imagesDir)) {
                const possibleImages = fs.readdirSync(imagesDir);
                const titleTokens = title.toLowerCase().split(/\s+/).filter(t => t.length > 3);
                const match = possibleImages.find(img => {
                    const lowerImg = img.toLowerCase();
                    return titleTokens.some(token => lowerImg.includes(token));
                });
                
                if (match) {
                    const dest = path.join(IMAGE_DIR, match);
                    if (!fs.existsSync(dest)) fs.copyFileSync(path.join(imagesDir, match), dest);
                    matchedImage = `/images/${match}`;
                }
            }

            const frontmatter = {
                title,
                primary: 'General',
                secondary: [],
                image: matchedImage,
                month: targetMonth,
                status: 'published',
                source_meta: { url: '', title: '', author: '', date: '', publication: '' }
            };

            const finalContent = `---\n${yaml.dump(frontmatter)}---\n${chunk}`;
            if (!fs.existsSync(outPath)) {
                fs.writeFileSync(outPath, finalContent);
                console.log(`  + Created: ${slug}.md in Archive Vault`);
            } else {
                console.log(`  ~ Skipping: ${slug}.md (already in Archive Vault)`);
            }
        }
    }
    return batches;
}

/**
 * PHASE 2: Propagation to Live Content
 */
function propagateToLiveContent() {
    console.log("\n📡 Phase 2: Propagating Archive to Live Content...");
    const vaultArticlesDir = path.join(LOCAL_ARCHIVE_ROOT, 'articles');
    const localArticlesDir = path.join(PROJECT_SOURCES_DIR, 'articles');
    const vaultGlossaryDir = path.join(LOCAL_ARCHIVE_ROOT, 'glossary');
    const localGlossaryDir = path.join(PROJECT_SOURCES_DIR, 'glossary');

    if (!fs.existsSync(vaultArticlesDir)) {
        console.error("❌ Master Archive Vault not found!");
        return;
    }

    if (!fs.existsSync(localArticlesDir)) {
        fs.mkdirSync(localArticlesDir, { recursive: true });
    } else {
        const localFiles = fs.readdirSync(localArticlesDir);
        for (const f of localFiles) fs.unlinkSync(path.join(localArticlesDir, f));
    }

    const articles = fs.readdirSync(vaultArticlesDir).filter(f => f.endsWith('.md'));
    for (const file of articles) {
        fs.copyFileSync(path.join(vaultArticlesDir, file), path.join(localArticlesDir, file));
    }

    if (fs.existsSync(vaultGlossaryDir)) {
        if (!fs.existsSync(localGlossaryDir)) {
            fs.mkdirSync(localGlossaryDir, { recursive: true });
        } else {
            const localG = fs.readdirSync(localGlossaryDir);
            for (const f of localG) fs.unlinkSync(path.join(localGlossaryDir, f));
        }
        const glossary = fs.readdirSync(vaultGlossaryDir).filter(f => f.endsWith('.md'));
        for (const file of glossary) {
            fs.copyFileSync(path.join(vaultGlossaryDir, file), path.join(localGlossaryDir, file));
        }
    }
    console.log(`  ✓ Synced ${articles.length} articles to project.`);
}

/**
 * PHASE 3: Synchronization & Data Generation
 */
function syncEngine() {
    console.log("\n🔄 Phase 3: Synchronizing Data Store...");
    const VAULT_DIR = path.join(PROJECT_SOURCES_DIR, 'articles');
    const GLOSSARY_DIR = path.join(PROJECT_SOURCES_DIR, 'glossary');
    const today = new Date().toISOString().split('T')[0];

    if (!fs.existsSync(VAULT_DIR)) return;

    const files = fs.readdirSync(VAULT_DIR).filter(f => f.endsWith('.md'));
    const articles: any[] = [];
    const glossaryEntries: any[] = [];

    for (const filename of files) {
        const filePath = path.join(VAULT_DIR, filename);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parts = rawContent.split('---');
        if (parts.length < 3) continue;

        const frontmatter = yaml.load(parts[1]) as any;
        let body = parts.slice(2).join('---').trim();
        body = harmonizeContent(body);

        // Metadata Extraction
        const extracted = extractSourceMeta(body);
        const existing = frontmatter.source_meta || {};
        frontmatter.source_meta = {
            url: extracted.meta.url || existing.url || "",
            title: extracted.meta.title || existing.title || "",
            author: extracted.meta.author || existing.author || "",
            date: extracted.meta.date || existing.date || "",
            publication: extracted.meta.publication || existing.publication || ""
        };

        // Metadata Validation Warnings
        const meta = frontmatter.source_meta;
        if (!meta.author) console.warn(`  ⚠️ Missing Author: ${filename}`);
        if (!meta.date) console.warn(`  ⚠️ Missing Date: ${filename}`);

        // Cleanup body
        let bodyLines = body.split('\n');
        if (extracted.sourceStartIndex !== -1 && extracted.sourceEndIndex !== -1) {
            bodyLines.splice(extracted.sourceStartIndex, (extracted.sourceEndIndex - extracted.sourceStartIndex) + 1);
        }
        let cleanBody = bodyLines.join('\n').trim()
            .replace(/^# .*\n(\n)*/m, '')
            .replace(/^!\[.*?\]\(.*?\)(\n)*/m, '')
            .trim();

        // Acts & Refs
        const acts: number[] = [];
        const actMatches = Array.from(cleanBody.matchAll(/### Act ([0-9IVX]+)/g));
        for (const m of actMatches) {
            const r = m[1];
            if (r === 'I') acts.push(1); else if (r === 'II') acts.push(2); else if (r === 'III') acts.push(3); else if (r === 'IV') acts.push(4);
        }
        if (acts.length === 0) acts.push(1);

        const glossaryRefs = Array.from(new Set((cleanBody.match(/\[\[(.*?)\]\]/g) || []).map(m => m.slice(2, -2).trim())));

        // Preview
        let preview = cleanBody.replace(/\[\[(.*?)\]\]/g, '$1').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim();
        if (preview.length > 300) preview = preview.substring(0, 297) + "...";

        articles.push({
            title: frontmatter.title || filename.replace('.md', ''),
            filename,
            primary: frontmatter.primary || "General",
            secondary: frontmatter.secondary || [],
            image: frontmatter.image || (cleanBody.match(/!\[.*?\]\((.*?)\)/)?.[1] || ""),
            acts: [...new Set(acts)].sort((a,b) => a-b),
            preview,
            body: cleanBody,
            month: frontmatter.month || "",
            glossary_refs: glossaryRefs,
            order: frontmatter.order || 0,
            source_meta: frontmatter.source_meta,
            status: frontmatter.status || 'published',
            publish_date: frontmatter.publish_date || "",
            series: frontmatter.series || ""
        });

        const newContent = `---\n${yaml.dump(frontmatter)}---\n${body}`;
        fs.writeFileSync(filePath, newContent);
        // Also update Master Archive if possible
        const masterPath = path.join(LOCAL_ARCHIVE_ROOT, 'articles', filename);
        if (fs.existsSync(masterPath)) fs.writeFileSync(masterPath, newContent);
    }

    // Glossary
    if (fs.existsSync(GLOSSARY_DIR)) {
        const gFiles = fs.readdirSync(GLOSSARY_DIR).filter(f => f.endsWith('.md'));
        for (const filename of gFiles) {
            const raw = fs.readFileSync(path.join(GLOSSARY_DIR, filename), 'utf-8');
            const parts = raw.split('---');
            if (parts.length < 3) continue;
            const fm = yaml.load(parts[1]) as any;
            const b = parts.slice(2).join('---').trim();
            const desc = b.replace(/^# .*\r?\n/m, '').replace(/^\*\*Timeline:\*\* .*\r?\n/m, '').trim();
            let p = desc.replace(/\[\[(.*?)\]\]/g, '$1').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim();
            if (p.length > 250) p = p.substring(0, 247) + "...";
            glossaryEntries.push({ term: fm.term || filename.replace('.md', '').replace(/_/g, ' '), years: fm.years || "", description: desc, preview: p });
        }
    }

    // Sorting & Re-indexing
    articles.sort((a, b) => {
        const getYear = (art: any) => {
            const match = (art.source_meta?.date || "").match(/\d{4}/);
            if (match) return parseInt(match[0]);
            return (art.month === 'April' || art.month === 'March') ? 2026 : 2025;
        };
        const yearA = getYear(a), yearB = getYear(b);
        if (yearA !== yearB) return yearA - yearB;
        const monthA = monthMap[a.month] || 0, monthB = monthMap[b.month] || 0;
        if (monthA !== monthB) return monthA - monthB;
        if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
        return a.title.localeCompare(b.title);
    });

    articles.forEach((a, i) => {
        const newOrder = i + 1;
        if (a.order !== newOrder) {
            const filePath = path.join(VAULT_DIR, a.filename);
            const content = fs.readFileSync(filePath, 'utf-8');
            fs.writeFileSync(filePath, content.replace(/order:\s*\d+/, `order: ${newOrder}`));
            // Update master too
            const masterPath = path.join(LOCAL_ARCHIVE_ROOT, 'articles', a.filename);
            if (fs.existsSync(masterPath)) {
                const masterContent = fs.readFileSync(masterPath, 'utf-8');
                fs.writeFileSync(masterPath, masterContent.replace(/order:\s*\d+/, `order: ${newOrder}`));
            }
            a.order = newOrder;
        }
    });

    const filtered = articles.filter(a => a.status !== 'draft' && (!a.publish_date || a.publish_date <= today));
    const dataExport = `export const SYNO_DATA = ${JSON.stringify({ articles: filtered, glossary: glossaryEntries.sort((a,b) => a.term.localeCompare(b.term)) }, null, 2)};\n`;
    fs.writeFileSync(DATA_PATH, dataExport);
    console.log(`✅ Success! Synced ${filtered.length} articles and ${glossaryEntries.length} glossary entries.`);
}

/**
 * PHASE 4: Finalization (Move processed batches)
 */
function finalizeBatches(batches: string[]) {
    console.log("\n📦 Phase 4: Finalizing source batches...");
    if (!fs.existsSync(ARCHIVE_VAULT_BATCHES)) return;
    for (const batch of batches) {
        const src = path.join(WORKING_COPY_DIR, batch);
        const dest = path.join(ARCHIVE_VAULT_BATCHES, batch);
        if (fs.existsSync(src)) {
            fs.renameSync(src, dest);
            console.log(`  ✓ Archived: ${batch}`);
        }
    }
}

function main() {
    const args = process.argv.slice(2);
    const targetMonth = args.find(a => a.startsWith('--month='))?.split('=')[1] || "May";
    const imagesDir = args.find(a => a.startsWith('--images='))?.split('=')[1];
    const shouldFinalize = args.includes('--finalize');

    console.log("🚀 Starting Obsidian Mirror Master Sync (Unified Pipeline)...");
    
    const batches = ingestFromWorkingCopy(targetMonth, imagesDir);
    propagateToLiveContent();
    syncEngine();
    
    if (shouldFinalize && batches.length > 0) {
        finalizeBatches(batches);
    } else if (batches.length > 0) {
        console.log("\n💡 Note: Source batches were NOT archived. Run with --finalize after Git push to clean up om_docs.");
    }
}

main();
