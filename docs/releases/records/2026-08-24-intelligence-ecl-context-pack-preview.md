# 2026-08-24-intelligence-ecl-context-pack-preview — Intelligence ECL Context Pack Preview

## Release ID

`2026-08-24-intelligence-ecl-context-pack-preview`

## Status

`candidate`

## Plain-English Summary

Adds a non-default Intelligence preview panel that reads the governed ECL context-pack projection when the route is opened with `provider=ecl_projection_db`. The default Intelligence experience is not repointed; this only proves that the ECL projection has rows, retrieval states, access classes, citations and explicit gaps.

## Layer Impact

- `global-control-lane`: adds a read-only Intelligence projection preview panel behind a non-default provider query parameter.
- Layer 4 products: adds read-only consumption of `ecl_projection.intelligence_context_pack`; no schema or data mutation.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: dense ECL preview is expected for tenants whose ECL context pack has been loaded.
- Internal only: provider-flag proof and QA.
- Public/demo only: no.
- Feature flag: route query parameter `provider=ecl_projection_db`.

## Changes Included

- `src/lib/intelligence/eclContextPackPreview.ts`
- `src/app/(maestro)/intelligence/page.tsx`
- `src/lib/intelligence/__tests__/eclContextPackPreview.test.ts`

## QA / Validation

- `pass`: focused Jest coverage for populated rows and empty-projection loud failure.
- `pass`: ESLint on changed files.
- `pass`: TypeScript compile.
- `pass`: release check.
- `pending`: signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through PR, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, then verify the non-default route in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned ACA deploy workflow.
- Approved image digest: populated by deployment evidence after merge.
- ACA runtime invariant: required before live proof.
- Worker image invariant: handled by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or stop using the non-default provider query parameter. The default Intelligence path is unchanged.

## Audit Evidence

To be attached after PR, CI, deploy and browser proof complete.

## Known Gaps

This is not a full Intelligence rewrite. The panel proves the ECL context-pack projection exists and is readable, but it does not replace the authored advisory surface or the live ask/retrieval pipeline.
