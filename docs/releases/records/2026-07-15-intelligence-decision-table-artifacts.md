# 2026-07-15-intelligence-decision-table-artifacts — Governed Decision-Table Artifacts for aVa Ranking Answers

## Release ID

`2026-07-15-intelligence-decision-table-artifacts`

## Status

`candidate`

## Plain-English Summary

When a CXO asks aVa to rank or compare named items on decision criteria (for example "rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness"), aVa previously either produced a real table only if the model happened to emit clean Markdown, or fell back to a guardrail placeholder table titled "Requested Visual Boundary" whenever the model's prose style drifted or it declined to assign exact values under thin evidence. This change fixes the problem at the answer-packet contract layer, not by loosening the renderer's validation:

- The model is now steered (via a dedicated repair pass) toward a governed ` ```decision-table ` fenced JSON block with a fixed schema — Initiative, Value, Complexity, Readiness, Evidence basis, Recommendation, Next action, plus 0-100 numeric scores and a `directional` flag per row — instead of relying on regex-parsed Markdown prose.
- That fenced block is parsed into a real typed `AnswerTable` and three derived `AnswerChart` blocks (Value/Complexity 2x2 matrix, Readiness bar chart, Priority stack ranking) built from the same rows, so the chart is never independently hallucinated.
- Rows the model could not source-validate are explicitly permitted rather than refused or omitted — they render marked `(directional)` in the table and with a caveat in the chart title/subtitle, instead of triggering the "Requested Visual Boundary" guardrail. That guardrail now only fires when there are truly zero usable rows across every extraction path (decision-table fence, structured source rows, Markdown table, inline table).
- Fixed an export-parity gap: chart captions (`subtitle`) were rendered in the PDF export but not in the live chat card or the HTML export. They now render in all three surfaces.

## Layer Impact

- `global-control-lane`: `structured-exhibits.ts` and `synthesizer.ts` are shared aVa answer-generation code used by the Intelligence surface (and reused across the shared `ava-answer` contract consumed by Home/Moves/Source/Tower). The new extraction/derivation logic is additive — it only activates for ranked-decision-shaped queries and existing extraction paths (Markdown tables, chart fences, structured source rows, Moves phase table) are unchanged.

## Client Applicability

- All clients: yes — this is a shared answer-generation/rendering fix, not tenant-scoped.
- Specific clients: none singled out; the reported case was observed on Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — no flag gate; the fix activates automatically for ranked-decision queries via prompt detection (`isRankedDecisionAsk`).

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts` — ` ```decision-table ` fence parser, canonical 7-column table builder, and three chart-derivation functions (`valueComplexityMatrixFromDecisionRows`, `readinessBarChartFromDecisionRows`, `priorityStackFromDecisionRows`), wired into `buildStructuredExhibits`.
- `src/lib/intelligence/ask/synthesizer.ts` — `isRankedDecisionAsk()` detection, `hasDecisionTableFence()` check, and a dedicated decision-table repair prompt that explicitly permits directional/estimated values instead of refusing.
- `src/components/agent-answer/AgentAnswerRenderer.tsx` — renders `chart.subtitle` in the live chart card (parity with PDF export).
- `src/lib/ava-answer/export/render-answer-html.ts` — renders `chart.subtitle` in HTML export (parity with PDF export).
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` — 4 new tests covering the exact ranking scenario (agent assist / payment integrity / cost transparency), directional-row marking, malformed-fence fallback safety, and the too-few-scored-rows-for-charts edge case.
- This release record.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` (37/37, including 4 new tests)
- Pass: `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` (8/8)
- Pass: `npx jest src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/lib/ava-answer/export/__tests__/render-answer-pdf.test.tsx --runInBand` (9/9)
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` (clean, no errors)
- Not run: live signed-in browser proof on Meridian. Local dev cannot reach the Meridian tenant database — `AZURE_LAB_DATABASE_URL` points at `pg-abarva-context-lab-001.postgres.database.azure.com`, a private Azure VNet endpoint that does not resolve from a local machine outside the VNet (confirmed via DNS failure). Live proof requires the signed-in Meridian browser check against a deployed environment where the data plane is reachable (see Known Gaps).

## Rollout Plan

Merge the PR via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys the `main-<sha>` image to the shared ACA web runtime automatically on push to `main` (no ad-hoc `az acr build` or `az containerapp update` performed by this change). No feature flag, no migration, no worker image change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified by this change).
- Shared runtime mutators: none — this PR does not touch Azure Container Apps configuration, revision weights, or the web Container App template directly.
- Approved image digest: assigned by the existing main-deploy workflow on merge; not modified here.
- ACA runtime invariant: unaffected — no env var, flag, scale, or secret change.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after merge + ACA deploy — ask the exact reported query ("rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness") as Meridian and confirm a real decision table + Value/Complexity matrix + Readiness bar + Priority stack chart render (no "Requested Visual Boundary" fallback), and that HTML/PDF export include the same table + charts.

## Rollback Plan

Revert the PR. The change is additive to the existing extraction pipeline (new fence type + new chart-derivation calls guarded behind `decisionRows.length > 0`); reverting restores the prior Markdown-only extraction and stricter guardrail behavior with no data migration or flag cleanup required.

## Audit Evidence

- PR URL: pending (this record ships in the same PR).
- Unit test run output: see QA / Validation above.
- Live signed-in Meridian proof: pending merge + ACA deploy (tracked as a known gap below).

## Known Gaps

- Live signed-in browser proof on Meridian is not yet captured — blocked locally by Azure Postgres VNet reachability, not by application logic. Must be run against `https://app.abarva.ai` (or another environment with data-plane access) after this PR merges and deploys, using the query set in the linked PR description.
- HTML/PDF export parity for the new decision-table blocks relies on the existing shared `AvaAnswerPacket.artifacts` contract (no export-specific code was needed for the table/chart types themselves, only the pre-existing `chart.subtitle` gap called out above) — this is asserted by the shared-contract test suite, not by a fresh live export smoke test.
