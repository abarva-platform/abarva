# 2026-07-15-intelligence-ava-cxo-narrative-quality — Intelligence aVa CXO Narrative and Visual Contract

## Release ID

`2026-07-15-intelligence-ava-cxo-narrative-quality`

## Status

`live-proven`

## Plain-English Summary

Tightens the Intelligence aVa answer path so CXO-visible answers do not expose internal data-layer, Move trace, packet, table, or debug language. The route now sends server-sanitized `agent-answer` packets, stream deltas and browser-facing source events are scrubbed before they render, and the prompt contract asks for decision-grade structured rows that Nexus can lift into typed visual artifacts instead of raw chart/SVG/Mermaid code. Chat exports now preserve typed tables, chart exhibits, and graph relationships in HTML/PDF exports instead of flattening or dropping structured formatting.

## Layer Impact

- global-control-lane: shared Intelligence API response shaping and final packet sanitization now enforce CXO-safe language before data reaches the browser.
- global-control-lane: browser-facing Intelligence source events now use display-safe source names, details, and IDs while preserving original source objects for internal trace/audit.
- global-control-lane: final `agent-answer` packets now scrub source-style citation/exhibit metadata, compatibility prose mirrors, and chart/table/graph payload strings before browser or export rendering.
- global-control-lane: aVa visible-answer validation now treats internal product/data-layer terms as errors.
- global-control-lane: Intelligence prompts now encourage compact source-backed decision tables for rankings, comparisons, roadmaps, trends, and tradeoffs, while forbidding raw renderer/chart code in visible answers.
- global-control-lane: Intelligence chat export rendering now keeps typed table/chart/graph artifacts in the downloadable HTML/PDF path.

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
- `src/lib/ava-answer/export/render-answer-pdf.tsx`
- Regression tests for public answer scrubbing, server-side answer safety, CXO quality validation, and structured exhibit lifting.
- Regression tests for browser-facing source text scrubbing of data-layer/source-record language.
- Regression tests for final `agent-answer` citation and exhibit metadata scrubbing of V-layer labels, versioned record IDs, source-record counts, and validation-gate labels.
- Regression tests for HTML/PDF export preservation of tables, chart exhibits, and graph relationships.

## QA / Validation

- Pass: focused Jest suites for public answer scrubbing, CXO quality gate, server render safety, and structured exhibits.
- Pass: confirms `V7 substrate`, `candidate_move`, `move_id`, `phase_id`, `artifact_id`, `evidence_id`, `tenant_id`, and `source_record_id` are removed or blocked from visible answers.
- Pass: confirms browser-facing source text removes V-layer labels, source-record counts, internal source IDs, and `candidate_move` markers before reaching the UI stream.
- Pass: confirms versioned source IDs such as `v7.1` are replaced with display-safe source references before reaching the UI stream.
- Pass: confirms final `agent-answer` packets scrub V-layer labels, `Intelligence V#` wording, `not_loaded`, validation-gate labels, raw `recordId`, and source-record counts from citations and exhibits.
- Pass: confirms a Meridian-style agent-assist ranking table is lifted into typed table and chart artifacts.
- Pass: confirms chat HTML/PDF exports preserve typed tables, chart exhibits, graph relationships, and compact numeric formatting.
- Pass: post-deploy signed-in Meridian proof on `https://app.abarva.ai/intelligence?client=meridian` returned page 200, ask API 200 NDJSON, `agent-answer` present, zero forbidden browser-visible hits across sources/deltas/final answer packet, HTML export preserving table/SVG/graph/currency/percent formatting, and PDF export returning a valid `%PDF-` file.

## Rollout Plan

Merged through the protected GitHub path. Production activation completed through the repo-owned Azure Container Apps main deploy workflow, followed by signed-in browser proof on `https://app.abarva.ai/intelligence?client=meridian`.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA main deploy run `29444862476`.
- ACA runtime invariant: Pass in ACA main deploy run `29444862476`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Complete for Meridian Intelligence agent-assist smoke after deploy.

## Rollback Plan

Revert the PR and redeploy the prior known-good main SHA through the repo-owned ACA deploy workflow. No migrations or data changes are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4834
- Follow-up PR URL: https://github.com/abarva-platform/abarva/pull/4837
- Follow-up PR URL: https://github.com/abarva-platform/abarva/pull/4838
- Follow-up PR URL: https://github.com/abarva-platform/abarva/pull/4840
- Merge SHA: `5b47d1f5ae83b4442283b2ce6d977fc19fd9fb3c`
- ACA deploy run: `29444862476`
- Focused test output: local Jest run in this release branch.
- Prior motivating proof: `reports/intelligence-ava-live-proof/` and Downloads proof bundle from the signed-in Meridian live audit.
- Follow-up motivating proof: `reports/intelligence-ava-live-proof-post4838/v-hit-diagnostic.json` captured the remaining V-layer leakage in final `agent-answer` citation/exhibit metadata.
- Live proof bundle: `reports/intelligence-ava-live-proof-post4840/proof.json`

## Known Gaps

- This does not change retrieval, data-layer promotion, Home, Moves, Source, or Tower behavior.
