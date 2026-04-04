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

const VAULT_DIR = path.join(process.cwd(), 'vault', 'articles');
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
 * Matches structure: "Title, by Author\nPublication, Date\nURL"
 */
function extractSourceMeta(body: string) {
    const lines = body.split('\n');
    let title = "";
    let author = "";
    let pub = "";
    let date = "";
    let url = "";

    // Search for URL first as the anchor
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const line = lines[i].trim().replace(/\r/g, '');
        if (line.startsWith('http')) {
            url = line;
            const intro = lines.slice(0, i).map(l => l.trim().replace(/\r/g, '')).filter(l => l.length > 0 && !l.startsWith('#'));
            
            if (intro.length >= 2) {
                // Line right before URL: Publication, Date
                const pubDateLine = intro[intro.length - 1];
                if (pubDateLine.includes(',')) {
                    const parts = pubDateLine.split(', ');
                    date = (parts.pop() || "").trim();
                    pub = parts.join(', ').trim();
                }

                // Line before that: Title info, Author
                const authorInfoLine = intro[intro.length - 2];
                if (authorInfoLine.includes(', by ') || authorInfoLine.includes(', By ')) {
                    const parts = authorInfoLine.split(/, [Bb]y /);
                    title = parts[0].trim();
                    author = parts[1].trim();
                } else if (authorInfoLine.includes(',')) {
                    const parts = authorInfoLine.split(',');
                    author = parts.pop()?.trim() || "";
                    title = parts.join(',').trim();
                } else {
                    author = authorInfoLine;
                }
            }
            break;
        }
    }

    return { title, author, publication: pub, date, url };
}

function harmonizeContent(content: string): string {
    let body = content;

    // 1. Convert various "Act X:" variants to "### Act X: Title"
    // Matches: "* **Act I: Title**", "Act I: Title", "Act I. Title", etc.
    // Handles bulleted, bolded, or plain text variants.
    // Regex breakdown:
    // ^\s*(\* )?(\*\*)?Act ([0-9IVX]+)[:.]?\s*([^\n\*]+)(\*\*)?
    // Matches optional bullet, optional bold, "Act", Roman/Arabic number, optional colon/period, and finally the title.
    body = body.replace(/^\s*(\* )?(\*\*)?Act ([0-9IVX]+)[:.]?\s*([^\n\*]+)\s*(\*\*)?.*$/gm, '### Act $3: $4');

    // 2. Ensure spacing after Act headers and remove trailing periods from headers
    body = body.replace(/^(### Act [0-9IVX]+:[^\n]+)\.?\n([^\n])/gm, '$1\n\n$2');

    // 3. Clean up any double headering (if it was already a header)
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
    
    // Split by H1 or H3 markers (H3 is used in some compiled files)
    // Using lookahead to keep the title in the chunk
    let chunks = sourceContent.split(/\n(?=###?\s)/);
    
    // If first chunk doesn't start with header, skip preamble
    if (!chunks[0].trim().startsWith('#')) {
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
      } else {
        console.log(`  ~ Exists: ${slug}.md`);
      }
    }
  }

  // --- SYNC PHASE ---
  if (!fs.existsSync(VAULT_DIR)) {
      console.error("❌ Vault directory not found!");
      return;
  }

  const files = fs.readdirSync(VAULT_DIR).filter(f => f.endsWith('.md'));
  const articles: ArticleMeta[] = [];

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
    
    // Merge: prioritize extracted over existing to fix broken data
    frontmatter.source_meta = {
        url: extracted.url || existing.url || "",
        title: extracted.title || existing.title || "",
        author: extracted.author || existing.author || "",
        date: extracted.date || existing.date || "",
        publication: extracted.publication || extracted.publication || ""
    };

    // 3. Clean up any \r remainders in the frontmatter itself
    Object.keys(frontmatter.source_meta).forEach(key => {
        if (typeof frontmatter.source_meta[key] === 'string') {
            frontmatter.source_meta[key] = frontmatter.source_meta[key].trim().replace(/\r/g, '');
        }
    });

    // 4. Extract Image Path
    const imgMatch = body.match(/!\[.*?\]\((.*?)\)/);
    let imagePath = frontmatter.image || (imgMatch ? imgMatch[1] : "");
    
    // 4. Clean Body for site storage
    let cleanBody = body
      .replace(/^# .*\n(\n)*/m, '')
      .replace(/^!\[.*?\]\(.*?\)(\n)*/m, '')
      .trim();

    // 5. Extract Acts
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

    // 6. WikiLinks
    const glossaryRefs = Array.from(new Set(
        (cleanBody.match(/\[\[(.*?)\]\]/g) || []).map(m => m.slice(2, -2).trim())
    ));

    // 7. Preview
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
      image: imagePath,
      acts: [...new Set(acts)].sort((a,b) => a-b),
      preview,
      body: cleanBody,
      month: frontmatter.month || "",
      glossary_refs: glossaryRefs,
      order: 0,
      source_meta: {
          url: frontmatter.source_meta.url || "",
          title: frontmatter.source_meta.title || "",
          author: frontmatter.source_meta.author || "",
          date: frontmatter.source_meta.date || "",
          publication: frontmatter.source_meta.publication || ""
      }
    });

    // Write back harmonized content and updated frontmatter
    const newContent = `---\n${yaml.dump(frontmatter)}---\n${body}`;
    fs.writeFileSync(filePath, newContent);
  }

  // Final assembly
  articles.sort((a, b) => a.title.localeCompare(b.title));
  articles.forEach((a, i) => a.order = i + 1);

  const dataExport = `export const SYNO_DATA = ${JSON.stringify({ articles }, null, 2)};\n`;
  fs.writeFileSync(DATA_PATH, dataExport);

  console.log(`\n✅ Success! Synchronized ${articles.length} articles.`);
  console.log(`✨ Harmonized "Acts" headers and persisted source metadata.`);
}

sync();
