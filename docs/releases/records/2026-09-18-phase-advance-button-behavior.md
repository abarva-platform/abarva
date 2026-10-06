# 2026-09-18-phase-advance-button-behavior - Prove The Commit Needs A Human

## Release ID

`2026-09-18-phase-advance-button-behavior`

## Status

`candidate`

## Plain-English Summary

Advancing a program phase from this button is a stateful write. The control requires the human to write a rationale of real length and commit the decision themselves, with the AI-support watermark and attestation text in view while they do it.

The catalog checker proves those strings appear in the file. It cannot prove the commit refuses to fire, or that the rationale sent is the one typed. This is the tenth behavioral test in that programme; it renders the real component and drives it.

With this and the two route tests, every path that advances a program phase — the agent tool, the HTTP route, and the button a person presses — now fails when its gate is removed.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/programs/__tests__/PhaseAdvanceButton.controls.test.tsx`: five cases against the rendered component.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What each case proves

- With no rationale the commit refuses **and no request leaves the page**. A disabled control that still posts would satisfy the catalog and advance a phase unaccounted for.
- A rationale shorter than the stated minimum is refused, so the number shown is the number enforced.
- The rationale that reaches the request is the one the human typed.
- The attestation is visible while the decision is being made, not after.
- When the caller says the gate is closed, no commit control is rendered at all.

## QA / Validation

- New suite: **5 of 5 pass**. Status: **pass**.
- Mutation check: removing the rationale conditions from both the button's `disabled` and the handler's guard fails 2 of 5.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## A note on the missing router mock

The suite failed on `invariant expected app router to be mounted` until
`next/navigation` was mocked. That is the same missing mock the failing-suite
triage found in several older component suites, where it had been read as a
product defect rather than a test-setup gap. Recording it here so the next
author recognises the message rather than re-diagnosing it.

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

PR link, the five test results, and the mutation result to be added when available.

## Known Gaps

- Eight of the eighteen declared controls still have no behavioral test; the remainder are largely labelling and disclosure surfaces, where the failure is misleading rather than doing.
- The attestation case asserts that decision-responsibility language is present, not its exact wording. Pinning the wording would make the test a copy lock rather than a control test, and the wording lives in a shared module with its own tests.
