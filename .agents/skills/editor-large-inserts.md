# Skill: Large/Batched File Edits (editor tool + patch scripts)

## Large inserts
- Use bounded `old_text` anchors — never bare line counts; re-read ±15 lines
  around the insertion point after the edit and re-verify section counts
  (e.g., `## §` headers) before committing.

## Batch Patch Scripts (multi-file programmatic edits)
1. Assert `count == 1` for EVERY old-string BEFORE any write; write per-file
   only after all asserts for that file pass.
2. If the script fails at any point, treat ALL files as unknown state:
   re-grep every target pattern across every file before re-running.
   (A script that writes file A then crashes before file B leaves partial
   state that only a failing integration test reveals.)
3. Redirect script output to a file and cat it — shell integration drops
   stdout intermittently; exit codes lie.
4. Re-grep the full pattern set after the script reports success (a "pass"
   with a swallowed error is indistinguishable from success).

*Reference incident: ShellGuard 2026-09-13 — agentKeys patched, auth.ts
silently unpatched; caught by `no such column: api_key` in the test oracle.*
