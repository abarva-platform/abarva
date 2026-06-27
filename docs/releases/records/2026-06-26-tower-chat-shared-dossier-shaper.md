# 2026-06-26-tower-chat-shared-dossier-shaper — Tower Chat Shared Dossier Shaper

## Release ID

`2026-06-26-tower-chat-shared-dossier-shaper`

## Status

`candidate`

## Plain-English Summary

Tower chat now sends Claude a clean business-language prompt instead of raw Tower substrate JSON, and every Tower answer route passes through the shared aVa response shaper. The shaper replaces raw IDs with display names, blocks stale Atlas/Sentinel/Nexus branding, compacts long evidence dumps for chat, and preserves a next-step affordance.

Follow-up audit finding: the first deployed proof showed the API route resolving Tower state but not carrying the canonical tenant key into the L3 dossier lookup, causing `missing_tenant_key` fallback and `Active client` prompt labels. This release record also covers the tenant-binding correction and prompt-cleanliness repair. Subsequent deployed audits showed prompt cleanliness fixed, with remaining failures caused by the shared shaper preserving section-heading/list noise and too many visible chat lines; this record also covers that line-count polish.

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
- Shaper-line deployed audit: `/Users/anand/Downloads/tower-chat-shared-fix-20260626T235744Z`, `7/10`. All ten rows passed prompt cleanliness, raw-ID blocking, stale-brand blocking, next-step, and substance checks. The remaining three failures were compact-list paragraph-count only.
- Current follow-up: adds a shared shaper regression for compact ranked lists so Tower chat stays within the five-paragraph proof bar without dropping the answer's evidence.

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

- PR #4027: `https://github.com/abarva-platform/abarva/pull/4027`.
- PR #4028: `https://github.com/abarva-platform/abarva/pull/4028`.
- PR #4029: `https://github.com/abarva-platform/abarva/pull/4029`.
- ACA revision after PR #4027: `ca-abarva-web-lab-eastus--mf8c535f5`, image `acrabarvalab001.azurecr.io/abarva/web@sha256:e1b0384210e53f62b0be400e099d372a27ece02cfc3e927e292077622204d32e`, 100% traffic.
- ACA revision after PR #4028: `ca-abarva-web-lab-eastus--mec5e47fa`, image `acrabarvalab001.azurecr.io/abarva/web@sha256:c4821489650c6b0cae681786c33ea4aad2c792a0bd22beefee8e6dc4598ce186`, 100% traffic.
- ACA revision after PR #4029: `ca-abarva-web-lab-eastus--med4f76f4`, image `acrabarvalab001.azurecr.io/abarva/web@sha256:24973f3c292f0b30be761ac60d345bef50594c82ec98442b73f9b6008a35ea1e`, 100% traffic.
- Deployed trace audit: `/Users/anand/Downloads/tower-chat-shared-fix-20260626T235744Z`.

## Known Gaps

This release does not wire Home, Intelligence, Source, or Moves to the shared shaper. It proves the shared component and Tower adoption path first.

Tower does not yet have complete ready L3 dossier coverage for every Tower dataset dimension. The shared physical dossier store is `semantic2_dossiers`, and the Tower L3 model/builder exists in `src/lib/tower/tower-l3-dossiers.ts` plus `src/scripts/tower/build-l3-dossiers.ts`, but deployed traces still show missing curated dossier rows for broad Lakeshore Tower dimensions such as `budget_financials`. A ready `organization_leadership` dossier can be used as the first dossier-backed proof target; budget, vendor, AI value, risk, application/system, and portfolio-company slices must be built and validated before claiming Tower is fully L3-backed across tenants.
