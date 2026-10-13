# Home Advisor Admission Diagnostics

## Release ID

`2026-10-13-home-advisor-admission-diagnostics`

## Status

`candidate`

## Plain-English Summary

Distinguish requests for missing interviews from actual testimony. Keep combined revenue populations intact in executive readouts. Retain a complete qualified supporting point after one unsuccessful shortening attempt without relaxing factual checks.

## Layer Impact

Layer 4, Products. Release lane: `global-control-lane`. Home answer admission and its prompt change. No canonical records, tenant refresh, loaders, permissions, financial calculations or other product values change.

## Client Applicability

- All clients: Authenticated Home advisor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls unchanged.

## Changes Included

- Separate missing interview references and future discovery requests from assertions of actual testimony.
- Require local synthetic basis on recognized testimony; do not license trust populations from concern counts.
- Reject recognized single-population revenue concentration unsupported by a cited combined population.
- Keep the initial 30-word supporting-point target; after one correction allow complete otherwise-admitted points up to 45 words.
- Preserve quantity, scope, financial-denominator, citation and qualification checks at both limits.
- Emit only fixed admission reason categories when a response is withheld, without question, source text, response text or tenant identifiers.

## QA / Validation

Pass: Final affected answer/display/export run, 895 tests across 40 suites; Node 24 typecheck, scoped lint and all 11 release gates. Independent review found bounded negation, local qualification and evidence-request cases; regressions were added and the reproduced findings corrected. Protected CI remains pending.

Not run on this candidate: Signed-in discovery and business questions, cross-domain replies, count/source parity, graph honesty, actual exports and visual checks. Safe withholding is not useful-answer acceptance.

## Rollout Plan

Protected squash merge and `.github/workflows/aca-main-deploy.yml`. Resolve the exact merge image and independently prove runtime parity before browser acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from merge SHA and retain private proof.
- ACA runtime invariant: Template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: All required worker jobs match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Discovery relevance, bounded business composition, cited qualified points and exports.

## Rollback Plan

Revert through a PR and the same workflow. No data rollback.

## Audit Evidence

Private reproduction and read-only admission-category diagnostics, regression tests, review, CI, exact-SHA deploy, runtime invariant and browser acceptance.

## Known Gaps

The wording guards recognize bounded forms, not general semantic entailment. No original source references, canonical graph, data refresh or other-module continuation are created. The existing record source remains explicitly labelled.
