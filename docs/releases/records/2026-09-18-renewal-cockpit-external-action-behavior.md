# 2026-09-18-renewal-cockpit-external-action-behavior - Prove The Button Is Really Disabled

## Release ID

`2026-09-18-renewal-cockpit-external-action-behavior`

## Status

`candidate`

## Plain-English Summary

Two controls sit on the renewal cockpit. An approval gate stops an external action — serving notice on a vendor — being created without a human rationale. An AI label stops a generated vendor email reading as something that was sent.

The catalog checker proves both controls' strings appear in the file. It cannot prove the button is actually disabled, that a click produces no request, or that the request carries what the screen promised. This is the seventh behavioral test in that programme, and the earliest one on a rendered surface rather than a route: it renders the real component and drives it.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/__tests__/RenewalCockpitActionBar.external-action.test.tsx`: four cases against the rendered component.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What each case proves

- With no rationale the create button is disabled **and** clicking it produces no request. A disabled attribute that still posts would satisfy the catalog and defeat the gate, so the absence of the request is the assertion rather than the attribute.
- A rationale shorter than the stated minimum leaves the button disabled, so the minimum shown on screen is the minimum enforced.
- Once a rationale is written, the request carries `humanConfirmed`, the operator's own words, and the evidence references naming the contract and vendor — what the screen promised, not a placeholder.
- The generated vendor email renders as "draft, not sent".

## QA / Validation

- New suite: **4 of 4 pass**. Status: **pass**.
- Mutation checks: removing the rationale condition from the button's `disabled` fails 2 of 4; dropping the "draft, not sent" wording fails 1 of 4.
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

- Eleven of the eighteen declared controls still have no behavioral test.
- This test proves the client sends a confirmed, justified request. The server-side half — that the route refuses an unconfirmed one — is covered separately by the Source work-items test. Neither depends on the other, which is the right shape: a client control and a server control that both have to hold.
