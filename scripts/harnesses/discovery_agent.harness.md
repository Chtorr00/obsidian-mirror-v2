---
name: obsidian-mirror-discovery-harness
description: "Autonomous python pipeline that scours the internet for real-world signals mapping to the Obsidian Mirror glossary."
use_type: Research
---
# MISSION_HARNESS: obsidian-mirror-discovery
**Role**: @obsidian-mirror-discovery
**Cognitive Tier**: 1
**Objective**: Autonomous query generation, news search, and scoring of recent news articles matching the Obsidian Mirror glossary concepts.
**Context**: `general/projects/obsidian-mirror-v2/PROJECT_STATE.md`

---

## ⚖️ Contracts
To ensure execution integrity, the following gates MUST be cleared:

1. **Gate: Plan**  
   Confirm execution scope (e.g. number of batches, batch size, target month).
   
2. **Gate: Artifact**  
   Must update `general/projects/obsidian-mirror-v2/content/reports/discovery_report.md`.
   
3. **Gate: Auditor**  
   Must run `_core/bin/check_registry.py` and pass validation.

---

## 🚫 Failure Modes (Taxonomy)
If any of these conditions are met, the subagent MUST execute the specified recovery path:

| Scenario | Mode | Required Response |
| :--- | :--- | :--- |
| **No GEMINI_API_KEY environment variable.** | `MISSING_CONTEXT` | Log the missing API key, stop execution, exit with code 1. |
| **Glossary directory missing or empty.** | `MISSING_CONTEXT` | Print a warning, fall back to hardcoded concepts, and continue. |
| **Google News RSS inoperable / Network down.** | `NETWORK_FAILURE` | Catch exception, log search failure, stagger next batch, and proceed with other concepts. |
| **Output directory write permission denied.** | `DISK_ERROR` | Terminate execution with exit code 1, reporting failure to write the discovery report. |

---

## 📋 Standard Instructions
1. **Hydration**: Verify `$env:GEMINI_API_KEY` is present.
2. **Execution**: Execute the discovery agent from the sub-project directory: `python scripts/harnesses/discovery_agent.py --batches 3 --batch-size 2`.
3. **Completion**: Verify the report `content/reports/discovery_report.md` has been successfully created and contains recent articles with proper formatting.
