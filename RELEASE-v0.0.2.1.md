# 🦞 ShellGuard — Release v0.0.2.1

> **"The Deep Storage Molt"** — Phase 19: Attachment SQLite BLOB Migration & Streaming Architecture
> **ClawStack Studios ©™** · 2026-09-18 · AGPL-3.0

The attachment grotto goes native. Encrypted file payloads move from base64
TEXT strings into **native SQLite BLOB storage**, uploads and downloads become
**streamed wire contracts** (Busboy multipart in, chunked `substr` reads out),
and the grotto gains real limits: a **50MB per-file ceiling** and a **500MB
per-owner quota**, both failing closed with `413`. The vault UI gains live
upload progress with cancel, on-demand streamed decryption, encrypted inline
previews for images and PDFs — and the Eye-beside-Copy control ergonomics
pulled forward from Phase 22.

---

## Key Themes

1. **Native BLOB Storage** — migration 0005 rebuilds `vault_secure_attachments`
   with `file_data BLOB` + `size_bytes INTEGER`; legacy TEXT rows are
   re-encoded in code (idempotent, transactional, VACUUM'd — no byte-level
   ghosts). Base64's 33% storage inflation is gone.
2. **The Streaming Wire Contract** — uploads are multipart: the ShellCryption
   envelope streams as already-encrypted bytes (zero-knowledge untouched, no
   base64 inflation); the list endpoint is **metadata-only** — payload BLOBs
   leave exclusively via `GET /api/attachments/:id/file` in 1MB chunks, so a
   vault listing never carries bulk ciphertext and downloads never spike RSS.
3. **Limits & Quotas, Fail-Closed** — 50MB per-file ceiling aborts mid-stream
   (`ATTACHMENT_MAX_MB`); 500MB grotto quota per `owner_uuid`
   (`GROTTO_QUOTA_MB`) via an exact `SUM(size_bytes)` aggregate; both yield
   `413` and store nothing.
4. **Streaming UI** — real-time upload progress with cancel (XHR
   `onprogress`/abort), on-demand decryption (the client decrypts with the
   shellKey; the server never sees plaintext), and encrypted inline previews:
   images render from the decrypted payload, PDFs from a Blob object URL
   (never a `data:` URI on insecure origins).
5. **Eye-beside-Copy Ergonomics (folded forward from P22/T44)** — the Unmask
   (Eye/EyeOff) toggle sits immediately LEFT of Copy in the right-hand action
   cluster on every masked field row (password, SSH private key, hidden custom
   fields); the full-value mask invariant holds (every character → `•`).

## Verification

- Full test oracle: **19 files / 230 tests** green, 1 skipped (the
  Phase-24-targeted fallback-parity test) — including the new
  `tests/attachments-blob.test.ts` (6 tests: migration, backfill idempotence,
  multi-chunk streaming, per-file 413, quota 413, quota release)
- `tsc --noEmit`, `vite build`, `docs:build` — all clean
- `docsLinks` + `mermaidDiagrams` suites — 10/10
- `tsc --noEmit`, `vite build`, VitePress build — all clean

## Deployment

```bash
docker compose pull && docker compose up -d --wait
# or
docker compose up -d --build
```

Data lives in `./data` (`db.sqlite` + `audit.sqlite`). Set `DB_ENCRYPTION_KEY`
(strongly recommended). See `QUICKSTART.md` for the first-hatch walkthrough.

## Commit Ledger (v0.0.2.0 → v0.0.2.1)

```
dee897f docs: sync Phase 19 BLOB/quota/streaming truth across the corpus
27df54b feat: streamed progress uploads, on-demand decryption & encrypted previews + Eye-beside-Copy (Phase 19 Task 38)
f4f6073 feat: attachment BLOB storage, streaming handlers & grotto quota (Phase 19 Task 37)
```

---

*Your reef. Your keys. Your secrets.* — **Trust the Shell.** 🦞
