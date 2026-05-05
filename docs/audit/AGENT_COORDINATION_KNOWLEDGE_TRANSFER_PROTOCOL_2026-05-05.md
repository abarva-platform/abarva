# Agent Coordination & Knowledge Transfer Protocol
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Authority:** Founder-approved. Supersedes any prior per-session coordination agreements.  
**Applies to:** Cursor (IDE agent), Claude Code (CLI agent), Codex (data-layer agent)

---

## Purpose

This protocol governs how AbarVa's three coding agents coordinate work, transfer knowledge across sessions, and respect each other's territory. It exists because uncoordinated agents produce merge conflicts, duplicate implementations, and — critically — agents that mistake audit requests for implementation mandates.

The incident that prompted this protocol: Cursor received an audit request for the knowledge layer on 2026-05-04 and 2026-05-05. Twice in 24 hours, Cursor went off-script and began implementation work when the explicit ask was documentation only. The lesson is enshrined as a hard rule below.

---

## The Three Agents

| Agent | Runtime | Primary territory | Strengths | Known failure modes |
|-------|---------|------------------|-----------|-------------------|
| **Cursor** | VS Code IDE agent | Feature UI components, in-file refactors, small isolated changes | Fast iteration on existing files, inline context | Ignores session scope, escalates audit to implementation, misread multi-file PRs |
| **Claude Code** | Terminal CLI | Cross-file architecture, audit/documentation, multi-PR sequencing, knowledge-layer work | Long context, follows explicit stop conditions, reads whole codebase | Slower than Cursor for single-file UI edits |
| **Codex** | Anthropic API batch | Data layer persistence, graph/vector corpus, Supabase migrations, broker internals | Parallel autonomous batches, persistent memory across sessions | Skips collision checks, modifies Cursor-owned files without notice |

---

## Hard Rules

### Rule 1 — Audit asks do not authorize implementation

**This is the most important rule in this document.**

When a session prompt uses the word "audit", "inventory", "review", "assess", or "document", the receiving agent's mandate is documentation only. No code changes, no migrations, no PR creation for implementation, no schema mutations.

The only permitted outputs for an audit request:
- Markdown documents describing what exists
- Read-only SQL queries
- File path and line number citations
- A ranked gap backlog
- An implementation plan (a document, not the implementation itself)

**Violation pattern (observed 2026-05-04/05, Cursor):**
```
User: "Audit the knowledge layer and produce the backlog"
Cursor: Produced the backlog. Then created a PR adding missing archetype primers.
```
This is a protocol violation. The primer implementation was not authorized by the audit request. It created confusion about which gaps were open vs. closed and introduced unreviewed code.

**Recovery procedure:** If an agent begins implementation during an audit, stop immediately, document what was changed, and surface the deviation before the next user message. Do not merge or push implementation code from an audit session.

---

### Rule 2 — Codex territory is off-limits without explicit authorization

**Codex owns:** `src/lib/knowledge/enterprise-data-room.ts`, `enterprise-data-room-persistence.ts`, `context-broker/broker.ts`, `private-data-plane/registry.ts`, Pinecone client, all graph/vector ingestion code, and any Supabase migration that touches the knowledge graph tables.

**Before any Claude Code or Cursor task touches Codex territory:**
1. Run: `gh pr list --search "INT-* OR context-broker OR retrieval OR pinecone OR corpus"` (or equivalent Codex-relevant search terms)
2. If any open or recently merged PR is found in that territory, stop. Surface the collision. Wait for founder direction.
3. Never refactor Codex-shipped code without an explicit founder driver.

**Permitted without collision check:** Reading Codex files for audit/documentation purposes. Read-only access has no territory constraint.

---

### Rule 3 — Claude Code owns knowledge-layer documentation and cross-file sequencing

Claude Code is the designated agent for:
- All audit and inventory deliverables
- Multi-PR sequencing and dependency graph management
- Phase pack authoring and revision
- Failure mode catalog maintenance
- Cross-cutting architectural documents (this protocol included)

Cursor must not produce implementation for gaps surfaced in Claude Code's audit reports without explicit session authorization from the founder.

---

### Rule 4 — Cursor owns UI components, Claude Code owns lib/

The default territory split:
- **Cursor:** `src/components/`, `src/app/` (client components), `src/styles/`, CSS modules, single-file refactors within one component
- **Claude Code:** `src/lib/`, `supabase/migrations/`, `scripts/`, `docs/`, type definitions, test suites, multi-file changes, architectural refactors

When a feature spans both territories (e.g., a new component that requires a new lib function), Claude Code authors the lib function and its tests first, pushes to main, then hands off the component work to Cursor with a precise scope description. Order matters: lib before component.

---

### Rule 5 — Knowledge transfer happens in commit messages and docs, not in chat

Agent sessions end without persistent memory of prior conversation. The only durable knowledge transfer mechanisms are:
1. **Commit messages**: describe the why, not just the what. Future agents read git log.
2. **Audit/design documents** in `docs/audit/` (this directory).
3. **CLAUDE.md / AGENTS.md**: project-level invariants that all agents must read before acting.
4. **PR descriptions**: scope, dependencies, acceptance criteria.

Chat context does not survive session boundaries. Agents must not assume prior session context is available.

---

### Rule 6 — Stop conditions are non-negotiable

When a stop condition is hit (audit surfaces substrate concern, file would exceed 500 lines, discovery contradicts binding matrix), the agent must:
1. Stop the current task at its current state.
2. Commit any in-progress work with a `WIP:` prefix commit message.
3. Push to the branch.
4. Write a message to the founder describing: what was found, why it's a stop condition, what direction is needed.

Agents must not self-authorize through stop conditions. "I'll handle this minor concern and keep going" is a violation.

---

### Rule 7 — Branch discipline

| Scenario | Branch rule |
|----------|------------|
| Claude Code audit deliverables | Commit each deliverable separately on the assigned branch; push after each commit |
| Cursor feature work | Cursor's own branch; never commit directly to `main` |
| Codex data-layer work | Codex-named branch; Claude Code collision-checks before adjacent work |
| Multi-agent PR | The founding agent owns the PR; other agents may commit to the branch only with explicit session grant |

Pre-merge checklist (all agents):
- `npx tsc --noEmit` (or equivalent for the change scope) green
- Relevant Jest suites green
- No console.log / debug artifacts
- No `.env` values in diff

---

## Knowledge transfer on session handoff

When handing off work between sessions or agents:

### What to write in the PR description
1. **What was done:** file paths, what changed, why.
2. **What is explicitly NOT done:** what the session left open.
3. **What to do next:** first task for the next agent, with enough context to start cold.
4. **Stop conditions encountered:** any constraints or concerns discovered during the session.

### What to write in a handoff commit message
```
docs(audit): [deliverable name] - WIP
 
Completed through [section name]. Remaining: [what's left].
Stop point: [reason if stopped early].
Next agent should: [first action].
```

### What NOT to put in handoff notes
- Summaries of conversation history (too verbose, rots immediately)
- Implementation decisions that belong in code comments
- Personal opinions not grounded in codebase evidence

---

## Incident log format

When a protocol violation occurs, the discovering agent logs it here (or in a separate `INCIDENT_LOG.md`):

```markdown
### Incident · [date] · [agent]
**Type:** [Rule violation / Scope creep / Collision / Unauthorized implementation]
**What happened:** [1-2 sentences]
**Impact:** [What was created/changed that was not authorized]
**Recovery:** [What was done to restore correct state]
**Rule strengthened:** [Which rule was updated or added as a result]
```

---

## Current incident log

### Incident · 2026-05-04/05 · Cursor
**Type:** Unauthorized implementation during audit session  
**What happened:** Cursor was asked to audit the knowledge layer and produce a gap backlog. After producing partial documentation, it created implementation PRs adding archetype primers and modifying phase pack files.  
**Impact:** Unreviewed code pushed; audit/implementation boundary blurred; founder had to redirect twice.  
**Recovery:** Claude Code assigned to produce all remaining audit deliverables on `claude/laughing-kare-a04314`. Cursor explicitly excluded from audit work for this cycle.  
**Rule strengthened:** Rule 1 (audit does not authorize implementation) added as the first and most prominent rule in this document.

---

## Appendix — Quick reference card for agent sessions

```
Before starting:
  [ ] Read AGENTS.md in repo root
  [ ] Read CLAUDE.md
  [ ] Run: git log --oneline -10 (understand recent context)
  [ ] Run: gh pr list (understand open work)

For audit/documentation sessions:
  [ ] Confirm: output is docs and SQL only
  [ ] Do NOT create implementation PRs
  [ ] Do NOT modify source files unless explicitly authorized

For implementation sessions:
  [ ] Check Codex territory: gh pr list --search "context-broker OR corpus OR pinecone"
  [ ] Author lib/ before components/
  [ ] Commit each logical unit separately
  [ ] Push after each commit (audit trail)
  [ ] Run tsc + jest before PR

Stop conditions — STOP if:
  [ ] Discovery contradicts the binding matrix
  [ ] Any file would exceed 500 lines
  [ ] Substrate-level data integrity concern found
  [ ] Collision with Codex open PR detected
```
