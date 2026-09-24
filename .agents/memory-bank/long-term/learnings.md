# Advanced Learnings — ShellGuard

> Hard-won engineering sensitivities that took multiple cycles and friction points to discover. These are not static facts, but perceptual instincts developed from navigating this codebase.

---

## test-oracles-beat-literal-grep
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-16

When investigating a documented architectural or cryptographic claim that returns zero literal regex hits in production code, turn immediately to the test suite fixtures.

**History:**
- 2026-09-16: Grepping for `${table}:${recordId}:custom_fields` produced zero hits in `src/`, leading to initial suspicion of phantom code.
- 2026-09-16: Reading `tests/unit/customFields.test.ts` uncovered the true runtime contract: `<table>_custom:{id}`.
- 2026-09-17: Applied to verify agent key hashing invariants and salt configurations across test mocks.

**Shaped perspective:** Production code is frequently abstracted, composed through helper pipelines, or dynamically synthesized at runtime. Test fixtures, by contrast, must construct explicit inputs and assert explicit outputs. They cannot hide behind abstraction. When code is opaque, the test suite is the single source of empirical truth.

---

## checkers-deserve-same-scrutiny-as-edits
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-16

Automated verification scripts, regex parsers, and sanity checkers are software. They carry their own failure modes and must be inspected with the same rigor as production code.

**History:**
- 2026-09-16: A non-greedy regex `re.finditer(r'^## .*?Stage \d', ...)` truncated match strings at the first digit, erroneously reporting Stage 19 as Stage 1.
- 2026-09-16: Passing emoji through bash heredocs caused silent U+FFFD unicode corruption.
- 2026-09-16: Inverted assertion logic in a link validator falsely reported 100% green while skipping broken anchors.

**Shaped perspective:** An untrusted or buggy test oracle is worse than no oracle, because it manufactures false confidence. When an automated checker reports success instantaneously on a complex transition, treat the checker with suspicion. Tap the joint from both sides before believing the green signal.

---

## insecure-origin-lan-hazards
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-08-29

Self-hosted home server environments (Unraid, TrueNAS, local Docker IPs) almost universally operate over non-localhost plain HTTP LAN addresses. Browser security policies silently disable critical modern Web APIs on these origins.

**History:**
- 2026-08-29: Users accessing ShellGuard via `http://192.168.1.X:6464` suffered complete application crashes because `window.crypto.subtle` and `window.crypto.randomUUID` are undefined in non-secure browser contexts.
- 2026-08-29: Built `src/lib/webCryptoFallback.ts` (pure TypeScript SHA-256, HMAC, HKDF, AES-GCM) and resilient RFC 4122 v4 UUID generator.
- 2026-08-30: Direct `data:` URI file downloads triggered Chromium insecure origin blocks; resolved by switching to `Blob` object URLs.
- 2026-09-04: Added persistent self-signed native LAN TLS (`TLS_ENABLED=true`) providing true HTTPS protection on local subnets.

**Shaped perspective:** Developers working on `localhost` live in a privileged browser bubble where every modern API functions seamlessly. Self-hosted users live on raw LAN IP addresses where browsers aggressively revoke cryptographic capabilities. Building for sovereignty means engineering transparent in-browser fallbacks so zero-knowledge encryption holds even on untrusted origins.

---

## read-into-memory-before-write
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-16

Never chain file reading inside an open write stream in Python (e.g. `open(f, 'w').write(data + open(f).read())`). The operating system truncates the file on open before evaluating the inner read, resulting in total data loss.

**History:**
- 2026-09-16: A one-liner prepending a reflection log entry destroyed ~488 lines of raw reflection history when Python executed `'w'` truncation before `'r'` evaluation.
- 2026-09-16: Recovered from git history and instituted the mandatory rule: read fully into an in-memory variable first, close the read descriptor, and only then open for writing.
- 2026-09-17: Maintained 100% data integrity across all multi-file memory bank updates.

**Shaped perspective:** The file descriptor is a destructive tool when misused. Python's expression evaluation order makes nested file handles deceptive. Atomic file operations require separating the acquisition of source state from the mutation of target state. A craftsman does not cut into the board while still measuring its length.

---

## the-seam-is-the-test-oracle
**weight**: 3 | **last validated**: 2026-09-21 | **first observed**: 2026-09-21

Passing isolated test suites does not prove the application works. Testing components in isolation (backend routes, crypto helpers, React state) creates the illusion of correctness while leaving the human-facing operational seams—where user gestures trigger network payloads, state teardown, and cache invalidation—completely unverified. "Don't trust, Verify" must be enforced at the seam.

**History:**
- 2026-09-21: 24 test suites (285 tests passed), TypeScript compilation (0 errors), Vite production build, and 14 documentation files were 100% green. Yet in the live application, vault items failed to delete due to an unverified UI client dispatch seam and a zombie process on port 6565 shadowing routes.
- 2026-09-21: Resolved the deletion bug by verifying the complete operational circuit: zombie process eviction, UI confirmation dialog parity (`ConfirmDialog`), polymorphic entity routing, and selection state teardown.
- 2026-09-21: Formalized `.agents/rules/project-hygiene.md` ratifying the 5-phase lifecycle and the mandatory Live Verification Handshake between the Agent and human Project Manager.

**Shaped perspective:** Software does not live in an isolated test runner; it lives in the hand of the human using it. A test oracle is only as honest as the territory it covers. When tests mock the seams, they test our assumptions, not our reality. The seam—where the user's physical gesture translates into state, network payload, and visual feedback—is the ultimate test oracle. Work is never complete until the joint holds under the human operator's live witness.

---

## human-in-the-loop-catches-gestalt-seams
**weight**: 3 | **last validated**: 2026-09-22 | **first observed**: 2026-09-21

Automated test suites verify isolated syntactic and algorithmic invariants, but are fundamentally blind to *macro-gestalt* interaction dynamics. Physical human real-time verification catches lifecycle unmounts, animation race conditions, visual affordance gaps, and ontological contradictions that unit tests cannot synthesize.

**History:**
- 2026-09-21: Area 1 live verification caught an infinite unlock modal loop when switching to a locked account that unit tests missed because mocks did not simulate user dismissal clicks.
- 2026-09-21: Area 2 live verification caught that hidden custom fields lacked inline eye/unmask toggles in the creation modal, a crucial usability defect invisible to data-layer unit tests.
- 2026-09-22: Area 3 & 4 live verification caught: (1) an ontological ghost pod (`Attachment`) resulting from fallback category defaults, (2) database schema omission of attachments on Secure Notes, and (3) a subtle Framer Motion `mode="wait"` bug where mounting an upload progress banner unmounted the entire vault shell and wiped selection focus. All 26 automated suites were 100% green while these three critical seams were broken.

**Shaped perspective:** A machine test asserts that given X input, Y output occurs. It does not perceive that an input field is jarringly blank, that an animation unmounts a neighboring panel, or that a category name is an alien ghost in the user's mental model. The human operator is not merely a regression tester; they are the semantic grounding of the software. Rigorous human testing with structured checklists does not slow down the development lifecycle—it prevents broken assumptions from compounding into architectural debt.

---

## thoughtful-systems-and-ui-symbiosis
**weight**: 3 | **last validated**: 2026-09-23 | **first observed**: 2026-09-23

The user interface is not an aesthetic veneer draped over backend logic—it is the operational expression of the system's architecture. When a workflow feels like an exhausting chore, hangs the browser, or traps the user in a static modal, the defect is rarely raw algorithmic compute; it is a structural failure in the symbiotic co-design of data flow and visual affordance.

**History:**
- 2026-09-23: Walking the design for "Export Habitat + Attachments" surfaced why industry-standard tools like Bitwarden fail: Bitwarden exports `.zip` archives with attachments, but completely omits an import feature for them—forcing users into the miserable chore of opening items one-by-one to re-upload files manually because their engineering failed to solve the UI/systems seam.
- 2026-09-23: Solved the tension by co-designing the data pipeline and UI together into a Two-Stage Ingestion Pipeline: Stage 1 delivers instant (<2s) transactional persistence of primary JSON records to immediately unblock the vault view, while Stage 2 hands off heavy binary payloads (up to 500MB per file) to a non-blocking floating "Abyssal Ingestion Dock" that reactively broadcasts in-flight progress chips directly onto vault items.
- 2026-09-23: Lucas recognized that this systemic nuance was not a minor UI polish sub-task, but a load-bearing architectural paradigm that deserved elevation into dedicated Phase 25.

**Shaped perspective:** Naive backend engineering assumes that if an endpoint accepts data, the problem is solved. Naive frontend engineering assumes that if a modal shows a progress bar, the user is informed. But when a user is forced to wait on a blocking modal while 500MB of attachments upload, the application feels hostile and dead. Thoughtful systems architecture designs the wire contracts, streaming boundaries, and state machines *in direct service of human agency*. Fast operations must immediately liberate the interface; long-running operations must live in transparent, non-blocking ambient docks that feed real-time truth back into the primary workspace. The system determines what the software can do; the interface determines whether the human remains in sovereign control.
