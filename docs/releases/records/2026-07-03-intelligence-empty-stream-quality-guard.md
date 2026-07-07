# 2026-07-03 Intelligence Empty Stream Quality Guard

## Release ID

`2026-07-03-intelligence-empty-stream-quality-guard`

## Status

`candidate`

## Plain-English Summary

This release prevents the Intelligence page from treating an empty model stream as a usable answer. If the `/api/intelligence/ask` stream completes without either visible model text or an `agent-answer` packet, the UI retries once before showing an explicit incomplete-stream message. The 100-question pressure harness now records parsed API response events per question and marks fallback answer text as a technical failure, so a fast canvas alone cannot be scored as a successful executive answer. The native CXO canvas also avoids overlap-prone chart labels by rendering numbered plot markers with a separate initiative key.

## Layer Impact

- `global-control-lane`: shared Intelligence response handling for all clients using the v2 Intelligence surface.
- `public-demo`: improves demo reliability for Lakeshore/Industrial and SkyHarbor live proof by preventing canvas-only false positives.
- `internal-admin`: strengthens QA artifacts used by operators to audit prompt input, model output, and rendered response behavior.

## Client Applicability

- All clients: Intelligence v2 stream handling and QA scoring behavior.
- Specific clients: Lakeshore Holdings / Industrial Demo and SkyHarbor are the immediate proof tenants.
- Internal only: pressure-harness artifact changes.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
  - Retries once when the Intelligence stream returns no delta text and no `agent-answer`.
  - Replaces the ambiguous grounded-answer fallback with an explicit incomplete-stream retry message after the retry fails.
  - Keeps value/readiness chart points as numeric markers instead of plotting long initiative names inside the chart.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`
  - Adds a regression proving an empty first stream retries and renders a valid second `agent-answer`.
- `src/lib/cxo-canvas/rendererRegistry.tsx`
  - Moves executive sequencing chart labels into a controlled number key so long initiative names do not overlap on the plot.
- `src/lib/cxo-canvas/__tests__/cxo-canvas-renderer.test.tsx`
  - Adds a regression proving long initiative names stay out of plotted point text and remain available in the chart key.
- `scripts/qa/intelligence-100q-pressure.mjs`
  - Saves `api-response-events.json` for each question.
  - Marks fallback answer text as a technical failure.

## QA / Validation

- Pass: `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand -t "retries once when the Intelligence stream completes without an answer"`
- Pass: `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand`
- Pass: `npx jest src/lib/cxo-canvas/__tests__/cxo-canvas-renderer.test.tsx --runInBand`
- Pass: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx scripts/qa/intelligence-100q-pressure.mjs`
- Pass: `npm run qa:intelligence:pressure100 -- --dry-run --out-dir /Users/anand/Projects/nexus/proof/intelligence-100q-harness-dryrun-after-empty-stream-fix-20260703`

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the exact merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, and run a signed-in targeted Q06 proof before resuming broad 50Q/100Q pressure tests.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deploy lane for `app.abarva.ai`.
- Shared runtime mutators: ACA image update and ingress traffic assignment only.
- Approved image digest: to be captured at deploy time.
- ACA runtime invariant: verify active revision, image digest, health, and 100% traffic.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, targeted Lakeshore Q06 proof plus no fallback answer.

## Rollback Plan

Rollback by shifting ACA traffic back to the prior healthy revision. No schema or data migration is included.

## Audit Evidence

- Partial pressure run stopped at 54/100: `/Users/anand/Projects/nexus/proof/intelligence-100q-v7-prod-20260703T1950Z`
- Q06 failure screenshot: `/Users/anand/Projects/nexus/proof/intelligence-100q-v7-prod-20260703T1950Z/screenshots/006-industrial-ai_investment_prioritization-06.png`
- Q06 trace replay proving prompt/model output was valid: `/Users/anand/Projects/nexus/proof/intelligence-q06-trace-20260703T2035Z`
- Harness dry-run proof: `/Users/anand/Projects/nexus/proof/intelligence-100q-harness-dryrun-after-empty-stream-fix-20260703`

## Known Gaps

The broad 100-question production run was intentionally stopped after one canvas-only false positive was found. Full pressure testing should resume only after this guard is deployed and the targeted Q06 signed-in proof passes.
