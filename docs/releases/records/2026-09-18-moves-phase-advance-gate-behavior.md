# 2026-09-18-moves-phase-advance-gate-behavior - Prove The Phase-Advance Route Refuses

## Release ID

`2026-09-18-moves-phase-advance-gate-behavior`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog declares a human-approval gate on the route that advances a program phase. Until now the catalog could only prove the control's names appear in executable code; it could not prove the code is reached.

This is the fourth behavioral test in that programme, after the visible agent stream, the agent phase-advance tool and the Source external-action route. It drives the real route handler and asserts that a phase cannot advance without an explicit human rationale, that an approval-requiring gate produces a pending request rather than an advance, and that an unmet hard gate refuses. Each case asserts the advance mutation was never called.

Together with the tool test, both paths to a phase advance — the agent tool and the HTTP route — now have a test that fails when their gate is removed.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/advance/__tests__/approval-gate.test.ts`: three cases against the real handler.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## QA / Validation

- New suite: **3 of 3 pass**. Status: **pass**.
- Mutation checks: disabling the rationale gate fails one test; disabling the approval branch fails one test. Each mutation fails only its own case.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## What writing it exposed

The handler wraps its whole body in one `try` whose `catch` returns
`tenancyErrorResponse(error)`. Any failure inside — a missing access-policy
field, an unresolved operator person — is therefore reported to the caller as a
tenancy error with the status that helper chooses. While building this test a
`TypeError` on `programIdsAllowed` surfaced as an authentication failure.

That is not a security defect, and it is not changed here: the route refuses in
every case, which is the safe direction. It is a diagnosability problem — a
bug inside the handler is indistinguishable from a signed-out caller, both in
logs and to the client. Worth separating deliberately rather than leaving the
catch to absorb everything.

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

PR link, the three test results, and both mutation results to be added when available.

## Known Gaps

- Fourteen of the eighteen declared controls still have no behavioral test.
- This test mocks the data layer and the gate evaluator. It proves the route refuses to call the mutation; it does not prove the gate evaluator's own rules are right.
