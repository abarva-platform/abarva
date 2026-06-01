# 2026-06-01-engineering-standards — Engineering Standards Docs

## Release ID

`2026-06-01-engineering-standards`

## Status

`candidate`

## Plain-English Summary

Adds engineering onboarding, test pyramid, and telemetry/observability standards so future backlog execution has a clearer operating model for setup, validation, and production signals.

## Layer Impact

- Internal admin: documents engineering practices for AbarVa operators and contributors.
- Governance: clarifies validation and telemetry expectations without changing runtime behavior.

## Client Applicability

- All clients: No direct runtime effect.
- Specific clients: None.
- Internal only: Engineering and release operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/runbooks/engineer-onboarding.md`
- `docs/standards/TEST_PYRAMID_POLICY.md`
- `docs/standards/TELEMETRY_OBSERVABILITY_STANDARD.md`
- `docs/releases/records/2026-06-01-engineering-standards.md`

## QA / Validation

- Pass: `git diff --check`
- Pass: `git diff --check origin/main..HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No production deploy, migration, feature flag, or client rollout is required because this is documentation-only.

## Rollback Plan

Revert the PR to remove the added docs and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2764
- Local validation output: `git diff --check origin/main..HEAD` passed.
- Local validation output: `npm run release:check -- --base origin/main --head HEAD` passed with no enforced release-relevant runtime files in this docs-only change.

## Known Gaps

This PR documents the standards only. It does not add coverage thresholds, Lighthouse CI, accessibility CI, or branch-protection settings.
