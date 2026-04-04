# Antigravity Skill Awareness Anchor - Obsidian Mirror

## 🚨 Required Search Path

All skills for this project are stored in the `_agent/skills/` directory.

**DO NOT search for skills in .gemini/antigravity/skills/.**

### 📂 Project Skills

- **obsidian-mirror-sync**: Process source documents, extracts complex metadata, harmonizes Act formatting, and manages image-to-article correspondences.
- **Location:** `_agent/skills/mirror-sync/SKILL.md`

### 🚨 Infrastructure & Build Scripts

- **Location:** `scripts/sync.ts` — The core engine for data synchronization.
- **Mandatory Nudge:** If you hit client-side exceptions (e.g. missing glossary keys), run `npm run sync` to regenerate the `lib/data.ts` data store.

## 🔄 Hydration Protocol

1. `ls _agent/skills/` to discover project-local capabilities.
2. Read the `SKILL.md` of the relevant folder to hydrate your context.
3. Before a major ingestion, audit `scripts/sync.ts` for metadata extraction patterns.
