# 2026-10-05-source-market-candidate-research - Evidence-linked market longlist

## Release ID

`2026-10-05-source-market-candidate-research`

## Status

`candidate`

## Plain-English Summary

Adds a sourced, explicitly unreviewed market-candidate longlist for Source
archetypes. It does not approve a supplier, create a contact, send a message,
or change a product page.

## Layer Impact

Release lane: `internal-admin`. Layer 1 research input only. There is no
Layer 2 adapter, Layer 3 canonical write, or Layer 4 product projection in
this release.

## Client Applicability

- All clients: none until a separate reviewed intake and serving decision.
- Specific clients: none.
- Internal only: research review and planning.
- Public/demo only: no runtime change.
- Feature flag: none.

## Changes Included

- A source-linked CSV with five candidate fits per category-routed Source
  archetype and a declared incumbent-specific renewal exception.
- A fail-closed validator and negative tests run in CI.
- A README recording the identity, authority, contact, and load boundaries.

## QA / Validation

- `node --import tsx --test scripts/source/__tests__/market-candidate-research.test.mjs`: 5 tests passed, including mutated approval, contact, evidence, and identity cases.
- `node --import tsx scripts/source/validate-market-candidate-research.mjs`: pass, 50 fits across 10 category-routed archetypes.
- `npm run typecheck`: clean.
- `npm run release:check`: all 11 gates passed.
- `npx eslint scripts/source/validate-market-candidate-research.mjs scripts/source/__tests__/market-candidate-research.test.mjs`: clean.

## Rollout Plan

Merge the documentation/research pack. The repo-owned ACA main workflow may
deploy the commit as usual, but there is no runtime activation or data job.
Any future load requires a new dataset manifest, exact-version approval,
operator job, and private readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: unchanged; if main deploys, the workflow selects it.
- ACA runtime invariant: no runtime claim is made from this research pack.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this unserved research pack; required
  before any future product serving claim.

## Rollback Plan

Revert this research pack and validator in a PR. No database rollback is
needed because this release writes no tenant rows.

## Audit Evidence

The CSV carries provider-owned source URLs per fit. The validator emits its
SHA-256 and explicit no-write authority flags. CI runs the negative tests.

## Known Gaps

Company identity and suitability are not buyer-reviewed; no canonical
supplier/contact writes or signed-in product proof exist for this longlist.
