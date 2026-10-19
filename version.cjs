const fs = require('fs');

function bumpJson(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/"version": "0.0.2.6"/g, '"version": "0.0.2.7"');
  fs.writeFileSync(file, c);
}

bumpJson('package.json');
bumpJson('package-lock.json');

let readme = fs.readFileSync('README.md', 'utf8');
readme = readme.replace('v0.0.2.6', 'v0.0.2.7');
fs.writeFileSync('README.md', readme);

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
changelog = changelog.replace('## [Unreleased]', '## [Unreleased]\n\n## [0.0.2.7] - 2026-10-18 (Build 29)\n\n### Added\n- Habitat Full-Archive Mobility Engine (streaming zero-knowledge ZIP generator bounded to memory footprint).\n- Two-Stage Ingestion Pipeline with Abyssal Dropzone and `.zip` archive sniffer.\n- Abyssal Ingestion Dock: background queue processor with real-time UI tracking for massive attachment restores.\n- Reactive bioluminescent chips tracking in-flight attachment upload progress.\n- Auditor Battery Additions: Classes L2 & L6 schema vs codebase verification.\n\n### Changed\n- Enhanced ImportExportView.tsx to accept drop events for Habitat archives and Stage 1 manifest previews.\n\n### Fixed\n- Enforced strictly decoupled memory parsing on ZIP packaging by implementing Web Streams & `client-zip` async generators.\n');
fs.writeFileSync('CHANGELOG.md', changelog);

let arch = fs.readFileSync('ARCHITECTURE.md', 'utf8');
arch = arch.replace('Version: v0.0.2.6', 'Version: v0.0.2.7');
arch = arch.replace('Build: 28', 'Build: 29');
arch += "\n\n## Delta #30: Habitat Full-Archive Mobility & Reactive Ingestion Dock\n\nIn Phase 25 (Task 49 & 50, Build 29), we introduced **Habitat Full-Archive Mobility**, establishing a zero-knowledge streaming pipeline for exporting complete Vaults without ever buffering multi-gigabyte ZIP structures in browser memory. By leveraging an asynchronous generator with `client-zip`, the client strictly maintains an bounded memory ceiling while applying deterministic directory hierarchy logic. The ingestion counterpart deployed the **Two-Stage Ingestion Pipeline**. Rather than paralyzing the UI parsing giant `.zip` files, the new `sniffHabitatArchive` engine instantly resolves Stage 1 extraction of the embedded `shellguard_vault_export.json` to commit all primary row credentials to the database transactionally. Stage 2 elegantly hands off attachments to the floating **Abyssal Ingestion Dock** inside `VaultShell.tsx`, processing file blobs lazily via background queue while rendering bioluminescent reactive state chips across `ItemDetailPane.tsx` and `ItemListPane.tsx`. Finally, `tests/build-gates.test.ts` was upgraded to run active Class L2 & L6 parity checks to prevent limit and configuration drift across the application suite.\n";
fs.writeFileSync('ARCHITECTURE.md', arch);
