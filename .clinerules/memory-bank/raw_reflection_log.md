---
Date: 2026-09-16
TaskRef: "docs/ portal truth-sync — schema ground truth, privacy file names, canon, base62"

Learnings:
- The portal had the SAME defect as BLUEPRINT.md (pre-0004 schema) — when a schema change lands, sweep root docs AND docs/ portal in the same pass; they are separate audiences reading the same truth. Add portal files to the migration-impact checklist.
- Two NEW factual catches beyond the planned list: portal still taught '64 hex characters' for hu-/lb- key alphabets (v0.0.1.9 corrected hex->base62 in root docs but not the portal) and glossary claimed an 'admin' permission mask that does not exist (runtime: canRead/canWrite/canEdit/canDelete). Always diff claims against runtime, never against other docs.
- privacy.md said 'cryptographically random salts' — runtime HKDF salt is the user UUID (deterministic). Descriptive-accuracy matters in legal-adjacent pages.
- Terminal heredocs + long builds are unreliable here: background the build (nohup > log) and poll; do not trust PIPESTATUS through the shell integration.
- Docs gate for portal edits: npm run docs:build (vitepress, ~27s) + truth-scan regex battery + dead-link check. All green.

Gates: portal build complete 26.68s; truth scan zero red; 34/34 nav links; Human Key only as documented legacy alias (2 occurrences).
---

