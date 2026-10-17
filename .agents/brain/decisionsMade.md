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


