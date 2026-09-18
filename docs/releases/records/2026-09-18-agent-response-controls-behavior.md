# 2026-09-18-agent-response-controls-behavior - Prove The Disclosures Fire, And Only When They Should

## Release ID

`2026-09-18-agent-response-controls-behavior`

## Status

`candidate`

## Plain-English Summary

The rendered agent response carries five declared controls at once: the AI draft label, citation resolution, the citation-gap notice, the confidence disclosure, and the approval notice above follow-up actions. It is the densest entry in the control catalog.

The checker proves those component names appear in the file. It cannot prove any of them renders for a given answer, and — the part that matters more — it cannot prove the citation gap stays quiet when the answer really is cited. This is the twelfth behavioral test in that programme; it renders the real component.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/__tests__/AgentResponse.controls.test.tsx`: five cases against the rendered component.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## Both directions, deliberately

Three cases assert a disclosure appears: the draft label on every answer, the
citation gap on substantive uncited prose, and the approval notice above any
follow-up action a user can fire.

Two cases assert a disclosure does **not** appear: no citation gap on an answer
that carries citations, and none when confidence is explicitly `none`.

That second group is the half usually missing. A notice that fires on cited
answers too would train readers to ignore it, which leaves them exactly as
uninformed as no notice at all — and it would still satisfy a checker looking
for the component's name. The mutation results below show the suite catches an
over-firing notice, not only a missing one.

## QA / Validation

- New suite: **5 of 5 pass**. Status: **pass**.
- Mutation checks: removing the draft label fails 1 of 5; forcing the citation gap to always show fails **2** of 5 — the cited case and the explicit-none case.
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

- Six of the eighteen declared controls still have no behavioral test.
- The confidence case asserts the tier renders when the view model supplies one. Whether the tier itself is *correct* belongs to the scoring layer and its own tests; this test would pass on a wrong tier honestly displayed.
- The approval-notice case asserts that human-ownership language accompanies the action chips, not its exact wording, so the shared notice component can be reworded without breaking an unrelated suite.
