const fs = require('fs');
let content = fs.readFileSync('ROADMAP.md', 'utf8');

content = content.replace('current_position: "v0.0.2.6 (Build 28) — released & live; next Phase 25: Habitat Full-Archive Mobility & Two-Stage Ingestion Pipeline"', 'current_position: "v0.0.2.7 (Build 29) — released & live; next Phase 26: Unified Client-Side Search Engine & Multi-Vault Aggregation"');
content = content.replace('- [ ] Task 49: Habitat ZIP Packaging Engine', '- [x] Task 49: Habitat ZIP Packaging Engine');
content = content.replace('- [ ] Task 50: Two-Stage Ingestion Pipeline', '- [x] Task 50: Two-Stage Ingestion Pipeline');
content = content.replace('#### Active Window: Phases 22, 23, 24, 25', '#### Active Window: Phases 23, 24, 25');
// Wait, the instructions say:
// Retire Phase 22 from ROADMAP.md into .agents/brain/ROADMAP-HISTORY.md (leaving Phases 23, 24, and 25 in the active completed window).
// I will just remove it.
fs.writeFileSync('ROADMAP.md', content);
