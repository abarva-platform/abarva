# 2026-05-24-p18-apex-sentinel-canonical-harness — Apex Sentinel Canonical Verification

## Release ID

`2026-05-24-p18-apex-sentinel-canonical-harness`

## Status

`candidate`

## Plain-English Summary

Adds the Packet 18 canonical Sentinel verifier promised by the Apex synthetic data pack. The verifier reads the Apex pack and scores all 12 canonical Sentinel questions against the expected evidence, trap, and answer-shape requirements.

## Layer Impact

- `corpus-knowledge-lane`: verifies that the Apex substrate can support the canonical Sentinel questions.
- `agent-quality-lane`: adds a deterministic scoring harness for Sentinel-shaped answers.
- `ops-release-lane`: adds `npm run verify:apex-sentinel-canonical`.

## Client Applicability

- All clients: none.
- Specific clients: Apex Retail synthetic/demo tenant only.
- Internal only: Packet 18 QA and demo-readiness verification.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `package.json`
- `scripts/verify/apex-sentinel-canonical.mjs`

## QA / Validation

- pass: `npm run verify:apex-sentinel-canonical`
- pass: `npm run verify:apex-data-pack`
- pass: `npm run db:verify:p18-apex-pack`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge after CI. No migration is required. Run `npm run verify:apex-sentinel-canonical` with Packet 18 QA.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL after publication.
- CI checks for the PR.
- Verifier output showing 12/12 canonical questions passing, all tenant-grounded, and weighted average above the 0.75 threshold.

## Known Gaps

- This is a deterministic canonical harness. It validates the expected answer shape from the Apex substrate but does not yet exercise the live Sentinel chat UI/browser path.
