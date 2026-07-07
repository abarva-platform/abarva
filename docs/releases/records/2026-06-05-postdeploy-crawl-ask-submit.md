# 2026-06-05-postdeploy-crawl-ask-submit — Postdeploy Crawl Ask Submit

## Release ID

`2026-06-05-postdeploy-crawl-ask-submit`

## Status

`candidate`

## Plain-English Summary

The production crawl now submits Sentinel Ask questions the same way a user does. Previously it filled the textarea and pressed Enter, which only inserted a newline and caused the crawl to score the page shell instead of the agent's answer.

## Layer Impact

`global-control-lane`: The post-deploy crawl harness now captures real Intelligence Ask responses before judging citation depth.

`client-data-lane`: No client data, loader data, private schemas, ingestion runs, migrations, or static seed facts changed.

## Client Applicability

- All clients: Yes. The crawl runs across every configured production crawl persona.
- Specific clients: Not limited to one client.
- Internal only: The script is an internal QA harness, not a user-facing surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated `scripts/crawl/post-deploy-harness.ts` to click the Sentinel Ask submit button and wait for streaming to complete before capturing transcripts.

## QA / Validation

- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT-RUN until merge and deploy: production crawl should capture real Sentinel Ask transcripts instead of page-shell text.

## Rollout Plan

Merge to main. The next post-deploy crawl run uses the corrected interaction path. No production app data operation is required.

## Rollback Plan

Revert the PR. The crawl returns to the previous interaction behavior without changing customer data or runtime surfaces.

## Audit Evidence

- Prior production crawl artifact `/private/tmp/post-deploy-crawl-local-intelligence-strip/2026-06-05T07-29-42-624Z-local/transcripts` showed only page shell text in every Intelligence Ask transcript.

## Known Gaps

This release fixes the crawl interaction. It does not guarantee the live answers will pass citation-depth once they are actually captured.
