# 📂 ShellGuard — The `/project` Reverse-Build System

> **The docs ARE the app.** Everything in this folder existed as text before anything
> was translated into the application — reconstructed post hoc from the git history,
> but written the way it *should have been written* before the first line of code.

---

## 🧬 What This Folder Is

A **1:1 mirror of the ShellGuard-TOTP build system** (`ShellGuard-TOTP/project/`),
applied retroactively to ShellGuard (web vault). It is a three-layer document
compiler that produces the application deterministically:

```text
YOU (build session)
  │  pastes ONE thing: the meta prompt for the current stage
  ▼
meta-prompt-ai-studio.md ── Stage N          (the SPINE)
  │  "see ROADMAP.md, Phase N"
  ▼
ROADMAP.md ── Phase N (exactly 2 tasks)      (the ROUTER)
  │  Task A [Functionality] → "see shellcryption-spec.md §2"
  │  Task B [UI Component]  → "see ui-ux-design-system.md §4"
  ▼
Build Spec Files ── the ground truth         (the ORACLES)
  │  exact code, exact tokens, exact schemas, exact success criteria
  ▼
Agent builds it ── HOW is its discretion; WHAT is fully pinned
```

## 📜 The Three Layers

| Layer | Files | Job |
|:---|:---|:---|
| **1. Orchestration** | `meta-prompt-ai-studio.md` | The *sequencer*. One staged prompt per phase; tells the builder where to look and what to verify. Prevents context degradation by feeding only the slices each stage needs. |
| **2. Ground Truth Specs** | `architecture.md`, `shellcryption-spec.md`, `routes-and-contracts.md`, `database-schema.md`, `key-hierarchy-spec.md`, `import-export-spec.md`, `admin-suite-spec.md`, `ui-ux-design-system.md` | The *invariants*. Security-critical logic is fully specified so no agent improvises on crypto, tenancy, or the key hierarchy. |
| **3. Schedule** | `ROADMAP.md` | The *router*. Never contains implementation detail — points at spec sections for each task. Separation of schedule (roadmap) from truth (specs) from sequence (spine). |

## 🏷️ Version Grammar

Follows the Google Play Android schema (`X.Y.Z.N`, `versionCode = Build N`):

- **`v0.0.0.0`** — the void. Stage 0's first build pulls the app out of it.
- **`Baseline: v0.0.0.x (Build N)`** — the pre-genesis sprint (2026-08-23 → 2026-08-30).
  Labeled baselines, never forged as releases: these versions never existed as tags.
- **`v0.0.1 → v0.0.1.8`** — real git tags, bracketing later phases 1:1.
  REVISION space (`0.0.1.x`) leaves room for hotfixes between builds.

The roadmap is **the story the git history tells**, transcribed into prompts and specs:
every phase's work matches the commits inside that release gap. Every Task description
is receipt-backed by a real commit; every success criterion is backed by a real test
suite that still runs today.

## 🔄 The Invariants of the System

1. **Single point of entry per stage** — you paste the meta prompt; the agent discovers
   the roadmap itself; the roadmap discovers the specs. Identity (version + phase tag)
   rides at two levels: the outer stage header *and* the inner paste-block title.
2. **Section-level reference resolution** — references name `§N (Anchor)`, never a
   whole file. Context stays surgical; nothing degrades.
3. **The loop is in the text** — every stage ends with a verify line tied to a real
   gate (`npm test`, `npm run build`). A stage cannot complete without passing through it.
4. **Determinism by reference resolution** — a cold reader must be able to traverse the
   chain (spine → roadmap → spec) and make **zero design decisions**. Traversal itself
   is the audit: every dangling edge is a bug.
5. **Built for the delete key** — every document is severable and replaceable without
   collapsing the spine. If the core docs become unmaintainable, so does the app.

## 🚀 How to Rebuild ShellGuard From This Folder Alone

1. Read `ROADMAP.md` frontmatter for current position and version grammar.
2. Open `meta-prompt-ai-studio.md`, find the stage matching your position.
3. Attach the Required Reference Files listed in that stage's header.
4. Paste the stage's fenced prompt block.
5. Run the stage's verify line before moving on.
6. Advance the ROADMAP checkboxes. Repeat until the summit (v0.0.1.8 parity).

---

*Origin note: ShellGuard was first built in Google AI Studio (see Phase 1: the
scaffold commit shipped with `patch_*.cjs` scripts, molted out in the same gap).
The TOTP companion later proved the lesson that produced this folder:
**build the docs first, and so tightly, the application has no choice but to follow.***
