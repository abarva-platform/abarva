# 2026-07-16-legacy-context-retirement-v3-cutover — Legacy Context Retirement Inventory and V3 Cutover Guardrails

## Release ID

`2026-07-16-legacy-context-retirement-v3-cutover`

## Status

`candidate`

## Plain-English Summary

This release starts the controlled retirement of legacy context structures by creating a repository-wide inventory, adding V3-only active architecture audits, and documenting the target architecture. It does not delete, archive, load, promote, deploy, or mutate Azure/Postgres.

The current truth is split: V3 canonical inputs, approved Home/Knowledge advisory artifacts, local runtime retrieval proof, candidate invisibility, and the PR1 active-language burndown are present. Physical archive/delete and route/schema/file renames are still separate follow-up work.

## Layer Impact

Release lane: `global-control-lane` for shared architecture/audit guardrails; no client data-plane mutation is included.

Architecture/documentation layer: Documents `standard-2026-07-v3` as the only canonical tenant input standard and approved Claude-derived advisory blocks as interpretation artifacts layered on deterministic context.

Audit/proof layer: Adds `audit:legacy-context-retirement`, `audit:v3-only-active-architecture`, and `audit:no-legacy-context-language`.

Runtime/data layer: No runtime behavior is intentionally changed by this release. Candidate/active isolation remains governed by the candidate invisibility guard.

## Client Applicability

- All clients: Yes, for architecture and audit guardrails.
- Specific clients: Meridian, SkyHarbor Air, and First Capital are the proven V3/advisory tenants.
- Internal only: Audit outputs and inventory are operator-facing.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `scripts/audit/legacy-context-retirement.mjs`
- Package scripts for legacy context retirement, V3-only active architecture, and no-legacy-language audits.
- Architecture docs updated for the V3 canonical flow and legacy/internal naming boundary.
- CXO story-block audit/generation metadata now reports neutral canonical input paths instead of legacy dataset identifiers.
- Proof outputs under `reports/legacy-context-retirement/`.

## QA / Validation

- Pass: `npm run audit:legacy-context-retirement`
- Pass: `npm run audit:v3-only-active-architecture`
- Pass: `npm run audit:no-legacy-context-language`
- Pass: `npm run audit:knowledge-cxo-story-blocks`

## Rollout Plan

Merge only after review if the team wants the audit framework and V3 architecture guardrails in place before continuing the physical archive/delete work. No deployment or data-plane action is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed.

## Rollback Plan

Revert this release commit. No database rollback is required.

## Audit Evidence

- `reports/legacy-context-retirement/inventory.csv`
- `reports/legacy-context-retirement/replacement-proof.csv`
- `reports/legacy-context-retirement/active-architecture-audit.csv`
- `reports/legacy-context-retirement/language-audit.csv`
- `reports/legacy-context-retirement/summary.md`
- `reports/legacy-context-retirement/proof.html`

## Known Gaps

Physical archive/delete and compatibility route/schema/file renames are still out of scope. Remaining legacy terms are allowed internal/test/API/admin compatibility uses recorded by the PR1 language burndown.
