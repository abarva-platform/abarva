# 2026-06-04-ai-liability-live-evidence-matrix — AI Liability Live Evidence Matrix

## Release ID

`2026-06-04-ai-liability-live-evidence-matrix`

## Status

`candidate`

## Plain-English Summary

Adds an AI Liability live evidence matrix for the remaining open AI Liability Defense rows. It separates live product E2E proof, durable evidence/export proof, source-binding proof, and counsel/insurance proof so the tracker can stay truthful about what Codex can advance versus what requires Anand, counsel, broker, carrier, or client-side evidence.

## Layer Impact

- `internal-admin`: Adds operator-facing closure discipline and a verifier for AI Liability Defense evidence.
- `global-control-lane`: Documents evidence expectations for shared AI labels, citations, approval gates, audit exports, contract allocation, and insurance confirmation. No runtime behavior changes.

## Client Applicability

- All clients: The evidence model applies to pilot-facing AI liability controls.
- Specific clients: None.
- Internal only: The matrix and verifier are for AbarVa operators and counsel/broker coordination.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/legal/AI_LIABILITY_LIVE_EVIDENCE_MATRIX_2026-06-04.md`
- `scripts/ai-liability/verify-live-evidence-matrix.mjs`
- `docs/releases/records/2026-06-04-ai-liability-live-evidence-matrix.md`

## QA / Validation

- Pass: `node scripts/ai-liability/verify-live-evidence-matrix.mjs`
- Pass: `node --check scripts/ai-liability/verify-live-evidence-matrix.mjs`
- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR and merge queue. No runtime rollout, migration, data load, feature flag, or production deploy is required.

## Rollback Plan

Revert the PR if the evidence model conflicts with the active AI Liability Defense tracker or counsel workflow. No production rollback is required because this is documentation and verifier only.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Local verifier output from `node scripts/ai-liability/verify-live-evidence-matrix.mjs`.
- Release check output from `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

This matrix does not close the AI Liability Defense rows by itself. Done still requires live product E2E proof, durable export/review evidence, source-binding coverage, counsel signoff, and insurance confirmation where applicable.
