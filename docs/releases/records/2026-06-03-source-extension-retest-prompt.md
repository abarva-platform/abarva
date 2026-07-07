# 2026-06-03-source-extension-retest-prompt — Source Extension Retest Prompt

## Release ID

`2026-06-03-source-extension-retest-prompt`

## Status

`candidate`

## Plain-English Summary

Adds a paste-ready Claude-in-Chrome retest prompt for the Source module after the latest Source fixes. The prompt tells an external browser automation agent exactly what to test, what evidence to capture, and how to decide GO, CONDITIONAL GO, or NO-GO.

## Layer Impact

- internal-admin: Gives operators a repeatable final retest script for Source production QA.
- global-control-lane: Documents the expected Source validation path for all tenants without changing runtime behavior.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: The retest prompt focuses on Apex Retail as the primary Source validation tenant.
- Internal only: Intended for AbarVa QA/operator use.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/build/codex-handoff/2026-06-03-CLAUDE_EXTENSION_SOURCE_RETEST_PROMPT.md`.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime deploy behavior changes are expected, but Vercel production deploy and normal post-deploy checks still run because this repository deploys from main.

## Rollback Plan

Revert the PR to remove the retest prompt and release record. No database, configuration, or feature-flag rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2869
- Retest prompt path: `docs/build/codex-handoff/2026-06-03-CLAUDE_EXTENSION_SOURCE_RETEST_PROMPT.md`

## Known Gaps

The prompt is an operator artifact only. It does not itself execute the retest or certify the Source module.
