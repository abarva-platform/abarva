# 2026-06-03-agent-paperclip-sensitive-upload-guard - Agent Paperclip Sensitive Upload Guard

## Release ID

`2026-06-03-agent-paperclip-sensitive-upload-guard`

## Status

`candidate`

## Plain-English Summary

This release closes the agent paperclip upload bypass for backlog rows T191 and
T197. The shared AgentDock paperclip route now runs the same sensitive-upload
guard used by other upload surfaces before object storage, text extraction, or
metadata persistence. Suspected PHI/PII is rejected with the existing
`sensitive_data_quarantined` response instead of being stored or parsed.

## Layer Impact

- `global-control-lane`: Updates the shared `/api/v1/agent/attachments`
  control-plane route used by agent paperclip uploads.
- Client data-plane protection: Stops suspected PHI/PII before blob upload,
  parser execution, row persistence, indexing, or evidence use.

## Client Applicability

- All clients: Applies to the shared agent paperclip upload endpoint.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/agent/attachments/route.ts`
- `src/app/api/v1/agent/attachments/__tests__/route.test.ts`
- `docs/releases/records/2026-06-03-agent-paperclip-sensitive-upload-guard.md`

## QA / Validation

- Pass: `npx jest src/app/api/v1/agent/attachments/__tests__/route.test.ts --runInBand`
- Pass: `npx eslint src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge to `main`. The guard is active immediately on the shared paperclip
endpoint after the application deploys.

## Rollback Plan

Revert this PR to remove the route guard and tests. Rollback reopens the
paperclip bypass risk, so it should be used only if the route blocks valid
non-sensitive uploads unexpectedly.

## Audit Evidence

- Pull request for this release.
- GitHub CI checks for the pull request.
- Focused local route test output listed in QA / Validation.
- Tracker rows T191 and T197 after merge.

## Known Gaps

This release does not implement Azure Document Intelligence, the full private
data-plane loader, or OCR for image attachments. It also does not change
program attachment uploads, Source artifact uploads, or admin context-layer
uploads, which already call the shared sensitive-upload guard separately.
