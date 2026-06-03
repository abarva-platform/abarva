# 2026-06-03-agent-attachment-parse-economics — Agent Attachment Parse Economics Metadata

## Release ID

`2026-06-03-agent-attachment-parse-economics`

## Status

`candidate`

## Plain-English Summary

Agent attachment uploads now emit deterministic document-economics metadata:
document key, content hash, parser/provider, page/table/byte counts, parse-cost
estimate, and cost basis. This gives the customer-admin document economics
dashboard a consistent upstream contract for parser/upload jobs instead of
waiting for every caller to invent its own metadata shape.

## Layer Impact

- `global-control-lane`: Updates shared AgentDock attachment parsing helpers and
  the upload API response contract. No database migration or persistent ledger
  write is included in this slice.

## Client Applicability

- All clients: Applies to all shared AgentDock upload flows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2961.
- Commit: final merge commit pending.
- `src/lib/agent/attachments.ts` builds parse economics metadata.
- `src/app/api/v1/agent/attachments/route.ts` exposes the metadata under
  `parse_metadata`.
- `src/lib/agent/__tests__/attachments.test.ts` and
  `src/app/api/v1/agent/attachments/__tests__/route.test.ts` cover the contract.

## QA / Validation

- Passed locally:
  `npx jest src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts --runInBand`.
- Passed locally:
  `npx eslint src/lib/agent/attachments.ts src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts`.
- Passed locally:
  `npx tsc --noEmit --pretty false`.
- Passed locally:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected GitHub PR flow. Normal app deployment exposes the
metadata to upload callers.

## Rollback Plan

Revert the PR. No data rollback is required because this slice adds no schema
migration and writes no durable parse-economics rows.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2961.
- Local QA output: focused Jest, ESLint, TypeScript, release control, and diff
  whitespace checks passed before PR.
- CI checks: Pending.

## Known Gaps

- The current `agent_attachment` write seam has no parse-metadata column, so
  this slice emits response metadata but does not persist it to the attachment
  row.
- AI egress rows still need document-bound chat metadata for the full
  parse-cost plus chat-cost rollup to be complete.
