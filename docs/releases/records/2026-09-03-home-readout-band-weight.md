# 2026-09-03-home-readout-band-weight — The chapter opens from where its weight is

## Release ID

`2026-09-03-home-readout-band-weight`

## Status

`candidate`

## Plain-English Summary

The Leadership Perspective chapter opened on the programme portfolio.

Its actual content is four counted findings about what leaders said — _all 44
interviewed leaders raised value realisation as a concern_ — and the readout
reached past every one of them to a lone cross-domain remark about
expected-value-to-budget ratio, which is not this chapter's subject.

The cause is an ordering, not the content. The readout took an interpretation
whenever one existed, and fell back to the record only when none did. Those four
findings are typed `FACT`, which puts them in the record band. **The chapter's
strongest material was skipped precisely because it was well enough evidenced to
count as fact.**

## What changed

Interpretation leads only where it outnumbers the record. On a tie the record
leads: a page whose whole claim is that it asserts no more than its evidence
should open with the evidence when the two are level.

Measured across both tenants before choosing the rule, rather than tuned until the
one broken chapter looked right. It changes five openers and all five improve:

- the leadership chapter now opens on leadership, on both tenants
- the business chapter opens on the revenue split rather than one platform
  dependency
- the value chapter opens on the share of promised value that is finance-validated
- one tenant's Executive Brief opens on the enterprise profile, which is what the
  opening ten minutes asks for

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change.
- **Layer 4 / products:** which band supplies the chapter readout.

## Client Applicability

- All clients. The rule reads each chapter's own bands, so a chapter weighted
  toward interpretation still opens on interpretation.
- Feature flag: none.

## Changes Included

- `ChapterPage.tsx` — the readout leads with the heavier band.
- `__tests__/readout-label.test.tsx` — 3 further cases, run against the loaded
  record for both tenants rather than a fixture.

## QA / Validation

- PASS the readout suite, 9 of 9
- PASS Home surface 683/711 across 76 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS rendered every chapter on both tenants and read the opener
- **Mutation-tested three ways:** returning to interpretation-led ordering fails 3
  cases; giving a tie to interpretation fails 2; always leading with the record
  fails one

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The readout returns to taking an interpretation whenever one exists.

## Audit Evidence

- The band weights measured across sixteen chapters before the rule was chosen,
  and the rendered opener for each afterwards.
- The three mutation results.

## Known Gaps

- **How We Operate still opens off its own question**, on both tenants. That is a
  different fault and this does not touch it: the claim is routed to the chapter at
  build time, because its evidence carries a provenance domain rather than a
  subject domain, so a technical statement is not recognised as technical and falls
  through to the operating chapter's fallback. Fixing it means correcting the
  domain where the signal is built and regenerating, which is a gated model run —
  not a render change, and not shippable here.
- The rule counts claims. It does not judge whether a claim is on-question, which
  is what the routing above is for.
