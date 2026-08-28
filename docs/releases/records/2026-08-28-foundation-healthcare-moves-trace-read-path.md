# 2026-08-28-foundation-healthcare-moves-trace-read-path — Moves Trace Read Path

## Release ID

`2026-08-28-foundation-healthcare-moves-trace-read-path`

## Status

`candidate`

## Plain-English Summary

This release tightens the foundation healthcare demo Moves trace so it reads governed handoff rows through the tenant-aware data-plane path and only passes browser proof when all four trace steps are linked. It also makes an empty Moves workspace actionable by showing the existing draft candidates instead of a bare empty table, including the no-document default state.

## Layer Impact

- Release lane: `public-demo`.
- Layer 3 canonical / data plane: no schema or data mutation.
- Layer 4 products: Moves trace read-path selection and Moves workspace presentation change.
- QA: the Meridian Moves browser smoke now requires the full four-step trace, not a partial trace.

## Client Applicability

- All clients: no.
- Specific clients: foundation healthcare demo tenant.
- Internal only: no.
- Public/demo only: yes.
- Feature flag: existing Moves workspace feature flag still controls the workspace route.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/trace/page.tsx`
- `src/app/(maestro)/strategic-moves/[moveId]/workspace/page.tsx`
- `src/lib/data-plane/read-adapters/outcomeLedgerReadAdapter.ts`
- `src/lib/tower/outcome-ledger/index.ts`
- Foundation healthcare Moves browser smoke contract.
- `src/lib/data-plane/read-adapters/__tests__/outcome-ledger-read-adapter.test.ts`

## QA / Validation

- `npx jest src/lib/data-plane/read-adapters/__tests__/outcome-ledger-read-adapter.test.ts --runInBand` passed.
- `npm run ecl:meridian-phs-moves-browser:smoke -- --validate-contract` passed.
- `node --check scripts/ecl/run_meridian_phs_moves_browser_smoke.mjs` passed.
- Follow-on workspace candidate wiring is validated by the same signed-in Moves browser smoke after deployment.

## Rollout Plan

Open a PR, squash merge to `main`, deploy through the repo-owned Azure Container Apps workflow, then rerun the foundation healthcare Moves signed-in browser smoke against the default route. No governed data load is required for this code-only slice.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: not used directly.
- Approved image digest: produced by the repo-owned ACA workflow after merge.
- ACA runtime invariant: required before claiming the change is live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the foundation healthcare Moves smoke.

## Rollback Plan

Revert the PR and redeploy the previous ACA digest if the trace or workspace routes regress. No database rollback is needed.

## Audit Evidence

- PR URL after opening.
- ACA deploy workflow after merge.
- Signed-in Meridian Moves browser smoke summary and screenshots after deploy.

## Known Gaps

- This release does not create new workspace documents. The workspace remains honest about missing reviewed documents and exposes draft candidates only.
