# 2026-06-01-license-sbom-compliance - License And SBOM Compliance

## Release ID

`2026-06-01-license-sbom-compliance`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic dependency license compliance check and SBOM generator so AbarVa can prove what npm packages ship with the app and which licenses require review before the pilot.

## Layer Impact

- Release lane: `internal-admin`.
- `internal-admin`: adds engineering governance scripts, CI, and runbook documentation. No runtime app behavior changes.

## Client Applicability

- All clients: no runtime impact.
- Specific clients: none.
- Internal only: engineering and release governance.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/compliance/check-licenses.mjs`.
- Adds `scripts/compliance/generate-sbom.mjs`.
- Adds `docs/compliance/license-policy.json`.
- Adds `docs/runbooks/license-sbom-compliance.md`.
- Adds `.github/workflows/license-sbom-compliance.yml`.
- Adds npm scripts for license checks, SBOM checks, SBOM generation, and the combined supply-chain compliance gate.

## QA / Validation

- Passed: `npm run license:check`
- Passed: `npm run sbom:check`
- Passed: `npm run sbom:generate`
- Passed: `npm run compliance:supply-chain`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. The new GitHub Action runs on pull requests that touch dependency, compliance, workflow, or compliance-script files. Operators can generate an SBOM locally with `npm run sbom:generate`.

## Rollback Plan

Revert the PR to remove the scripts, policy, workflow, npm commands, and runbook. No database or runtime rollback is required.

## Audit Evidence

- Pull request for this branch.
- CI workflow `License and SBOM Compliance`.
- Generated CI artifacts under `license-sbom-compliance`.
- Local validation commands listed above.

## Known Gaps

The first policy includes dated exceptions for packages whose lockfile metadata is missing or non-SPDX. Those exceptions should be reviewed before direct dependency expansion or by the listed review date.
