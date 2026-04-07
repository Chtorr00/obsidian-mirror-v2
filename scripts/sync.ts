import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * ----------------------------------------------------------------------------
 * OBSIDIAN MIRROR MASTER SYNC ENGINE
 * ----------------------------------------------------------------------------
 * 1. Synchronizes vault/articles/*.md with lib/data.ts
 * 2. Harmonizes Act headers: "Act I: Title" -> "### Act I: Title"
 * 3. Extracts metadata (Author, Pub, Date, URL) into structured fields.
 * 4. Generates standard 300-char site previews.
 * ----------------------------------------------------------------------------
 */

const ARCHIVE_ROOT = 'C:\\Users\\markj\\OneDrive\\Documents\\ObsidianArchive\\Mirror\\2026\\Weblog-Sources';
const VAULT_DIR = path.join(ARCHIVE_ROOT, 'articles');
const GLOSSARY_DIR = path.join(ARCHIVE_ROOT, 'glossary');
const DATA_PATH = path.join(process.cwd(), 'lib', 'data.ts');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images');

interface ArticleMeta {
  title: string;
  filename: string;
  primary: string;
  secondary: string[];
  image: string;
  acts: number[];
  preview: string;
  body: string;
  month: string;
  glossary_refs: string[];
  order: number;
  source_meta: {
    url: string;
    title: string;
    author: string;
    date: string;
    publication: string;
  };
}

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
 * Matches structure: "Author\nPublication, Date\nURL" or similar.
 * Returns the metadata, and the indices where the source block starts and ends.
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

    // Search for URL as the anchor - look for http anywhere in the line
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const rawLine = lines[i].trim().replace(/\r/g, '');
        if (rawLine.match(/https?:\/\//)) {
            url = rawLine.match(/(https?:\/\/[^\s\)\],]+)/)?.[1] || rawLine;
            sourceEndIndex = i;

            // Look backward to find the start of the citation block
            // Citation blocks usually start with a "By " line or a title.
            // We stop once we hit an image, a header, or multiple empty lines.
            let firstLineOfBlock = i;
            for (let j = i - 1; j >= 0; j--) {
                const l = lines[j].trim().replace(/\r/g, '');
                if (l.length === 0) continue;
                if (l.startsWith('#') || l.startsWith('![')) break;
                firstLineOfBlock = j;
                if (j < i - 4) break; // Blocks are usually 1-4 lines long
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

    // 1. Convert various "Act X:" variants to "### Act X: Title"
    body = body.replace(/^\s*(\* )?(\*\*)?Act ([0-9IVX]+)[:.]?\s*([^\n\*]+)\s*(\*\*)?.*$/gm, '### Act $3: $4');

    // 2. Ensure spacing after Act headers
    body = body.replace(/^(### Act [0-9IVX]+:[^\n]+)\.?\n([^\n])/gm, '$1\n\n$2');

    // 3. Clean up any double headering
    body = body.replace(/^#+ (### Act)/gm, '$1');

    return body.trim();
}

function sync() {
  const args = process.argv.slice(2);
  const ingestFile = args.find(a => a.startsWith('--ingest='))?.split('=')[1];
  const imagesDir = args.find(a => a.startsWith('--images='))?.split('=')[1];
  const targetMonth = args.find(a => a.startsWith('--month='))?.split('=')[1] || "March";

  console.log("🚀 Starting Obsidian Mirror Master Sync...");

  // --- INGESTION PHASE ---
  if (ingestFile && fs.existsSync(ingestFile)) {
    console.log(`\n📥 Ingesting new articles from: ${ingestFile}`);
    const sourceContent = fs.readFileSync(ingestFile, 'utf-8').replace(/\r\n/g, '\n');
    let chunks = sourceContent.split(/\n(?=###?\s)/);
    
    if (chunks[0] && !chunks[0].trim().startsWith('#')) {
        chunks.shift();
    }
    
    for (let chunk of chunks) {
      chunk = chunk.trim();
      if (chunk.length < 100) continue;
      
      const lines = chunk.split('\n');
      const titleLine = lines.find(l => l.startsWith('#')) || "# Unknown Title";
      const firstLine = titleLine.replace(/^#+\s+/, '').replace(/\*\*/g, '').trim();
      const slug = slugify(firstLine);
      const outPath = path.join(VAULT_DIR, `${slug}.md`);

      let matchedImage = "";
      if (imagesDir && fs.existsSync(imagesDir)) {
          const possibleImages = fs.readdirSync(imagesDir);
          const titleTokens = firstLine.toLowerCase().split(/\s+/).filter(t => t.length > 3);
          const match = possibleImages.find(img => {
              const lowerImg = img.toLowerCase();
              return titleTokens.some(token => lowerImg.includes(token));
          });
          
          if (match) {
              const dest = path.join(IMAGE_DIR, match);
              if (!fs.existsSync(dest)) {
                  fs.copyFileSync(path.join(imagesDir, match), dest);
              }
              matchedImage = `/images/${match}`;
          }
      }

      const content = `---\ntitle: "${firstLine}"\nprimary: General\nsecondary: []\nimage: "${matchedImage}"\nmonth: ${targetMonth}\n---\n${chunk}`;
      
      if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, content);
        console.log(`  + Created: ${slug}.md`);
      }
    }
  }

  // --- SYNC PHASE ---
  if (!fs.existsSync(VAULT_DIR)) {
      console.error("❌ Vault directory not found!");
      return;
  }

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

    // 1. Harmonize Body
    body = harmonizeContent(body);

    // 2. Extract Source Meta
    const extracted = extractSourceMeta(body);
    const existing = frontmatter.source_meta || {};
    
    frontmatter.source_meta = {
        url: extracted.meta.url || existing.url || "",
        title: extracted.meta.title || existing.title || "",
        author: extracted.meta.author || existing.author || "",
        date: extracted.meta.date || existing.date || "",
        publication: extracted.meta.publication || existing.publication || ""
    };

    // 3. Clean up frontmatter strings
    Object.keys(frontmatter.source_meta).forEach(key => {
        if (typeof frontmatter.source_meta[key] === 'string') {
            frontmatter.source_meta[key] = frontmatter.source_meta[key].trim().replace(/\r/g, '');
        }
    });

    // 4. Precise Excision: Remove the *block* from the body
    let bodyLines = body.split('\n');
    if (extracted.sourceStartIndex !== -1 && extracted.sourceEndIndex !== -1) {
        // Remove lines from startIndex to endIndex (inclusive)
        bodyLines.splice(extracted.sourceStartIndex, (extracted.sourceEndIndex - extracted.sourceStartIndex) + 1);
    }
    let cleanBody = bodyLines.join('\n').trim();

    // 5. Regular cleanup for the site view (remove duplicate H1 and Image)
    cleanBody = cleanBody
      .replace(/^# .*\n(\n)*/m, '')
      .replace(/^!\[.*?\]\(.*?\)(\n)*/m, '')
      .trim();

    // 6. Extract Acts
    const acts: number[] = [];
    const actMatches = Array.from(cleanBody.matchAll(/### Act ([0-9IVX]+)/g));
    for (const match of actMatches) {
        const roman = match[1];
        if (roman === 'I') acts.push(1);
        else if (roman === 'II') acts.push(2);
        else if (roman === 'III') acts.push(3);
        else if (roman === 'IV') acts.push(4);
    }
    if (acts.length === 0) acts.push(1);

    // 7. WikiLinks
    const glossaryRefs = Array.from(new Set(
        (cleanBody.match(/\[\[(.*?)\]\]/g) || []).map(m => m.slice(2, -2).trim())
    ));

    // 8. Preview
    let preview = cleanBody
      .replace(/\[\[(.*?)\]\]/g, '$1') 
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/[*_#`>]/g, '') 
      .replace(/\s+/g, ' ') 
      .trim();
    
    if (preview.length > 300) {
      preview = preview.substring(0, 297) + "...";
    }

    articles.push({
      title: frontmatter.title || filename.replace('.md', ''),
      filename,
      primary: frontmatter.primary || "General",
      secondary: frontmatter.secondary || [],
      image: frontmatter.image || (cleanBody.match(/!\[.*?\]\((.*?)\)/) ? cleanBody.match(/!\[.*?\]\((.*?)\)/)![1] : ""),
      acts: [...new Set(acts)].sort((a,b) => a-b),
      preview,
      body: cleanBody,
      month: frontmatter.month || "",
      glossary_refs: glossaryRefs,
      order: frontmatter.order || 0,
      source_meta: frontmatter.source_meta
    });

    const newContent = `---\n${yaml.dump(frontmatter)}---\n${body}`;
    fs.writeFileSync(filePath, newContent);
  }

  // 10. Process Glossary Entries
  if (fs.existsSync(GLOSSARY_DIR)) {
    const glossaryFiles = fs.readdirSync(GLOSSARY_DIR).filter(f => f.endsWith('.md'));
    for (const filename of glossaryFiles) {
      const filePath = path.join(GLOSSARY_DIR, filename);
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      
      const parts = rawContent.split('---');
      if (parts.length < 3) continue;

      const frontmatter = yaml.load(parts[1]) as any;
      const body = parts.slice(2).join('---').trim();
      
      // Aggressive glossary cleaning
      const cleanDescription = body
        .replace(/^# .*\r?\n/m, '')
        .replace(/^\*\*Timeline:\*\* .*\r?\n/m, '')
        .replace(/^\s*\n/m, '')
        .trim();
      
      let preview = cleanDescription
        .replace(/\[\[(.*?)\]\]/g, '$1')
        .replace(/[*_#`>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (preview.length > 250) {
          preview = preview.substring(0, 247) + "...";
      }

      glossaryEntries.push({
        term: frontmatter.term || filename.replace('.md', '').replace(/_/g, ' '),
        years: frontmatter.years || "",
        description: cleanDescription,
        preview
      });
    }
  }

  // Final assembly
  // Sort by 'order' from frontmatter if available, otherwise fallback to title
  articles.sort((a, b) => {
    if (a.order && b.order) return a.order - b.order;
    if (a.order) return -1;
    if (b.order) return 1;
    return a.title.localeCompare(b.title);
  });

  // Assign order only to those that don't have it, starting after the max existing order
  const hasExistingOrders = articles.some(a => (a.order || 0) > 0);
  if (!hasExistingOrders) {
    articles.forEach((a, i) => a.order = i + 1);
  }

  glossaryEntries.sort((a, b) => a.term.localeCompare(b.term));

  const dataExport = `export const SYNO_DATA = ${JSON.stringify({ articles, glossary: glossaryEntries }, null, 2)};\n`;
  fs.writeFileSync(DATA_PATH, dataExport);

  console.log(`\n✅ Success! Synchronized ${articles.length} articles and ${glossaryEntries.length} glossary entries.`);
  console.log(`✨ Harmonized "Acts" headers, promoted metadata, and restored glossary.`);
}

sync();
