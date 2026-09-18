# 🦞 ShellGuard — Release v0.0.2.0

> **“The Composite Reef”** — Phase 18: Unified Bitwarden-Style Item Composition & In-Browser Keypair Generation
> **ClawStack Studios ©™** · 2026-09-17 · AGPL-3.0

ShellGuard's first MINOR-feature molt after the auditable corpus. The vault
becomes a **composite** reef: logins, notes and SSH keys carry their notes, TOTP
seeds, attachments and custom fields as one cohesive Bitwarden-style entity;
SSH keypairs are **generated inside the browser** (WebCrypto, Ed25519 /
RSA-4096) with output verified byte-identical to `ssh-keygen`; pod tallies are
proven (and locked by tests) to count primary items only. Alongside: the README
reorganized to the TOTP discipline, mermaid diagrams rendering on GitHub and
the portal, and the cryptologist's lens sealed into permanent memory.

---

## Key Themes

1. **In-Browser SSH Keypair Engine** — WebCrypto `generateKey` (Ed25519 +
   RSA-4096), OpenSSH one-line + RFC-4716 public encodings, PKCS#8 private key
   sealed client-side (AAD `vault_ssh_keys:{id}`) — never transmitted raw.
   Secure-context feature detection with an honest plain-HTTP-LAN notice.
2. **Bitwarden-Style SSH Key Section** — the item form gains a full SSH
   private-key surface (paste/import or generate), public-key display with
   one-click copy in the detail pane; extra fields (notes/TOTP/attachments/
   custom fields) extended to SSH keys per the locked domain rules.
3. **Pod-Tally Decoupling, Locked as Receipts** — `buildPodTree` filters to
   primary types; tests now prove attachment rows never inflate folder badges.
4. **The Composite Item Model Documented** — `vault_pearls` as the primary
   composite entity; schema truth already carried it, the docs now say so.
5. **Corpus & Portal Polish** — README TOTP-style reorganization, mermaid
   rendering (portal plugin + GitHub-parseable labels), long-term memory bank
   with the sealed Auditor's Perspective, learning-proposal rules ratified.

## Verification

- Full test oracle: **16 files / 221 tests** green (incl. 6 new keyGen tests
  and 2 pod-decoupling receipt tests)
- `ssh-keygen -y` cross-verification: derived public == generated public for
  both Ed25519 and RSA-4096
- `tsc --noEmit`, `vite build`, VitePress build — all clean

## Deployment

```bash
docker compose pull && docker compose up -d --wait
# or
docker compose up -d --build
```

Data lives in `./data` (`db.sqlite` + `audit.sqlite`). Set `DB_ENCRYPTION_KEY`
(strongly recommended). See `QUICKSTART.md` for the first-hatch walkthrough.

## Commit Ledger (v0.0.1.10 → v0.0.2.0)

```
61336a1 feat(vault): Bitwarden-style SSH key section with in-browser keypair generation (Phase 18 Task 36)
6f9b00d feat(vault): in-browser SSH keypair engine — Ed25519 + RSA-4096, ssh-keygen-verified (Phase 18 Task 35)
c6b74f1 docs(roadmap): frontmatter queue chain gains Phase 24
96e6047 docs(readme): TOTP-style reorganization — grouped features, merged encryption sections, collapsed references
ccdfd55 fix(docs): render mermaid diagrams — portal plugin + README label syntax
3d655d8 docs: adjust ShellGuard ASCII logo spacing in README
14d939a docs: adjust spacing and alignment of ShellGuard ASCII logo
ae55a5f docs: replace thumbnail PNG with favicon SVG in README
67bcf27 chore: rename auditable-corpus handoff to taskHandoff.md
df64545 feat: restore tighter original feature graphic & align README header to TOTP structure
f099808 docs(memory-bank): session handoff — the auditable corpus arc closed
bb9b95c docs(memory-bank): seal the Auditor's Perspective — long-term lens artifact
6b78c49 merge: brand assets refresh + VitePress link integrity (no release — docs deploy via main)
f3f6f68 feat: brand assets refresh + Web Design Bank + agent memory maintenance
1ba5f19 fix(docs): base-prefix Card hrefs + navigation-link integrity suite (all three link classes)
0a2c16c docs(memory-bank): initialize Long-Term Memory Bank + VitePress fix plan
cc8a872 docs: add Web Design Bank guidelines for consistent UI/UX development
2df6d63 rules: apply learning proposal — docs bow to code, ClawKey canon, env hazards, build-label sweep
```

---

*Your reef. Your keys. Your secrets.* — **Trust the Shell.** 🦞
