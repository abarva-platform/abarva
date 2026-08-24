# 2026-08-24-intelligence-ecl-preview-summary-copy — Intelligence ECL Preview Summary Copy

## Release ID

`2026-08-24-intelligence-ecl-preview-summary-copy`

## Status

`candidate`

## Plain-English Summary

Improves the non-default Intelligence ECL preview so rows without authored payload summaries render deterministic count-and-state summaries instead of repeated placeholder copy. The change keeps the same ECL projection source and does not change default Intelligence behavior.

## Layer Impact

- `global-control-lane`: updates read-only presentation logic for a non-default provider preview.
- Layer 4 products: improves display of existing `ecl_projection.intelligence_context_pack` rows; no Layer 1, Layer 2, or Layer 3 mutation.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: tenants with loaded ECL context-pack projections can use the provider-flag preview.
- Internal only: provider-flag QA and proof.
- Public/demo only: no.
- Feature flag: route query parameter `provider=ecl_projection_db`.

## Changes Included

- `src/lib/intelligence/eclContextPackPreview.ts`
- `src/lib/intelligence/__tests__/eclContextPackPreview.test.ts`

## QA / Validation

- `pass`: focused Jest coverage for deterministic fallback summaries.
- `pass`: ESLint on changed files.
- `pass`: TypeScript compile.
- `pass`: release check.
- `not-run`: signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through PR, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, verify the ACA runtime invariant, then re-check the non-default Intelligence ECL preview in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned ACA deploy workflow.
- Approved image digest: populated by deployment evidence after merge.
- ACA runtime invariant: required before live proof.
- Worker image invariant: handled by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or stop using the non-default provider query parameter. The default Intelligence route remains unchanged.

## Audit Evidence

To be attached after PR, CI, deploy and browser proof complete.

## Known Gaps

This does not index context packs or create new Intelligence facts. Rows can still truthfully show `not_indexed` or warning quality states when the underlying ECL projection says so.
