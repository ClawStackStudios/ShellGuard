---
description: Mandatory protocol for self-reflection, persistent knowledge capture, and continuous improvement before task completion.
author: ClawStackStudios
version: 1.0
category: "Core"
tags: ["protocol", "meta", "learning", "reflection", "knowledge-management", "core-behavior"]
globs: ["*"]
---

# Continuous Improvement Protocol

**Objective:** Proactively learn from tasks, capture knowledge in a structured way, distill fundamental insights, refine understanding, and improve efficiency and reliability. This protocol maintains two key files: `memory-bank/raw_reflection_log.md` for initial detailed logging, and `memory-bank/consolidated_learnings.md` for pruned, actionable, long-term knowledge.

**Core Principle:** Continuous learning and adaptation are **mandatory**. This protocol **must be executed before task completion** for tasks with new learning, problem-solving, user feedback, or multiple steps. Trivial mechanical tasks *may* be exempt; otherwise, execution is default.

**Key Knowledge Files:**
* **`memory-bank/raw_reflection_log.md`**: Detailed, timestamped, task-referenced raw entries. Initial dump of all observations.
* **`memory-bank/consolidated_learnings.md`**: Curated, summarized, actionable insights. Primary refined knowledge base. Kept concise and highly relevant.

---

## 1. Mandatory Pre-Completion Reflection & Raw Knowledge Capture

Before signaling task completion, perform these internal steps:

### 1.1. Task Review & Analysis:
* Review the completed task (conversation, logs, artifacts).
* **Identify Learnings:** New information, techniques, underlying patterns, API behaviors, project-specific commands, environment variables, setup quirks, successful outcomes. What core principles can be extracted?
* **Identify Difficulties & Mistakes:** Challenges faced? Errors, misunderstandings, inefficiencies? How can these refine future approaches? Did user feedback indicate a misstep?
* **Identify Successes:** What went particularly well? What strategies or tools were notably effective? Key contributing factors?

### 1.2. Logging to `memory-bank/raw_reflection_log.md`:
* Create a timestamped, task-referenced entry detailing all learnings, difficulties (and resolutions), and successes (and contributing factors).
* This file serves as the initial, detailed record. Entries are candidates for later consolidation.

---

## 2. Knowledge Consolidation & Refinement (Periodic)

Refining knowledge from `raw_reflection_log.md` into `consolidated_learnings.md`. Occurs periodically or when `raw_reflection_log.md` grows significantly.

### 2.1. Review and Identify for Consolidation:
* Review `raw_reflection_log.md` for durable, actionable, or broadly applicable knowledge.

### 2.2. Synthesize and Transfer to `consolidated_learnings.md`:
* Concisely synthesize, summarize, and distill into generalizable principles or actionable patterns.
* Organize logically (by topic, project, tech) for easy retrieval.
* Ensure content is actionable, generalizable, and non-redundant.

### 2.3. Prune `raw_reflection_log.md`:
* **Once information is consolidated, remove corresponding entries from `raw_reflection_log.md`.**
* Keeps it focused on recent, unprocessed reflections. Prevents indefinite growth.

### 2.4. Proposing Rule Enhancements (Exceptional):
* If a broadly applicable insight strongly suggests modifying another active rule, propose the change after user confirmation.

---

## 3. Guidelines for Knowledge Content

* **Prioritize High-Value Insights:** Lessons that significantly impact future performance, lead to robust understanding, detail critical errors and resolutions, major time-savers, fundamental shifts in understanding, essential configurations.
* **Be Concise & Actionable:** Clear, to the point, useful when revisited. What can be *done* differently next time?
* **Document Persistently, Refine Continuously:** Capture raw insights immediately. Systematically refine, consolidate, and prune.
* **Organize for Retrieval:** Clear headings, logical structure, Markdown formatting.
* **Avoid Low-Utility Info in consolidated_learnings.md:** No trivial statements. Raw verbose thoughts belong in raw_reflection_log.md before pruning.
* **Support Continuous Improvement:** Avoid repeating mistakes, accelerate future tasks, make operations more robust.
