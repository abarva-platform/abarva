# 2026-09-18-promotion-submit-gate-behavior - Prove A Pattern Cannot Become A Program Unowned

## Release ID

`2026-09-18-promotion-submit-gate-behavior`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog declares a human-approval gate on the submit path that turns an Intelligence pattern into a real program. It is the moment an AI suggestion becomes work the organisation will fund, so the gate requires a named human to accept decision responsibility, give a rationale, and name the evidence they relied on.

Until now the catalog could only prove the control's names appear in executable code; it could not prove the code is reached. This is the fifth behavioral test in that programme. It calls the real submit function and asserts the refusal lands before anything else happens — the proof is that authentication — the step immediately after the gate — was never reached.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/__tests__/origination-submit.promotion-gate.test.ts`: five cases against the real submit function.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## QA / Validation

- New suite: **5 of 5 pass**. Status: **pass**.
- Mutation checks: disabling the gate's throw fails 3 of 5; making the gate never required fails 3 of 5.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Scope of the assertion

Three cases assert the refusal, one asserts the gate stays scoped — a brief that
came from no pattern is not asked to accept promotion responsibility — and one
asserts an approved promotion gets past the gate.

That fourth case is deliberate. A blanket gate is its own defect: asking for an
acceptance on every brief trains people to click through it, and an acceptance
that is always required is indistinguishable from no acceptance at all.

The approved-path case asserts only that the gate is not what stopped it, and
that authentication was reached. Carrying a full submit through to a write would
mean mocking the entire persistence chain, which proves the mocks rather than the
control.

## Rollout Plan

Squash-merge after required checks pass. No deploy is required for a test-only change; it rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the five test results, and both mutation results to be added when available.

## Known Gaps

- Thirteen of the eighteen declared controls still have no behavioral test. The remaining action-bearing ones are the Moves phase-gate route, the renewal cockpit external action, the deliverable approval actions, the Source approval queue and the phase-advance button; the rest render labels and disclosures.
- This test proves the gate refuses before any write. It does not prove the downstream write path records the accepted rationale and evidence refs where a reviewer can later read them.
