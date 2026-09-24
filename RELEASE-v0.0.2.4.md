# 🦞 ShellGuard — Release v0.0.2.4

> **"The Reef Polish & Unified Ergonomics Molt"** — Phase 22: Unified Zero-Knowledge Search Engine, Control Surface Consolidation & Ergonomics Verification  
> **ClawStack Studios ©™** · 2026-09-23 · AGPL-3.0

The reef achieves unprecedented clarity and navigational velocity. ShellGuard **v0.0.2.4 (Build 26)** delivers a **Robust Unified Client-Side Search Engine**, prunes redundant global search bars across the header and sidebar, preserves high-speed local pod tree filtering, and re-verifies Eye-beside-Copy unmasking ergonomics across every secret field.

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██╗  ██╗
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██║  ██║
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ███████║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ╚════██║
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║         ██║
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝         ╚═╝
                                              ~ **ClawStack Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.2.4 (Build 26)** of **ShellGuard**! This release delivers a streamlined, ergonomic control experience by eliminating UI clutter and powering the vault with a pure zero-knowledge search engine. Vault items are matched instantly in client memory across titles, usernames, primary and secondary URLs, decrypted note contents, custom field names and values, attachment filenames, and tags—with zero network leakage and automatic memory purge on lock.

---

## 💎 Key Themes & Highlights

### 🔍 1. Robust Unified Client-Side Search Engine (`src/lib/vaultSearch.ts`, Task 43)
- **Deep In-Memory Search Corpus**: Queries across the pre-decrypted in-memory corpus (`vaultItems`) without triggering redundant decryption cycles or disk reads.
- **Multi-Field Matching**:
  - Item **title** (e.g., website, service, or server name)
  - **Username** or identity handle
  - Primary **URL** and secondary login **URIs**
  - Pearl **notes** text
  - Decrypted **Secure Note markdown content** (`secret`)
  - **Custom Fields**: Matches both field names and field values across text, hidden, checkbox, and linked types
  - Binary **attachment filenames** (`file_name`)
  - Assigned **bioluminescent tags**
- **Zero-Knowledge Invariant**: Zero network requests. The search query never touches the wire, query parameters (`?q=`), or server logs. The server cannot search what it cannot decrypt.
- **Lock Purge**: When `isLocked` flips to `true` or upon logout, the active `searchQuery` state and in-memory filtered corpus are purged immediately.

### 🧹 2. Search Surface Consolidation & Clutter Elimination (Task 44)
- **Header Simplification**: Removed the top-right search input, search icon, and floating search dropdown from `Header.tsx` (-64 lines). The header is restored to a clean utility cluster containing only the `+` Add Menu, Account Switcher, and Theme Toggle.
- **Sidebar Streamlining**: Removed the redundant top search bar and duplicate dropdown under "Dashboard" in `Sidebar.tsx` (-214 lines).
- **Pruned Dead Plumbing**: Cleaned up 71 lines of orphaned search state, refs, keyboard shortcuts (`/` and `⌘K`), and click-outside listeners in `src/App.tsx`.

### 🌲 3. Ergonomic Pod-Scoped Search Preserved
- **Dedicated Pod Tree Filtering (`SidebarFolderTree.tsx`)**: In accordance with ergonomic feedback, the dedicated **"Search Pods..."** input above the folder hierarchy was intentionally preserved. Users with extensive multi-tier pod structures can rapidly filter their folder tree without cluttering the global item feed.

### 👁️ 4. Eye-beside-Copy Ergonomics Re-Verified
- **Masked Field Consistency**: Re-verified across all masked rows (passwords, SSH private keys, and hidden custom fields) that the Eye/EyeOff unmask toggle sits strictly immediately to the **left** of the Copy button in the action cluster.
- **Mask Invariant**: Masked fields maintain full `••••••••••••••••` masking without leaking character counts or exposing sensitive text on row hover.

### 🧪 5. Comprehensive Unit Testing
- **10 Dedicated Test Cases (`tests/unit/vaultSearch.test.ts`)**: Covers empty/whitespace queries, title matches, username matches, multi-URI array parsing, decrypted note content, custom fields, attachment filenames, tags (JSON array and comma-separated), and resilient malformed JSON handling.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                 🌐 Client Layer (React 19 + Vite 6)                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   SidebarFolderTree     │  │          ItemListPane                │  │
│  │ (Pods, Tags, Pod Search)│  │    (Unified Master Search Bar)       │  │
│  └───────────┬─────────────┘  └──────────────────┬───────────────────┘  │
│              │                                   │                      │
│              ▼                                   ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     vaultSearch Engine (RAM)                      │  │
│  │    (Title, User, URIs, Decrypted Notes, Custom Fields, Tags)       │  │
│  │              Zero-Knowledge • Purged on Lock                      │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │                      ItemDetailPane                               │  │
│  │     (Eye-beside-Copy Unmask Cluster, Decrypted Inline Content)    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Verification Receipts

- **Unit Test Oracle**: 27 test suites, 323 passing tests (1 skipped).
- **TypeScript Strict Check**: `tsc --noEmit` passed with 0 errors.
- **Production Build**: Built cleanly via Vite in 54.75s.
- **Documentation Portal**: Built cleanly via VitePress in 94.89s.
- **Live Server Handshake**: Ports `:6464` (Web Shell) and `:6565` (API Server) verified live and operational.
