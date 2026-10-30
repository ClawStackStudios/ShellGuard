# Architectural Decision Records (ADR)

This directory serves as the immutable historical record of key architectural choices, trade-offs, and design axioms adopted in ShellGuard.

Each record documents the context, the options considered, the chosen path, and the permanent consequences for the system.

---

## 📑 ADR Index

| ADR ID | Title | Date | Status | Impact Area |
|---|---|---|---|---|
| **[ADR-001](ADR-001-SQLite-BLOB-Streaming-vs-External-Storage)** | SQLite BLOB Storage with Chunked Substr Streaming vs External Filesystem | 2026-09-15 | **Accepted** | Database & Attachments |
| **[ADR-002](ADR-002-Pure-Kotlin-Application-Scoped-DI-vs-Framework-DI)** | Pure-Kotlin Application-Scoped Lazy DI vs Heavy Framework DI (Android) | 2026-09-26 | **Accepted** | Mobile Companion Architecture |
| **[ADR-003](ADR-003-Boot-Time-Environment-Validation-vs-Dynamic-Fallback)** | 24-Envar Boot-Time Validation & Entropy Clamping vs Dynamic Fallbacks | 2026-10-28 | **Accepted** | Container & Host Configuration |

---

## 📝 Format Standard

All future ADRs added to the compendium adhere to the standard Nygard format:

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Superseded | Deprecated]

## Context & Problem Statement
[What situation motivated this decision? What constraints or requirements applied?]

## Options Considered
1. [Option 1]: [Description, pros, cons]
2. [Option 2]: [Description, pros, cons]

## Decision & Rationales
[What was chosen and why? What was the fundamental trade-off made?]

## Consequences
- **Positive**: [Benefits and capabilities gained]
- **Negative / Trade-offs**: [Inconveniences, extra steps, or complexity accepted]
- **Security Invariant**: [Any security guarantee that must never be violated]
```
