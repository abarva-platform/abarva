# 2026-07-08-intelligence-typed-exhibits-export — Intelligence Typed Exhibits And Export

## Release ID

`2026-07-08-intelligence-typed-exhibits-export`

## Status

`candidate`

## Plain-English Summary

Intelligence answers can now treat a value/complexity 2x2 request as a real typed chart, not raw markdown. The shared answer renderer gets a deterministic quadrant-matrix SVG, and the governed answer packet can be exported as standalone HTML or PDF from the same validated packet.

Follow-up polish in this release also lifts governed fenced `chart` blocks from Claude/aVa prose into typed chart artifacts. That lets a GPT/Claude-style response with a real chart block render as a first-class aVa chart and export without leaking raw JSON or internal renderer labels.

## Layer Impact

- Global control lane: Extends the shared `AvaAnswerPacket` exhibit contract and Intelligence answer routing for chart-shaped questions.
- Product UI/rendering: Adds a print-safe quadrant chart builder and packet-level HTML/PDF export route for chat answers.
- Governance: Keeps rendering behind the existing validated answer packet; export does not re-query Claude or use model prose scraping as the source of truth.

## Client Applicability

- All clients: Yes, when using the Intelligence ask packet renderer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Adds `quadrant-matrix` to the answer chart contract, chart-kind builder map, expert-pack chart gate, and structured ask chart hint type.
- Routes explicit 2x2/quadrant/value-vs-complexity prompts to chart output.
- Converts validated markdown tables with value and complexity columns into typed quadrant-matrix charts.
- Converts valid fenced `chart` JSON blocks into typed `inlineChart` artifacts, strips the raw JSON from prose, and refuses invalid/non-numeric chart blocks rather than fabricating an exhibit.
- Adds a generic print-safe SVG chart renderer for model-emitted bar, horizontal-bar, line, area, and pie chart intents.
- Hides internal chart builder names from the user-facing answer while preserving `data-chart-builder` for diagnostics.
- Adds standalone export rendering for `AvaAnswerPacket` HTML and PDF through `POST /api/intelligence/ask/export`.
- Adds focused tests for routing, structured exhibit extraction, agent answer rendering, and HTML export.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/router.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts --runInBand` — 4 suites, 42 tests passed. Jest still prints the repo's pre-existing duplicate manual mock warnings.
- Pass: `npx eslint <changed source and test files>` — no findings.
- Pass: Focused TypeScript check over the touched renderer/export files with a temporary `noEmit` tsconfig — no findings.
- Pass: Generated local proof export at `proof/typed-exhibits/morgan-backoffice-ai-export.html` and captured `proof/typed-exhibits/morgan-backoffice-ai-export.png`; visual QA confirmed no raw chart JSON, no visible internal builder labels, formatted tables, and rendered line/horizontal-bar SVG charts.
- Pass: `npm run release:check`.
- Blocked: repo-wide `npx tsc --noEmit --pretty false` was attempted but produced no output after roughly two minutes and was stopped. The separate baseline TypeScript repair lane remains the owner for repo-wide TS health; this release does not claim repo-wide TS green.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, test a signed-in Intelligence question that asks for a supply-chain AI 2x2 value/complexity matrix and verify the emitted `agent-answer` includes a `quadrant-matrix` artifact.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by ACA main deploy after merge.
- ACA runtime invariant: Required before live acceptance.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Intelligence ask + export.

## Rollback Plan

Revert the PR. Existing chart/table/graph answer artifacts remain compatible because this only adds a new chart kind and a new export route.

## Audit Evidence

- PR URL: Pending.
- Focused test output: 4 suites / 42 tests passed.
- Local visual proof: `proof/typed-exhibits/morgan-backoffice-ai-export.png` generated from the standalone HTML export.
- Live signed-in screenshots/export: Pending deploy.

## Known Gaps

PDF preserves quadrant matrix structure as a PDF-native 2x2 summary and preserves tables; full inline SVG fidelity is provided by the HTML export path.
