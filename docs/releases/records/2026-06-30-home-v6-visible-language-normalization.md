# 2026-06-30-home-v6-visible-language-normalization — Home V6 Visible Language Normalization

## Release ID

`2026-06-30-home-v6-visible-language-normalization`

## Status

`candidate`

## Plain-English Summary

Home V6 Claude answers can be blocked when the model uses implementation-facing phrases such as "loaded evidence" or "loaded context" even though the business answer is otherwise good. This change applies the existing public aVa answer scrubber before Home validates Claude output, so those phrases are translated into executive-safe wording instead of causing a 503 fallback.

## Layer Impact

- `global-control-lane`: changes shared Home Ask answer composition and validation behavior for all tenants using the Home V6 path.
- `public-demo`: improves demo-facing Home answers by preserving acceptable Claude prose after wording cleanup.

## Client Applicability

- All clients: all tenants using Home V6 receive the normalization.
- Specific clients: Retail Demo, Airline Demo, Healthcare Demo, Financial Services Demo, and Industrial Demo are covered by live smoke scope.
- Internal only: none.
- Public/demo only: no.
- Feature flag: governed by existing Home V6 executive synthesis flags.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- `docs/releases/records/2026-06-30-home-v6-visible-language-normalization.md`

## QA / Validation

- Passed: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand`
- Passed: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- Pending before merge: `npm run release:check`
- Required after deploy: rerun the 25-question Home V6 live smoke and confirm no `home_know_blocked` responses for visual, budget, or handoff cases.

## Rollout Plan

Merge to `main`, deploy through the canonical Azure Container Apps main deploy workflow, confirm the live revision receives 100% traffic, then rerun the Home V6 targeted production smoke.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow on `main`
- Shared runtime mutators: none outside the approved workflow
- Approved image digest: assigned by the ACA deploy run
- ACA runtime invariant: required before declaring live
- Worker image invariant: required by the deploy workflow
- Feature/env flag update path: no new flag
- Live signed-in proof required: yes, Home V6 25-question smoke

## Rollback Plan

Revert the release commit and redeploy through the ACA main deploy workflow. The rollback restores stricter validation and may again block otherwise acceptable Claude answers that contain public-scrubbable evidence wording.

## Audit Evidence

Pre-fix live smoke after the visual patch:

- Visual/table/chart/graph: 3/3 passed
- Remaining hard failures: `visible:implementation_loaded_evidence` for Airline Demo Tower handoff and Financial Services Demo budget/spend
- One scorer-only warning: missing tenant name on Industrial Demo risk/control

## Known Gaps

The live smoke must be rerun after this follow-up deploy before the broader Home 25-question gate can be called clean.
