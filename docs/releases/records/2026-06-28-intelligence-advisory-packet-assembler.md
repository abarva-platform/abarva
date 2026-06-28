# 2026-06-28-intelligence-advisory-packet-assembler — Intelligence AdvisoryPacket Assembler

## Release ID

`2026-06-28-intelligence-advisory-packet-assembler`

## Status

`candidate`

## Plain-English Summary

Intelligence now has a reusable AdvisoryPacket assembler that separates the context Claude can see from audit-only lineage and retrieval diagnostics. The same assembler is wired into live Intelligence Ask and the local Top 100 prompt audit so the audit path cannot drift into a demo-only packet format.

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
- `src/lib/intelligence/ask/index.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`
- `scripts/intelligence/generate-top-100-advisory-packet-audit.ts`
- `docs/intelligence/prompt_audit/top_100/20260628/`
- `docs/intelligence/TOP_100_PROMPT_AUDIT_SUMMARY_20260628.md`

## QA / Validation

- `npx jest src/lib/intelligence/advisory-packet/__tests__/advisory-packet.test.ts --runInBand` passed, 9 tests.
- `npx eslint src/lib/intelligence/advisory-packet src/lib/intelligence/ask/index.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/app/api/intelligence/ask/route.ts scripts/intelligence/generate-top-100-advisory-packet-audit.ts` passed.
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

## Known Gaps

- Live signed-in Q001 trace artifacts are not yet captured.
- Local-vs-live Q001 packet diff is not yet saved.
- Renderer preservation is unit-tested locally, but live browser renderer proof is still pending.
