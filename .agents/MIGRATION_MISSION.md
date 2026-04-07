# Mission Order: [Obsidian-Mirror] Source-of-Truth Harmonization
**Status**: 🔴 PENDING (Awaiting Subagent Pickup)
**Priority**: High (System Integrity)

## 🎯 Goal
Synchronize the website's content-fetching logic with the established Vault infrastructure.

## 📋 Mission Requirements
1. **Move Sources**:
   - Promote the 331 markdown files from `[AG-Root]/general/projects/obsidian-mirror-v2/vault/` to `[Vault]/Mirror/2026/Weblog-Sources/`.
2. **Refactor Codebase**:
   - Update `lib/` and `app/` fetching logic (e.g., `getPostData`) to use the Absolute Path to the Vault's Mirror folder.
3. **Continuous Deployment**:
   - Update the GitHub sync script (likely in `scripts/`) to pull from the Vault's Mirror, separating the **Website Code** (GitHub) from the **Website Content** (Vault).
4. **Verification**:
   - Ensure the Next.js build (`npm run build`) still includes all 331 posts from the new location. Once verified, purge the local `vault/` folder to clean the repository.

## ⚖️ Policy Override
This mission originates from the Antigravity Architect (Conversation 0fc157c3). It supersedes initial project structure rules.
