# 2026-07-31-retire-airline-demo-new-corpus — Retire the abandoned airline-demo-new template/source-corpus staging directory

## Release ID

`2026-07-31-retire-airline-demo-new-corpus`

## Status

`candidate`

## Plain-English Summary

Removes `clients/airline-demo-new/19-template-instantiation-source-corpus/` (58 tracked files)
from the repository — the template-instantiation source-corpus staging directory built as an
early, unregistered parallel effort before the real registered airline tenant (`skyharbor-air`)
had its own enriched dataset. `airline-demo-new` never appears in
`datasets/tenant-inputs/tenant-input-registry.json`, and skyharbor-air's own dataset has since
been separately enriched to real client-pilot depth (see PR #5838, `feat(knowledge): enrich
skyharbor-air core dataset, interviews, and Tower AI-control-tower`) — this staging directory is
superseded by that work, not by an equivalent replacement at this same path.

**Scope correction from the original draft of this release**: an earlier version of this record
proposed deleting all of `clients/airline-demo-new/` (232 files across six subdirectories). That
was wrong. Five of those six subdirectories —
`18-phase2b3c-azure-lab-implementation/`, `20-phase1-azure-infrastructure-execution-package/`,
`21-processing-wave-execution/`, `22-passwordless-review-auth/`, and `execution/` — are not
abandoned staging material. They are the live operational record (applied Bicep IaC, the approved
boundary snapshot, security/RLS hardening plans, job execution/processing-wave logs, and the
freeze/blocked manifests) for `airline-demo-new` as a real, distinct tenant candidate in the
**Dual-Tenant Knowledge Execution Program**
(`docs/ops/dual-tenant-knowledge-execution-program.md`) — the governed Foundation V2 pipeline that
is separate from, and not a stand-in for, skyharbor-air. That program document itself records
`airline-demo-new` as "Blocked before Phase 0 freeze," with remediation of its source corpus and
an independent semantic audit as the only next allowed action. This release does not change that
status. Those five subdirectories, and the real Azure infrastructure they document
(`rg-abarva-airdn-lab-eus2-001`), are left untouched — deleting them here would have destroyed the
only manifest the real ACA job pipeline for that program depends on, with no relation to the
skyharbor-air work this release is actually about.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: removes a stale Layer 1 source-corpus staging subdirectory. No
  Layer 3 (canonical model) or Layer 4 (product) code is touched — this staging directory was
  never wired into any product surface or `CANONICAL_TENANTS.ts` entry.
- Does not touch any live Azure infrastructure. In particular, this release does **not** touch the
  Dual-Tenant Knowledge Execution Program's `airline-demo-new` environment
  (`rg-abarva-airdn-lab-eus2-001`, database `abarva_airline_demo_new_knowledge_lab`) — that program
  continues to exist, blocked, under its own governance track, independent of skyharbor-air.

## Client Applicability

- All clients: No.
- Specific clients: None — the removed directory was never registered or live for any client.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `clients/airline-demo-new/19-template-instantiation-source-corpus/` only (58 files): the
  template workbooks and synthetic source-corpus samples staged before skyharbor-air's own
  enrichment work existed.
- Leaves `clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/`,
  `20-phase1-azure-infrastructure-execution-package/`, `21-processing-wave-execution/`,
  `22-passwordless-review-auth/`, and `execution/` fully intact — these belong to the Dual-Tenant
  Knowledge Execution Program's `airline-demo-new` candidate, not to this cleanup.

## QA / Validation

- Confirmed `airline-demo-new` is absent from `CANONICAL_TENANT_KEYS`
  (`src/config/tenants/CANONICAL_TENANTS.ts`) and from
  `datasets/tenant-inputs/tenant-input-registry.json` on `origin/main`.
- Confirmed no product route, API, or UI component references
  `clients/airline-demo-new/19-template-instantiation-source-corpus/` as a runtime dependency.
- Confirmed the five preserved subdirectories are referenced by
  `docs/ops/dual-tenant-knowledge-execution-program.md` and by the real Azure boundary snapshot
  (`18-phase2b3c-azure-lab-implementation/00-implementation-charter/APPROVED_BOUNDARY_SNAPSHOT.json`)
  that the deployed `job-airdn-*` ACA Jobs in `rg-abarva-airdn-lab-eus2-001` depend on — read-only
  `az` inspection confirms those jobs and that resource group are live.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending (run before merge).

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — this is a repository
content removal only. Full history remains recoverable via git (see Rollback Plan).

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — no runtime/image change.
- Shared runtime mutators: None.
- Live signed-in proof required: No — no product-facing change.

## Rollback Plan

Revert the merge commit; the removed directory will be fully restored from git history at the
commit prior to this one. No data was destroyed outside of git.

## Audit Evidence

- `reports/airline-e2e-data-quality-lineage-audit-2026-07-29.md`
- `reports/airline-knowledge-provider-reconciliation-2026-07-30/` (full reconciliation package,
  including `TENANT_ACTIVATION_DEPENDENCY.md`)
- `reports/skyharbor-air-data-factory/summary.md` (the Label Contract establishing skyharbor-air
  as the real airline tenant identity)
- `docs/ops/dual-tenant-knowledge-execution-program.md` (governs the separate, still-blocked
  `airline-demo-new` Foundation V2 candidate that this release does not touch)
- PR #5838 (skyharbor-air's replacement enrichment work)

## Known Gaps

- The Dual-Tenant Knowledge Execution Program's `airline-demo-new` candidate remains blocked
  before Phase 0 freeze, per its own governing document. This release does not change that status
  and does not attempt to remediate, freeze, provision, load, or publish it.
- The Knowledge UI route (`src/app/(maestro)/home/knowledge/page.tsx`, from PR #5772/#5784) still
  hardcodes the tenant-key label `"airline-demo-new"` (bound only to fixture data, no live
  dependency on the removed staging directory). Relabeling it to `skyharbor-air` is tracked as a
  follow-up, not done here, to keep this PR scoped to the actual abandoned staging directory.
- ~37 remaining local worktree directories referencing `airline-demo-new` work that does not yet
  have a merged PR were deliberately left untouched (not part of this repo-tracked change).
