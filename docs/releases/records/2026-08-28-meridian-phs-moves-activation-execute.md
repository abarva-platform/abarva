# 2026-08-28-meridian-phs-moves-activation-execute — Meridian Moves Activation Execute Wrapper

## Release ID

`2026-08-28-meridian-phs-moves-activation-execute`

## Status

`candidate`

## Plain-English Summary

This release adds the governed execution wrapper for the Meridian/PHS Moves activation package.
The wrapper is intended to run inside the private ACA operator job: it regenerates the dense
Meridian source room, writes the activation SQL, applies it through the approved database secret,
proves idempotency with a second apply, and reads back the activated Move rows by their activation
marker.

## Layer Impact

- Layer 2/source adapters: regenerates the Meridian dense source-room input used by the Moves
  activation package.
- Layer 4/products: loads operational Move rows consumed by Strategic Moves routes after the ACA
  data-build job runs.
- Proof/control plane: emits an ACA proof bundle with row counts, SQL hash, readback, and
  idempotency result.

## Client Applicability

- All clients: no.
- Specific clients: Meridian/PHS demo tenant only.
- Internal only: governed data-build operation.
- Public/demo only: yes, for the Meridian/PHS demo lane.
- Feature flag: none.

## Changes Included

- `scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`
- `package.json`

## QA / Validation

- Pass: `node --check scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- Pass: `node --check scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`
- Pass: `npm run test:ecl-meridian-phs-moves-activation-execute`

## Rollout Plan

Merge by PR only. After the repo-owned ACA main deploy builds a digest-pinned image containing this
wrapper, run it through `npm run ops:aca-job` with the approved database secret and explicit
Meridian/PHS execution environment. Then run signed-in Moves browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required before running the ACA operator job with this script.
- Shared runtime mutators: private ACA operator job only.
- Approved image digest: required from the repo-owned ACA main deploy.
- ACA runtime invariant: required before claiming the script is available in the live image.
- Worker image invariant: required by the ACA operator wrapper.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after load/readback.

## Rollback Plan

Before execution, revert this PR and redeploy the previous digest. After execution, rollback is a
scoped archive or deletion of rows whose charter carries
`activation_basis=meridian_phs_demo_moves_activation_plan`, executed through the same governed ACA
operator path.

## Audit Evidence

- Local execute-wrapper test output.
- ACA operator job proof bundle after execution.
- Signed-in Moves route proof after data load.

## Known Gaps

This release adds the executable load path but does not itself run the ACA data-build job or claim
browser proof.
