# 2026-08-15-source-rich-proposal-fact-extraction — Source Rich Proposal Fact Extraction

## Release ID

`2026-08-15-source-rich-proposal-fact-extraction`

## Status

`candidate`

## Plain-English Summary

Expands Source vendor-proposal ingestion so uploaded proposal packages can produce governed
candidate facts for the commercial and technical evidence a sourcing team actually needs: scope,
delivery/support model, solution architecture, integration/data/AI architecture, automation,
accelerators, staffing, transition, security, assumptions, exceptions, evidence references, and
pricing. These rows are still candidates until a human accepts them; the change does not turn parsed
proposal text into authoritative scoring or value by itself.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 / source adapters: expands the existing vendor-proposal text extractor that feeds the
  governed proposal-fact table.
- Layer 4 / Source product: strengthens the Source vendor-response ingest path and proposal
  intelligence readiness model. It does not change workflow state, tenant data, or calculation
  logic.

## Client Applicability

- All clients: yes, for Source events that ingest vendor proposal artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/vendor-proposals/extract-vendor-proposal-facts.ts`
- `src/lib/source/vendor-proposals/__tests__/extract-vendor-proposal-facts.test.ts`
- `src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/ingest/__tests__/route.test.ts`
- `src/lib/source/proposal-intelligence/parser.ts`
- `src/lib/source/proposal-intelligence/types.ts`
- `src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/vendor-proposals/__tests__/extract-vendor-proposal-facts.test.ts 'src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/ingest/__tests__/route.test.ts' src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts --runInBand`
  (49/49 tests passed).
- PASS: targeted ESLint over the changed Source/aVa files.
- PASS: TypeScript project check with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --skipLibCheck --project tsconfig.json`.
- PENDING: signed-in upload smoke proof against a Source event with post-upload readback from
  `source_vendor_proposal_facts`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow rolls the application code
forward. No migration is required because `source_vendor_proposal_facts` already uses open fact and
section keys.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming upload-to-fact persistence is live-proven.

## Rollback Plan

Revert the PR. Existing proposal-fact rows remain append-only evidence candidates; no destructive
data rollback is required.

## Audit Evidence

PR, targeted Jest output, lint/typecheck output, release-control output, ACA deploy run, and
post-deploy signed-in upload/readback proof.

## Known Gaps

This closes the parser vocabulary and unit-route proof. It does not by itself complete the live
browser upload and database readback proof for a full proposal document.
