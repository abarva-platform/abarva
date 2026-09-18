# 2026-09-18-approval-queue-controls-behavior - Prove The Queue Refuses And Reports

## Release ID

`2026-09-18-approval-queue-controls-behavior`

## Status

`candidate`

## Plain-English Summary

Two controls sit on the Source approval queue. The approval gate requires every stage attestation to be ticked and a reason of real length before an approval can be sent. The risk caveat tells the approver, in the row itself, that this is their accountable decision.

The catalog checker proves both controls' strings appear in the file. It cannot prove the button refuses to fire, that the request carries the attestations the approver actually ticked, or that a refused approval is reported rather than swallowed. This is the ninth behavioral test in that programme; it renders the real component and drives it.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/__tests__/AdminSourceEventApprovalQueue.controls.test.tsx`: five cases against the rendered component.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What each case proves

- With attestations unticked the approve control refuses and **no request leaves the page**. The absent request is the assertion, not the disabled attribute.
- A reason shorter than the minimum the placeholder advertises is refused, so the number shown is the number enforced.
- An accepted approval sends the attestations the approver actually ticked, not a default-true set.
- The accountable-decision caveat renders in the row.
- A refused approval surfaces the server's reason. A silent failure here would leave an approver believing a gate advanced when it did not — the worst outcome available on this surface, and the one a status-only test would miss.

## QA / Validation

- New suite: **5 of 5 pass**. Status: **pass**.
- Mutation checks: dropping the attestation and reason conditions from the approve control fails 2 of 5; swallowing the failed-response branch fails 1 of 5.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## A note on the fixture

The component takes rows in the database's own shape. An earlier draft of this
test invented a camel-cased fixture, which rendered and then threw on a field
that does not exist under that name. The fixture now mirrors `SourceEventRow`
exactly. A test that constructs a shape the product never produces proves
nothing about the product.

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

- Nine of the eighteen declared controls still have no behavioral test.
- This proves the queue sends the ticked attestations. Whether the server records them against the named approver is asserted separately by the approve-route tests.
