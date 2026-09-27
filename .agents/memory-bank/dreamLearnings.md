# Dream Learnings — ShellGuard

*Crystallized invariants, high-salience patterns, and resolved tensions extracted during memory consolidation passes.*

---

## 2026-09-26 18:32 — Pass #1

### Invariants
- **Zero-Plaintext Network Egress** (source: `systemPatterns.md`, `projectBrief.md`, `long-term/constraints.md`)  
  Plaintext passwords, TOTP seeds, secure notes, SSH private keys, and file payloads never reach the server in unencrypted form. The server is strictly a cipher-keeper, never a key-holder.
- **In-Memory Volatility & RAM Zeroization** (source: `systemPatterns.md`, `docs/companion/security.md`, `long-term/constraints.md`)  
  Decrypted search indices and cached secrets exist strictly in volatile client RAM. Locking or session retraction automatically zeroizes memory buffers with zero disk residual.
- **The Operational Seam is the Sole Empirical Oracle** (source: `project-hygiene.md`, `long-term/learnings.md`)  
  Automated tests prove internal algorithmic consistency within what the author remembered to test. The human Live Verification Handshake proves that the software meets reality at the surface of use.
- **Ephemeral Batch Isolation & Progressive Disclosure** (source: `ROADMAP.md`, `activeContext.md`, `decision-log.md`)  
  Bulk imports stamp lifecycle metadata (`import_batch_id`, TTL). The UI remains 100% silent unless active imported items exist, and editing an item automatically graduates it to permanent status.

### High-Salience Patterns
- **Ambient Two-Stage Ingestion** (source: `activeContext.md`, `ROADMAP.md`, `long-term/learnings.md`)  
  Heavy bulk ingestion decouples primary metadata persistence from bulk ciphertext streaming. Stage 1 executes instant (<2s) transactional commits to liberate the user interface immediately; Stage 2 delegates heavy binary attachments (up to 500MB) to a floating, ambient dock.  
  *seed: Thoughtful Systems & UI Symbiosis*
- **Pure In-Memory Zero-Knowledge Search** (source: `src/lib/vaultSearch.ts`, `docs/vault-features/search.md`, `changelog.md`)  
  Unified search across encrypted vaults executes purely against already-decrypted in-memory client state. Avoids server-side query leakage or index poisoning, purging results immediately on lock.  
  *seed: Zero-Knowledge Search Invariant*
- **Frameworkless Application-Scoped DI** (source: `android/di-container.md`, `android/README.md`, `systemPatterns.md`)  
  Security-critical zero-knowledge clients prioritize deterministic cold boot (<100ms) and auditable memory lifetimes. Pure Kotlin `AppContainer` with thread-safe `by lazy` properties eliminates annotation processing and reflection while enabling clean memory zeroization.  
  *seed: Auditable Client Sovereignty*

### Contradictions & Tensions Resolved
- **SQLite Schema Reality vs. Delta Sync Expectations** (`vault_pearls.updated_at`):  
  `vault_pearls` has no native `updated_at` column (only `created_at`). Resolved in code contract: client's `classifyDeltaPearls` treats null `updated_at` as changed and prunes deletions via remote ID sets without requiring disruptive database schema alters.
- **Inactivity Timer Retraction vs. Heavy Ingestion UX**:  
  Strict 15-minute sliding inactivity timer must not abort active multi-hundred-megabyte archive streams. Resolved by background transfer workers maintaining active socket keep-alives and `NavIntent` state preservation to prevent mid-stream session eviction while keeping credentials masked.
- **Memory Bank Directory Boundaries**:  
  Antigravity rules dictate staying strictly in `.agents/memory-bank/`. Resolved: workflows and memory bank files operate exclusively inside `.agents/` with zero cross-touching of other agent homes (`.clinerules/`, `.claude/`).
