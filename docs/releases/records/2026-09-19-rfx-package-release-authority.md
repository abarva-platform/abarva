# 2026-09-19 RFx Package Release Authority

## Release ID

`2026-09-19-rfx-package-release-authority`

## Status

`candidate`

## Plain-English Summary

Adds the governed decision for whether a sourcing-event package may be released to supplier recipients, and to which of them. It records the facts the recorded stage decision requires — disclosure scope, recipient authentication, expiry, revocation, receipt proof, do-not-contact enforcement, canonical entity plus named-contact binding, and an audit event on every evaluation — and refuses when any of them is absent. The furthest state it can reach is "ready for the human release gate". Nothing in the module transmits anything; real supplier contact and external transmission remain a separate human gate, as recorded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 decision helper. A pure function over inputs supplied by the caller.
- No canonical model change, no schema change, no adapter change, no outbound integration.
- Not yet mounted on a surface; this adds the decision and its proof.

## Client Applicability

- All clients: no client-facing change yet, because nothing calls this decision.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add `evaluateRfxPackageRelease`, returning one of four states: ready for the human release gate, blocked, expired, or revoked.
- Enforce contact policy at two levels, because a supplier that may be approached can still have an individual contact who may not be. A legal entity absent from the policy map is unknown, and unknown refuses.
- Order the outcomes so revocation outranks everything and package defects outrank expiry, so a package that was never well-formed cannot read as merely stale and be "fixed" by re-issuing it with a later date.
- Report receipt proof independently of release, so clearing a recipient never creates evidence that the recipient received anything. A receipt with no evidence hash is not a receipt.
- Emit the audit event on refusals as well as clearances, and record explicitly that no external transmission occurred.
- Add a behavior suite covering each required fact by removing it and pinning the refusal.

## QA / Validation

- PASS: new behavior suite passes 17 of 17 cases.
- PASS: mutation harness catches 13 of 13 seeded defects. An earlier run had one survivor — removing the empty-artifact-list check — which had no case of its own; a case was added and the rerun caught it. The harness asserts a green baseline of the expected case count before mutating and confirms a return to green after each restore.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on both new files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. No surface consumes the decision yet, so merging changes no rendered behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Nothing is rendered by this change.

## Rollback Plan

Delete the decision module and its behavior suite. Nothing imports them, so no runtime, data, or schema rollback is required.

## Audit Evidence

- Behavior suite output.
- Mutation harness output, including the surviving mutation and the case added to catch it.
- TypeScript and lint exit codes.

## Known Gaps

The supplier contact policies are supplied by the caller rather than read from the candidate-supplier authority directly, which keeps the decision pure and means the two are not yet joined in running code. The secure package store, the controlled response upload path, and the human release gate itself are all separate items. No storage, no transport, and no notification exist for any of this yet.
