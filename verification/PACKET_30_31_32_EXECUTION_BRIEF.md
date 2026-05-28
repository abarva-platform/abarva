# Packet 30/31/32 Execution Brief

Status: BLOCKED in Phase 0
Timestamp: 2026-05-28
Primary worktree: /private/tmp/nexus-packet-30-architectural-consolidation
C1 audit worktree: /private/tmp/nexus-packet-32-c1-state-audit

## Source Document Check

Execution cannot proceed because the required governing source documents are not present on the current execution base.

Required documents:

- docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md
- docs/build/delta-pilot/PACKET_30_ARCHITECTURAL_CONSOLIDATION.md
- docs/build/PACKET_32_MULTI_TENANT_PRODUCTIZATION.md

Checks performed:

- Current dirty checkout: files not present.
- Fresh fetch of origin/main: files not present.
- All fetched origin remote branches: no matching Packet 30/31/32 filenames or obvious title matches found.
- GitHub code search for exact Packet 31 filename, "Architectural Constitution", "PACKET 30", and "MULTI_TENANT_STATE_AUDIT": no matching source documents found.
- Clean worktree verification from origin/main: all three required files return missing.

## Interpreted Invariants From Packet 31

Not interpreted. Packet 31 is explicitly the highest authority and must be read end to end before execution. Because it is unavailable, any inferred invariant would be unsafe.

Temporary execution invariants derived only from the user's handoff:

- Do not proceed beyond Phase 0 until this brief exists.
- Do not execute runtime, migration, data-plane, product, config, script, or test changes without the Packet 31 constitution.
- Do not invent Packet 30 phases or Packet 32 P0 closure criteria from memory or adjacent work.
- Preserve separate worktrees for Packet 30 and Packet 32 C1.
- Treat Packet 32 C1 as read-only and output-only until the actual source packet is available.

## Planned Branches / Worktrees

Created:

- Branch: codex/packet-30-architectural-consolidation
  Worktree: /private/tmp/nexus-packet-30-architectural-consolidation
  Base: origin/main

- Branch: codex/packet-32-c1-state-audit
  Worktree: /private/tmp/nexus-packet-32-c1-state-audit
  Base: origin/main

Not yet created because source documents are missing:

- codex/packet-31-operating-model
- codex/packet-32-p0-<category>

## Exact P0 Scope

Cannot be safely enumerated without Packet 32 §15, §18, and §19.

The user handoff lists this intended P0 order, but the authoritative Packet 32 text is missing:

1. C2 healthcare overlay loader, validation, loading/verifier path only.
2. C8 Phase 1 404 remediation.
3. C4 Phase 1 read-only customer admin.
4. C5 CSV upload connector.
5. C6 Phase 1 observability foundation plus tenant-bleed alert.
6. C9 PHS compliance schema.
7. C12 thumbs up/down on Sentinel answers.
8. C13 security baseline.

## Explicit Non-Goals

Until source documents are restored:

- No runtime code changes.
- No migrations.
- No product UI changes.
- No data-plane loads.
- No deploys.
- No scorer/verifier changes.
- No Packet 32 P1+ work.
- No inferred changes to Packet 31 invariants.

## Acceptance Gates

Phase 0 unblock gate:

- All three source packet documents are present in the repo or otherwise supplied as execution source of truth.
- Packet 31 has been read end to end.
- Packet 30 has been read end to end.
- Packet 32 §15 and §19, plus §18 closure bar, have been read.
- This brief is updated from BLOCKED to ACTIVE with concrete invariants, P0 scope, acceptance gates, and deployment semantics.

General gates carried from user handoff:

- Each PR must include local validation, CI/check status, affected routes/modules, release record when relevant, rollback plan, and production deploy requirement.
- Runtime/product PRs require typecheck, lint, focused unit tests, relevant smoke tests, tenant-isolation smoke when applicable, production deploy inspection after merge, and live smoke against production alias.
- Data-plane/context-layer PRs require loader dry-run, row/chunk count verification, RLS/tenant isolation verification, provenance/audit evidence, retriever test proving agent reachability, and no cross-tenant leakage check.
- Verifier/scorer PRs require synthetic positive/negative tests, replay against existing artifacts, before/after score comparison, and no silent score inflation.

## Deploy / Rollback Plan

No deployment is authorized from this blocked state.

Once unblocked:

- Do not call work "deployed" unless PR is merged to main, production deployment completes, production alias points to the new deployment, smoke passes against the production alias, and deployment ID plus smoke artifact are recorded.
- Rollback plan must be captured per PR before merge.
- Any migration or multi-tenant data-plane action that could affect multiple tenants must escalate before merge/deploy.

## Blocker

BLOCKER: PACKET-SOURCE-MISSING

Packet 31 is the governing constitution. Packet 30 and Packet 32 are the tactical execution sources. None of the three required documents are available in the current repo state, fetched main, or fetched remote branches. Execution is paused before coding to avoid violating the user's source-of-truth hierarchy.
