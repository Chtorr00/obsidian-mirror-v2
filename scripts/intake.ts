import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const VAULT_INTAKE_DIR = 'C:\\Users\\markj\\OneDrive\\Documents\\ObsidianArchive\\Obsidian Mirror Intake';
const PROJECT_INTAKE_DIR = path.join(process.cwd(), 'om_docs', 'Obsidian Mirror');
const GRAPH_RAG_DIR = 'C:\\Users\\markj\\OneDrive\\Documents\\AI\\OMGraphRag';

async function main() {
    console.log("🚀 Starting Obsidian Mirror Intake Bridge...");

    // 1. Ensure project intake directory exists
    if (!fs.existsSync(PROJECT_INTAKE_DIR)) {
        fs.mkdirSync(PROJECT_INTAKE_DIR, { recursive: true });
    }

    // 2. Scan Vault for new files
    if (!fs.existsSync(VAULT_INTAKE_DIR)) {
        console.error(`❌ Vault intake directory not found: ${VAULT_INTAKE_DIR}`);
        return;
    }

    const files = fs.readdirSync(VAULT_INTAKE_DIR).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
        console.log("📭 No new articles found in the Vault intake folder.");
        return;
    }

    console.log(`📦 Found ${files.length} new articles. Moving to project queue...`);

    for (const file of files) {
        const src = path.join(VAULT_INTAKE_DIR, file);
        const dest = path.join(PROJECT_INTAKE_DIR, file);
        
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src); // Move (Copy + Delete)
        console.log(`  + Moved: ${file}`);
    }

    // 3. Clean Bridge Directory
    const bridgeDir = path.join(GRAPH_RAG_DIR, 'bridge');
    if (fs.existsSync(bridgeDir)) {
        console.log("🧹 Cleaning bridge directory...");
        fs.readdirSync(bridgeDir).forEach(f => fs.unlinkSync(path.join(bridgeDir, f)));
    } else {
        fs.mkdirSync(bridgeDir, { recursive: true });
    }

    // 4. Trigger GraphRAG Registry Update
    console.log("\n🔄 Updating GraphRAG Registry...");
    try {
        execSync(`python init_registry.py`, { cwd: GRAPH_RAG_DIR, stdio: 'inherit' });
    } catch (error) {
        console.error("❌ Failed to update GraphRAG registry.");
        return;
    }

    // 5. Trigger Interactive Batch Session
    console.log("\n🎭 Starting Ingestion Session (Artifact Bridge Mode)...");
    try {
        // Run with --mode 2 to trigger automated batch logic
        execSync(`python -u om_interactive_agent.py --mode 2`, { cwd: GRAPH_RAG_DIR, stdio: 'inherit' });
    } catch (error) {
        console.error("❌ Ingestion session exited with an error.");
    }
}

main();
