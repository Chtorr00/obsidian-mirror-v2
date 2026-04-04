---
name: obsidian-mirror-sync
description: Synchronizes article data between the Obsidian vault and the website mirror, including mass ingestion and image matching.
---

# Obsidian Mirror Sync Skill

This skill manages the pipeline between raw research notes, Obsidian files, and the live application data. It is designed to be the single source of truth for the project's intellectual history.

## 🎯 Key Capabilities

1. **Act Harmonization**: Automatically converts shorthand `Act I: Title` markers into structured `### Act I: Title` headers with proper spacing for clean web rendering.
2. **Metadata Extraction**: Scrapes Author, Publication, Date, and URLs from article bodies to populate the source metadata fields.
3. **Mass Ingestion**: Splits large compiled Google Doc exports into individual Obsidian-ready articles.
4. **Smart Imaging**: Matches article titles to image filenames inside a provided folder using keyword intersection.
5. **Database Sync**: Rebuilds the shared `lib/data.ts` file from the `vault/articles/` directory to ensure the website is perfectly up to date.

---

## 🚀 How to Run

### 1. Routine Vault Refresh

Run this after making edits directly in your Obsidian vault to sync them to the website.

```bash
npm run sync
```

### 2. Monthly Ingestion (New Articles)

Run this when you have a new batch of articles from your monthly Google Doc.

```bash
npm run sync -- --ingest="C:/Path/To/March_Articles.md" --images="C:/Path/To/March_Images"
```

---

## 📁 Technical Blueprint

- **Source of Truth**: `vault/articles/*.md`
- **Build Artifact**: `lib/data.ts`
- **Logic Engine**: `scripts/sync.ts`
- **Images**: `public/images/`

---

## 🧪 Integration Tests

When running an ingestion, the skill will:

- Check for duplicate articles (based on slugified title).
- Copy matched images into `public/images/` automatically.
- Generate a 300-char preview for the main feed dossier view.
