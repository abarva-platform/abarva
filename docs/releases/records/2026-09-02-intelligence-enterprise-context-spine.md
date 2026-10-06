# 2026-09-02-intelligence-enterprise-context-spine — Intelligence enterprise context spine

## Release ID

`2026-09-02-intelligence-enterprise-context-spine`

## Status

`candidate`

## Plain-English Summary

The Intelligence surface sends the answer path a packet describing the tenant. That packet was far thinner than the enterprise context actually loaded behind the page: two executive-summary fields, three current-state rows from three sections, eight maturity items and six source lines. The enterprise landscape carries roughly fourteen sections across five nav groups, so most of the loaded enterprise — the estate, commercial exposure, the AI footprint, risk and controls, outside-in benchmarks — was never offered to the model at all.

Two changes fix that. A new enterprise context spine routes every landscape section into the typed bucket matching its domain, so the model has a baseline picture of the enterprise even when question-specific retrieval is narrow. Sections the nav groups do not name are carried too, with reserved budget, so a tenant using a different section vocabulary cannot silently lose context.

The retriever that renders those buckets had a matching defect. It merged seven typed buckets into one list and cut it at 34 items, so whichever bucket came last in the merge order was starved by ordering alone — meaning a richer packet would not have reached the model even once it was sent. Each domain now carries its own budget and its own heading, so every domain is represented and the model can tell an AI-footprint fact from a vendor fact.

No metric, figure, or read model is computed or newly quoted by this change. It governs which already-loaded context reaches the answer path, and how that context is labelled.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): context assembly and retrieval rendering only.
- Layer 3 (Canonical model): unchanged. Values are read from the existing landscape view model; nothing is recomputed and no new number is asserted.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — the spine is tenant-agnostic and derives from whatever landscape sections a tenant has loaded.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/enterprise-context-spine.ts` — new. Maps the enterprise landscape view model into the typed surface-context buckets, with per-bucket caps, cross-bucket dedupe, section-labelled facts, and reserved budget for sections the nav groups do not name.
- `src/lib/intelligence/ask/retrievers/surface-context.ts` — replaced the single flattened 34-item tenant cap with per-domain budgets and labelled domain headings. The SURFACE/TENANT/GRAPH source contract is unchanged.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — `buildSurfaceContext` now delegates to the spine.
- `src/lib/intelligence/__tests__/enterprise-context-spine.test.ts`, `src/lib/intelligence/ask/__tests__/surface-context-domains.test.ts` — new coverage.

## QA / Validation

- `npx jest src/lib/intelligence/__tests__/enterprise-context-spine.test.ts` — 6 passed, exercised against real tenant view models rather than fixtures, including a tenant on the generic section set.
- `npx jest src/lib/intelligence/ask/__tests__/surface-context-domains.test.ts` — 5 passed, including an explicit regression guard that a large leading bucket no longer starves later domains.
- `npx jest src/lib/intelligence src/components/intelligence-advisory` — 538 passed, 30 failed. All 30 failures are pre-existing on the base commit; verified by stashing the change and re-running (527 passed, identical failing suites). No suite regressed.
- `npx tsc -p tsconfig.json --noEmit` — 0 errors repo-wide.
- `npx eslint` on all changed and added files — clean.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — a signed-in Intelligence answer that draws on a domain outside the three sections the previous packet carried.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. The change is confined to context assembly with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. Local validation only so far; a signed-in read on a deployed revision is still owed before this record moves to `released`.
- Prompt size grows. The tenant substrate budget rises from 34 items to a per-domain total of up to 58. This has not been measured against latency or token cost on a live revision, and the caps are a considered starting point rather than a tuned result.
- Section-to-domain mapping is keyed on the landscape section ids in use today. Unrecognised sections are carried under the enterprise bucket with reserved budget, so nothing is lost, but they are not domain-labelled.
- The spine is assembled client-side from the view model the page already holds and sent with the request. Assembling it server-side from the canonical model would be stronger, and remains open.
- Retrieval itself is unchanged. This widens the always-on baseline context; it does not change how question-specific evidence is selected.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and the live signed-in answer proof.
