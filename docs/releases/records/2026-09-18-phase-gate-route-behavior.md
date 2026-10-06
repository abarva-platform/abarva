# 2026-09-18-phase-gate-route-behavior - Prove The Phase-Gate Route Refuses

## Release ID

`2026-09-18-phase-gate-route-behavior`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog declares a human-approval gate on the phase-gate route. Advancing a program across a gate is a stateful write on tenant-owned work, so the route requires an explicit human rationale and the gate-approval capability — not merely tenant membership.

Until now the catalog could only prove the control's names appear in executable code; it could not prove the code is reached. This is the sixth behavioral test in that programme. It drives the real handler through five refusals: no rationale, an empty rationale, a tenant member without gate-approval permission, an ordinary approver under strict mode, and a caller whose tenant access does not check out.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `GATE_APPROVAL_STRICT_MODE` is exercised in one case; its behavior is unchanged.

## Changes Included

- `src/app/api/programs/phase-gate/__tests__/approval-gate.test.ts`: five cases against the real handler.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## One assertion is about ordering, not status

The missing-rationale case asserts that the tenant lookup was never called. The
route validates the rationale before resolving the program's owning tenant, so a
caller cannot discover which program codes resolve by sending a stream of
requests with no rationale and reading the difference between "unknown
programCode" and a permission error.

That ordering is easy to lose in a refactor — a reviewer moving validation
around would see all five statuses stay correct. The assertion exists so the
ordering has to be deliberate.

## QA / Validation

- New suite: **5 of 5 pass**. Status: **pass**.
- Mutation checks: disabling the rationale gate fails 2 of 5; disabling the gate-approval permission check fails 1 of 5.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

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

- Twelve of the eighteen declared controls still have no behavioral test. The action-bearing ones remaining are the renewal cockpit external action, the deliverable approval actions, the Source approval queue, the phase-advance button and the program gate approval; the rest render labels and disclosures.
- These cases stop at the refusals. The accepted path writes a phase snapshot and an audit log entry through several collaborators; proving what it records deserves its own test rather than a chain of mocks inside this one.
