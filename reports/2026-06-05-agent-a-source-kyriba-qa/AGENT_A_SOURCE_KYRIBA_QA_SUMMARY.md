# Agent A - Lakeshore Source/Kyriba Artifact QA

## Scope

Agent A verified Lakeshore Source demo readiness for the Kyriba event only. Corpus expansion, Moves fixes, Tower fixes, and Azure private-plane remediation were intentionally out of scope.

## Baseline

- Repo worktree: `/private/tmp/nexus-agent-a-source-kyriba-qa`
- Branch: `codex/source-kyriba-artifact-qa`
- Base: `origin/main` at `a879c5bc4`
- Production target: `https://app.abarva.ai`
- Demo persona: `cfo@lakeshore-holdings.example.com`
- Active client cookie: `lakeshore`

## Live Route QA

Command:

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a; \
LAKESHORE_DEMO_QA_BASE_URL=https://app.abarva.ai \
LAKESHORE_DEMO_QA_OUT=reports/2026-06-05-agent-a-source-kyriba-qa \
node scripts/lakeshore/app-demo-readiness-qa.mjs
```

Result:

- Total checks: 26
- Pass / watch / fail: 26 / 0 / 0
- Source checks: 14 / 14 pass
- Report: `reports/2026-06-05-agent-a-source-kyriba-qa/lakeshore-app-demo-readiness-2026-06-05T18-40-36-624Z-a879c5bc4/report.html`

Source coverage:

- `/source/events` showed Lakeshore, 2 sourcing events, `LSH-KYRIBA-TREASURY-2026`, and `LSH-AMS-MODERNIZATION-2026`.
- `/source/compare` showed the Lakeshore Source events and did not show the old cross-tenant `19 events available` issue.
- `LSH-KYRIBA-TREASURY-2026` rendered expected artifact markers for Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, and Value.
- `LSH-AMS-MODERNIZATION-2026?stage=evaluation` stayed on the AMS boundary and did not show Kyriba BAFO artifact content.
- No Apex Retail or Meridian Health marker appeared in the checked Source routes.

## Kyriba Stage-Specific Proof

Command:

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a; \
LAKESHORE_VERIFY_BASE_URL=https://app.abarva.ai \
npx tsx scripts/lakeshore/verify-kyriba-source-live.ts
```

Result:

- Selection: 200, with `Selection Memo`, `Contract Record`, `Kyriba`, `Lakeshore`, and `Lakeshore should proceed with a treasury platform rollout anchored on Kyriba`.
- Transition: 200, with `Transition Plan`, `Checkpoint Log`, `Knowledge-Transfer Evidence`, `Kyriba`, `Lakeshore`, and `The transition plan is built around a controlled parallel run`.
- Value: 200, with `Value Ledger`, `Governance Review Note`, `Kyriba`, `Lakeshore`, and `The Kyriba rollout value ledger is intentionally conservative`.

## API and Export QA

Command:

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a; \
node --input-type=module '<inline authenticated Playwright request sweep>'
```

Result:

- Total checks: 7
- Pass / fail: 7 / 0
- Report: `reports/2026-06-05-agent-a-source-kyriba-qa/source-kyriba-api-export-proof-2026-06-05T18-43-47-829Z-a879c5bc4/checks.json`

API/export coverage:

- `/api/v1/source/events/LSH-KYRIBA-TREASURY-2026`: 200, returned the persisted event with `currentStageKey: executive_decision`.
- `/api/v1/source/LSH-KYRIBA-TREASURY-2026/cxo-report?format=html`: 200 HTML.
- `/api/v1/source/LSH-KYRIBA-TREASURY-2026/cxo-report?format=pptx`: 200 graceful HTML fallback with `x-source-cxo-report-format: pptx-fallback`; no raw JSON `pptx_unavailable`.
- `/api/v1/source/LSH-KYRIBA-TREASURY-2026/deal-pack?format=html`: 200 HTML attachment with `x-source-deal-pack-format: html`; distinct Deal Pack title, not duplicate CXO narrative.
- `/api/v1/source/LSH-KYRIBA-TREASURY-2026/artifacts/d01_strategy_memo/render-html`: 200 HTML.
- `/api/v1/source/LSH-KYRIBA-TREASURY-2026/artifacts/d27_selection_memo/render-html`: 200 HTML.
- `/source/events/LSH-KYRIBA-TREASURY-2026/value`: 200 page, no `invalid input syntax for type uuid`.

## Verdict

Lakeshore Source/Kyriba is demo-ready for the current honest story: full artifact spine is retrievable, prior stages through BAFO are approved, Executive Decision is the current event stage, downstream Selection/Transition/Value artifacts are retrievable as in-review continuity proof, and tenant isolation held across the checked routes.

## Remaining Caveat

This is live-route and export proof, not a new data-load proof. The route truth aligns with the existing Lakeshore live data audit: the artifacts are synthetic but real deliverables loaded for the Lakeshore demo and should not be described as realized Kyriba production value.
