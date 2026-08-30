# 2026-08-30-home-tier1-visible-language — Home Tier 1 Visible Language

## Release ID

`2026-08-30-home-tier1-visible-language`

## Status

`candidate`

## Plain-English Summary

Home preview keeps the new executive story shell, but removes build-system vocabulary from the CXO-visible page. Status labels, evidence wording, and tier labels now read as business language instead of implementation language.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Home preview visible copy is cleaned so the Tier 1 story does not expose internal narrative-build or data-plane terms to executive users.

## Client Applicability

- All clients: Home preview visible language.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Home Tier 1 story sanitizer now converts implementation terms such as underscore tier labels and packet/register wording into executive-readable language.
- Home story rail displays terminal states as `ready`, `held`, or `deferred` rather than raw internal state values.
- The rail footer labels the evidence basis without using build-process language.

## QA / Validation

- PASS: `npm test -- src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS: `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required for live rollout.
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This is a copy-only product-surface change with no database migration.

## Audit Evidence

- PR, deploy workflow, live ACA invariant, and signed-in Home proof to be added after merge and deploy.
- Local focused test and ESLint commands listed above.

## Known Gaps

- This release does not regenerate all Home chapter narratives. It prevents internal build vocabulary from appearing on the new Tier 1 executive story surface.
