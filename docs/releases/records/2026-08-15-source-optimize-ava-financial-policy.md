# 2026-08-15-source-optimize-ava-financial-policy — Source Optimize aVa Financial Policy

## Release ID

`2026-08-15-source-optimize-ava-financial-policy`

## Status

`candidate`

## Plain-English Summary

Source Optimize aVa now uses the same financial visibility posture as the signed-in Source page for same-tenant AbarVa canonical/proof accounts. If the user is already allowed to see governed Source contract values on the page, aVa can cite those same retrieved values instead of replacing them with generic restricted-value placeholders.

## Layer Impact

- `global-control-lane`: updates Source access policy evaluation for already-recognized same-tenant AbarVa canonical/proof accounts.
- Product layer: affects Source Optimize Contract aVa answers that are rendered through the shared agent dock.
- Data layer: no schema, migration, seed, or client-data mutation.

## Client Applicability

- All clients: no change for ordinary client admins, source members, or source viewers; explicit membership or participant financial visibility still controls exact financial output.
- Specific clients: none.
- Internal only: same-tenant AbarVa canonical/proof account path used for governed product verification and demonstrations.
- Public/demo only: no public route impact.
- Feature flag: none.

## Changes Included

- Updates `src/lib/auth/source-access-policy.ts` so same-tenant canonical/proof Source admin shortcuts set exact financial visibility.
- Updates `src/lib/auth/__tests__/source-access-policy.test.ts` to prove same-tenant visibility and preserve cross-tenant denial.
- Adds this release record.

## QA / Validation

- PASS: `npx jest src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`
- PASS: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`
- PASS: `npx eslint src/lib/auth/source-access-policy.ts src/lib/auth/__tests__/source-access-policy.test.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PENDING: `npm run release:check`
- PENDING: GitHub PR checks.
- PENDING: ACA runtime invariant and signed-in Source Optimize aVa proof after merge.

## Rollout Plan

Merge through PR to `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. No manual Container App mutation is approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending post-merge deploy evidence.
- ACA runtime invariant: required before live claim.
- Worker image invariant: required before live claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Optimize Contract aVa answer for a governed contract must show page-visible governed values without raw artifact markers or restricted-value placeholders.

## Rollback Plan

Revert the policy change PR. The Source page will continue to render governed values, but aVa will again redact exact financial values for this proof/admin account path.

## Audit Evidence

- PR URL after opening.
- Local validation command output.
- GitHub PR checks.
- ACA deploy evidence artifact after merge.
- Signed-in browser proof after deploy.

## Known Gaps

None known for this policy alignment. This does not change ordinary tenant membership financial visibility rules.
