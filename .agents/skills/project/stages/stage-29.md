# Stage Execution Record: Stage 29 — Dual-Homed Network Resolution Engine, MagicDNS Mesh, Bulk Coalescing & Mobile Backup Interop

> **Milestone**: `v0.0.3.1 (Build 33)`  
> **Tasks**: Task 63 (Dual-Homed Network Resolution & Bulk Coalescing Engine) & Task 64 (Transport Diagnostics Drawer, Mobile Backup Interop & 4-Zone Docs Walk)  
> **Status**: 🟢 **RATIFIED & MERGED** (PRs `#33`, `#35`, `#36`, `#37`, `#38`, `#45`, `#46`, `#47`; latest code merge `8b7338e`)  
> **GitHub Issues**: `#21`, `#22`, `#25`, `#26`, `#27`, `#28`, `#29`, `#30`, `#31`, `#32`, `#34`  

---

## 1. Executive Summary

Phase 29 shipped across three cohesive pillars:

### Pillar A — Multi-Domain Bulk Transactions & Reactive River Coalescing (PR `#33` / `277e039`, Issues `#30`–`#32`)
- Coalesced `publishMutation()` to 1 SSE event per bulk transaction across `bulk-import`, `bulk-delete`, `bulk-metadata`, `graduate`, and `revert` in `src/server/routes/vault.ts`.
- Wrapped batch audit writes in `auditDb.transaction()`.
- Unified `POST /api/vault/bulk-import` (500-item client chunking + shared `import_batch_id`), `DELETE /api/vault/bulk` (4-table cascade), and added `PATCH /api/vault/bulk-metadata` (Layer-2 `category`/`tags` batch update without touching Layer-1 ciphertext).
- Exposed IETF `RateLimit-*` and `Retry-After` CORS headers (`corsConfig.ts`) and added `RateLimitError` + automatic HTTP `429` backpressure pacing to `AttachmentIngestionQueue` and `fetchAttachmentEnvelope`.
- Added `200ms` trailing debounce to `handleRiverMutation` and single-flight deduplication to `scuttleVault` in `src/App.tsx`.

### Pillar B — Dual-Homed Network Resolution Engine & MagicDNS Mesh (PRs `#35`–`#38`, `#45`, `#46`, Issues `#21`, `#22`, `#25`–`#28`)
- Added `src/server/utils/networkTopology.ts` classifying RFC 1918 LAN vs RFC 6598 (`100.64.0.0/10`) / Tailscale IPv6 (`fd7a:115c:a1e0::/48`) and resolving `*.ts.net` MagicDNS via 3-tier waterfall (Tailscale LocalAPI socket ➔ `dns.reverse` ➔ env hint) with graceful LAN-only fallback (`PR #35`, `a8bb50f`).
- Reflected `*.ts.net` as DNS SAN (`type: 2`) in `tlsManager.ts` and emitted dual-vector `shellguard://pair?v=1&lan=...&ts=...` QR URIs in `admin.ts`.
- Authorized `*.ts.net` and `fd7a:115c:a1e0::/48` origins in LAN-mode CORS via `isPrivateNetworkHostname()` (`PR #36`, `dc63a5c`).
- Mounted unauthenticated `GET /api/public/endpoints` reachability manifest in `src/server/routes/public.ts` (`PR #37`, `2eae2c0`).
- Implemented client `NetworkResolver` (`src/lib/networkResolver.ts`) with parallel `1200ms` LAN / `3000ms` Tailscale `AbortController` races, single-flight coalescing, `auto`/`force-lan`/`force-tailscale` pinning persisted in `sg_transport_config`, and `'online'` re-racing (`PR #38`, `c299297`).
- Wired dynamic base URL resolution in `apiConfig.ts`, transparent emergency race failover on network error in `restAdapter.ts`, and `EventSource` vector migration retaining `Last-Event-ID` in `useReactiveRiver.ts` (`PR #45`, `1f2bb20`).
- Delivered accessible `src/components/Network/TransportDiagnosticsDrawer.tsx` wired to the interactive Header Reactive River pill and Settings (`PR #46`, `7ee3ef0`).

### Pillar C — Mobile Backup Interop & Layer-2 Write Parity (PR `#47` / `8b7338e`, Issue `#34`)
- Added `src/lib/customFieldUtils.ts` (`normalizeCustomFields`, `extractShellGuardBackupItems`) handling Mobile object-map custom fields, camelCase fallback, and legacy `{ pearls, notes, sshKeys }` exports.
- Converted `POST /api/vault/bulk-import` to owner-scoped `ON CONFLICT(id) DO UPDATE ... WHERE owner_uuid = excluded.owner_uuid` with fail-closed `changes === 0` cross-tenant collision guard.
- Added Layer-2 `MetadataGuard` `uris` write-path parity across `POST /`, `PUT /:id`, and `POST /bulk-import`.

---

## 2. Test Vectors & Cloud CI Receipts

- **Full Suite Verification (Cloud CI Run `#45020213969`)**:
  - `43 passed (43)` Vitest test files, `480 passed | 1 skipped (481)` assertions.
  - `tsc --noEmit` & `npm run lint`: 0 errors.
  - Vite production build (`4.33s`) & VitePress docs build (`17.18s`): 100% green.
- **New Suites Shipped in Stage 29**:
  - `tests/unit/network-topology.test.ts`
  - `tests/unit/cors-magicdns.test.ts`
  - `tests/unit/networkResolver.test.ts`
  - `tests/unit/restAdapter-failover.test.ts`
  - `tests/unit/mobile-backup-interop.test.ts`
  - `tests/integration/bulk-import-idempotency.test.ts`

---

## 3. Dual-Testing Teamwork Sign-Off

- **Agent Gate**: All 8 code PRs (`#33`, `#35`, `#36`, `#37`, `#38`, `#45`, `#46`, `#47`) passed 100% green on GitHub Actions Cloud CI; verification products artifacts produced and audited.
- **Physical Verification**: Verified live by Lucas across LAN & Tailscale discovery (`GET /api/public/endpoints` `200 OK`), Transport Diagnostics Drawer interaction, and Mobile Backup Interop verification receipts prior to each merge.
