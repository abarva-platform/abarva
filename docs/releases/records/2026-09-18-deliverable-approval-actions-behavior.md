# 2026-09-18-deliverable-approval-actions-behavior - Prove The Human's Edit Is What Ships

## Release ID

`2026-09-18-deliverable-approval-actions-behavior`

## Status

`candidate`

## Plain-English Summary

Two controls sit on the deliverable approval actions. An edit-before-commit control makes the drafted decision editable, so what gets recorded is what the human left in the box rather than what the model wrote. An approval gate tells a viewer without approval rights that they cannot approve, and gives them no control to press.

The catalog checker proves both controls' strings appear in the file. It cannot prove the edited text is what gets posted, or that a viewer without rights cannot reach the action. This is the eighth behavioral test in that programme; it renders the real component and drives it.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/deliverables/__tests__/ApproveActions.controls.test.tsx`: four cases against the rendered component.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What each case proves

- A viewer without approval rights sees the refusal and **no approve control exists at all**. The absence of the control is the assertion, not a disabled attribute: a disabled button a viewer can still fire would satisfy the catalog and defeat the gate.
- An edited decision is what reaches the request, and the drafted text explicitly does not survive the edit. That second half matters — a test asserting only that the edited text appears would pass even if both were sent.
- An emptied decision sends nothing.
- The approver is told what approving does — logging them as approver and advancing the program — before they press it.

## QA / Validation

- New suite: **4 of 4 pass**. Status: **pass**.
- Mutation checks: removing the approval-rights branch fails 1 of 4; sending the drafted decision instead of the reviewed one fails 1 of 4.
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

PR link, the four test results, and both mutation results to be added when available.

## Known Gaps

- Ten of the eighteen declared controls still have no behavioral test.
- This proves the client posts the reviewed decision. Whether the server records that text against the named approver is a separate assertion, and the approval route that would carry it is not this one.
