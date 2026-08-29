# 2026-08-29-tower-zero-claim-set-guard — An empty claim set reads as a gap, never as success

## Release ID

`2026-08-29-tower-zero-claim-set-guard`

## Status

`candidate`

## Plain-English Summary

When the Tower Executive View has no value claims loaded, it presented the tenant as finished
rather than as unmeasured. Three separate places did this at once:

- The usage-evidence card compared `usageSupportedClaimCount === claims`. With both at zero that is
  true, so it rendered a green **COMPLETE** badge over "0 of 0" captioned *"Every value claim has
  usage-to-value support"* — vacuously true, on the one gate this surface exists to prove is unmet.
- The headline read *"0 of 0 claims still need proof."*
- All three review decisions rendered instructions to act on nothing, e.g. *"Backfill measured
  outcome on the 0 claims that carry no actual"*, with metric values of `0/0` and `0`.

An executive reading that sees a reviewed, settled portfolio. The truth is that nothing has been
loaded to review. This is the same missing-is-not-zero failure the product exists to prevent,
inverted into a positive claim, which is worse than the `$0` it replaced.

Now: a zero denominator renders an explicit gap (`NO CLAIMS` / "No value claims in this read — the
usage gate has nothing to evaluate"), the headline says no claims are loaded so nothing can be
proven or disproven yet, and the decision list is empty with an explicit reason rather than three
actions targeting zero items. Decisions 2 and 3 are also dropped individually whenever their own
target count is zero, since each names that count in its title.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 3 (canonical model):** unchanged. No metric, value, or serving view redefined.
- **Layer 4 (products — Tower):** the Executive View stops asserting completeness it has not
  earned when the claim population is empty.

## Client Applicability

- All clients: yes — any tenant whose Tower read returns zero value claims.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx` — zero-claim guards on the
  headline, the usage-evidence card, and the decision builder; explicit empty-state copy on the
  decisions section.
- `src/components/tower/command-center/__tests__/zero-claim-set.test.tsx` — new behavioural suite.
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` — two existing tests
  updated; see below.

## QA / Validation

- New behavioural suite → 7/7 pass. It renders the component in both states rather than asserting
  on source text.
- `jest src/components/tower/command-center/__tests__ src/lib/tower/__tests__` → 109 pass / 21 fail
  across 6 failed suites. Baseline measured on clean `origin/main` by stashing: 102 pass / 21 fail,
  6 failed suites. Identical failure count and suite set; the +7 are this change's own.
- Verified in the **rendered HTML** from the repo's render harness, not from assertions alone:
  `COMPLETE`, `Every value claim has usage-to-value support`, `0 of 0 claims still need proof` and
  `the 0 claims` are all absent; `NO CLAIMS`, `nothing to evaluate`, `No value claims are loaded`
  and `nothing to decide yet` are all present.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on all changed files → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

### Two existing tests were asserting the defect

`TowerCommandCenter.test.tsx` had a case pinning the string
`/Backfill measured outcome on the 0 claims/`. Its actual intent is that claim arithmetic uses the
230-claim population and not the 969-row economic queue, but it set `outcomeMeasuredClaimCount`
equal to `valueClaimCount`, making the gap exactly zero and letting it pass on an action that
targets nothing. It now uses 160 of 230 — the real tenant shape — and asserts a gap of 70, which
tests the same intent against a state that can actually occur.

A second case drove the Review buttons from the base fixture, which has no claims, so those buttons
are now correctly absent. It now renders with a populated claim set.

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
- Live signed-in proof required: yes — a signed-in `/tower` capture on a tenant with an empty claim
  set, showing the gap state rather than `COMPLETE`.

## Rollback Plan

Revert the squash commit; the deploy workflow ships the prior digest. Code-only, immediate, no
schema or data change. Reverting restores a green completeness badge over an empty claim set.

## Audit Evidence

- The three-file diff.
- New-suite output, the stashed-baseline counts above, and the harness-rendered HTML probe results.
- Post-deploy: ACA runtime invariant proof and a signed-in capture.

## Known Gaps

- Not yet live-proven; this record is `candidate`.
- **This does not fix why the claim set is empty.** Live `/tower` is currently reading the older
  active-tree assessment (its source refs cite `08_spend_value.csv` and `09_programs_initiatives.csv`
  rather than the refreshed `20_`–`26_` package). This change makes that state legible instead of
  flattering; the assessment binding is separate work.
- **The design fixture itself carries `valueClaimCount: 0`,** which is why this defect survived
  every prior suite run and render-harness pass: the only fixture in the component suite exercises
  the empty path, and `COMPLETE` looked like a pass. A populated fixture would be worth adding so
  the non-empty path has default coverage.
- Pre-existing failures elsewhere in the Tower suites are untouched and unrelated, including
  `css-contract.test.ts` and the render harness's "writes every drawer" case, which was already red
  on `main` before this change.
