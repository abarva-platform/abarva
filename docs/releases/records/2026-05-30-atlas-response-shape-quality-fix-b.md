# 2026-05-30 — Atlas response-shape quality (audit fix B)

## Release ID

`2026-05-30-atlas-response-shape-quality-fix-b`

## Status

`candidate`

## Plain-English Summary

Closes three findings from the Atlas CXO-quality audit (PR #2562) in the response-shape layer that renders advisor prose into Atlas surfaces:

- Comparison tables no longer paste the literal strings "Needs validation." and "Medium pending evidence." as a fallback when the extractors fail. Empty cells render as an em-dash, not as fake assertions.
- The Evidence and Missing slots can no longer contain the same sentence. If both extractors find the same source, Evidence wins and Missing stays empty.
- Percentile numbers are never rendered as a naked "Xth percentile" anymore. A single `formatPercentile()` helper requires the metric, the cohort definition, and the sample size; if any of those is missing, the output is the honest sentinel `metric-context unavailable`.

## Layer Impact

- **Application layer (Atlas response shaping)**: `src/lib/agent/response-shape.ts` — three behavioral changes (boilerplate strip, Evidence/Missing exclusion, `formatPercentile` helper).
- **Application layer (Atlas surfaces)**: `src/components/atlas/CohortPeerVisualization.tsx`, `src/components/atlas/AtlasSignalDetailPanel.tsx`, `src/lib/atlas/scripted-engine.ts` — every user-rendered percentile site now routes through `formatPercentile`.
- No data layer, broker, or substrate change.

## Client Applicability

- All clients: yes — Atlas / Tower surfaces render identically for every tenant; the bugs were universal.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- PR #2564 — `fix(atlas): strip boilerplate, fix Evidence/Missing collision, label percentiles`
- Files: `src/lib/agent/response-shape.ts`, `src/lib/agent/__tests__/response-shape.test.ts`, `src/lib/atlas/scripted-engine.ts`, `src/components/atlas/CohortPeerVisualization.tsx`, `src/components/atlas/AtlasSignalDetailPanel.tsx`
- Anchor doc: `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md` (on audit PR #2562)

## QA / Validation

- `npx tsc --noEmit` — clean
- `npx jest src/lib/agent/__tests__/response-shape.test.ts` — 41/41 pass (10 new audit-invariant tests + every pre-existing test still green)
- `npm run test:behaviors` — no new regressions; 5 failing suites are pre-existing on `main` (tenant-onboarding fixture drift, unrelated)

## Rollout Plan

- Merge to `main` after CI green.
- Vercel production deploy auto-triggered on merge.
- No migration, no flag, no manual runbook.

## Rollback Plan

- `git revert` the merge commit; Vercel re-deploys the prior bundle. No data or schema change to undo.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2564
- Anchor audit: PR #2562 + `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`
- CI run: see PR checks list
- Test invariants live in `src/lib/agent/__tests__/response-shape.test.ts` under the "Atlas CXO-quality audit invariants" describe block

## Known Gaps

- Sibling fix A (PR scope: `src/app/api/tower/synthesis/route.ts`, `src/lib/agent/retrieval.ts`) and sibling fix C (`src/lib/agent/llm.ts`) are tracked separately per the audit's three-PR split.
- The portfolio-level percentile fields (`adoptionPercentile`, `spendIntensityPercentile`, `valueAttainmentPercentile`, `vendorCountPercentile`) are not currently rendered as visible text — they reach the LLM via the sanitized prompt context. If a future surface starts rendering them directly, it MUST route through `formatPercentile()` (enforced by the new invariant test).
