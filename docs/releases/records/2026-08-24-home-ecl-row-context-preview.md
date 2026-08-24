# 2026-08-24-home-ecl-row-context-preview — Home ECL Row Context Preview

## Release ID

`2026-08-24-home-ecl-row-context-preview`

## Status

`candidate`

## Plain-English Summary

Improves the non-default Home ECL preview by exposing loaded projection rows as deterministic context facts for the Current State and Browse the Data views. The preview now reflects the dense ECL record in the evidence browser instead of showing only a small set of summary signals.

## Layer Impact

- `global-control-lane`: updates read-only Home preview presentation logic behind a non-default provider query parameter.
- Layer 4 products: improves how existing `ecl_projection.home_enterprise_landscape` rows are shaped for Home views; no source, adapter, canonical, schema, or data-plane mutation.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: tenants with loaded ECL Home projections can use the provider-flag preview.
- Internal only: provider-flag QA and proof.
- Public/demo only: no.
- Feature flag: route query parameter `provider=ecl_projection_db`.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`

## QA / Validation

- `pass`: focused Jest coverage for row-level context facts.
- `pass`: ESLint on changed files.
- `pass`: TypeScript compile.
- `pass`: release check.
- `not-run`: signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through PR, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, verify the ACA runtime invariant, then re-check the non-default Home ECL preview in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned ACA deploy workflow.
- Approved image digest: populated by deployment evidence after merge.
- ACA runtime invariant: required before live proof.
- Worker image invariant: handled by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or stop using the non-default provider query parameter. The default Home route remains unchanged.

## Audit Evidence

To be attached after PR, CI, deploy and browser proof complete.

## Known Gaps

This does not redesign the full Home visual system or regenerate authored executive narrative. It makes the ECL-backed evidence views denser and more truthful while leaving default-provider cutover as a separate decision.
