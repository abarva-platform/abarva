# Agent Coordination · Knowledge Transfer Protocol

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Builds on | `docs/build/session-coordination/SESSION_COORDINATION.md` (the existing lane coordination protocol) |
| Scope    | No-loss handoff rules for Cursor / Codex / Claude agents working in the knowledge layer and Strategic Moves territory |

## Why this exists

The knowledge layer and the Strategic Moves surface are the most frequently contested territory in the repo. Three separate agents (Cursor background agents, Codex PRs, Claude worktrees) have shipped, drifted, or left gaps in the same files. This protocol adds knowledge-layer-specific guardrails on top of the existing `session-coordination/` machinery.

**The session-coordination protocol covers locks and sequencing. This protocol covers what must be transferred when an agent stops and another picks up.**

## 1 · Pre-flight checklist (before any knowledge-layer work)

Every agent, every session, no exceptions:

```bash
# 1. Check what Codex is doing
gh pr list --search "INT-* OR context-broker OR retrieval OR pinecone OR corpus OR knowledge-layer OR phase-packs OR failure-mode"

# 2. Check the session coordination plane
cat docs/build/session-coordination/ACTIVE_LOCKS.yaml
cat docs/build/session-coordination/WORKSTREAM_STATUS.yaml

# 3. Confirm design pack is current
ls docs/design/knowledge-layer/
ls docs/design/strategic-moves/
ls docs/design/nexus/

# 4. Confirm no open PRs in contested territory
gh pr list --state open | grep -i "phase-labels\|phase-packs\|failure-mode\|governance\|pattern"
```

**If any of the above shows a conflict or in-flight Codex PR in the same territory: stop, surface the conflict, do not proceed.**

## 2 · Contested file list (knowledge layer)

Any PR touching these files must follow the no-step-on-Codex rule and the broker boundary rule:

| File / directory | Risk | Rule |
|-----------------|------|------|
| `src/lib/programs/phase-packs/**` | Codex has shipped phase pack content; Claude owns doctrine rewrite | Lock before editing. Doctrine rewrite (GAP-2) owns the rename/retire; content within each pack is follow-on. |
| `src/lib/programs/failure-modes.ts` | Both agents touch this | Lock before editing. Only change to retire P6 refs (GAP-1); do not restructure. |
| `src/lib/intelligence/ai-program-failure-modes.ts` | Codex uses for Intelligence Ask | Coordinate before any change; this is Codex's primary FM source. |
| `src/lib/programs/governance.ts` | PR #1517 is in-flight | Do not touch until PR #1517 merges (or is closed). |
| `src/lib/intelligence/loader.ts` | Any corpus change flows through here | Do not modify without updating corpus count docs. |
| `src/lib/programs/classifier.ts` | Codex collision potential | Check Codex PR list before any classifier change. |
| `src/app/api/chat/agent/route.ts` | High-contention; many agents touch | Acquire a specific route-section lock before editing the phase-initialization block. |
| `supabase/migrations/**` | All migrations are shared; irreversible | Never write a migration in response to a knowledge-layer design doc; only write when the design doc says "done" and Wave 0 closes. |

## 3 · Broker boundary rule (hard rule)

> App-tier code MUST NOT import `EnterpriseDataRoom`, `broker`, `vector`, or `graph` modules directly. All knowledge layer reads must go through `AgentContextBroker`.

Any PR in the knowledge layer that violates this boundary will be reverted. This includes documentation-driven code that "just tests" the broker.

Verify before submitting a knowledge-layer PR:
```bash
grep -r "EnterpriseDataRoom\|from.*broker\|from.*vector\|from.*graph" src/app/ src/components/ src/lib/programs/ \
  | grep -v "AgentContextBroker" | grep -v "node_modules"
```
Zero results expected.

## 4 · Transfer handoff format

When an agent stops work in the knowledge layer **without completing the task**, it must leave a handoff note. Format:

```markdown
## Knowledge Layer Handoff · {agent} → {next} · {date}

### What was done
- [specific, with commit SHA or PR number]

### What is NOT done (do not assume otherwise)
- [specific list; no vague "some things remain"]

### Files left in a known-bad state
- [file path]: [what is wrong]

### Files that must NOT be touched until {condition}
- [file path]: [reason]

### Design docs that inform next steps
- [path to doc]: [what it tells you]

### Open questions that block progress
- [question]: [what's needed to answer it]
```

Leave this in the relevant `EVENT_LOG.md` entry AND in the PR description if a PR is open.

## 5 · Knowledge-layer PR rules

1. **Documentation before code**: a design doc in `docs/design/` must exist before any code PR in the knowledge layer (this pack IS that doc). Link the design doc in the PR description.
2. **Phase doctrine compliance**: any PR touching `phase-*` files must assert that it is consistent with the 6-phase doctrine. PR body must explicitly state which of GAP-1 or GAP-2 it addresses, or that it does not touch contested files.
3. **Test updates**: every phase-pack, failure-mode, or governance change must carry updated tests. Zero tolerance for `it.skip` on knowledge-layer tests without a named issue.
4. **No migration before design doc is stable**: the remap migration in PR #1517 should be the last migration touching phase numbers until this design pack is marked stable (all 9 deliverables merged to main).
5. **Corpus count verification**: any PR that adds or removes patterns must verify `loadCorpus()` count in the PR description.

## 6 · Specific handoff: Cursor → Claude / Codex on Phase Model work

**Context**: Cursor agent shipped PR #1517 (6-phase model impl) and then drafted PR #1519 plan (this design pack). The design pack is now on main. PR #1517 is still draft.

**What Cursor leaves behind**:
- PR #1517: 16 files, correct direction, but 2 P0 blockers (GAP-1, GAP-2) and 1 stacked-on-wrong-base issue (base is `cursor/6-phase-model-ac9d`, not main).
- Branch `cursor/6-phase-model-ac9d`: 1 commit (`0a70297f docs: lock 6-phase model doctrine`) that contains the `PHASE_MODEL_V2_DOCTRINE.md` file — this needs to land on main before or alongside PR #1517.
- Branch `cursor/audit-knowledge-layer-pattern-fabric-2026-05-05-c31e`: local-only on Cursor VM, no commits.

**What the next agent must do** (Wave 0 in the implementation plan):
1. Fix GAP-1: edit `src/lib/programs/failure-modes.ts` items 5, 9, 10.
2. Fix GAP-2: rename/rewrite `src/lib/programs/phase-packs/P1..P5`, retire `P6_OPERATE`.
3. Check whether `PHASE_MODEL_V2_DOCTRINE.md` should be moved to main directly or land as part of PR #1517's base merge.
4. After GAP-1 + GAP-2 land: retarget PR #1517 base to `main` (or close and re-open).

**Files NOT to touch** until Wave 0 is complete:
- `src/lib/programs/governance.ts` (owned by PR #1517)
- `supabase/migrations/20260505000000_strategic_moves_six_phase_remap.sql` (owned by PR #1517)

## 7 · Coordination with Codex on Intelligence + context-broker territory

Per memory rule: **Codex collision check before adjacent work**. Run:
```bash
gh pr list --search "INT-* OR context-broker OR retrieval OR pinecone OR corpus" --limit 20
```

The following are Codex-owned unless explicitly handed to Claude/Cursor:
- `src/lib/intelligence/` — broker, graph, vector retrieval
- `AgentContextBroker` contract
- INT-* slice work
- Pinecone indexing / corpus sync

The knowledge-layer design pack touches these surfaces in **design only** (this doc, the inventory, the pattern context contract). No code changes to Codex-owned files are authorized from this design pack. Implementation waves that touch these files need Codex coordination before starting.

## 8 · When to escalate to the founder

Escalate (do not self-resolve) if:
- A Codex PR has modified contested files since the design pack was written and the design is now inconsistent with the implementation
- The `PHASE_MODEL_V2_DOCTRINE.md` file on `cursor/6-phase-model-ac9d` is being modified or is in conflict
- PR #1517 is being force-pushed or the migration is being changed
- Any of the 10 GAP items are being addressed by two agents simultaneously
