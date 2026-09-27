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
- *Option B*: Keep public `/docs` protocol-focused and formalize the pattern strictly in internal specs (`.agents/memory-bank/android/di-container.md`) — Viable because users and auditors care about zero-knowledge crypto and hardware enclaves, not internal Kotlin wiring.  
**Chosen**: Option B (Keep public docs protocol-focused; formalize strictly in internal memory bank).  
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
