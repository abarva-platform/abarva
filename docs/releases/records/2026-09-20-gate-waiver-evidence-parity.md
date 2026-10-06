# 2026-09-20-gate-waiver-evidence-parity - Bind Waiver Claims to the Real Handler

## Release ID

`2026-09-20-gate-waiver-evidence-parity`

## Status

`candidate`

## Plain-English Summary

A hard-gate waiver now requires the same auditable human rationale and decision-evidence packet as
a gate approval. The legal claim is bound to the waiver handler's own behavioral test rather than
being credited by a neighboring approval test.

## Layer Impact

- `global-control-lane`: hardens a consequential write and its audit record.
- Layer 3 data: no schema or stored tenant-data change.
- Product projection: the successful route response now includes its decision evidence packet.

## Client Applicability

- All clients: Yes, wherever the reasoning gate-waiver route is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Rejects waiver rationales below the shared auditable minimum.
- Builds and validates a waiver-specific decision evidence packet with a named decision owner.
- Carries the packet and actor into the waiver audit buffer.
- Sends trusted scenario writes through the same evidence builder.
- Catalogs the waiver route as the exact surface supporting the legal claim.
- Makes the binding rule explicit: an unbound claim may remain deferred, but cannot be counted as
  covered.

## QA / Validation

- Failing test first: the prior route accepted a two-character reason and returned no packet.
- Focused route, claim-binding, and evidence-packet suites pass.
- AI surface control audit passes with 19 surfaces and 30 of 30 reachable controls behaviorally
  covered.
- TypeScript and targeted lint pass before merge.

## Rollout Plan

Squash-merge through the protected repository and deploy through the repo-owned ACA main workflow.
No migration or data-build job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes for product acceptance; merge and deploy proof do not imply it.

## Rollback Plan

Revert the squash commit. This restores the prior lighter waiver behavior; no schema or row rollback
is required.

## Audit Evidence

- Route behavior: `src/app/api/reasoning/gate-waiver/__tests__/route.controls.test.ts`.
- Claim binding: `src/__tests__/behaviors/catalog-claim-binding.test.ts`.
- Machine catalog: `docs/security/ai-surface-control-catalog.json`.

## Known Gaps

Deferred legal claims without a catalog surface remain explicitly deferred and contribute no
coverage. They require separate product-reachability or control work before promotion.
