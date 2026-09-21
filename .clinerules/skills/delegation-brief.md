# Skill: The Delegation Brief (ground truth for a memoryless executor)

**When:** handing a task to another agent, a fresh session, or any executor with
no memory of this codebase.

A brief that leads with *what to build* produces guesses. A brief that leads
with *verified ground truth* produces work. Order the document by
trap-prevention, not by task description.

## 1. Section 0 — GROUND TRUTH TABLE (lead with this)

For every fact the executor would otherwise have to rediscover, hand it over:

| Fact | Where (real path + line) | Consequence for you |

- **Real file paths, verified with `ls`/`grep`** — never from memory, never from
  the spec. Both failure modes have occurred: a phantom path
  (`src/components/ItemListPane.tsx` when the real path was
  `src/components/Vault/ItemListPane.tsx`), and a spec premise that was simply
  false.
- The routes / schemas / columns / limits that exist **TODAY**, with line numbers.
- Any spec claim that is FALSE, called out explicitly — *"the spec says 'update'
  these endpoints; none exist, you are adding, not updating."*
- Current test count, free test ports, body-size ceilings, and any adapter
  response-shape rule the client depends on.
- The invariants that silently break things: encryption-boundary rules, tenant
  scoping requirements, route-registration ordering, envelope shapes.

## 2. Section 1 — REQUIRED CONTEXT FILES

Name the oracle/spec files to read, with section numbers. An executor that does
not know which documents are authoritative will invent them.

## 3. Section 2 — RESOLVED DECISIONS (defaults, not menus)

An executor without context stalls on open choices or guesses. Give every
decision a **default + one-line rationale + a written-justification escape
hatch** so deviation is visible rather than silent. Never present a bare menu.

## 4. Sections 3–4 — BUILD ORDER + NEVER LIST

Compile-before-proceed steps, then the hard invariant violations that
constitute review rejection.

## 5. Section 5 — DOCUMENTATION IMPACT CHECKLIST

Verbatim from the phase spec. If the spec mandates it, the phase is incomplete
without it — an executor that was not handed the list will not invent it.

## 6. Section 6 — WITNESS-TEST SPEC

Test file path, isolation preamble, port, and the exact assertions the success
criteria imply — **including the spec's own arithmetic** ("100 items / 2
malformed → 98 persisted"). If the spec states a number, the test asserts it.

## 7. Section 7 — GATES + OUT OF SCOPE

Exact commands, measured durations, environment traps (shell-integration
swallowing, emoji-in-heredoc corruption, blocking daemons), and an explicit
out-of-scope list so scope creep is visible rather than silent.

## Reviewing a plan BEFORE execution

Grep every file, endpoint, and symbol the plan names. A plan that references a
nonexistent path, or that inherits a stale spec premise, is not ready to
execute. The coverage map — *spec line → plan line → gap* — is the artifact
that proves it. Review order of operations: read the spec, trust nothing it
claims about the codebase, verify each claim against the code, then measure the
plan against the verified reality.

*Reference incident: ShellGuard 2026-09-20 — Phase 21 delegated to a separate
agent. The first plan named a phantom file path, inherited a stale spec premise,
and omitted the Documentation Impact mandate, the witness test, the permission
mapping, and four silent-failure traps (metadata-guard columns, the 1 MB body
ceiling, the route-ordering shadow, the 207 envelope shape). A revision brief
led by a verified ground-truth table and resolved defaults produced a pass that
satisfied every item and cleared all four gates.*