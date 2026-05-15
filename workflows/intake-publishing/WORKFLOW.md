# Workflow: Obsidian Mirror Intake & Publishing

## Description
This workflow automates the ingestion, priority sorting, and structured archiving of markdown files from a local Obsidian Vault into the `obsidian-mirror-v2` GitHub repository for date-gated publishing.

## Phase 1: Initialization
1. **Load Project State**: Identify the active project by locating the `PROJECT_STATE.md` file in the project root.
2. **Path Resolution**: Read `PROJECT_STATE.md` to resolve absolute paths for:
   - `obsidian_intake_directory` (Local vault source)
   - `github_archive_directory` (Target repo)

## Phase 2: Ingestion & Sorting (The `npm run intake` loop)
1. **Trigger**: Execute the ingestion script to read all `.md` files in the `obsidian_intake_directory`.
2. **Priority Triage**:
   - Parse YAML frontmatter of each file for priority flags (High vs. Normal).
   - High-priority articles are surfaced to the UI immediately for manual Substack review.
   - Normal-priority articles bypass the UI and are staged for direct archiving.
3. **Archiving**:
   - Move processed files from the local intake folder to the `github_archive_directory`.
   - Apply hierarchical sorting and strict date-gating logic to ensure embargoed content is not prematurely released.

## Phase 3: Finalization
1. **Commit & Push**: Trigger the automated GitHub workflow to sync the `obsidian-mirror-v2` repository.
2. **Validation**: Ensure the GitHub action completes successfully and the frontend site is rebuilt.
