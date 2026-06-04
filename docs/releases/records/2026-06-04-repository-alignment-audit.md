# 2026-06-04-repository-alignment-audit — Canonical GitHub Repository Alignment

## Release ID

`2026-06-04-repository-alignment-audit`

## Status

`candidate`

## Plain-English Summary

Updates active AbarVa code and security documentation so repo-facing links, package metadata, and seeded GitHub connector data point at the canonical `abarva-platform/abarva` repository instead of legacy personal or placeholder repository names.

## Layer Impact

- `internal-admin`: admin build-progress and setup connector surfaces now link to the canonical GitHub repo.
- `public-demo`: buyer/security-facing Infosec Accelerator text now names the canonical organization repository.
- `global-control-lane`: package metadata and a new verifier make the canonical repo alignment check repeatable.

## Client Applicability

- All clients: receive corrected repo links anywhere the affected surfaces are visible.
- Specific clients: none.
- Internal only: GitHub setup connector seed and repository-alignment verifier.
- Public/demo only: Infosec Accelerator source-of-truth text.
- Feature flag: none.

## Changes Included

- Updated active PR links from legacy `anandsundaram-hash/abarva` and placeholder `anthropic/nexus` targets to `abarva-platform/abarva`.
- Updated seeded GitHub API endpoint from `abarva/nexus` to `abarva-platform/abarva`.
- Added `repository` and `bugs` metadata to `package.json`.
- Added `scripts/governance/verify-repository-alignment.mjs` and `npm run repo:alignment:verify`.

## QA / Validation

- PASS: `npm run repo:alignment:verify`
- PASS: `node --check scripts/governance/verify-repository-alignment.mjs`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge to main through the protected PR flow. Runtime surfaces pick up the corrected links on the next normal deployment.

## Rollback Plan

Revert this PR to restore prior link targets and remove the verifier/package metadata changes.

## Audit Evidence

- This release record.
- Repository alignment verifier output.
- PR diff and CI checks.

## Known Gaps

Historical archives and old release records may still cite legacy PR URLs as historical evidence. This change intentionally focuses on active code, active docs, package metadata, and setup/security surfaces.
