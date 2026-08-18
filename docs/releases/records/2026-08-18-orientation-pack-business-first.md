# 2026-08-18-orientation-pack-business-first — Orientation pack reads the business, not just the estate

## Release ID

`2026-08-18-orientation-pack-business-first`

## Status

`candidate`

## Plain-English Summary

The orientation pack described a multi-billion-dollar operating company as though it were an IT
department. Three causes, all fixed here.

**A defect that dropped every multi-value business fact.** Attributes holding more than one value
arrive as arrays. The attribute reader only accepted strings, so arrays silently returned null. The
casualties were exactly the fields that describe a business: strategic priorities, customer segments,
operating regions, leadership team. One tenant declared six strategic priorities and the pack printed
"Stated priorities: not supplied".

This read as a data-model problem and was not. The estate dimensions survived the bug because they are
row-per-thing — 503 applications are 503 records with scalar attributes — while the business is
described in a single record whose interesting fields are all lists. A defect that only dropped arrays
therefore erased the company and left its tooling standing.

**Prominence driven by row count.** The canonical model holds ~92% IT-estate records by volume and one
enterprise-profile record. Ranking by volume buries the organisation under its own systems. Ordering
is now editorial: identity and strategy lead, the estate is one section of seven.

**Metrics framed as an IT benefits ledger.** Both tenants' metrics are overwhelmingly business
measures — on-time performance, mishandled baggage rate, HEDIS screening rates, ancillary revenue per
passenger. They were presented solely as "claimable / blocked", which is a value-realisation lens over
what are the client's actual operating KPIs. They are now grouped by declared `metric_domain`, and
claim readiness is labelled as applying to value claims rather than to whether the metric is tracked.

Additionally, "where do we stand" now answers the question. The intake captures baseline, target and
actual but never which direction is good — and it differs per metric. That direction does not need
capturing because it is implied: the client placed the target somewhere relative to the baseline, and
that placement is the declared direction. Improvement is movement whose sign matches
`sign(target − baseline)`. Metric values also required a tolerant parser, since targets arrive as
"76.9% by MY2028" — a quantity, a unit and a period in one cell.

## Layer Impact

Lane: `global-control-lane`. Layer 4 only — the generator's aggregation logic. No canonical object,
attribute, record or intake file is modified. No schema change.

## Client Applicability

- All clients: yes. The array-reading defect affected every tenant with multi-value profile
  attributes, which is every tenant.
- Specific clients: none.
- Internal only / public-demo only / feature flag: no.

## Changes Included

- `scripts/data-build/build-home-orientation-pack.ts` — array-aware attribute reader, `list()` and
  `measurement()` helpers, business-first block ordering, metric domain grouping, derived
  direction-of-travel.
- No other files. No migrations, routes, or read-adapter changes.

## QA / Validation

**PASS**, with one item **NOT RUN** and named below.

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors repo-wide.
- `npx eslint` — PASS, 0 errors.
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 10/10 unchanged.
- Dry run against both tenants — PASS. Business facts now render: business model, industry, revenue,
  headcount, headquarters, operating regions, customer segments, mission, the full declared priority
  list, and the named leadership team. Direction of travel resolves for 15 and 34 comparable metrics
  respectively, where previously zero were comparable.

**NOT RUN:** narrative generation, still unexecuted end to end — no `ANTHROPIC_API_KEY` in the local
environment.

## Rollout Plan

Merge to `main`. No runtime rollout: no surface reads the pack yet, no migration, no image, no flag.

## Deployment Authority

Not applicable — no Azure Container Apps, workflow, runtime image, flag, env var, worker job, traffic,
DNS or environment-promotion impact.

- Repo-owned deploy workflow: not invoked.
- Shared runtime mutators: none.
- Approved image digest / ACA runtime invariant / worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this release.

## Rollback Plan

Revert the commit. Generator-only change; no stored data is migrated or destroyed.

## Audit Evidence

- PR: see Changes Included.
- Dry-run pack JSON and `summary.json` per tenant in the build's `--out-dir`.

## Known Gaps

- **A fixture defect this surfaced:** one tenant now reports 34 of 34 comparable metrics moving toward
  target. No real organisation improves every measure at once; the other tenant's 13 of 15 with 2
  regressing is plausible. This is the same flat-distribution class as defects previously found in the
  vendor ceiling, application lifecycle and interview themes, and needs a spread applied at the
  fixture level. The generator is reporting the data correctly.
- **A source-sheet defect this surfaced:** 9 and 18 metrics respectively write baseline, target and
  actual in inconsistent notation (`69.1%` against `71.8`), and targets embed a period inside the
  value cell (`76.9% by MY2028`). Surfaced as a labelled finding rather than silently normalised. The
  intake template should split value, unit and period into separate columns.
- The intake captures no explicit direction-of-good. Inference from target placement works and is
  labelled, but an explicit column would be more robust for metrics whose target equals baseline.
- Narrative generation remains unobserved.
- Home still does not read the pack; that is pending the layout decision.
