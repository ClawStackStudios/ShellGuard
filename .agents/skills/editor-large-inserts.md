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

## Environment Hazards (2026-09-15/16 arc)
1. NEVER open a file with mode 'w' in the same expression as the read that feeds it — `open(p,'w').write(entry + open(p).read())` truncates FIRST (Python evaluates `open` before the read). Read into a variable, then write. Tripwire: a huge deletion count in a "log entry" commit is an alarm.
2. Emoji/unicode through bash heredocs corrupts silently (a temple glyph became U+FFFD ×2). Pass emoji via Python `\U` escapes or use the editor tool; after any heredoc write, byte-scan for `b'\xef\xbf\xbd'`.
3. Long commands get swallowed by shell integration (oracle ~130s, vitepress ~27s): run `nohup <cmd> > /tmp/x.log 2>&1 &` and poll the log. Heredoc scripts always redirect — exit codes lie, logs don't.
4. `git add <files>` immediately before EACH commit; `git diff --cached --stat` is the trust boundary. (A pre-staged 4-file set once rode into the wrong commit message; own unpushed commit, amended, disclosed.)
