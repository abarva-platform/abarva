# 2026-08-28-tower-plan-variance-label — Trajectory variance label follows the sign of the gap

## Release ID

`2026-08-28-tower-plan-variance-label`

## Status

`candidate`

## Plain-English Summary

The Value Proof tab shows a three-stat block above the eight-quarter trajectory: Planned, Actual,
and a third figure naming the gap between them. That third figure was labelled "Over plan" — a
fixed string — over the value `max(0, planned - measured)`.

That quantity is the **shortfall**, not an overshoot, and the clamp at zero made it structurally
incapable of ever expressing an overshoot. So the label was not merely wrong in one case; it could
never be right. On live production data, where measured value is currently zero, the block rendered:

```
Planned $492.5M   Actual $0   Over plan $492.5M
```

A complete measurement failure, presented as outperformance, on the executive-facing tab, in the
most flattering possible direction.

The label is now derived from the sign of the gap — "Over plan", "Short of plan", or "On plan" —
and the figure is the magnitude of the difference. The same data now reads
`Planned $492.5M · Actual $0 · Short of plan $492.5M`.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 3 (canonical model):** unchanged. No metric, value, or serving view is redefined. The
  underlying figure is the same difference it always was; only its name changes.
- **Layer 4 (products — Tower):** one label on the Value Proof tab stops asserting the opposite of
  what the number means.

## Client Applicability

- All clients: yes — every tenant rendering the Tower Value Proof tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/ContractTabs.tsx` — add `planVarianceLabel()`; render
  it in place of the fixed string, over `Math.abs(...)` in place of `Math.max(0, ...)`.
- `src/components/tower/command-center/__tests__/plan-variance-label.test.ts` — new regression
  suite.

## QA / Validation

- New regression suite → 4/4 pass. It asserts the absence of the hardcoded `<span>Over plan</span>`
  and of the clamped expression, so a reintroduction fails the build.
- `jest src/components/tower/command-center/__tests__` → 23 pass / 2 fail. Baseline measured on
  clean `origin/main` by stashing: 19 pass / 2 fail. Identical failure set; the +4 are this
  change's own. No regressions.
- Rendered through the repo's own render harness and read back out of the emitted HTML: the block
  renders `Planned $35.5M · Actual $17.7M · Short of plan $17.8M` against the design fixture, where
  it previously read `Over plan $17.8M`. Verified from output, not from the test alone.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean. Note: an earlier draft of the test used the
  `s` (dotAll) regex flag, which jest accepted and `tsc` rejected under this target. jest-green is
  again not type-clean on this repo.
- `eslint` on both changed files → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the repo-owned ACA main deploy workflow builds and deploys. No migration,
no data build, no flag change, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command in this release.
- Approved image digest: assigned by the deploy workflow at build time.
- ACA runtime invariant: must be re-proven post-deploy before this record may claim `live-proven`.
- Worker image invariant: unaffected.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes — a signed-in capture of the Value Proof tab showing
  `Short of plan` against a tenant whose measured value is below plan.

## Rollback Plan

Revert the squash commit; the deploy workflow ships the prior digest. Code-only, immediate, no
schema or data change. Reverting restores a label that states the opposite of its own number.

## Audit Evidence

- The two-file diff.
- New-suite output, the stashed-baseline counts above, and the harness-rendered HTML string.
- Post-deploy: ACA runtime invariant proof and a signed-in Value Proof capture.

## Known Gaps

- Not yet live-proven; this record is `candidate`.
- **Two pre-existing failures remain in `css-contract.test.ts` on `main`,** untouched by this
  change and unrelated to it: four classes referenced by components and declared nowhere
  (`reviewDecisions`, `valueLoss`, `aiPortfolioLeft`, `aiPortfolioRight`), and a missing
  `min-width: 0` on `.root` that the suite requires so the fixed shell can shrink horizontally.
  Both need their own lane.
- Two larger Value Proof findings are **not** addressed here, because both are data-contract
  questions rather than labelling: the seven-gate chart is captioned "in order" while rendering a
  gate at $492.5M downstream of three gates at $0; and the claim ledger is headed "what each of the
  230 has on the record" while sourcing `Baseline linked` and `Stale` from the 140-row program
  population.
