# 05.02 — Import/Export Habitat: `.sghabitat.zip` Archive & Abyssal Ingestion Dock

The **Habitat Archive** ([`habitatExport.ts`](../../../../../src/lib/habitatExport.ts) and [`habitatImport.ts`](../../../../../src/lib/habitatImport.ts)) packages a user's complete vault—including binary Grotto attachments—into a single portable `.sghabitat.zip` container (`fflate` streaming ZIP assembly). Each archive contains `manifest.json` (format version, owner UUID, item/attachment counts, SHA-256 integrity hashes), `vault.enc` (encrypted JSON payload of pearls, notes, SSH keys, and pod color metadata), and `attachments/<id>.bin` (raw client-ShellCrypted attachment blobs), with memory-bounded streaming and orphan attachment quarantine awareness (`is_quarantined`, Migration 0009).

The **Abyssal Ingestion Dock** ([`AbyssalIngestionDock.tsx`](../../../../../src/components/vault/AbyssalIngestionDock.tsx)) provides a unified drag-and-drop intake surface driven by a two-stage non-destructive format sniffer: Stage 1 inspects file magic bytes and JSON/ZIP headers without mutating state to classify `.sghabitat.zip`, `sgtotp.bak`, ShellGuard `.enc`/`.json`, or Bitwarden exports; Stage 2 presents a dry-run preview card (item counts by domain, attachment volume, conflict/quarantine summary, and decryption passphrase/key prompt if sealed) before committing the batch import.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/vault/AbyssalIngestionDock.tsx`, `src/components/ImportExportView.tsx`
- **Client Libraries**: `src/lib/habitatExport.ts`, `src/lib/habitatImport.ts`
- **Deep Specs**:
  - [Import/Export & Compatibility Specification](../../../specs/storage/import-export-spec.md)
  - [SQLite Bedrock Database Schema (§3 Migration 0009 Orphan Quarantine)](../../../specs/storage/database-schema.md)
- **Verification Oracles**: `tests/unit/habitatArchive.test.ts`, `tests/attachments.test.ts`
