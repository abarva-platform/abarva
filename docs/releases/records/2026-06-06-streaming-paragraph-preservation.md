# 2026-06-06-streaming-paragraph-preservation — Streaming Paragraph Preservation

## Release ID

`2026-06-06-streaming-paragraph-preservation`

## Status

`candidate`

## Plain-English Summary

Ask Intelligence now preserves paragraph breaks while streaming answers to the browser. The previous chunking helper split text with a regex that dropped newline characters, so sectioned answers could still appear as one dense block even after server-side formatting inserted blank lines.

## Layer Impact

- `global-control-lane`: Shared Ask Intelligence streaming behavior changes for all clients.
- `client-data-lane`: No tenant data, loader, schema, or data-plane change.

## Client Applicability

- All clients: Yes, because Ask Intelligence streaming is shared.
- Specific clients: Meridian/PHS is the live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaces the Ask text chunking regex with a character-preserving chunker that keeps whitespace and newline characters.
- Adds regression coverage proving paragraph breaks round-trip through streaming chunk reconstruction.

## QA / Validation

- BLOCKED: Initial focused Jest run exposed a stale word-fusion expectation that assumed the prior regex chunk boundary.
- PASS: Focused ESLint completed cleanly.
- PASS: `git diff --check` completed cleanly.
- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand` passed 2 suites / 28 tests after expectation update.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed.
- NOT-RUN: Production Meridian response-shape proof after merge and deploy.

## Rollout Plan

Merge to main and deploy to Vercel production. No migration or data reload is required.

## Rollback Plan

Revert the PR or redeploy the previous production commit. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Production proof target: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-response-style-postdeploy/`.

## Known Gaps

This fixes transport of paragraph breaks. It does not change the underlying Meridian profile facts, evidence depth, or source data.
