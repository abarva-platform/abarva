# 2026-07-16-intelligence-universal-answer-contract — Intelligence Universal Answer Contract

## Release ID

`2026-07-16-intelligence-universal-answer-contract`

## Status

`candidate`

## Plain-English Summary

Intelligence aVa now receives the same answer and visual contract on every ask instead of only receiving strong table/chart instructions when regex wording recognizes a visual question. The live stream also suppresses governed structured fences before they can appear in chat, while the final clean answer packet remains authoritative for the rendered response.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence ask synthesis and rendering path used by all signed-in tenants.
- `runtime answer rendering`: Keeps Claude-owned `decision-table`, `chart`, and `followups` artifacts as structured packets while preventing raw fence JSON from appearing in the visible stream.
- `prompt governance`: Moves ranked/table/chart guidance into an always-on universal contract rather than a question-wording gate.

## Client Applicability

- All clients: Yes, for Intelligence asks using the aVa answer-only stream.
- Specific clients: Meridian is the required proof tenant for this release candidate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag.

## Changes Included

- Added a structured-fence stream filter for governed `decision-table`, `chart`, and `followups` fences.
- Updated the Intelligence client to prefer clean final packet prose when structured artifacts exist, including when the clean body contains normal Markdown tables.
- Added an always-on universal aVa answer/visual contract in `src/lib/intelligence/ask/synthesizer.ts`.
- Added focused regression coverage for split fence streaming, packet-body selection, and universal contract presence.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`.
- Pass: `npm run audit:intelligence-ava-stream-polish`.
- Pass: `npm run audit:intelligence-ava-visual-contract`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run release:check`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Not run: signed-in Meridian browser proof at release-record creation time.
- Not run: ACA deploy; this candidate must merge through the approved main deploy lane before live proof.

## Rollout Plan

Open PR from `codex/intelligence-universal-answer-contract`. After review and merge to main, use the repo-owned Azure Container Apps main deploy workflow. Run signed-in Meridian proof for the exact required question on `https://app.abarva.ai/intelligence?client=meridian`.

## Deployment Authority

- Repo-owned deploy workflow: Required for any shared runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after main deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Meridian Intelligence ask and export proof.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. Rollback risk is limited to Intelligence answer streaming, prompt shaping, and final packet selection.

## Audit Evidence

- PR URL: pending.
- Focused test output: pending.
- Live proof bundle: pending.
- Required live proof question: `For Meridian agent assist, rank the top opportunities by value and complexity. Show the tradeoff in an executive-ready way.`

## Known Gaps

- This PR keeps the existing `decision-table`, `chart`, and `followups` contract rather than introducing a new full visual-block schema.
- Live Meridian proof is pending until merge/deploy through the approved ACA lane.
