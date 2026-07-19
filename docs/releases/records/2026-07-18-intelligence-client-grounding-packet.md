# 2026-07-18-intelligence-client-grounding-packet — Intelligence Client Grounding Packet

## Release ID

`2026-07-18-intelligence-client-grounding-packet`

## Status

`candidate`

## Plain-English Summary

Intelligence now assembles a client-specific grounding packet for AI strategy, AI trend, use-case, automation, current-state, tool-usage, and readiness questions before aVa/Claude writes the answer. This prevents aVa from giving a strong but generic consulting answer when richer client context exists in Azure. The same packet feeds the answer, suggested follow-ups, trace, companion canvas, and exportable answer packet through the existing safety gates.

## Layer Impact

- `global-control-lane`: Changes the shared Intelligence answer path for all tenants.
- `agent-context`: Adds one governed model-visible source packet assembled from already-retrieved tenant sources.
- `retrieval`: Expands V7 AI/use-case dimension selection to include systems, data, vendors, bridge, process evidence, benchmarks, and infrastructure/cloud context.
- `experience`: Suggested questions receive the same grounding context so follow-ups stay tenant-specific instead of generic.

## Client Applicability

- All clients: Yes, for tenants using `/api/intelligence/ask`.
- Specific clients: Meridian/Healthcare Demo was used as the primary reconciliation example because its richer enterprise context exposed the gap.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag; runs inside the existing Intelligence ask path.

## Changes Included

- `src/lib/intelligence/ask/client-grounding-packet.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/followups.ts`
- `src/lib/intelligence/ask/retrievers/v7-dossier.ts`
- `src/lib/intelligence/ask/__tests__/client-grounding-packet.test.ts`
- `src/lib/intelligence/ask/retrievers/v7-dossier.test.ts`
- `reports/intelligence-client-grounding-20260718/azure-layer-reconciliation.md`

## QA / Validation

Targeted regression:

```bash
npx jest src/lib/intelligence/ask/__tests__/client-grounding-packet.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts --runInBand
```

Result:

- Test suites: `2 passed`
- Tests: `6 passed`

Azure data-layer reconciliation:

- Local direct Postgres access confirmed private-network blocked.
- Read-only evidence captured through live ACA container with VNet database access.
- Meridian active V7 pack, enterprise context counts, chunk status, and CIO Tower AI portfolio mart counts documented in `reports/intelligence-client-grounding-20260718/azure-layer-reconciliation.md`.

## Rollout Plan

1. Open PR from `codex/intelligence-client-grounding`.
2. Squash merge to `main`.
3. Let the repo-owned ACA main deploy workflow build and deploy the exact merged SHA.
4. Verify ACA runtime invariant and health.
5. Run live Intelligence proof on `https://app.abarva.ai` using an AI agent-assist / industry-trend prompt and confirm the response mentions client current state, evidence gaps, and industry context separately.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No ad-hoc mutation; deploy only by repo workflow after merge.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR or redeploy the previous digest through the approved ACA main deployment path. Because this change only affects answer-source assembly and retriever dimension selection, rollback does not require data migration rollback.

## Audit Evidence

- PR: pending
- Targeted test output: 2 suites / 6 tests passed
- Reconciliation report: `reports/intelligence-client-grounding-20260718/azure-layer-reconciliation.md`
- ACA deploy proof: pending after merge
- Live signed-in proof: pending after deploy

## Known Gaps

- Live ACA deploy and signed-in proof are pending until this candidate merges.
- Enterprise context evidence registry count for Meridian is currently `0` even though sources, records, facts, relationships, and chunks exist; this is a separate data-quality/readout issue.
- Some rich enterprise context remains outside active V7. This release improves model visibility now; long-term cleanup should promote/reconcile the right sources into the canonical active context model.
