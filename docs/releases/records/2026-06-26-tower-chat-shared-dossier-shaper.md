# 2026-06-26-tower-chat-shared-dossier-shaper — Tower Chat Shared Dossier Shaper

## Release ID

`2026-06-26-tower-chat-shared-dossier-shaper`

## Status

`candidate`

## Plain-English Summary

Tower chat now sends Claude a clean business-language prompt instead of raw Tower substrate JSON, and every Tower answer route passes through the shared aVa response shaper. The shaper replaces raw IDs with display names, blocks stale Atlas/Sentinel/Nexus branding, compacts long evidence dumps for chat, and preserves a next-step affordance.

Follow-up audit finding: the first deployed proof showed the API route resolving Tower state but not carrying the canonical tenant key into the L3 dossier lookup, causing `missing_tenant_key` fallback and `Active client` prompt labels. This release record also covers the tenant-binding correction and prompt-cleanliness repair. The second deployed audit showed prompt cleanliness fixed, with remaining failures caused by the shared shaper preserving section-heading noise and too many visible chat lines; this record also covers that line-count polish.

## Layer Impact

- `global-control-lane`: Adds a shared answer shaper module intended for all advisor surfaces, without Tower-only branching.
- `global-control-lane`: Repoints Tower chat prompt assembly away from raw tool payloads toward clean Tower business context plus curated L3 dossiers.
- `global-control-lane`: Carries canonical tenant key through the Atlas tenancy context so Tower can load curated dossiers and name the active client instead of falling back to generic `Active client`.
- `global-control-lane`: Adds a signed-in Tower audit script that captures prompt, raw model output, rendered output, diffs, and per-question checks.

## Client Applicability

- All clients: Shared shaper module is available to all surfaces.
- Specific clients: Tower runtime behavior is exercised first against Lakeshore Holdings because that was the failing audit tenant.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts`
- `src/lib/agent/response-shape.ts`
- `src/app/api/v1/atlas/_auth.ts`
- `src/lib/atlas/llm.ts`
- `src/lib/atlas/orchestrator.ts`
- `src/lib/atlas/tool-belt.ts`
- `src/lib/atlas/tower-grounding.ts`
- `src/lib/atlas/types.ts`
- `scripts/qa/tower-chat-shared-fix-audit.mjs`
- `src/lib/answer/__tests__/shared-response-shaper.test.ts`

## QA / Validation

- Pass: `npx eslint src/lib/answer/shared-response-shaper.ts src/lib/answer/__tests__/shared-response-shaper.test.ts src/lib/agent/response-shape.ts src/lib/atlas/llm.ts src/lib/atlas/orchestrator.ts src/lib/atlas/types.ts scripts/qa/tower-chat-shared-fix-audit.mjs`
- Pass: `npx eslint src/lib/answer/shared-response-shaper.ts src/lib/atlas/llm.ts src/lib/atlas/tower-grounding.ts src/lib/atlas/tool-belt.ts src/lib/atlas/types.ts src/app/api/v1/atlas/_auth.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npx jest src/lib/answer/__tests__/shared-response-shaper.test.ts --runInBand`
- Pre-fix deployed audit: `1/10`, with prompt-clean failures caused by missing tenant key and raw `LAK-AI-*` references in the prompt.
- Tenant-binding deployed audit: `2/10`, with prompt-clean passing on every row but length/visible-line failures remaining in the shared shaper.
- Not-run until shaper-line follow-up deploy: `node scripts/qa/tower-chat-shared-fix-audit.mjs` against `https://app.abarva.ai/tower`.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new healthy revision, then run the signed-in Tower 10-question trace audit.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared ACA runtime.
- Shared runtime mutators: Only approved repo-owned main deploy path should mutate `ca-abarva-web-lab-eastus`.
- Approved image digest: To be recorded after `az acr build`.
- ACA runtime invariant: Template image, 100% traffic revision, and active revision image must match the approved main digest.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not changed.
- Live signed-in proof required: Yes, Lakeshore Tower 10-question trace audit plus browser-visible route proof.

## Rollback Plan

Revert the merged commit, build a new main image, deploy the reverted image to ACA, and shift 100% traffic to the rollback revision. No schema/data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/digest: pending.
- Audit zip: `tower-chat-shared-fix-<timestamp>.zip` after deploy.

## Known Gaps

This release does not wire Home, Intelligence, Source, or Moves to the shared shaper. It proves the shared component and Tower adoption path first.
