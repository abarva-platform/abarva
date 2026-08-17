# 2026-08-17-intelligence-canonical-sections — Intelligence reads canonical

## Release ID

`2026-08-17-intelligence-canonical-sections`

## Status

`candidate`

## Plain-English Summary

The Intelligence advisory page did not read client data. `enterprise-landscape-view-model.ts` is 661
lines with no database call in it: one tenant received hand-authored sections naming specific
platforms and carrying specific maturity scores, and every other tenant received `buildGenericSections`,
which emits sentences like "the section is ready for client-specific evidence" — formatted exactly
like an assessment. Both render under the heading CURRENT STATE ASSESSMENT.

That is worse than an empty screen. An empty screen announces itself. A full one whose content came
from a file someone wrote is indistinguishable, to a reader, from a client fact.

This projects all fourteen advisory sections from the canonical model, and generalises the landscape
projector from the nine dimensions Home renders to all twenty-six canonical object types, with the
products that consume each recorded alongside it. That registry is the point: adding a reader is now
an entry in a list, not a new pipeline.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1–3:** unchanged.
- **Layer 4:** the projector covers every canonical type and carries named examples per dimension.
  Intelligence builds its sections from that projection; the authored view model remains only as a
  fallback for a tenant whose projection has not run.

## Client Applicability

- Specific clients: the two active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-home-landscape.ts` — dimension registry covering all 26 canonical
  types, each with the attribute that names an instance, the advisory section it answers, and the
  products that consume it. Carries up to 8 distinct named examples per dimension.
- `src/lib/home/landscape-read-adapter.ts` — surfaces object type, section, distinct-name count, and
  samples.
- `src/lib/intelligence/canonical-landscape-sections.ts` — builds advisory sections from canonical.
- `src/app/(maestro)/intelligence/page.tsx` — canonical first, authored as labelled fallback.
- `src/app/(maestro)/home/page.tsx` — dimension cards name examples.

## QA / Validation

- Pass: dry-run projects **52 dimensions across 2 tenants from 5,553 canonical records**, 2 gaps
  (`service_performance` and `crosswalk` for one tenant), with real names — Epic Hyperspace,
  Lakeview Primary Data Center, Epic Systems Corporation.
- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` on all five changed files — 0 errors.
- Pass: `npm run release:check`.

**A bug this caught.** The first run returned every count correctly and every name empty. Canonical
attributes are `CanonicalValue` wrappers, so `attributes[key]` is an object, not a string, and the
name extraction silently produced nothing. Counts alone would have passed review — the page would
have shown a populated landscape with no content in it.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow. The data build runs as an ACA Job under
`docs/ops/aca-data-build-job-rule.md`. No traffic or template mutation from this branch.

## Rollout Plan

Merge, deploy, then run `data-build:home-landscape` as an ACA Job with write approval for both
tenants. Until that run completes, Intelligence falls back to the authored view model, which is the
current behaviour — so the code can land ahead of the data without regressing the surface.

## Rollback Plan

Revert. The authored view model is untouched and resumes as the sole path.

## Audit Evidence

- The commit and its PR.
- Projector dry-run `summary.json` with per-dimension counts, distinct-name counts, and samples.
- The ACA Job run id and proof bundle from the write run, recorded before anything is called
  live-proven.

## Known Gaps

- **Maturity is evidence coverage, not a judgement.** Nothing canonical scores maturity. Deriving a
  score from record counts would read as an assessment while measuring only how much the client
  typed, so the section reports evidence coverage instead, which is a fact.
- **Exhibits are empty.** The authored sections had charts; the canonical ones have none yet. A
  missing chart is visible. A chart built from invented numbers is not.
- **The authored fallback still exists** for a tenant whose projection has not run. It is labelled
  in code but not yet on screen; the projection must run for both tenants before that matters.
- **Moves and Tower still read their own stores.** The registry names them as consumers, which is
  the wiring for that work, not the work itself.
- `enterpriseContextTenantKey` in the Intelligence page still maps two sunset tenant keys. That is
  tranche-3 sunset work and is deliberately not touched here.
