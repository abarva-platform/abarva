# Tower registered assessment rollback operator

## Release ID

`2026-10-12-tower-registered-rollback-operator`

## Status

`candidate`

## Plain-English Summary

Adds a private operator job to return Tower to its prior reviewed assessment if a serving promotion needs to be reversed. The job accepts only the exact staged candidate and the saved, checksum-verified promotion proof. It checks both assessment generations before changing the active selector, then reads Tower's restored serving views and saves the result to private Blob.

## Layer Impact

Release lane: `client-data-lane`.

- Layers 1–3: no source, adapter, or canonical rows change.
- Layer 4: a guarded rollback can restore the prior Tower serving selector. It does not delete either assessment or edit projection values.

## Client Applicability

- All clients: no automatic data or serving change.
- Specific clients: only a tenant with an exact registered Tower promotion proof can use the operator.
- Internal only: private ACA operator job and proof readback.
- Public/demo only: no automatic change.
- Feature flag: none.

## Changes Included

- Adds a rollback entry point to the existing digest-pinned private ACA Job wrapper.
- Requires the exact stage ZIP, candidate hash, source fingerprint, stage receipt, promotion proof URI and SHA-256, and original approval reference. A pending or mismatched promotion proof is rejected.
- Rechecks the current promoted pointer, the saved prior page fingerprints, and the staged candidate page fingerprints inside the rollback transaction.
- Saves the rollback result, independent restored-selector and serving-page readback, progress, and job receipt to private Blob with byte-for-byte readback. A post-commit proof failure records a fresh selector observation for investigation.

## QA / Validation

- Node 24 focused operator tests: 28/28 passed.
- Focused ESLint and `node --check` passed on the changed scripts.
- Tests cover proof identity and checksum binding, prior page census, wrong served generation, changed sibling page, and ACA wrapper plan binding.
- No private job or database mutation was run for this release candidate.

## Rollout Plan

Merge through a protected PR and deploy the approved digest through the repo-owned ACA main workflow. Verify web template, 100% healthy traffic revision, and required worker images match that digest. Keep the job unused until an exact prior promotion proof exists and an operator reviews a plan-only request, fresh idle state, and rollback scope. The rollback uses the private Job; it does not change shared web traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture after deployment and bind to the private Job.
- ACA runtime invariant: verify the web template, 100% traffic revision, and required workers match.
- Worker image invariant: same approved digest as the web image.
- ACR build policy: only the repo-owned deploy workflow builds shared web images; this operator reuses its approved digest and does not build or prune images.
- Feature/env flag update path: none.
- Live signed-in proof required: after any actual rollback.

## Rollback Plan

If this code is unsuitable before use, revert it through a PR and deploy normally; it has not changed tenant data. After an actual selector rollback, retain both generations and investigate the private rollback and serving readback proofs before any new serving decision. Never retry a failed post-commit job without first reading the current selector.

## Audit Evidence

The PR, focused tests, release checks, deployment digest parity, operator plan, exact stage and promotion proof hashes, private rollback proof, private restored-serving readback, and idle restoration form the evidence trail. Proof files remain in private Blob.

## Known Gaps

No actual rollback or signed-in Tower check has run. This release adds the operator path only; it grants no serving approval and does not change the current active assessment.
