# 2026-06-30-home-v6-validation-edge-hardening — Home V6 Validation Edge Hardening

## Release ID

`2026-06-30-home-v6-validation-edge-hardening`

## Status

`candidate`

## Plain-English Summary

Home V6 live smoke still found valid Claude answers being blocked by over-strict validation. Three answers used the ordinary word "row" when describing a table structure, and one handoff answer used executive terms such as recommendation and prioritization that were not counted by the current signal check. This release normalizes "row" to "line" in Home Claude prose and broadens the executive-signal check for handoff answers.

## Layer Impact

- `global-control-lane`: changes shared Home V6 answer validation for all tenants.
- `public-demo`: prevents otherwise valid demo answers from showing a 503 fallback because of acceptable table or handoff wording.

## Client Applicability

- All clients: all tenants using Home V6 receive the validation hardening.
- Specific clients: Industrial Demo, Airline Demo, Retail Demo, Financial Services Demo, and Healthcare Demo are covered by the live 25-question smoke.
- Internal only: none.
- Public/demo only: no.
- Feature flag: governed by existing Home V6 executive synthesis flags.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- `docs/releases/records/2026-06-30-home-v6-validation-edge-hardening.md`

## QA / Validation

- Pending: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand`
- Pending: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- Pending: `npm run release:check`
- Required after deploy: rerun the 25-question Home V6 live smoke and confirm no `home_know_blocked` responses.

## Rollout Plan

Merge to `main`, deploy through the canonical Azure Container Apps main deploy workflow, verify the live ACA revision, then rerun the Home V6 targeted production smoke.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow on `main`
- Shared runtime mutators: none outside the approved workflow
- Approved image digest: assigned by the ACA deploy run
- ACA runtime invariant: required before declaring live
- Worker image invariant: required by the deploy workflow
- Feature/env flag update path: no new flag
- Live signed-in proof required: yes, Home V6 25-question smoke

## Rollback Plan

Revert this release commit and redeploy through the ACA main deploy workflow. The rollback restores stricter validation and may again block table/handoff answers that are otherwise suitable for users.

## Audit Evidence

Pre-fix live smoke after visible-language normalization:

- Passed: 21/25
- Visual/table/chart/graph: 3/3 passed
- Remaining hard failures: `visible:implementation_rows` or narrow executive-signal validation on Industrial Demo structure, Airline Demo tenant fence, Retail Demo Intelligence handoff, and Financial Services Demo budget/spend.

## Known Gaps

The live smoke must be rerun after this release deploy before the Home 25-question gate can be called clean.
