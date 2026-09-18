# 2026-09-18-source-external-action-gate-behavior - Prove Nothing Leaves The Platform Unconfirmed

## Release ID

`2026-09-18-source-external-action-gate-behavior`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog declares a human-approval gate on the route that creates Source work items. Some of those items represent an action that leaves the platform — serving a notice on a counterparty. The gate requires an explicit human confirmation, a real rationale, and evidence references before such an item can be created.

Until now the catalog could only prove the control's names appear in executable code. It could not prove the code is reached. This is the third behavioral test in that programme, after the visible agent stream and the agent phase-advance tool. It drives the real route handler and asserts the guarantee, with every refusal case checking that the work item was never written.

The test also asserts the gate stays *scoped*: an item that stays inside the platform is created without a confirmation prompt. A blanket gate would be its own defect — it trains people to confirm reflexively, which is how a confirmation stops meaning anything.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/work-items/__tests__/external-action-gate.test.ts`: five cases against the real handler — no confirmation; a confirmation with no real rationale; a confirmed and justified action with no evidence references; the accepted path; and an internal item that needs no confirmation.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check, matching the existing steps.

The accepted path asserts what is recorded: who confirmed, the rationale, the evidence references, and the note stating that a human remains responsible for any off-platform transmission. The platform records the item; it never claims to have sent anything.

## QA / Validation

- New suite: **5 of 5 pass** (13 across the two suites matching the name). Status: **pass**.
- Mutation checks: disabling the route's gate branch fails 3 of 5; making the gate never required fails 4 of 5.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Note on the typecheck command

This record quotes the typecheck with its memory flag and its exit code deliberately. A bare `npx tsc --noEmit` exits 134 on this machine — a V8 out-of-memory crash emitting no diagnostics — and eleven earlier records quoted a clean result that had in fact crashed. Those were corrected on 18 Sep. The rule now is to judge the exit status, never the filtered output.

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

- Fifteen of the eighteen declared controls still have no behavioral test.
- The gate's workplan sub-kind branch (`rfp_send`, `vendor_notification`, `contract_draft_commit`) is unreachable from this route: the handler never reads a sub-kind from the request body, so `validateSourceExternalActionGate` is called without metadata and those sub-kinds cannot be created here at all. That is not a bypass today, but it means the branch is untested because it is unused — worth resolving deliberately rather than leaving ambiguous.
- This test mocks the write service. It proves the gate blocks the write; it does not prove the write would have persisted what the caller expected.
