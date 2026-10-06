# 2026-09-18-agent-phase-advance-gate-behavior - Prove The Agent Cannot Advance A Phase Itself

## Release ID

`2026-09-18-agent-phase-advance-gate-behavior`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog declares a human-approval gate on the agent tool that advances a program phase. Until now the catalog could only prove that the control's names appear in executable code. It could not prove the code is reached, so a gate behind a disabled branch would still have passed.

This is the second behavioral test in that programme, after the visible agent stream. It executes the real tool handler and asserts the two guarantees the control exists for: an agent cannot advance a phase without an explicit human rationale, and an agent never satisfies a gate approval itself — when one is required it queues a request and refuses.

Each assertion is about the mutation, not the message: the proof is that the phase-advance mutation was never called.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/tools/program/__tests__/advancePhase.approval-gate.test.ts`: four cases against the real handler — missing human rationale, approval required, bypass without approval rights, unmet hard gate. Every case asserts the advance mutation was not called.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check, matching the step added for the agent stream.

## QA / Validation

- New suite: **4 of 4 pass**. Status: **pass**.
- Mutation checks, the point of the exercise:
  - neutralising the human-rationale gate fails one test, and only that one;
  - neutralising the approval gate fails one test, and only that one.
- Scoped ESLint and full-project `tsc --noEmit`: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## A note on the test's own construction

Two early attempts failed on jest's hoisting of `jest.mock` factories above
the `const` declarations they referenced — a temporal dead zone error, and the
same defect the failing-suite triage found in two other test files. The mocks are
therefore created inside the factories and retrieved with `jest.mocked(...)`
after import. A behavioral test that cannot run is worth no more than a comment
naming a control.

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

PR link, the four test results, and both mutation results to be added when available.

## Known Gaps

- Sixteen of the eighteen declared controls still have no behavioral test. The highest-value remaining ones are the external-action route, the phase-gate route and the deliverable approval actions — every control where an agent or a route can take an action rather than render a label.
- This test mocks the data layer. It proves the gate blocks the mutation; it does not prove the mutation would have written what the caller expected.
