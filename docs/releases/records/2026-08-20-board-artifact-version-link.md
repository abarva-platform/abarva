# 2026-08-20-board-artifact-version-link — Board Artifact Version Links

## Release ID

`2026-08-20-board-artifact-version-link`

## Status

`candidate`

## Plain-English Summary

Regenerated Moves board-grade artifacts now mark the prior generated version as superseded while preserving the prior row and its content. This makes the artifact history linear and reviewable without turning downloaded documents into the source of truth.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection: generated Moves artifacts now carry the same current-version link behavior as the shared generated-artifact path. This does not change tenant intake, adapters, canonical records, graph data, runtime routing, or document upload workflow.

## Client Applicability

- All clients: Applies to shared Moves board-grade artifact persistence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing board-grade Moves generation/persistence path; this record does not activate new routing.

## Changes Included

- Store a canonical `deliverableTypeKey` for board-grade generated Move artifacts.
- Mark prior active versions of the same client, Move, and board artifact as superseded after regeneration.
- Add regression coverage proving the prior version remains intact and linked to the newer version.

## QA / Validation

- `npx jest src/lib/artifacts/__tests__/repository.test.ts --runInBand --silent` — passed.
- `npx eslint src/lib/artifacts/repository.ts src/lib/artifacts/__tests__/repository.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned main deploy workflow may rebuild and deploy the application image after merge. No database migration, tenant data load, registry activation, feature flag change, or manual runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Allowed after merge.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned main deploy workflow if it runs.
- ACA runtime invariant: Required only if the main deploy workflow deploys a new image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Basic route/invariant proof only if the repo-owned deploy runs; no new product workflow activation is claimed by this record.

## Rollback Plan

Revert the PR. Existing generated artifacts remain readable. The rollback only removes automatic supersession for newly generated board-grade artifacts.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/6551
- CI and deploy evidence: to be added after PR validation/merge if applicable.

## Known Gaps

This does not implement DOCX review upload, human proposed-change acceptance, or artifact approval workflow. It only links regenerated board-grade artifact versions.
