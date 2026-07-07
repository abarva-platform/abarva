# 2026-07-07-source-stranded-potential-at-risk — Scope-coverage stranded "potential at risk"

## Release ID

`2026-07-07-source-stranded-potential-at-risk`

## Status

`candidate`

## Plain-English Summary

The Source "Scope coverage" intelligence chart shows, for each archetype value lever,
whether the lever is REACHABLE (all the evidence its formula needs is present) or
STRANDED (some evidence is missing/out of scope). Before this change, a stranded lever
was sized with a flat generic illustrative scale, which badly undersold the big ones:
the AMS volume-band / run-cost lever operates on the event's real ~$46M run-cost pool
and is worth millions per year if unblocked, but showed as ~$1–2M. That muted the most
persuasive advisor moment — "this blocked lever is worth $X if you unblock it."

This change adds a "potential at risk" band for stranded levers. When a stranded lever's
REAL value pool fact IS present but only its driver inputs (percentages/ratios) are
missing, we run the lever's OWN deterministic formula over the real pool and fill only
the missing drivers from a named, illustrative AMS market benchmark band (low end → low
bound, high end → high bound). The result is a plausible, event-scaled "if unblocked"
RANGE. It is explicitly badged as benchmark-based potential — never a computed tenant
number and never a savings claim. If the lever cannot be honestly benchmark-sized (its
real $ pool is absent, a missing driver has no benchmark, or there is no real anchor
fact) it falls back to the existing flat illustrative scale — no magnitude is invented.

Honesty guardrails preserved: it is always a range never a point; every filled input
comes from a code-constant benchmark with a sourcing comment; it is deterministic (same
facts → same band); and the reachable-lever path, the value pool, the value bridge, and
the Door-2 waterfall are untouched. This is Scope-coverage-only.

## Layer Impact

- `global-control-lane`: shared app/control-plane behavior. The change is in the pure,
  deterministic Source value-analytics view builder (`step-insight-builder.ts`) and the
  Scope-coverage insight renderer/view-model. It ships to the Scope step of every
  archetype's Intelligence tab; it is not client-scoped or feature-gated. No schema,
  data-plane, retrieval, or model-prompt change — the numbers are computed on read from
  facts already in the event fact model plus in-code benchmark constants.

## Client Applicability

- All clients: Yes — any tenant viewing a Source event's Scope step sees the upgraded
  stranded-lever sizing where the lever's real value pool fact is present. Where facts
  are absent the existing MODEL/flat behavior is unchanged.
- Specific clients: None specifically; AMS archetype benefits most (its run-cost lever
  is the motivating case, e.g. Lakeshore).
- Internal only: No.
- Public/demo only: No.
- Feature flag: None (not flag-gated; it is additive and honesty-badged).

## Changes Included

- `src/lib/source/facts/view/step-insight-builder.ts` — add `AMS_DRIVER_BENCHMARKS`
  (named illustrative AMS driver bands with sourcing comment), `POOL_INPUT_KEYS`, and
  `strandedPotentialBand(rule, facts)`; wire potential-at-risk into stranded Scope rows
  with a `potentialAtRisk` flag; update the stranded headline and note to honest
  benchmark-scaled-if-unblocked phrasing. Reachable path unchanged; RFP/value-bridge/
  waterfall paths untouched.
- `src/components/source/canvas/analytics/view-model.ts` — add optional
  `potentialAtRisk` flag to `ScopeCoverageRowView`.
- `src/components/source/canvas/analytics/insights/ScopeCoverageInsight.tsx` — render an
  honest "benchmark-based potential at risk" badge + "if unblocked" read-out on
  potential-at-risk rows; flat-scale stranded rows keep the existing "stranded — needs"
  wording.
- `src/lib/source/facts/view/__tests__/step-insight-builder.test.ts` — extended with a
  potential-at-risk describe block (pool-scaled band, range-not-point, deterministic,
  honest headline/note, flat-scale fallback, reachable-unchanged).
- `src/components/source/canvas/analytics/__tests__/ScopeCoverageInsight.potential.test.tsx`
  — new: badge renders only for potential-at-risk rows with honest wording.

## QA / Validation

- `npx jest src/lib/source/facts/view/__tests__/step-insight-builder.test.ts` — passed
  (33/33), including the new potential-at-risk cases.
- `npx jest src/components/source/canvas/analytics/__tests__/ScopeCoverageInsight.potential.test.tsx`
  — passed (2/2).
- `npx jest src/lib/source/facts src/components/source/canvas/analytics` — passed
  (180/180 across 26 suites) — no regressions in the wider Source facts + analytics
  surface.
- `npx eslint src/lib/source/facts src/components/source/canvas/analytics` — passed
  (exit 0, clean).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — whole-project
  type-check run; see PR for the captured result.
- Worked example (AMS volume-band lever, real pool `annual_run_cost=$46M`, `term_years=3`,
  missing drivers filled from benchmark `variable_cost_share_pct 50–60%`,
  `projected_volume_decline_pct 12–20%`): flat old scale ~$1.2M–$1.9M → new
  potential-at-risk ~$5.8M–$16.6M, deterministic. Model/benchmark, not live-computed.

## Rollout Plan

Merge to `main` via squash PR to `abarva-platform/abarva`. Becomes active on the next
repo-owned ACA main deploy workflow build/deploy of the web image. No migration, no
feature flag, no env var, no worker job. No runtime traffic mutation from this branch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only path
  that builds/deploys the shared web image; this change piggybacks on the normal main
  deploy. No ad-hoc `az acr build` / `docker push` / branch workflow.
- Shared runtime mutators: None. This branch performs no `az containerapp update` and
  does not shift traffic, revision weights, or the web Container App template.
- Approved image digest: N/A for this PR — the standard main deploy sets the
  digest-pinned image; this change adds no new image contract.
- ACA runtime invariant: unchanged — to be proven by the normal post-deploy digest match
  (template image = 100%-traffic revision image = worker images) after main deploy, not
  by this branch.
- Worker image invariant: unchanged; no worker job image touched.
- Feature/env flag update path: None — not flag-gated or env-gated.
- Live signed-in proof required: A signed-in Lakeshore AMS Scope-step check that a
  stranded run-cost lever renders the benchmark-based potential-at-risk band + badge is
  recommended after deploy; this record is `candidate`, not `live-proven`.

## Rollback Plan

Pure additive view-layer change with no schema/data/flag. Fastest rollback is to revert
the squash-merge commit on `main` and let the next main deploy build the reverted image;
the Scope-coverage insight returns to the flat illustrative scale for stranded levers.
No migration to unwind, no data written.

## Audit Evidence

- PR URL: see the opened PR on `abarva-platform/abarva` (branch
  `feat/source-stranded-potential-at-risk`).
- Test output: jest runs above (33/33, 2/2, 180/180) + eslint clean (exit 0).
- Benchmark provenance: `AMS_DRIVER_BENCHMARKS` in `step-insight-builder.ts` carries an
  inline sourcing comment; every filled magnitude traces to a named code constant.
- Honesty contract: executable in the two test files (range-not-point, deterministic,
  benchmark-badged, flat-scale fallback, reachable-unchanged).

## Known Gaps

- The benchmark bands are illustrative AMS market magnitudes (model), not audited tenant
  data; the number is a benchmark-scaled potential-if-unblocked, not a computed tenant
  figure. It resolves to a cited number only once the missing driver evidence lands.
- Currently exercised for the AMS archetype's levers; other archetypes benefit only where
  their stranded levers have a present real $ pool and their drivers are covered by
  `AMS_DRIVER_BENCHMARKS`. Extending benchmark coverage to other archetypes is future work.
- Not yet live-proven in a signed-in browser session (see Deployment Authority).
