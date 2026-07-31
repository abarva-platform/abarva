# 2026-07-31-retire-airline-demo-new-corpus — Retire the unregistered airline-demo-new source corpus

## Release ID

`2026-07-31-retire-airline-demo-new-corpus`

## Status

`candidate`

## Plain-English Summary

Removes `clients/airline-demo-new/` (232 tracked files) from the repository. This corpus was
built over several days as source data for a tenant called `airline-demo-new`, which was never
a registered tenant — it does not appear in `datasets/tenant-inputs/tenant-input-registry.json`.
Investigation (see `reports/airline-e2e-data-quality-lineage-audit-2026-07-29.md` and
`reports/airline-knowledge-provider-reconciliation-2026-07-30/`) found the real, registered
airline tenant is `skyharbor-air` ("Airline Demo" is its display label — see
`reports/skyharbor-air-data-factory/summary.md`'s explicit Label Contract), and that
`airline-demo-new`'s corpus, database, and Azure infrastructure were built as an unregistered
parallel effort with confirmed data-quality defects (a QA/dedup flag stored in the
`application_type` business field; a 10,000-row infrastructure family with no traceable
consumption projection; several other gaps documented in the lineage audit).

skyharbor-air's own dataset has been separately enriched to real client-pilot depth (see PR
#5838, `feat(knowledge): enrich skyharbor-air core dataset, interviews, and Tower
AI-control-tower`) — the corpus removed here is superseded by that work, not by an equivalent
replacement at this same path.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: removes a Layer 1 source corpus. No Layer 3 (canonical model) or
  Layer 4 (product) code is touched — `airline-demo-new` was never wired into any product surface
  or `CANONICAL_TENANTS.ts` entry (confirmed absent on every branch checked during the lineage
  audit), so there is no product-facing dependency on this corpus to break.
- Does not touch the live Azure Postgres database (`abarva_airline_demo_new_knowledge_lab`) or
  the Azure resource group (`rg-abarva-airdn-lab-eus2-001`) built for this tenant this week — this
  release only removes the git-tracked source files. That infrastructure is a separate, later
  decision (see Known Gaps).

## Client Applicability

- All clients: No.
- Specific clients: `airline-demo-new` only — and that tenant was never registered/live for any
  client.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `clients/airline-demo-new/` in its entirety (232 files): the source corpus, template
  workbooks, freeze manifests, execution/processing-wave records, and all associated artifacts.

## QA / Validation

- Confirmed `airline-demo-new` is absent from `CANONICAL_TENANT_KEYS`
  (`src/config/tenants/CANONICAL_TENANTS.ts`) and from `datasets/tenant-inputs/tenant-input-registry.json`
  on `origin/main` before removal.
- Confirmed no product route, API, or UI component references `clients/airline-demo-new/` as a
  runtime dependency (the Knowledge UI built in PR #5772/#5784 hardcodes the string
  `"airline-demo-new"` as a tenant-key label bound only to a fixture runtime — a separate,
  already-tracked follow-up to relabel to `skyharbor-air`, not a dependency on these files).
- `git rm -r clients/airline-demo-new` — 232 files removed, no partial/orphaned remainder.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending (run before merge).

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — this is a repository
content removal only. Full history remains recoverable via git (see Rollback Plan).

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — no runtime/image change.
- Shared runtime mutators: None.
- Live signed-in proof required: No — no product-facing change.

## Rollback Plan

Revert the merge commit; `clients/airline-demo-new/` will be fully restored from git history at
the commit prior to this one. No data was destroyed outside of git — the live Azure database and
resource group for this tenant, if still provisioned, are untouched by this release either way.

## Audit Evidence

- `reports/airline-e2e-data-quality-lineage-audit-2026-07-29.md`
- `reports/airline-knowledge-provider-reconciliation-2026-07-30/` (full reconciliation package,
  including `TENANT_ACTIVATION_DEPENDENCY.md`)
- `reports/skyharbor-air-data-factory/summary.md` (the Label Contract establishing skyharbor-air
  as the real tenant identity)
- PR #5838 (skyharbor-air's replacement enrichment work)

## Known Gaps

- The live Azure Postgres database and resource group built this week under the
  `airline-demo-new` label are **not** addressed by this release — decommissioning or relabeling
  that live infrastructure requires Azure access this repo-only change does not have, and is a
  separate operational decision, not a code change.
- The Knowledge UI route (`src/app/(maestro)/home/knowledge/page.tsx`, from PR #5772/#5784) still
  hardcodes the tenant-key label `"airline-demo-new"` (bound only to fixture data, no live
  dependency on the removed corpus). Relabeling it to `skyharbor-air` is tracked as a follow-up,
  not done here, to keep this PR scoped to corpus removal only.
- ~37 remaining local worktree directories referencing `airline-demo-new` work that does not yet
  have a merged PR were deliberately left untouched (not part of this repo-tracked change) —
  see the session's own worktree-cleanup pass, which only removed worktrees with confirmed merged
  PRs.
