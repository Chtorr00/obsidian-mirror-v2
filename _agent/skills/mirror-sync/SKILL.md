---
name: obsidian-mirror-sync
description: >
  Synchronizes article data between the Obsidian vault and the website mirror, including mass ingestion and image matching.
version: 1.1.0
use_type: Expert
triggers:
  - "sync obsidian mirror"
  - "mass ingest articles"
  - "harmonize article content"
  - "import march articles"
allowedTools:
  - run_command
  - list_dir
  - view_file
  - write_to_file
  - replace_file_content
---

## Purpose
This skill manages the synchronization pipeline between an Obsidian vault (markdown source) and its website mirror. It processes source documents, extracts complex metadata, harmonizes Act formatting, and manages image-to-article correspondences to ensure a stable, beautiful frontend display.

## Inputs
- **Source Articles**: A markdown document (e.g., "March Articles.md") with multiple articles or individual project files in `vault/articles/`.
- **Source Photos**: A folder containing images indexed to article title keywords.

## Steps
1. **Metadata Extraction**: Scrutinize headers for URL, author, date, and publication.
2. **Ingestion & Splitting**: Segment mass-ingestion files and populate `vault/articles/`.
3. **Harmonization & Build**: Run the `npm run sync` engine to:
   - Stabilize "Act" section headers.
   - Resolve "WikiLinks" and glossary references.
   - Match images and move to `public/images/`.
   - Update `lib/data.ts` with both `articles` and `glossary`.
4. **Validation**: Test for client-side exceptions (like missing `glossary` keys).

## Output Register
Calibrate output vocabulary and depth to match the invocation context:
- Internal / practitioner use → precise, technical, process-oriented
- Client-facing use → accessible, value-framed, jargon-light
- Default (no context signal) → professional mid-register

---
## Skill Metadata
skill_id: obsidian-mirror-sync
source_document: _agent/skills/mirror-sync/SKILL.md
extraction_guide: n/a
build_priority: 1
generalizability: Medium
complexity: Workflow
depends_on: []
workflow_affinity: []
audience: practitioner
audience_expertise: Antigravity user, developer
schema_version: "1.0"
---
