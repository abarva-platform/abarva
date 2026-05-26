# 2026-05-26-northstar-demo-readiness — Northstar CXO demo readiness

## Release ID

`2026-05-26-northstar-demo-readiness`

## Status

`runtime-candidate`

## Plain-English Summary

Pre-demo deliverables and runtime grounding fixes for the 2026-05-27 Northstar CXO demo. In addition to the demo playbook and Playwright dry-run capture, this release closes the named-entity recall gap by loading the Northstar structured application, initiative, and vendor tables, reconciling the live client profile to the $22.6B / $1.15B IT budget dataset, and wiring Sentinel's tenant enterprise retrieval path to those structured rows.

## Layer Impact

- `documentation`: `docs/build/northstar-demo/DEMO_PLAYBOOK_2026-05-27.md` covers pre-flight checks, 6 demo scenes with talking points, risk register, backup flows, and post-demo follow-up checklist.
- `ops-release-lane`: `scripts/demo/northstar-demo-capture.mjs` signs in as Priya Mehta, walks all 13 demo steps, and captures screenshots + console errors + Sentinel response samples into an HTML report.
- `runtime`: `src/lib/knowledge/tenant-enterprise-context.ts` now retrieves structured `clients`, `applications`, `ai_initiatives`, and `vendor_contracts` rows for tenant-specific CXO questions before falling back to generic corpus material.
- `runtime`: `src/lib/intelligence-v3/sentinel-intel-context.ts` no longer frames non-Apex Intelligence calls as fallback sample content; it asserts the actual active tenant.
- `tenant-data`: Northstar live DB now has 240 applications, 80 initiatives, 90 vendor contracts, 728 embedded context chunks, and 8 demo-critical named-fact chunks.

## Client Applicability

- All clients: no
- Specific clients: Northstar Clinical Tech CXO demo
- Internal only: yes — operations + sales readiness
- Public/demo only: no (these are internal artifacts)
- Feature flag: none

## Changes Included

- `docs/build/northstar-demo/DEMO_PLAYBOOK_2026-05-27.md`
- `scripts/demo/northstar-demo-capture.mjs`
- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/lib/intelligence-v3/sentinel-intel-context.ts`
- `scripts/seed/load-tenant-substrate.ts`
- `scripts/seed/load-northstar-demo-fact-overlay.mjs`
- `datasets/northstar-clinical-tech-synthetic-v1/16-market-corpus/demo-critical-facts.jsonl`
- PR: this PR

## QA / Validation

- Focused retrieval tests: **passed** — `tenant-enterprise-context.test.ts` now covers Northstar `NST-APP-*`, `NST-VEND-*`, and `NST-INIT-*` retrieval.
- Tenant-pin tests: **passed** — non-Apex Sentinel Intel context does not assert Apex as active tenant.
- Live data smoke: **passed** — `northstar-context-layer-live-data.spec.ts` confirms at least 720 chunks, 8 demo-critical fact chunks, and no failed embeddings.
- Live retrieval probe: **passed** — Northstar retrieval now surfaces Daniel Okafor, `$1.15B` IT spend, `NST-VEND-090`, `NST-APP-234`, and kill candidates including `NST-INIT-AS400-REBATES`.
- Full repo `tsc --noEmit`: **blocked by pre-existing missing optional packages** (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`), unrelated to this patch.

## Rollout Plan

Merge to `main`, then deploy to production. Owner runs the dry-run script the morning of the demo, verifies all green, executes the demo flow from the playbook.

## Rollback Plan

Revert this PR for runtime code. Tenant-data rollback can delete `NST-DEMO-FACT-%` chunks and rerun the previous Northstar substrate loader if needed.

## Audit Evidence

- Playbook references all 5 closed Northstar P0s, Codex's merged Stream B (PR #2359), and the 1,720 chunks loaded across 4 tenants
- Capture script mirrors the production stress-test runner's sign-in approach (createSignInToken from Clerk, ticket strategy, abarva_active_client cookie)

## Known Gaps

- Capture script depends on Playwright Chromium and Clerk service-role key — same prerequisites as the stress-test runner
- Most-recent stress-test transcripts (post-substrate-load) confirmed grounding works; capture script is the new end-to-end gate
- The session-timeout regression on the long-form stress runner (sign-in early then 6.5 min crawl then agent probes — token expires) is noted; this capture script avoids that pattern by doing sign-in immediately before agent questions
- Task #17 remains open
