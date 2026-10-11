# 2026-10-11 Tower Candidate Promotion Control

## Release ID

`2026-10-11-tower-candidate-promotion-control`

## Status

`candidate`

## Plain-English Summary

Add a guarded way to prepare a new Tower assessment, check its nine physical views against the registered source files, and switch the active assessment only after review. A candidate without an independently staged, passing physical receipt cannot be promoted. Missing budget and claimable-value figures stay unknown.

## Layer Impact

Release lane: `global-control-lane` for the shared selector and operator controls. A later tenant-specific stage and promotion uses `client-data-lane` with its own proof and approval.

- **Layer 1 client intake:** registered source files are checked by exact SHA-256; the code does not alter them.
- **Layer 2 source adapters and Layer 3 canonical model:** no new adapter or canonical write is included. A separate governed build is required before promotion.
- **Layer 4 products:** the operator checks a separately staged registered-intake projection and changes the tenant's declared active pointer only after all checks pass. A narrow selector migration prevents a tenant with lifecycle history from falling back to ranked rows, while preserving fallback for tenants with no lifecycle declaration.

## Client Applicability

- All clients: the lifecycle selector safety rule applies where Tower lifecycle declarations exist.
- Specific clients: a promotion is limited to the exact active tenant named in the registry and in the operator proof.
- Internal only: preflight, promotion, and rollback commands are operator actions.
- Public/demo only: repository-backed intake hash verification applies to the registered synthetic demo path. Private client sources require the private data-plane build and proof contract.
- Feature flag: none.

## Changes Included

- `scripts/tower/operate-registered-intake-candidate.mjs` adds read-only preflight and guarded promotion/rollback.
- `supabase/migrations/20261011210000_tower_active_lifecycle_fail_closed.sql` closes ranking fallback after lifecycle adoption.
- `src/lib/governance/dataset-manifest.ts` adds Tower as an explicitly approved serving surface, reusing exact-version load and serving approvals.
- `docs/runbooks/tower-registered-candidate-promotion.md` records operator gates and the current review-only boundary.

## QA / Validation

- Node tests cover candidate and physical-stage separation, source drift, receipt identity, nine page counts and fingerprints, unknown money claims, and selector fallback logic. Preflight also checks the staged canonical object count, source-file hashes, and projection manifests directly in the database.
- `node --check` and `git diff --check` passed locally.
- No database write, migration apply, candidate staging, or signed-in product proof is claimed by this release candidate.

## Rollout Plan

Merge through a protected-branch PR. The repo-owned ACA main workflow builds and deploys a digest-pinned image. Apply the narrow migration through the approved database migration lane, compare active keys before and after, then run read-only preflight. A data-build job must produce a physical registered-intake stage and receipt before any promotion. Promotion requires named, exact-version manifest load and Tower serving approvals, proof hashes, and a matching release-record reference; verify all nine serving views and signed-in tabs afterward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main deploy workflow after merge.
- ACA runtime invariant: template, 100% traffic revision, and required worker images must match before calling the code deployed.
- Worker image invariant: same approved digest as the web image.
- Feature/env flag update path: none.
- Live signed-in proof required: all affected Tower tabs after promotion.
- ACR build policy: the repo-owned workflow checks Premium registry SKU and uses Docker Buildx with GitHub Actions cache; this PR does not run an ad-hoc build or prune images.

## Rollback Plan

For a failed or misleading candidate, use the saved promotion proof and its original approval reference to restore the prior lifecycle row in one guarded transaction, after checking the prior nine page fingerprints. If the selector migration must be reverted, restore the previous function only through the approved migration lane and verify no staged rows can become visible.

## Audit Evidence

PR and local test output; migration replay; preflight proof with candidate and receipt hashes; ACA job run and private proof bundle; post-promotion serving readback; signed-in tab walkthrough. The latter evidence is pending.

## Known Gaps

The current registered-intake candidate is review-only and has no approved physical stage receipt. This release cannot perform a data reload by itself. No load or Tower serving approval is included in this PR.
