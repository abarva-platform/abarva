# 2026-05-31-corpus-codex-wave-a — Codex Wave A Genome Patterns

## Release ID

`2026-05-31-corpus-codex-wave-a`

## Status

`candidate`

## Plain-English Summary

Adds 600 authored genome patterns across banking operational and liquidity risk, medtech SaMD/cyber/supply-chain/commercial operations, and healthcare pharmacy/care-transitions/clinical-quality/infection-prevention domains.

## Layer Impact

`intelligence-lane`: Adds vertical pattern depth for Sentinel and PatternOps coverage reporting.

`moves-lane`: Adds failure modes and remediation paths that Nexus can later use to shape Moves in banking, medtech, and healthcare.

`source-lane`: Adds sourcing and vendor-control implications in operational risk, cybersecurity, supply chain, pharmacy automation, and commercial operations patterns.

## Client Applicability

- All clients: no direct runtime behavior change until the seed files are loaded.
- Specific clients: First Capital, Northstar Clinical Technologies, and Meridian Health gain authored corpus depth after load.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom16-operational-risk-part1.ts`
- `src/scripts/seed/seed-banking-dom17-liquidity-risk-part1.ts`
- `src/scripts/seed/seed-medtech-dom04-samd-part7.ts`
- `src/scripts/seed/seed-medtech-dom05-cybersecurity-part6.ts`
- `src/scripts/seed/seed-medtech-dom08-supply-chain-part6.ts`
- `src/scripts/seed/seed-medtech-dom11-sales-hcp-part5.ts`
- `src/scripts/seed/seed-healthcare-dom08-pharmacy-services-part1.ts`
- `src/scripts/seed/seed-healthcare-dom09-care-transitions-part1.ts`
- `src/scripts/seed/seed-healthcare-dom10-clinical-quality-part1.ts`
- `src/scripts/seed/seed-healthcare-dom11-infection-control-part1.ts`

## QA / Validation

- PASS — per-file `npx tsx scripts/corpus/load-authored-genome-seeds.ts --parse-only src/scripts/seed/<file>.ts`
- PASS — batch `npx tsx scripts/corpus/load-authored-genome-seeds.ts --parse-only` across all 10 files
- PASS — `npx eslint` across all 10 seed files
- PASS — `git diff --check origin/main..HEAD`
- PENDING — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`, then run the durable corpus loader against these 10 files in the normal corpus loading lane.

## Rollback Plan

Revert this PR to remove the 10 authored seed files and release record; no database rollback is required unless the seed files have already been loaded.

## Audit Evidence

Loader parse-only output confirms 10 files and 600 parsed patterns with source keys `first-capital`, `northstar-clinical`, and `meridian-health`.

## Known Gaps

This PR only authors Wave A seed files and does not load them into the database or run the post-load PatternOps realignment.
