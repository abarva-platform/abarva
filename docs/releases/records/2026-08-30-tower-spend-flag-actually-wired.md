# Tower — wire the spend flag through the view model

## Release ID

`2026-08-30-tower-spend-flag-actually-wired`

## Status

`candidate`

## Plain-English Summary

Two earlier changes tried to make the AI portfolio table render "Not loaded" instead of `$0` for
the thirteen tool rollouts, which record no cost. Both shipped, both deployed, and neither changed
the render. This is why.

The view model built the flag like this:

```ts
aiSpendLoaded: item.aiTaggedSpendUsd !== null,
```

`aiTaggedSpendUsd` is typed `number`. The comparison is therefore **always true**, TypeScript does
not object to it, and the line discarded whatever the reader had derived. Both fixes were
downstream of it, so both were inert.

The flag now carries the reader's value. The reader is the only place that can still see whether
the source recorded a cost, because the value is coerced to 0 immediately afterwards for the
portfolio totals that sum it.

A read-only probe run against the lab data plane established that the data was never the problem
(all thirteen rollouts store `monthly_cost_usd` as SQL NULL, and no funding key appears in any
rollout's display payload), which is what narrowed this to the one link that had never been
checked.

## Layer Impact

Lane: `global-control-lane`. Tower view model only — one line. No reader, loader, type, schema or
data change, and no total is recalculated.

## Client Applicability

**All clients.** Every tenant reading the Tower AI portfolio table. Not flagged, not tenant-scoped.
Rows whose source records a cost are unaffected; rows that record none change from `$0` to
"Not loaded".

## Changes Included

- `src/lib/tower/command-center/view-model.ts` — the flag carries the reader's derivation.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — two guards: one pins this line, one
  rejects the whole class of `Loaded: item.<field> !== null` on a field the type says is never
  null.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 38/38, two new guards |
| Tower suites | PASS against baseline — 526 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Class sweep | PASS — the three sibling flags (`promisedBenefitLoaded`, `readinessScoreLoaded`, `riskScoreLoaded`) all sit on genuinely nullable fields; `aiTaggedSpendUsd` was the only non-nullable one |
| Live signed-in proof | NOT RUN — pending deploy. |

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. One line; no stored or summed value changed.

## Known Gaps

- **The guards on the two earlier attempts pinned the reader and the panel, and never this line.**
  Both changes were verified end to end by test and by type-check, and both were inert. A guard
  that covers the ends of a chain does not cover the chain.
- The probe's step 3 sampled a rollout's display payload with `limit 1` and no ordering, so it
  returned a row from a retired assessment whose payload holds only `page_key`. The active-view
  step (5) queried `serving.tower_adoption_lens` and is the trustworthy one. Worth an `order by`
  before that probe is used again.
- `aiTaggedSpendUsd` remains typed `number` and coerced to 0. Anything summing it still counts an
  unrecorded rollout as costing nothing.

## Audit Evidence

`git show origin/main:src/lib/tower/command-center/view-model.ts` line 438 read
`aiSpendLoaded: item.aiTaggedSpendUsd !== null` after both earlier changes had merged and
deployed, while `current-layer-view-model.ts` declares `aiTaggedSpendUsd: number`. The probe run
(`ops:probe-tower-serving-shape`, ACA Job `job-abarva-private-operator-eus`) reported
`cost_null: 13`, `cost_zero: 0`, and zero funding keys on every rollout display payload.
