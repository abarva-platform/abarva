# 2026-08-26-tower-ecl-preview-degrade — Tower route survives an empty ECL projection preview

## Release ID

`2026-08-26-tower-ecl-preview-degrade`

## Status

`candidate`

## Plain-English Summary

The Control Tower page shows an optional diagnostic panel built from the ECL projection preview.
That panel is additive — it explains projection coverage — and the Command Center is supposed to
render with or without it. It did not. The preview reader treated "this tenant has no projected
rows yet" as a fault and threw, and the route awaited it without a guard, so a tenant that had no
ECL projection built lost the entire Tower page and got the generic unhandled-error recovery
screen instead of the cockpit.

This change makes the absent case behave like the absent case. The reader returns `null` when the
serving view has no rows for the tenant/assessment, the route degrades the read to `null` on any
failure, and the panel — which already rendered nothing for `null` — simply hides. The base
Command Center renders either way.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 3 (canonical model):** unchanged. No projection, serving view, metric, or value is
  redefined; nothing that asserts a number was touched.
- **Layer 4 (products — Tower):** an optional diagnostic panel becomes genuinely optional. Tower's
  deterministic read models and their values are unchanged; only the failure mode changed, from
  "whole route fails" to "panel absent".

## Client Applicability

- All clients: yes — every tenant rendering `/tower` under the ECL product provider.
- Specific clients: none singled out; the crash reached any tenant without a built projection.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. Behavior still sits behind the existing ECL product-provider check.

## Changes Included

- `src/lib/tower/eclProjectionPreview.ts` — `readTowerEclProjectionPreview` returns `null` for an
  empty row set instead of throwing.
- `src/app/(maestro)/tower/page.tsx` — the preview read is guarded with `.catch(() => null)`,
  matching the canonical-reconciliation read immediately above it.
- `src/lib/tower/__tests__/ecl-projection-preview-degrades.test.ts` — new regression suite.

## QA / Validation

- `npx jest --runTestsByPath src/lib/tower/__tests__/ecl-projection-preview-degrades.test.ts`
  → 4/4 pass. The same suite fails 2/4 against the unpatched tree, so it is a real regression
  guard and not a tautology.
- `npx jest src/lib/tower/__tests__ src/__tests__/integration/tower` → 1058 pass / 23 fail.
  Baseline on the unpatched tree is 1056 pass / 25 fail. No new failures; the two that flipped are
  this change's own guards. The remaining 23 are pre-existing and unrelated — see Known Gaps.
- `npx tsc -p tsconfig.json --noEmit` (with an 8 GB heap; the default heap OOMs on this tree)
  → clean.
- `npx eslint` on the three touched files → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the image and deploys it.
No migration, no data build, no flag change, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This release contains no `az` command and no runtime template edit.
- Approved image digest: assigned by the main deploy workflow at build time; not pinned here.
- ACA runtime invariant: must be re-proven after deploy (template image = 100%-traffic revision
  image = approved digest) before this record may claim `live-proven`.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes. `/tower` must be crawled signed-in and shown rendering the
  Command Center for a tenant with no ECL projection. Until that capture exists this record stays
  `candidate`.

## Rollback Plan

Revert the squash commit and let the main deploy workflow ship the prior digest. There is no schema
or data change, so rollback is code-only and immediate. Reverting restores the throw, which restores
the crash — so roll back only if this change causes an unrelated regression, not to "restore" the
old behavior.

## Audit Evidence

- The three-file diff.
- Jest output for the new suite, and the before/after suite counts above.
- After deploy: the ACA runtime invariant proof and a signed-in `/tower` capture.

## Known Gaps

- Not yet live-proven. This record is `candidate`, not `released`.
- 23 pre-existing failures remain across 7 Tower suites, concentrated in the legacy `cio_tower` and
  v3 runtime-view read path. They predate this change and are untouched by it, but they are the same
  code path that currently blocks retiring the legacy Tower readers, so they need their own lane.
- The route now hides the diagnostic panel on any read failure, including a genuine data-plane
  outage. That is the correct trade for an additive panel, but it means panel absence is not by
  itself evidence that the projection is missing.
