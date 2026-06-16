# PROJECT STATE — Obsidian Mirror v2
> Last updated: 2026-05-27 | Maintainer: Mirror Architect (@coder)

## 1. Project Metadata & Anchors
- **Client/Domain**: General / Obsidian Mirror
- **Active Thread ID**: none
- **Status**: 🟢 ACTIVE

## 2. Path Registry (Machine-Parseable)
> Note: `om_config.py` parses paths using `- **KEY**: \`value\``


- **WEB_PROJECT_ROOT**: `C:\Users\markj\OneDrive\Documents\Antigravity\foresight-llm\projects\obsidian-mirror-v2`
- **AI_WORKSPACE**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag`
- **DB_PATH**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db`
- **ENTITY_LEDGER**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\Entity_Ledger.json`
- **LYRA_SYSTEM_PROMPT**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\LYRA_7_SYSTEM_PROMPT.md`
- **ACTIVE_CACHE_REF**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\active_cache.ref`
- **VAULT_INTAKE**: `C:\Users\markj\OneDrive\Documents\ObsidianArchive\Obsidian Mirror Intake`
- **INBOX_DIR**: `C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\Current\Inbox`
- **STAGING_ARTICLES**: `C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\2026\Weblog-Sources\articles`
- **STAGING_IMAGES**: `C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\2026\Weblog-Sources\images`
- **BRIDGE_DIR**: `C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\bridge`

---

## Storage Architecture

| Location | Path | Purpose |
| :--- | :--- | :--- |
| **Vault Intake** | `ObsidianArchive\Obsidian Mirror Intake\` | **Drop zone.** Individual `.md` articles arrive here. This is the pipeline entry point. |
| **Lyra Inbox** | `ObsidianArchive\Mirror\Current\Inbox\` | Temporary holding for Lyra-7's synthesized essays + generated images during processing. |
| **Archive Vault** | `ObsidianArchive\Mirror\2026\Weblog-Sources\` | Permanent home for processed articles (`articles\`) and matched images (`images\`). `npm run sync` reads from here. |
| **Live Content** | `obsidian-mirror-v2\content\sources\` | Git-tracked mirror of Archive Vault. Rebuilt on each `npm run sync`. Used by GitHub Actions. |
| **Working Copy** | `obsidian-mirror-v2\om_docs\Obsidian Mirror\` | Drop zone for raw `.md` batch files (multi-article). Fed directly by `npm run sync` Phase 1 (not the Lyra pipeline). |
| **GraphRAG Workspace** | `AI\OMGraphRag\` | Lyra-7 processing engine, graph database, per-article `.graph.json` files, `master_graph.json`. |
| **Archive Batches** | `ObsidianArchive\Obsidian Mirror\` | Permanent record of processed `.docx` batch files after sync. Write-once. |

---

## Pipeline Architecture

The workflow has **two entry points** depending on article type:

### Entry Point A: Individual Articles (Lyra-7 Pipeline)
Used for scout-sourced articles dropped one-by-one into Vault Intake. This is the **primary publishing workflow**.

```
[Vault Intake]
    ↓  (om_interactive_agent.py sync_vault_intake)
[om_processing.db — PENDING]
    ↓  (get_top_relevant_nodes — keyword match against Entity_Ledger.json)
[Top 50 relevant graph nodes extracted]
    ↓  (run_node_4_lyra_analysis — gemini-2.5-pro as Lyra-7)
[Lyra-7 Three-Act essay generated]
    ↓  (run_graphrag_ingestor — gemini-2.5-flash organic extraction)
[Per-article .graph.json saved to AI\OMGraphRag\graphs\]
    ↓  (generate_obsidian_mirror_image — gemini-3.1-flash-image)
[Image prompts cached in DB]
    ↓  [GATE 1: Image Selection — Exit code 10. Resume with --input 1/2/3 or write to bridge_input.txt]
    ↓  [GATE 2: Publish Schedule — Exit code 10. Resume with --input <date_instruction> or write to bridge_input.txt]
    ↓  (Stage 5: shutil.move → STAGING_ARTICLES + STAGING_IMAGES)
[om_processing.db — RESOLVED]
    ↓  (finally block: om_ledger_merge.merge_graphs() - only when all articles in batch are resolved)
[master_graph.json updated with all new nodes from batch]
    ↓  (npm run sync — from obsidian-mirror-v2 project root)
[lib/data.ts regenerated → content/sources/ updated → git push]
```

### Entry Point B: Batch `.md` Files (Direct Sync Pipeline)
Used for `.docx`-converted batch files placed in `om_docs\Obsidian Mirror\`. Bypasses Lyra-7 — articles are published as-is with basic harmonization.

```
[om_docs\Obsidian Mirror\*.md]
    ↓  (npm run sync — Phase 1: ingestFromWorkingCopy)
[Archive Vault articles\ — split + frontmatter added]
    ↓  (npm run sync — Phase 2: propagateToLiveContent)
[content\sources\articles\ — refreshed]
    ↓  (npm run sync — Phase 3: syncEngine)
[lib\data.ts regenerated]
```

---

## Key Scripts & Entry Points

| Script | Location | Command | Purpose |
| :--- | :--- | :--- | :--- |
| `om_interactive_agent.py` | `AI\OMGraphRag\` | `python om_interactive_agent.py --mode 2 [--input <text>]` | **Primary**: Runs Lyra-7 batch processing (HITL). Exits with code 10 at gates. |
| `om_ledger_merge.py` | `AI\OMGraphRag\` | (called automatically at batch end) | Merges per-article `.graph.json` into `master_graph.json`. |
| `init_registry.py` | `AI\OMGraphRag\` | `python init_registry.py` | Utility: Bulk-registers articles from `om_docs\Obsidian Mirror\` into DB. Run if articles were dropped to om_docs and skipped the agent. |
| `sync.ts` | `obsidian-mirror-v2\scripts\` | `npm run sync` | Propagates Archive Vault → content\sources → lib\data.ts. Run after Lyra pipeline completes. |
| `sync.ts` (finalize) | `obsidian-mirror-v2\scripts\` | `npm run sync -- --finalize` | Same as above, but also archives processed batch files from `om_docs\`. |
| `intake.ts` | `obsidian-mirror-v2\scripts\` | `npm run intake` | Legacy bridge: Moves files from Vault Intake → om_docs, then triggers GraphRAG. **Superseded** — use agent directly. |

---

## The Bridge (Human-in-the-Loop Gates)

The Lyra-7 pipeline pauses at two points per article, writing prompt files to `AI\OMGraphRag\bridge\` and exiting with code `10`.

**To respond:** 
- Relaunch the script passing the response to `--input`, e.g., `python om_interactive_agent.py --mode 2 --input "2"`
- Or, write response text to `AI\OMGraphRag\bridge\bridge_input.txt` before relaunching the script.

| Gate | Prompt File | Valid Responses |
| :--- | :--- | :--- |
| Gate 1 — Image Selection | `PROMPT_SELECTION.md` | `1`, `2`, or `3` |
| Gate 2 — Publish Schedule | `SUBSTACK_READY.md` | `DONE`, `DONE AUTO`, `DONE +N` (days), `DONE YYYY-MM-DD`, `SKIP`, `PAUSE` |

**Current pipeline status:** `AI\OMGraphRag\bridge\status.md`  
**To abort cleanly:** Write `PAUSE` to `bridge_input.txt` (or pass `PAUSE` via `--input`)  
**Lock file:** `AI\OMGraphRag\bridge\pipeline.lock` — delete manually if a prior run crashed.

---

## Standard Workflow Runbook (Agent Executable)

### Pre-flight checks
1. Confirm articles are present in `VAULT_INTAKE` (`ObsidianArchive\Obsidian Mirror Intake\`)
2. Confirm no `pipeline.lock` exists in `AI\OMGraphRag\bridge\`
3. Check `bridge\status.md` to see if a prior run was interrupted

### Step 1 — Run Lyra-7 Batch Pipeline (Zero-Timer Event-Driven Loop)
> [!IMPORTANT]
> **Zero-Timer Constraint**: DO NOT use static timers (`schedule`, cron, or sleeps) to poll the pipeline status. Start the script in the background, immediately stop calling tools, and yield control. Antigravity 2.0 will wake you up automatically when the process exits.

1. **Start the pipeline**:
   ```powershell
   cd "C:\Users\markj\OneDrive\Documents\AI\OMGraphRag"
   python om_interactive_agent.py --mode 2
   ```
2. **Handle HITL Gates (Exit Code 10)**:
   - When the script exits with exit code `10`, read the active prompt file in `bridge/` (either `PROMPT_SELECTION.md` or `SUBSTACK_READY.md`).
   - Present the prompt to the user and wait for their choice.
   - Resume the script passing the user's response:
     ```powershell
     python om_interactive_agent.py --mode 2 --input "<user_response>"
     ```
   - Stop calling tools and yield control again; repeat until execution exits with code `0`.
3. **Completion**: When the pipeline exits with code `0`, `om_ledger_merge.merge_graphs()` runs automatically to consolidate the ledger.

### Step 2 — Sync Mirror Website
```powershell
cd "C:\Users\markj\OneDrive\Documents\Antigravity\foresight-llm\projects\obsidian-mirror-v2"
npm run sync
```
- Propagates finalized articles from `STAGING_ARTICLES` → `content\sources\` → `lib\data.ts`.

### Step 3 — Verify & Deploy
```powershell
npm run dev   # Verify locally at localhost:3000
git add -A
git commit -m "sync: <batch description>"
git push
```

---

## Known Issues & History

| Date | Issue | Resolution |
| :--- | :--- | :--- |
| 2026-05-26 | `init_registry.py` used old project path (`general\projects` instead of `foresight-llm\projects`), causing silent zero-article registration. | Fixed path in `init_registry.py` line 59. |
| 2026-05-26 | `PROJECT_STATE.md` did not exist; `om_config.py` fell back to hardcoded defaults. | Created this file. |
| Prior | `intake.ts` called `init_registry.py` then `om_interactive_agent.py`, but moved files out of `VAULT_INTAKE` before the agent scanned it, causing the agent to find nothing. | Agent's `sync_vault_intake()` handles intake directly from `VAULT_INTAKE`. Skip `npm run intake`; run the agent directly. |
| 2026-06-09 | Processed June 9 batch of 7 articles using new event-driven state machine and generalized prompts. | Successfully processed, matched images, merged GraphRAG master ledger (4,643 nodes, 6,755 edges), built website, and deployed to GitHub. |
