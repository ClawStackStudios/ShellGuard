# Constraint History — ShellGuard

> The boundary record of ShellGuard. These are not arbitrary rules or dogma; each boundary was once probed or attempted to be mutable, broke critical security or operational guarantees, and was ratified back.

---

## offline-only-superlobster-restore
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-08-30

The SuperLobster Admin Panel must never expose an HTTP endpoint or UI button for uploading database backups or restoring database files over the network. Database restoration is strictly an offline CLI operation (`npm run scuttle:restore`).

**History:**
- 2026-08-30: Architecture review explored adding a convenient "Upload & Restore Backup" button inside `SuperLobsterBackups.tsx`.
- 2026-08-30: Threat-model audit revealed that an HTTP restore endpoint allows an attacker with a hijacked admin cookie or CSRF capability to swap out the entire SQLCipher database, replace audit logs, and corrupt instance state without physical host access.
- 2026-09-04: Ratified in `ADMIN.md` §5 and locked in `systemPatterns.md`: backups are created locally to `DATA_DIR/backups/` via SQLite Online Backup API, but restoration requires root shell access.
- 2026-09-17: Verified: zero HTTP restore routes exist in `src/server/routes/admin.ts`.

**Shaped perspective:** The boundary exists because the network is hostile. An admin web panel is an interface of convenience, not an interface of total host trust. If a web button can overwrite the database file on disk, the database is only as secure as the web session cookie. Requiring direct shell access for restores establishes a hard physical barrier between the web management plane and persistent disk state.

---

## inactivity-retract-session-evacuation
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-01

Decrypted session keys and client ShellCryption key material must never persist indefinitely across idle sessions. Inactivity automatically triggers a complete "Retract" that zeroizes session storage and locks the dashboard.

**History:**
- 2026-09-01: Leaving sessions unlocked indefinitely was considered for mobile/desktop UX convenience.
- 2026-09-02: User testing on shared workstations showed that unlocked tabs left credentials accessible in plaintext DOM nodes and browser memory long after the human stepped away.
- 2026-09-04: Enforced strict 15-minute sliding inactivity timer, window focus listeners, and `NavIntent` state preservation that returns the user to the locked dashboard overlay.
- 2026-09-16: Re-verified: locking clears memory keys without discarding known account profiles.

**Shaped perspective:** A zero-knowledge vault cannot protect secrets that remain decrypted in RAM on an unattended machine. The boundary between convenience and security concentrates on the idle timer. When the human walks away, the carapace must close.

---

## zero-plaintext-server-secrets
**weight**: 4 | **last validated**: 2026-09-17 | **first observed**: 2026-08-28

The server is a cipher-keeper, never a key-holder. Plaintext passwords, TOTP seeds, secure notes, SSH private keys, and file attachment payloads must never reach the server in unencrypted form.

**History:**
- 2026-08-28: Server-side search indexing was proposed to allow full-text search across passwords and notes.
- 2026-08-28: Rejected because server-side indexing requires the server to hold decryption keys or inspect plaintext payloads, instantly invalidating zero-knowledge sovereignty.
- 2026-09-13: Extended to agent credentials in Phase 17: even agent API keys are now stored strictly as SHA-256 hashes.
- 2026-09-17: Triple-layer encryption model verified: client-side ShellCryption + server-side per-row metadata encryption + SQLCipher whole-DB encryption.

**Shaped perspective:** This is the bedrock constraint of ShellGuard. Once plaintext touches the server network interface, zero-knowledge is dead. It cannot be negotiated away for server-side search, push notifications, or agent summarization. All indexing and filtering occurs client-side in the browser or inside the agent's isolated local enclave.

---

## pod-unassigned-empty-string
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-02

The unassigned category state must strictly be represented as `""` (empty string). Code must never coalesce empty categories to `'Personal'` or any other fallback string.

**History:**
- 2026-09-02: `category || 'Personal'` fallback was added to provide a default folder chip in the UI.
- 2026-09-03: The fallback caused deleted folders to silently reappear, corrupted user pod trees, and prevented users from having an empty vault structure.
- 2026-09-13: Ratified across all four item types and migration `0004_key_ledger.sql`: `DEFAULT 'Personal'` was dropped from SQLite schemas, and uncategorized items persist strictly as `""`.
- 2026-09-16: Verified in test suites and documented in `systemPatterns.md`.

**Shaped perspective:** A default category seems harmless until a user attempts to delete it. When code refuses to accept nothingness as a valid state, it fights the user for control of their data. The empty string is not an error; it is an explicit architectural assertion that the user has chosen no classification.
