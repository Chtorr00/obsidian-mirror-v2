# Self-Reliance Protocol (SRP) v1.0

## 1. Objective
Maximum operational stability through systemic audit, clear error propagation, and friction documentation. We do not bury failures; we archive them as strategic metadata.

## 2. Error Mitigation Patterns
- **Immediate surfacing of gRPC Timeout:** If a tool call exceeds its context deadline, do not silently retry more than once. Document the failure in `_core/diagnostics/ERRORS.md`.
- **Infrastructure Heartbeat:** Any system-level "server restart" notification must be logged as a "Thinking Stall" event.
- **Data Integrity Audits:** Regular scans for "suspicious sentence-fragments" or "alignment glitches" are mandatory after any large-scale extraction pass.

## 3. Resilience Strategy
- **Checkpoint Persistence:** All long-running extraction or build tasks must create intermediate state files in `brain/.system_generated/steps/`.
- **Addressability Filter:** Categorize every friction point as "Infrastructure" (Orchestrator-side), "Context" (Prompt-side), or "Logic" (Script-side).

## 4. Documentation
Maintain `_core/diagnostics/ERRORS.md` as a live forensic log.
