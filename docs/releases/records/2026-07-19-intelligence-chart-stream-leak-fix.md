# 2026-07-19-intelligence-chart-stream-leak-fix — Intelligence Chart Stream Leak Fix

## Release ID

`2026-07-19-intelligence-chart-stream-leak-fix`

## Status

`candidate`

## Plain-English Summary

The post-PR #5073 FS Demo 20-question audit passed follow-up quality, but one chart-heavy answer still leaked a raw `chart {"type":"horizontal-bar"...}` payload into the streamed answer text. The root cause was a chunk-boundary case in the structured fence stream filter: when a model delta ended with a bare `chart ` marker and the JSON payload arrived in the next delta, the marker could be emitted before the filter saw the payload. This release holds trailing structured markers across chunks so chart payloads stay available to the exhibit parser without reaching visible chat text.

## Layer Impact

- `global-control-lane`: Intelligence/aVa streaming display safety.
- `experience`: Prevents raw chart JSON markers from appearing in chat during chart/table/matrix answers.
- `safety`: No prompt or data-layer change. This only hardens display filtering for governed structured artifacts.

## Client Applicability

- All tenants using Intelligence/aVa chart, table, matrix, or follow-up structured artifacts.
- Primary audit tenant: FS Demo (`arcturus`).
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-fence-stream-filter.ts`
- `src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/answer/structured-fence-stream-filter.ts src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Not-run after deploy: rerun the FS Demo chart-heavy 2x2 prompt and the 20-question follow-up audit.

## Rollout Plan

1. Open PR from `codex/intelligence-chart-stream-leak-fix`.
2. Squash merge to `main` after checks.
3. Deploy through the repo-owned ACA main workflow.
4. Verify ACA runtime invariant and health.
5. Rerun the chart-heavy FS Demo 2x2 prompt and confirm no raw chart payload appears in streamed answer text.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the approved ACA main workflow. No data migration rollback is required.

## Audit Evidence

- Post-topic-lock audit: `/tmp/intelligence-fs-followup-quality-audit-20260719-post-topiclock-v2/report.md`
- Finding: 20/20 follow-up pass, average follow-up score 9.77/10, but Q02 had one raw chart payload leak in answer text.
- PR: pending.
- ACA deploy proof: pending.
- Post-deploy audit: pending.

## Known Gaps

- This release fixes stream filtering only. It does not change chart generation, chart rendering, or export rendering.
