# 2026-06-03-agent-attachment-parse-metadata-persistence — Agent Attachment Parse Metadata Persistence

## Release ID

`2026-06-03-agent-attachment-parse-metadata-persistence`

## Status

`candidate`

## Plain-English Summary

This change persists the same parse-economics packet returned by the AgentDock
upload API onto the `agent_attachment` row. That gives the cost-per-document
dashboard/reporting work a durable source for document hash, parser/provider,
page/table counts, parse cost estimate, small-document routing, and raw-mode
escape metadata.

## Layer Impact

- `client-data-lane`: Adds an `agent_attachment.parse_metadata` JSONB column and
  indexes for document key and parser provider.
- `global-control-lane`: Extends the shared AgentDock upload route and
  attachment write adapter so every supported data plane receives the parse
  metadata packet.

## Client Applicability

- All clients: Applies to future AgentDock uploads once the migration is applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2963.
- Commit: final merge commit pending.
- Migration:
  `supabase/migrations/20260603232500_agent_attachment_parse_metadata.sql`.
- Route: `src/app/api/v1/agent/attachments/route.ts`.
- Write adapter:
  `src/lib/data-plane/write-adapters/attachmentsWriteAdapter.ts`.
- Tests:
  `src/app/api/v1/agent/attachments/__tests__/route.test.ts` and
  `src/lib/data-plane/write-adapters/__tests__/attachments-write-adapter.test.ts`.

## QA / Validation

- Initial local validation was blocked before `npm ci` because the fresh
  worktree had no `node_modules`; after installing dependencies, passed
  locally:
  `npx jest src/app/api/v1/agent/attachments/__tests__/route.test.ts src/lib/data-plane/write-adapters/__tests__/attachments-write-adapter.test.ts --runInBand`.
- Initial local validation was blocked before `npm ci`; after installing
  dependencies, passed locally:
  `npx eslint src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/lib/data-plane/write-adapters/attachmentsWriteAdapter.ts src/lib/data-plane/write-adapters/__tests__/attachments-write-adapter.test.ts`.
- Initial local validation was blocked before `npm ci`; after installing
  dependencies, passed locally:
  `npx tsc --noEmit --pretty false`.
- Failed before this evidence update, then passed locally:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected PR flow, then apply the migration in the target data
plane before expecting production upload rows to carry `parse_metadata`.

## Rollback Plan

Revert the PR if not yet deployed. After migration deployment, a rollback should
stop writing `parse_metadata` first; dropping the JSONB column is only safe after
confirming no dashboard/reporting path depends on it.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2963.
- Local QA output: Focused Jest, ESLint, TypeScript, release check, and
  whitespace check passed before PR after installing worktree dependencies.
- CI checks: Pending.

## Known Gaps

- This does not yet build the full customer-facing economics dashboard or weekly
  report.
- Chat-cost and cache-hit economics still need to be joined from AI egress audit
  records in a follow-on slice.
