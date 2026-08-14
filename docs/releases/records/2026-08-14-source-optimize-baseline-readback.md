# 2026-08-14-source-optimize-baseline-readback — Restore persisted baseline readback

## Release ID

`2026-08-14-source-optimize-baseline-readback`

## Status

`candidate`

## Plain-English Summary

Source Optimize Contract was not reading an already-persisted commercial baseline
because the read adapter ordered baseline rows by a timestamp column that the
baseline table does not define. The query failed, the defensive read path returned
an empty baseline, and the workflow stayed blocked at "Lock baseline" even when a
governed baseline row existed.

This release aligns the read query with the actual baseline table contract. Missing
baselines still remain missing, and conflicting baselines still remain conflicts;
the change only restores visibility to persisted baseline rows that already exist.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Optimize Contract now projects the existing Layer 3
  baseline spine correctly instead of falling back to a partial missing-baseline
  state.
- Layer 3 Canonical Enterprise Model: No schema, facts, calculations, or stored
  amounts change.

## Client Applicability

- All clients: yes, for tenants using the shared Source Optimize Contract
  opportunity spine.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`: removes a dependency on a
  nonexistent timestamp column when reading `source.optimization_baseline`.
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`:
  adds a regression assertion that the persisted baseline query does not depend
  on that timestamp column.

## QA / Validation

- Live read-only ACA diagnostic against the deployed database showed the sampled
  contracts fell into three distinct states by counting basis:
  - contract register only, with no persisted opportunity rows and no pricing
    schedule rows;
  - persisted baseline conflict where pricing schedule annual value exceeded
    stated annual value beyond tolerance;
  - persisted baseline ready where pricing schedule annual value reconciled to
    stated annual value and opportunity/calculation rows existed.
- Pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand`
- Pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the digest-pinned web image. After deployment, run the runtime
invariant check and signed-in Source Optimize browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: produced by the workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and merge through the same repo-owned deploy workflow. No data
rollback is required because no schema or stored rows change.

## Audit Evidence

- PR URL after publication.
- GitHub Actions ACA main deploy run after merge.
- ACA runtime invariant output after deploy.
- Signed-in browser proof that a contract with a ready persisted baseline advances
  past "Lock baseline", while a contract with a conflicting baseline remains
  blocked as a conflict and a contract with no pricing schedule remains missing.

## Known Gaps

This release does not create missing optimization evidence for contracts that have
only contract-register rows. It also does not resolve baseline conflicts; those
remain governed data-quality issues to fix in the source evidence package or
projection job.
