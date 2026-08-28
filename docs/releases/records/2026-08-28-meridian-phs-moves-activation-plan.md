# 2026-08-28-meridian-phs-moves-activation-plan — Meridian Moves Activation Plan

## Release ID

`2026-08-28-meridian-phs-moves-activation-plan`

## Status

`candidate`

## Plain-English Summary

This release adds a controlled activation package for the Meridian/PHS Moves demo lane. It creates
an idempotent SQL plan that can turn declared Meridian programs into operational Moves rows, with
module state, milestones, work items, risks and pattern-match records. The package does not connect
to a database and does not claim live proof; it prepares the governed data-build step that must run
before signed-in Moves route proof can pass.

## Layer Impact

- Layer 2/source adapters: consumes the dense SP07 PPM source-room extract when supplied.
- Layer 4/products: prepares Moves operational rows consumed by the existing Strategic Moves routes.
- Proof/control plane: extends Meridian/PHS status reporting with a separate Moves activation metric.

## Client Applicability

- All clients: no.
- Specific clients: Meridian/PHS demo tenant only.
- Internal only: proof and operator workflow.
- Public/demo only: yes, for the current Meridian/PHS demo lane.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_meridian_phs_moves_activation_plan.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-plan-tests.mjs`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/MERIDIAN_PHS_DEMO_READINESS_PLAN_2026_08_28.md`
- `package.json`

## QA / Validation

- Pass: `node --check scripts/ecl/write_meridian_phs_moves_activation_plan.mjs`
- Pass: `node --check scripts/ecl/__tests__/run-meridian-phs-moves-activation-plan-tests.mjs`
- Pass: `npm run test:ecl-meridian-phs-moves-activation`
- Pass: `node scripts/ecl/write_meridian_phs_demo_status.mjs --moves-activation-proof <summary.json> --json`
- Not run yet: governed ACA data-build execution of the generated SQL.
- Not run yet: signed-in Moves browser proof after data-build execution.
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge by PR only. This release does not deploy web code by itself and does not mutate Azure data.
The generated SQL must be executed later through the governed ACA data-build job, followed by
independent readback and signed-in Moves browser proof.

## Deployment Authority

- Repo-owned deploy workflow: not required for this local proof package.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the governed data-build job loads the activation SQL.

## Rollback Plan

Before the SQL is run, rollback is removing the script/status changes. After the SQL is run, rollback
is a scoped deletion or archive of the generated demo Move IDs listed in the proof summary, executed
through a governed data-build job.

## Audit Evidence

- Generated proof summary from `ecl:meridian-phs-moves-activation:plan`.
- Test output from `test:ecl-meridian-phs-moves-activation`.
- PR review and merge record.

## Known Gaps

The package prepares operational Moves rows but does not load them, read them back from Azure, or
prove the signed-in Moves routes. Browser proof remains pending until the governed data-build step
has completed.
