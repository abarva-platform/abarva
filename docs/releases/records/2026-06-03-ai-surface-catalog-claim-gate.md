# 2026-06-03-ai-surface-catalog-claim-gate - AI Surface Catalog Claim Gate

## Release ID

`2026-06-03-ai-surface-catalog-claim-gate`

## Status

`candidate`

## Plain-English Summary

Strengthens the AI surface control CI gate so it reads the legal AI catalogs as
truth sources. Any legal catalog row that claims a completed control now must be
tracked in `docs/security/ai-surface-control-catalog.json` as either:

- `covered`, linked to a machine-verified surface/control with code-token
  evidence, or
- `deferred`, with a concrete reason explaining why the claim is not yet
  machine-covered.

This does not mark T250 complete. It prevents silent catalog drift while the
remaining partial surfaces are finished.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: governance, CI, responsible-AI regression control.
- Runtime impact: none. This changes CI/catalog validation only.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: none.
- Internal only: AbarVa release governance and pilot-readiness enforcement.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/audit/ai-surface-control-catalog.mjs` now parses:
  - `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
  - `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/security/ai-surface-control-catalog.json` now includes:
  - additional machine-verified surfaces, and
  - `catalogClaimCoverage` entries for every current completed legal-catalog
    claim.

## QA / Validation

- Pass: `node scripts/audit/ai-surface-control-catalog.mjs`
- Pass: `npx eslint scripts/audit/ai-surface-control-catalog.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The existing `AI Surface Control Catalog` GitHub Actions gate
will run the stronger verifier on every PR and push to main.

## Rollback Plan

Revert this PR. The CI gate returns to validating only machine-catalog code
evidence and stops checking legal-catalog claim coverage.

## Audit Evidence

- This release record.
- Local verifier output.
- PR checks from the AI Surface Control Catalog workflow.

## Known Gaps

T250 remains `In progress`: deferred catalog claims still need durable,
machine-pinned coverage before the full audit-catalog standard is complete.
