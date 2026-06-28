# 2026-06-28-intelligence-advisory-packet-assembler — Intelligence AdvisoryPacket Assembler

## Release ID

`2026-06-28-intelligence-advisory-packet-assembler`

## Status

`candidate`

## Plain-English Summary

Intelligence now has a reusable AdvisoryPacket assembler that separates the context Claude can see from audit-only lineage and retrieval diagnostics. The same assembler is wired into live Intelligence Ask and the local Top 100 prompt audit so the audit path cannot drift into a demo-only packet format.

Follow-up hardening adds a shared model-input cleaner guard for generated system-code labels discovered during signed-in Q001 proof. Business labels such as operational system names are preserved, while generated suffixes and raw key labels are removed before the packet reaches Claude.

Second follow-up hardening tightens the Intelligence decision-canvas contract after live proof showed Claude preserved the Markdown table but placed it inside the Decision tab instead of a dedicated Table/Chart tab. The contract now states that every Markdown table must appear inside a Table or Chart tab.

Third follow-up hardening clarifies that the right-side decision canvas should add relevant decision support, not duplicate the left-side answer. Table and Chart tabs may use directly related tenant metrics or adjacent function/category/pattern context when that is more useful for a CXO, but the tab grounding and first line must clearly distinguish tenant evidence from function, category, industry, corpus-pattern, benchmark, or planning-assumption context.

Fourth follow-up hardening makes the right-side tab strip dynamic and contentful after signed-in browser proof showed tabs with real content displaying misleading `0` badges. Per-answer tabs now hide count badges unless a real count exists, blank Claude tabs are omitted, and function/category context groundings render as CXO-readable labels instead of a fallback badge. The tab contract also now explicitly allows Chart tabs to show industry trend data, directional benchmarks, peer-pattern maps, and function/category opportunity maps when those are more useful than tenant metrics, provided the grounding label and first line make clear that the chart is not tenant proof.

Fifth follow-up hardening fixes the explicit visual repair path after signed-in Lakeshore proof showed an industry trend chart request still answered in prose without creating a right-canvas Chart/Table tab. Explicit chart/graph/trend requests now require a chart-ready Chart tab during model repair; table/comparison requests require a Table tab. If repair still misses the contract, deterministic fallback places the compact visual in the right canvas instead of the left answer and only labels it as tenant evidence when the fallback is built from the loaded packet.

## Layer Impact

- `global-control-lane`: changes shared Intelligence answer preparation, prompt evidence boundaries, and operator trace behavior for all clients using the Intelligence Ask path.
- `public-demo`: adds SkyHarbor Top 100 packet audit artifacts for demo-readiness review; these are local proof artifacts, not live signed-in proof.

## Client Applicability

- All clients: the live Intelligence Ask path now assembles an AdvisoryPacket before Claude synthesis.
- Specific clients: SkyHarbor has generated Top 100 audit artifacts for the current proof slice.
- Internal only: audit diagnostics, hidden lineage, and generated prompt audit artifacts are operator/proof material.
- Public/demo only: none.
- Feature flag: existing Intelligence Claude synthesis flags still govern model usage.

## Changes Included

- `src/lib/intelligence/advisory-packet/types.ts`
- `src/lib/intelligence/advisory-packet/assemble-advisory-packet.ts`
- `src/lib/intelligence/advisory-packet/top-100-audit.ts`
- `src/lib/intelligence/model-input-cleaner.ts`
- `src/lib/intelligence/tabbed-response.ts`
- `src/lib/intelligence/__tests__/tabbed-response.test.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`
- `scripts/intelligence/generate-top-100-advisory-packet-audit.ts`
- `docs/intelligence/prompt_audit/top_100/20260628/`
- `docs/intelligence/TOP_100_PROMPT_AUDIT_SUMMARY_20260628.md`

## QA / Validation

- `npx jest src/lib/intelligence/__tests__/model-input-cleaner.test.ts src/lib/intelligence/advisory-packet/__tests__/advisory-packet.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed, 22 tests.
- `npx jest src/lib/intelligence/__tests__/tabbed-response.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/__tests__/model-input-cleaner.test.ts src/lib/intelligence/advisory-packet/__tests__/advisory-packet.test.ts --runInBand` passed, 25 tests.
- `npx eslint src/lib/intelligence/advisory-packet src/lib/intelligence/ask/index.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/app/api/intelligence/ask/route.ts scripts/intelligence/generate-top-100-advisory-packet-audit.ts` passed.
- `npx eslint src/lib/intelligence/model-input-cleaner.ts src/lib/intelligence/__tests__/model-input-cleaner.test.ts src/lib/intelligence/advisory-packet/__tests__/advisory-packet.test.ts` passed.
- `npx eslint src/lib/intelligence/tabbed-response.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/tabbed-response.test.ts` passed.
- Third follow-up: `npx jest src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed, 4 tests.
- Third follow-up: `npx eslint src/lib/intelligence/tabbed-response.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/__tests__/tabbed-response.test.ts` passed.
- Third follow-up: `npm run release:check` passed.
- Fourth follow-up: `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed, 11 tests.
- Fourth follow-up: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/tabbed-response.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts` passed.
- Fourth follow-up: `npm run release:check` passed.
- Fifth follow-up: `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed, 22 tests.
- Fifth follow-up: `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/tabbed-response.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- `npx tsx scripts/intelligence/generate-top-100-advisory-packet-audit.ts` generated 100 prompt JSON, 100 prompt Markdown, 100 summary Markdown artifacts, plus the Top 100 rollup.
- Top 100 rollup: 100 / 100 packets reached richness >= 4, 100 / 100 passed raw leakage scan, Q001 richness = 5, six sampled answer-quality checks averaged 5.00.

## Rollout Plan

Merge to main, build a digest-pinned Azure Container Apps image, deploy through the approved ACA path, then capture signed-in Q001 live model input/output/rendered proof before marking the release as live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release runbook.
- Shared runtime mutators: Intelligence Ask route and Claude synthesis prompt assembly.
- Approved image digest: pending.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: existing Intelligence synthesis environment flags; no new flag added.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback by reverting this release candidate or deploying the previous ACA image digest. No migrations are included.

## Audit Evidence

- Top 100 prompt audit summary: `docs/intelligence/TOP_100_PROMPT_AUDIT_SUMMARY_20260628.md`
- Q001 prompt audit artifacts under `docs/intelligence/prompt_audit/top_100/20260628/`
- Focused Jest and ESLint command output from this candidate branch.
- Pre-fix signed-in Q001 trace showed the API/browser proof lane working but exposed generated system-code labels; this was treated as a failed proof and patched before live-safe signoff.
- Post-cleaner signed-in Q001 trace showed model/renderer raw leakage fixed, but the Markdown table landed inside the Decision tab instead of a dedicated Table tab; this was treated as a renderer-placement proof failure and patched before live-safe signoff.
- Post-table-tab signed-in Q001 trace on `ca-abarva-web-lab-eastus--m6bbfc5da` showed the full right-canvas tab set: Decision, Industry Insights, Table, Chart, and Evidence. Renderer proof passed: left answer equaled Claude's main answer, tabs equaled parsed Claude tabs, Markdown tables were preserved in Table/Chart, and raw leakage scan passed.
- Third follow-up adds the adjacent-visual rule so future right-canvas tabs can surface useful related function/category/pattern visuals instead of repeating the answer text.
- Post-adjacent-visual signed-in Q001 browser proof on `ca-abarva-web-lab-eastus--me8c4c46c` showed the right-side canvas can render Decision, Chart, Table, and Evidence tab content, but exposed misleading `0` tab badges and a fallback `Grounding noted` label for function/category context. Fourth follow-up addresses that UI defect.
- Post-fourth-follow-up signed-in Lakeshore browser proof showed the right-side badges and context labels fixed, but an explicit industry trend chart request still produced a prose-only response without a Chart/Table tab. Fifth follow-up addresses that model-repair defect before live-safe signoff.

## Known Gaps

- Fifth follow-up deploy and signed-in regression are pending.
