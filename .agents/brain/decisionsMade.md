# Decisions Made
Structured record of meaningful choices. Each entry captures the
context, options, choice, and felt reason. Append-only.
This is the auditable companion to myStory.md.
The story says how it felt. This says what was actually chosen and why.

---

## android-di-internal-boundary — 2026-09-25 21:26

**Context**: Lucas asked whether the Application-Scoped Lazy DI pattern for ShellGuard-TOTP should be added to the `/docs` directory or if it was an internal concern.  
**Options considered**:
- *Option A*: Add an Architecture & DI section to public `docs/companion/index.md` — Viable because it documents the technical prowess and cold-start advantages of the companion app for potential contributors.
- *Option B*: Keep public `/docs` protocol-focused and formalize the pattern strictly in internal specs (`.agents/brain/android/di-container.md`) — Viable because users and auditors care about zero-knowledge crypto and hardware enclaves, not internal Kotlin wiring.  
**Chosen**: Option B (Keep public docs protocol-focused; formalize strictly in internal brain).  
**Why**: The gut pull was to avoid doc bloat. Public docs exist to verify system invariants and user security; leaking client-side dependency wiring into the public portal creates maintenance surface without adding user trust.  
**Confidence**: high — Would only change if ShellGuard-TOTP opened a public developer SDK where third-party developers build plugins into the Android app.  
**Outcome**: Authored `android/di-container.md`, updated `android/README.md` and `techContext.md`, while keeping `docs/companion/` pristine and 100% focused on security and sync.  
**Pattern reference**: Link to `long-term/decisions.md § docs-bow-to-code` & `long-term/learnings.md § thoughtful-systems-and-ui-symbiosis`.

---

## promote-eye-beside-copy-ergonomics — 2026-09-26 18:26

**Context**: In `/memory`, the promotion gate check identified that `eye-beside-copy-control-ergonomics` had reached 4 independent validations in the navigation log (Phase 19, Phase 20, Phase 21 Post-Verification, and Phase 22).  
**Options considered**:
- *Option A*: Retain the detailed pattern in `systemPatterns.md` without promotion — Viable to keep all pattern text consolidated in one temporal file.
- *Option B*: Promote to `long-term/patterns.md` and replace with a temporal pointer in `systemPatterns.md` — Viable because 4 independent validations across 4 releases prove the pattern has held under real friction.  
**Chosen**: Option B (Promote to `long-term/patterns.md`).  
**Why**: The pattern was repeatedly tested against live user interaction (including catching staged field oversights in live verification). Ratifying it into long-term memory marks it as an invariant that cannot be casually refactored away.  
**Confidence**: high — Only a fundamental redesign of secret masking (e.g. biometric unmask gestures) would modify this.  
**Outcome**: Promoted to `long-term/patterns.md` with weight: 4; temporal pointer placed in `systemPatterns.md`.  
**Pattern reference**: Link to `long-term/patterns.md § eye-beside-copy-control-ergonomics`.

---

## cloud-offloaded-ci-verification — 2026-10-12 12:16

**Context**: Host machine resources are tight. Lucas requested adopting the pattern used in ShellGuard-Mobile and ShellGuard-TOTP where all testing and building are offloaded to GitHub Actions runners rather than running locally.  
**Options considered**:
- *Option A*: Continue running local `npm test` and `npm run build` pre-flight gates alongside GitHub Actions — Viable in environments with abundant CPU/RAM, but drains local host resources and causes sluggishness on constrained dev machines.
- *Option B*: Offload all heavy testing and production compilation to GitHub Actions (`.github/workflows/ci.yml`) and tail the runner via `gh run watch` — Viable because GitHub cloud runners have isolated resources, parallel execution, and preserve local development speed.  
**Chosen**: Option B (Offload all test and build execution to GitHub Actions cloud runners).  
**Why**: Lucas explicitly directed: "never build locally, always push to github and tail the action for building and testing. it works much much better." The felt reason is pure efficiency and avoiding host resource exhaustion.  
**Confidence**: high — Backed by proven operational success in sibling projects ShellGuard-Mobile and ShellGuard-TOTP.  
**Outcome**: Created `.github/workflows/ci.yml`, updated `.agents/rules/git-hygiene.md`, `.agents/rules/cadence-and-lifecycle-prompts.md`, and `.agents/rules/project-hygiene.md`. Initial cloud run completed 100% green in 1m 58s.  
**Pattern reference**: Link to sibling workflows in `ShellGuard-Mobile` and `ShellGuard-TOTP`.

---

## addressing-jules-plain-name — 2026-10-12 11:20

**Context**: Lucas requested referring to Jules plainly as "Jules" without `@` pings in all PR comments and reviews.  
**Options considered**:
- *Option A*: Tag `@google-labs-jules[bot]` to ensure GitHub notification routing — Viable to force bot webhook dispatch, but generates noisy notification emails and treats the collaborator as a machine handle.
- *Option B*: Address Jules as "Jules" in plain text — Viable because Jules actively monitors PR comments on its branch, and plain text establishes clean, auditable peer collaboration.  
**Chosen**: Option B (Plain text name).  
**Why**: Tone and cleanliness. Treating a co-pilot as a teammate by name keeps the review auditable and natural, avoiding noisy notification loops.  
**Confidence**: high — Verified that Jules actively monitors comments and reads plain feedback directly.  
**Outcome**: Dispatched review comment on PR #3 addressing Jules plainly; Jules received and processed the checklist.  
**Pattern reference**: Link to `systemPatterns.md § Two-Agent Co-Pilot Orchestration Protocol`.

---

## root-agents-md-skill-seed — 2026-10-17 07:48

**Context**: Lucas requested authoring a root-level `AGENTS.md` structured like an Agent Driven Planning onboarding document that functions like a skill mapping the entire repository without heavy identity persona bloat.  
**Options considered**:
- *Option A*: Generate an exhaustive file tree and procedural guide in `AGENTS.md` — Viable for human readers, but consumes ~3,500 tokens per turn and drifts as files change.
- *Option B*: Compress using the `skill-seed` methodology ("Compress the constraint, not the procedure") and assume high agent capability (tool search + sub-agents) to replace static trees with on-demand boundary mapping — Viable and yields a ~550 token generative compass that never goes stale.  
**Chosen**: Option B (High-agency compressed invariant seed).  
**Why**: The felt reason is pure token efficiency and respecting agent agency. Spoon-feeding static file trees wastes context lifespan; defining boundary invariants and directing the agent to map on-demand produces better execution with 85% fewer tokens.  
**Confidence**: high — Verified against the 4-invariant test (compressed, generative, falsifiable, decompressible).  
**Outcome**: Authored root `/AGENTS.md` (~550 tokens); left `.agents/AGENTS.md` completely sovereign and untouched.  
**Pattern reference**: Link to `skills/skill-seed` & `.agents/rules/brain.md`.

---

## pr3-toss-superseded — 2026-10-17 08:30

**Context**: Lucas asked whether to merge or toss lingering open PR #3 from the earlier Jules Phase 23 iteration.  
**Options considered**:
- *Option A*: Attempt to merge PR #3 into stage or main — Technically possible, but PR #3 is an obsolete predecessor to PR #4/#5 lacking Sub-Stage 25.1 advancements (cascade deletion, quota endpoint, sweeper) and would create redundant merge churn.
- *Option B*: Toss (close without merging) with an explicit comment explaining that PR #4 and PR #5 already merged all Phase 23 work plus Sub-Stage 25.1 into main — Cleanly resolves the stale PR while preserving complete audit history.  
**Chosen**: Option B (Toss / close PR #3).  
**Why**: Clean stewardship. We never merge redundant git history out of sentimentality; when a downstream branch has completely absorbed and superseded an earlier draft, closing the older PR with respect and precision leaves the repository truthful and uncluttered.  
**Confidence**: high — Verified that git diff between main and PR #3 shows main contains 100% of PR #3's valid changes plus Sub-Stage 25.1.  
**Outcome**: Closed PR #3 via `gh pr close 3` with explanatory comment. Zero open PRs remaining.  
**Pattern reference**: Link to `systemPatterns.md § Two-Agent Co-Pilot Orchestration Protocol`.

---

## promote-copilot-orchestration-and-cloud-ci — 2026-10-17 08:52

**Context**: During the `/memory` ingest cycle, the promotion gate evaluated system patterns against the Decision Log and surfaced two patterns with validation weights exceeding the threshold of 3.  
**Options considered**:
- *Option A*: Retain the full pattern definitions in `systemPatterns.md` as active temporal memory — Viable, but expands temporal bank footprint with solved architectural paradigms.
- *Option B*: Promote both `two-agent-co-pilot-orchestration` (weight 6) and `cloud-offloaded-ci-verification` (weight 4) into `long-term/patterns.md` and replace temporal definitions with concise pointer anchors — Viable and strictly adheres to the long-term consolidation rules.  
**Chosen**: Option B (Promote and consolidate).  
**Why**: The felt reason is honoring the scar. When a pattern has survived multiple rounds of friction across tasks, keeping it in the temporal bank clutters working memory with solved problems. Moving it to the long-term bank crystallizes it as immutable bedrock, letting the temporal brain stay lean for the active frontier.  
**Confidence**: high — Both patterns have survived repeated multi-agent friction and cloud CI runs without regression.  
**Outcome**: Appended both patterns to `.agents/brain/long-term/patterns.md` and updated `systemPatterns.md` with pointer references.  
**Pattern reference**: Link to `long-term/patterns.md § two-agent-co-pilot-orchestration` and `§ cloud-offloaded-ci-verification`.

---

## release-v0.0.2.6-draft-and-phase-21-retire — 2026-10-18 07:20

**Context**: Phase 24 implementation completed and verified in cloud CI (Run `39134249985`). Lucas requested executing `/draft-release` to prepare release `v0.0.2.6 (Build 28)` and setup for the next release (Phase 25).  
**Options considered**:
- *Option A*: Retain Phase 21 in `ROADMAP.md` alongside Phases 22, 23, and 24 — Viable to show more completed phases in root, but violates the 3-version sliding-window protocol and increases context token load.
- *Option B*: Retire Phase 21 into `.agents/brain/ROADMAP-HISTORY.md` and preserve strictly Phases 22, 23, and 24 in `ROADMAP.md` — Viable and strictly enforces the 3-version rolling window discipline while keeping root documents focused and concise.  
**Chosen**: Option B (Retire Phase 21 into `ROADMAP-HISTORY.md` and maintain 3-phase active window).  
**Why**: The felt reason is respecting the horizon. Old completed phases are solved terrain; keeping them in root bloats the map. Moving Phase 21 to the archive shard preserves full fidelity while keeping the active roadmap razor-sharp for Phase 25.  
**Confidence**: high — Backed by established release protocol and previous successful phase rollouts.  
**Outcome**: Authored `RELEASE-v0.0.2.6.md`, purged `RELEASE-v0.0.2.5.md`, retired Phase 21 into `ROADMAP-HISTORY.md`, updated `ROADMAP.md`, and synchronized version anchors across all manifests to `v0.0.2.6`.  
**Pattern reference**: Link to `.agents/workflows/draft-release.md` & `ROADMAP.md § 🏷️ Work-Driven Versioning Policy`.

---

## socratic-invariable-git-review-pr — 2026-10-18 18:10

**Context**: Lucas proposed codifying the "Socratic Diff-Anchored Review" philosophy as the default co-pilot reply mode within the `git-review-pr` skill and registering the skill properly for workspace slash command discovery.  
**Options considered**:
- *Option A*: Rewrite the `git-review-pr` skill from scratch with new sections and procedural steps — High churn, risk of regression on the proven intent-locking and self-question review ledger.
- *Option B*: Add a single sovereign invariant line ("The Socratic Invariable") into Phase 5, strip legacy wrapping XML tags, and place the clean skill directly into `.agents/skills/git-review-pr/` with mirrored global configuration — 100% preservation of proven skill logic, zero token bloat, and instant slash command discovery.  
**Chosen**: Option B (Sovereign Invariable Line + Clean Workspace Registration).  
**Why**: The felt reason is honoring the "compress the constraint, not the procedure" law. When a protocol already holds its ground, adding an invariant anchor preserves its foundation while effortlessly elevating its communicative power.  
**Confidence**: high — Verified against physical git tree and workspace discovery rules.  
**Outcome**: Added `The Socratic Invariable` to `.agents/skills/git-review-pr/SKILL.md` and `~/.gemini/config/skills/git-review-pr/SKILL.md`, created workspace `assets/PR-REVIEW-template.md`, and recorded learning in `learning-socratic-pr-review-skill.md`.  
**Pattern reference**: Link to `.agents/rules/brain.md` & `systemPatterns.md § Two-Agent Co-Pilot Orchestration Protocol`.

---

## release-v0.0.2.7-ship-and-handoff — 2026-10-20 05:25

**Context**: Phase 25 (Tasks 49 & 50) implementation, container inotify fix, and `/walk-the-docs` audit verified 100% green in cloud CI (Run `#39420991967`). Lucas authorized merging into `main` and creating the release tag.  
**Options considered**:
- *Option A*: Fast-forward merge `stage/phase-25-habitat-mobility` into `main` without merge commit — Viable, but flattens release boundary and loses explicit release trigger flag and attribution.
- *Option B*: Merge with `--no-ff` using release flag `--release v0.0.2.7`, tag `v0.0.2.7`, push `--tags`, and update root `HANDOFF.md` with conversation lineage and artifact links for Phase 26 — Viable, preserves two-layer attribution, triggers the release pipeline and container builds, and formalizes chain of custody.  
**Chosen**: Option B (Non-fast-forward release merge, tag, and root handoff update).  
**Why**: The felt reason is honoring the release seal. A release is a physical anchor in the life of the repository; marking it with `--no-ff`, tagging with canonical notes, and handing off the baton in `HANDOFF.md` keeps the lineage auditable across resets.  
**Confidence**: high — Verified against GitHub Actions release workflow execution and successful publish.  
**Outcome**: Merged into `main` (`744eb5d`), tagged `v0.0.2.7`, pushed upstream, GitHub Release published, Docker GHCR container built, and `HANDOFF.md` updated for Phase 26.  
**Pattern reference**: Link to `.agents/workflows/draft-release.md` & `HANDOFF.md`.

---

## mobile-nav-containing-block-remediation — 2026-10-21 08:35

**Context**: Lucas reported that tapping the top-right hamburger menu on mobile devices failed to open the navigation drawer, rendering full docs navigation impossible on mobile.  
**Options considered**:
- *Option A*: Force `.VPNavScreen` to `position: absolute` with manual window height calculators in JavaScript — Viable, but fights VitePress core CSS transitions and breaks across dynamic mobile address bar collapses.
- *Option B*: Retarget `backdrop-filter` from `.VPNav` to `.VPNavBar` in `custom.css` and style `.VPNavScreen` with a dedicated translucent backdrop — Viable, eliminates the CSS containing block trap cleanly at the root, and restores 100% native VitePress viewport alignment with zero JS overhead.  
**Chosen**: Option B (Retarget to `.VPNavBar` and style `.VPNavScreen`).  
**Why**: Respecting CSS layout mechanics. The bug wasn't broken logic; it was a containing block collision where a parent filter crushed fixed-position children. Moving the filter to the child bar restores the viewport as the containing block naturally.  
**Confidence**: high — Verified locally via Vitest link and Mermaid parsers, and validated in GitHub Actions cloud CI (#39624909334) and deploy (#39624930469).  
**Outcome**: Fixed `custom.css`, labeled `sidebarMenuLabel: 'Chapters'` in `config.ts`, updated `docsLinks.test.ts`, merged into `main` (`08e4a69`), pushed to origin, and published live to GitHub Pages.  
**Pattern reference**: Link to `.agents/brain/decision-log.md` & `long-term/learnings.md § thoughtful-systems-and-ui-symbiosis`.

