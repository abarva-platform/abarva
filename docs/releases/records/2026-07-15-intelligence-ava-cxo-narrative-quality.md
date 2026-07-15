# 2026-07-15-intelligence-ava-cxo-narrative-quality — Intelligence aVa CXO Narrative and Visual Contract

## Release ID

`2026-07-15-intelligence-ava-cxo-narrative-quality`

## Status

`candidate`

## Plain-English Summary

Tightens the Intelligence aVa answer path so CXO-visible answers do not expose internal data-layer, Move trace, packet, table, or debug language. The route now sends server-sanitized `agent-answer` packets, stream deltas are scrubbed before they render, and the prompt contract asks for decision-grade structured rows that Nexus can lift into typed visual artifacts instead of raw chart/SVG/Mermaid code.

## Layer Impact

- global-control-lane: shared Intelligence API response shaping and final packet sanitization now enforce CXO-safe language before data reaches the browser.
- global-control-lane: aVa visible-answer validation now treats internal product/data-layer terms as errors.
- global-control-lane: Intelligence prompts now encourage compact source-backed decision tables for rankings, comparisons, roadmaps, trends, and tradeoffs, while forbidding raw renderer/chart code in visible answers.

## Client Applicability

- All clients: Yes, shared Intelligence answer route and reusable aVa answer-safety utilities.
- Specific clients: Meridian Health motivated the proof case, but no Meridian-only behavior was added.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`
- `src/lib/ava-answer/public-answer-scrub.ts`
- `src/lib/ava-answer/cxo-quality-gate.ts`
- `src/lib/ava-answer/validateAvaAnswerPacket.ts`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- Regression tests for public answer scrubbing, server-side answer safety, CXO quality validation, and structured exhibit lifting.

## QA / Validation

- Pass: focused Jest suites for public answer scrubbing, CXO quality gate, server render safety, and structured exhibits.
- Pass: confirms `V7 substrate`, `candidate_move`, `move_id`, `phase_id`, `artifact_id`, `evidence_id`, `tenant_id`, and `source_record_id` are removed or blocked from visible answers.
- Pass: confirms a Meridian-style agent-assist ranking table is lifted into typed table and chart artifacts.
- Pending: full release validation and post-deploy signed-in Meridian Intelligence proof after merge/deploy.

## Rollout Plan

Merge the PR through the protected GitHub path. Production activation requires the repo-owned Azure Container Apps main deploy workflow to build and deploy the merged SHA, then signed-in browser proof on `https://app.abarva.ai/intelligence?client=meridian`.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Intelligence 10-question smoke after deploy.

## Rollback Plan

Revert the PR and redeploy the prior known-good main SHA through the repo-owned ACA deploy workflow. No migrations or data changes are included.

## Audit Evidence

- PR URL: Pending.
- Focused test output: local Jest run in this release branch.
- Prior motivating proof: `reports/intelligence-ava-live-proof/` and Downloads proof bundle from the signed-in Meridian live audit.

## Known Gaps

- Post-deploy signed-in live proof is not yet captured for this candidate.
- This does not change retrieval, data-layer promotion, Home, Moves, Source, or Tower behavior.
