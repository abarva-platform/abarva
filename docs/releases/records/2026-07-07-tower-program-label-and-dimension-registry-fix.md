# 2026-07-07-tower-program-label-and-dimension-registry-fix — Tower program-name mangling + dimension_registry stale-stamp fix

## Release ID

`2026-07-07-tower-program-label-and-dimension-registry-fix`

## Status

`candidate`

## Plain-English Summary

Two small, targeted fixes to Tower (the CIO IT-investment dashboard), both root-caused via a live VNet audit of the Lakeshore V7 dataset rather than assumed:

1. **Program names were rendering mangled** (e.g. "Shared services AI service desk directional promised value" instead of "Shared services AI service desk"). Root cause: `programLabel()` in the Tower CXO view model treated `source_label` as a valid display-name candidate, but the Lakeshore V7 projection script builds `source_label` by appending a fixed set of fact-type descriptors ("... FY26 committed budget", "... directional promised value", etc.) to the real name, and no separate clean name field exists on these facts. Fix: strip the known, enumerated suffixes before using `source_label` as a display name, instead of discarding the field (which would have left program names blank).
2. **`intelligence_v7.dimension_registry` was empty for the current Lakeshore contract version** (`v7.1.1-holdco-depth-correction-20260706`), even though the underlying `business_records` loaded correctly (3,094 rows across 25 dimensions). Root cause: `dimension_registry.dimension_key` is the sole primary key (not composite with `contract_version`), and the loader's upsert (`on conflict(dimension_key) do update ...`) never updated `contract_version` in its `SET` clause — so once a dimension_key row existed from an earlier contract version, later reloads silently refreshed its label/column_count but left it stamped under the old, stale contract_version. Any reader (Home's dimension browser, this session's own audit queries) that filters `dimension_registry.contract_version = <current>` found zero rows. Fix: the upsert now also sets `contract_version = excluded.contract_version` (and `dimension_file`) on conflict, so the next load correctly re-stamps existing dimension_key rows to the new contract version.

## Layer Impact

Release lane: `global-control-lane` (shared app/control-plane behavior — Tower's view-model and the V7 loader script are not tenant-gated code, even though Lakeshore is the only tenant currently exercising this data path).

- **Application/view-model layer** (`src/lib/cio-tower/cxo-view-model.ts`): pure function change, no schema or data impact. Affects how existing Postgres rows are labeled for display; does not change what's stored.
- **Loader/ingestion script** (`scripts/v7/load-lakeshore-holdco-v7-azure.mjs`): changes upsert behavior for future runs of this script only. Does not retroactively fix rows already loaded under the current contract version — see Known Gaps.

## Client Applicability

- All clients: view-model fix (#1) applies to any tenant's Tower data that flows through this same projection pattern (currently only Lakeshore uses derived/tower_financial_amounts.csv, so it is Lakeshore-visible today but is not tenant-gated code).
- Specific clients: dimension_registry loader fix (#2) is specific to the Lakeshore V7 holdco loader script; other tenants' loaders are unaffected by this change.
- Internal only: no
- Public/demo only: no
- Feature flag: none — both are unconditional code paths, no flag gating needed since neither changes behavior for well-formed data.

## Changes Included

- `src/lib/cio-tower/cxo-view-model.ts`: added `cleanedSourceLabel()` helper (suffix-stripping) and wired it into `programLabel()` in place of raw `source_label`.
- `scripts/v7/load-lakeshore-holdco-v7-azure.mjs`: `dimension_registry` upsert `ON CONFLICT` clause now updates `contract_version` and `dimension_file`, not just label/column_count/metadata.

## QA / Validation

- `npx eslint src/lib/cio-tower/cxo-view-model.ts` — clean, no errors.
- `node -c scripts/v7/load-lakeshore-holdco-v7-azure.mjs` — syntax valid.
- `npx jest src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` — 2/2 passed (closest existing Tower-adjacent suite; no dedicated unit test exists for either touched file).
- Standalone regex verification against the exact 8 `source_label` production patterns observed live in `cio_tower.facts.attributes` for Lakeshore (via VNet probe) — all strip to the correct clean name, including the one holdco-literal label ("Corporate shared services IT FY26 budget") that correctly does NOT get stripped since it isn't a suffixed program name.
- `npx tsc --noEmit -p .` could not be used as a gate: it stack-overflow-crashes identically on a clean `origin/main` checkout in this environment (confirmed by running it un-modified before any edits), so this is a pre-existing local toolchain issue, not a regression introduced by this change.

## Rollout Plan

Standard ACA rollout: merge to `main` → GitHub Actions "ACA main deploy" builds from the merge SHA via `az acr build` → deploys to `ca-abarva-web-lab-eastus` → 100% traffic shift on health check → verify `https://app.abarva.ai` Tower views live. No migration, no data reload, no feature flag needed for this PR by itself.

Separately (NOT part of this release): the loader-script fix (#2) only prevents the bug going forward. Making Lakeshore's *already-loaded* `v7.1.1-holdco-depth-correction-20260706` dimension_registry rows correct right now requires either a one-off Azure Postgres UPDATE or a full V7 loader re-run for that tenant/version — both are production data writes and are explicitly deferred pending separate user confirmation (tracked as fixes #3/#4 in the same investigation thread).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*` (existing, unmodified)
- Shared runtime mutators: none added
- Approved image digest: assigned at deploy time via `az acr build` from merge SHA
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, unchanged
- Worker image invariant: n/a — no worker changes
- Feature/env flag update path: n/a — no flag
- Live signed-in proof required: yes — Tower CXO view for Lakeshore must be checked post-deploy to confirm program names render cleanly (this is part of the still-pending CIO-narrative acceptance test for the broader Tower redesign effort)

## Rollback Plan

Revert the merge commit; redeploy previous image via the same ACA rollout path (reassign 100% ingress to the prior healthy revision). No migration to unwind — both changes are code-only.

## Audit Evidence

- PR URL: (to be filled in when opened)
- CI run: (to be filled in when opened)
- VNet probe transcripts establishing root cause: live queries against `intelligence_v7.dimension_registry`, `intelligence_v7.business_records`, and `cio_tower.facts` for tenant `lakeshore-industries`, contract version `v7.1.1-holdco-depth-correction-20260706`, run via the `job-abarva-db-migrate-lab-eastus` operator job image-override pattern (per `docs/runbooks/azure-container-apps-deploy.md`).

## Known Gaps

- The dimension_registry fix only takes effect on the *next* load of a given tenant/contract-version pair. Lakeshore's current `v7.1.1-holdco-depth-correction-20260706` dimension_registry rows remain stamped with a stale, earlier contract_version until either a scoped Azure Postgres UPDATE or a full loader re-run is explicitly approved and executed — this is intentionally out of scope for this release per the hard-to-reverse/production-write caution already agreed with the user.
- Broader Tower projection-scope work (carrying `owner_role` into derived facts; widening the projection beyond the 2 current financial-rollup files to cover apps/vendors/AI-initiatives/relationships) is tracked separately as fixes #3/#4 and requires its own explicit approval before any Azure data write.
