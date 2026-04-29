# Knowledge Layer Execution State

Last updated: 2026-04-29 13:22 CT
Baseline: origin/main at a0f297ec (`[corpus][ven] Author PAT-SRC-VEN-SPLUNK-001 - 1 pattern (#1081)`)

## Mission

Strengthen the AbarVa knowledge layer while Programs, Source, and corpus expansion continue in parallel. This program favors additive contracts, audits, and integrity checks now. Runtime rewiring is gated until active app work is stable.

## Current Operating Rules

- Use isolated worktrees for every lane; do not use the dirty primary checkout.
- Do not touch `src/lib/intelligence/seed-patterns-*` from knowledge-governance lanes while corpus authoring is active.
- Do not change auth, security, tenant routing, or model/API behavior in this program.
- Do not add database migrations without a dedicated migration gate.
- Do not rewrite `src/app/api/chat/agent/route.ts` unless the final cutover gate is open.
- Auto-merge scoped PRs when CI is green and the diff stays inside the lane's file ownership.
- Stop and report if a PR needs runtime behavior changes outside its approved scope.

## Live Agent Board

| Agent | Status | Branch | Worktree | File ownership | ETA | Merge policy |
| --- | --- | --- | --- | --- | --- | --- |
| Governor | Active | `knowledge/state-control-board` | `/private/tmp/nexus-knowledge-state` | `docs/build/KNOWLEDGE_LAYER_STATE.md` | 10-15 min | Auto-merge if green |
| Audit | Active | `knowledge/audit-current-state` | `/private/tmp/nexus-knowledge-audit` | `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` | 20-35 min | Auto-merge if docs-only and green |
| Graph/Evidence | Active | `knowledge/graph-evidence-contract` | `/private/tmp/nexus-knowledge-graph-contract` | `docs/build/KNOWLEDGE_GRAPH_CONTRACT.md`, `docs/build/KNOWLEDGE_EVIDENCE_LEDGER_CONTRACT.md` | 30-45 min | Auto-merge if docs-only and green |
| Integrity Tests | Queued | `knowledge/integrity-loader-coverage` | TBD | Loader/manifest/orphan checks only | After audit | Auto-merge if additive tests only |
| Shadow Retrieval | Queued | `knowledge/shadow-retrieval-contract` | TBD | Retrieval contract/tests only | After audit + graph contract | Auto-merge if no live route change |
| Final Cutover | Gated | TBD | TBD | `route.ts` and retired playbook fallback only | Not started | No merge until cutover gate opens |

## Fresh Baseline Observations

- `tests/intelligence/loader.test.ts` currently expects 149 patterns, 30 signals, 9 solutions, and 10 contradictions.
- `tests/architecture/knowledge-fabric.test.ts` currently expects 198 primitives and 990 dry-run index writes.
- `src/app/api/chat/agent/route.ts` now imports `retrieveStageContext` and `retrieveCategoryContext` from `@/lib/intelligence/agent-retrieval`.
- `src/lib/agent/stage-playbooks.ts` and `src/lib/agent/service-category-playbooks.ts` are no longer present on the current `origin/main` baseline.
- The agent route appears to have crossed an earlier consolidation boundary; the audit lane must verify how complete and safe that binding is before any additional runtime work.

## Phase Plan

### Phase 0 - Governance

Deliverable: this state board.

Acceptance:

- Board committed on a dedicated branch.
- Board names live lanes, file ownership, gates, and merge policy.
- Board stays docs-only.

### Phase 1 - Current Truth Audit

Deliverable: `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md`.

Checks:

- Corpus primitive counts by type and seed source.
- Loader coverage and manifest coverage.
- Runtime usage of corpus-backed retrieval.
- Persistence/schema locations.
- Orphan, duplicate, and stale-test risks.
- Active gaps before shadow retrieval or DB work.

### Phase 2 - Contract Hardening

Deliverables:

- `docs/build/KNOWLEDGE_GRAPH_CONTRACT.md`
- `docs/build/KNOWLEDGE_EVIDENCE_LEDGER_CONTRACT.md`

Scope:

- Postgres-first graph contract.
- Tenant-isolated node and edge model.
- Evidence/citation contract.
- Azure migration alignment.
- Explicit DB migration gate.

### Phase 3 - Integrity Tests

Likely deliverables:

- Additive tests for duplicate IDs.
- Additive tests for seed exports being loaded.
- Additive tests for stage/category retrieval mappings pointing to existing patterns.
- Optional report script if it does not create generated churn in CI.

### Phase 4 - Shadow Retrieval

Scope:

- Build or document retrieval contracts behind non-runtime tests.
- No changes to live prompt assembly until the final cutover gate.

### Phase 5 - Final Cutover Gate

Not open yet.

Gate requirements:

- Audit is current against latest `origin/main`.
- Integrity tests are green.
- Retrieval contract is tested.
- No active Programs/App branch is touching the same runtime files.
- Founder gives explicit cutover approval or a new task specifically names runtime rewiring.

## Active PR Dependencies

- Corpus PR #1081 has merged into `origin/main` and is included in this baseline.
- Open docs PRs #751 and #748 are unrelated unless they touch the same docs names. They do not block this program.

## Next Actions

1. Commit and push this state board.
2. Open PR `knowledge/state-control-board`.
3. Monitor audit and graph/evidence workers.
4. Merge docs-only PRs when CI is green.
5. Start integrity-test lane after the audit identifies the exact high-value checks.
