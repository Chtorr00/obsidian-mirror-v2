import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * ----------------------------------------------------------------------------
 * OBSIDIAN MIRROR MASTER SYNC ENGINE (v2.0)
 * ----------------------------------------------------------------------------
 * Unified Pipeline:
 * 1. Discover: Auto-scan om_docs/Obsidian Mirror/ for new .md batches.
 * 2. Ingest: Split batches into the ObsidianArchive vault.
 * 3. Propagate: Sync from Archive Vault to local project (content/sources).
 * 4. Sync: Harmonize, Extract Meta, Re-index, and Generate lib/data.ts.
 * 5. Finalize: Archive source batch to permanent storage (optional flag).
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
  status?: 'draft' | 'published' | 'archive';
  publish_date?: string;
  series?: string;
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

// ... existing helper functions (extractSourceMeta, harmonizeContent) will be kept ...

/**
 * 1. INGESTION: Split batches from om_docs into Archive Vault
 */
function ingestFromWorkingCopy() {
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
        console.log(`📥 Processing batch: ${batch}`);
        const batchPath = path.join(WORKING_COPY_DIR, batch);
        const content = fs.readFileSync(batchPath, 'utf-8').replace(/\r\n/g, '\n');
        
        let chunks = content.split(/\n(?=###?\s)/);
        if (chunks[0] && !chunks[0].trim().startsWith('#')) chunks.shift();

        for (let chunk of chunks) {
            chunk = chunk.trim();
            if (chunk.length < 100) continue;

            const lines = chunk.split('\n');
            const titleLine = lines.find(l => l.startsWith('#')) || "# Unknown Title";
            const title = titleLine.replace(/^#+\s+/, '').replace(/\*\*/g, '').trim();
            const slug = slugify(title);
            const outPath = path.join(vaultArticlesDir, `${slug}.md`);

            // Heuristic for month if not in frontmatter
            const batchMonthMatch = batch.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
            const month = batchMonthMatch ? batchMonthMatch[0] : "May";

            const frontmatter = {
                title,
                primary: 'General',
                secondary: [],
                image: '',
                month,
                status: 'published',
                source_meta: { url: '', title: '', author: '', date: '', publication: '' }
            };

            const finalContent = `---\n${yaml.dump(frontmatter)}---\n${chunk}`;
            if (!fs.existsSync(outPath)) {
                fs.writeFileSync(outPath, finalContent);
                console.log(`  + Created: ${slug}.md in Archive`);
            }
        }
    }
    return batches;
}

/**
 * 2. PROPAGATION: Sync Archive Vault to Local Project
 */
function propagateToLiveContent() {
    console.log("\n📡 Phase 2: Propagating Archive to Live Content...");
    const vaultArticlesDir = path.join(LOCAL_ARCHIVE_ROOT, 'articles');
    const localArticlesDir = path.join(PROJECT_SOURCES_DIR, 'articles');

    if (!fs.existsSync(vaultArticlesDir)) return;
    if (!fs.existsSync(localArticlesDir)) fs.mkdirSync(localArticlesDir, { recursive: true });

    const files = fs.readdirSync(vaultArticlesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
        fs.copyFileSync(path.join(vaultArticlesDir, file), path.join(localArticlesDir, file));
    }
    
    // Also sync glossary
    const vaultGlossaryDir = path.join(LOCAL_ARCHIVE_ROOT, 'glossary');
    const localGlossaryDir = path.join(PROJECT_SOURCES_DIR, 'glossary');
    if (fs.existsSync(vaultGlossaryDir)) {
        if (!fs.existsSync(localGlossaryDir)) fs.mkdirSync(localGlossaryDir, { recursive: true });
        const gFiles = fs.readdirSync(vaultGlossaryDir).filter(f => f.endsWith('.md'));
        for (const file of gFiles) {
            fs.copyFileSync(path.join(vaultGlossaryDir, file), path.join(localGlossaryDir, file));
        }
    }
    
    console.log(`  - Synced ${files.length} articles to local content/sources/`);
}

/**
 * 3. FINALIZATION: Move processed batches to Archive Vault
 */
function finalizeBatches(batches: string[]) {
    console.log("\n📦 Phase 3: Finalizing and Archiving source batches...");
    if (!fs.existsSync(ARCHIVE_VAULT_BATCHES)) {
        console.warn(`⚠️ Archive vault batches directory not found: ${ARCHIVE_VAULT_BATCHES}`);
        return;
    }

    for (const batch of batches) {
        const src = path.join(WORKING_COPY_DIR, batch);
        const dest = path.join(ARCHIVE_VAULT_BATCHES, batch);
        if (fs.existsSync(src)) {
            fs.renameSync(src, dest);
            console.log(`  ✓ Archived: ${batch}`);
        }
    }
}

// ... the rest of the existing sync() logic will be adapted ...
