---
name: editor-large-inserts
description: Best practices for large code inserts (>30 lines or JSX/interface blocks) without boundary clipping or syntax damage.
---

# Skill: Large Editor Inserts Without Clipping

When inserting >30 lines (or JSX/interface blocks) into an existing file:
1. Prefer replacing a bounded `old_text` anchor (e.g., the exact closing lines) over bare `insert_line` at a boundary.
2. If `insert_line` must be used, re-read ±15 lines around the insertion point afterward and verify boundary lines survived intact.
3. After any multi-insert session, run the transform gate (vitest on touched files + `npm run build` or `npm run lint`) BEFORE committing — transform errors ("Unexpected }", "Expected identifier") are the signature of clipping, not logic bugs.
