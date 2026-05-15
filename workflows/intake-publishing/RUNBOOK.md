# Runbook: Obsidian Mirror Intake & Publishing

## Operator Instructions

This workflow manages the "Lyra-7" automated publishing pipeline, allowing for human-in-the-loop manual review of high-priority content before automated GitHub deployment.

### Pre-Flight Checks
1. Ensure `PROJECT_STATE.md` exists in the active project directory.
2. Verify that your draft markdown files are placed in the correct Obsidian intake folder (defined in `PROJECT_STATE.md`).
3. Ensure the `obsidian-mirror-v2` GitHub repository is synced locally and there are no outstanding merge conflicts.

### Execution
1. Run `npm run intake` from the project root.
2. The UI will prompt you to review any articles flagged as "High Priority". Manually publish these to Substack if desired.
3. Confirm the archive step to move all files into the repository and enforce date-gating.
4. The system will automatically commit and push to GitHub.

### Troubleshooting
- **GitHub Sync Failures**: If the automated push fails, check the local repository status (`git status`). You may need to manually resolve a conflict before running the intake script again.
- **Missing Articles**: Ensure your markdown files have proper YAML frontmatter (especially date fields) so they are not rejected by the ingestion engine.
- **Path Resolution Failures**: Check `PROJECT_STATE.md` for absolute path accuracy.
