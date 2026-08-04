# 2026-08-04-source-v4-operator-evidence-packaging - Source v4 Operator Evidence Packaging

## Release ID

`2026-08-04-source-v4-operator-evidence-packaging`

## Status

`candidate`

## Plain-English Summary

Packages the narrow Source v4 question-evidence contract directory into the Azure Container Apps
runtime image so the private operator job can run the Source v4 lab canary answer baseline inside
the same image used for the load. The change does not broaden runtime access to all docs.

## Layer Impact

- `client-data-lane`: enables the Source v4 lab canary job to read its governed question bank,
  coverage matrix and model-fit audit in ACA.
- CLIENT INTAKE: no change.
- SOURCE ADAPTERS: no schema change; only operator packaging changes.
- CANONICAL MODEL: no change.
- PRODUCTS: no UI behavior change.

## Client Applicability

- All clients: no user-facing behavior change.
- Specific clients: applies to the synthetic airline Source v4 lab canary operator path.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.dockerignore` now whitelists `docs/source/skyharbor-v4/**` while keeping the rest of docs
  excluded from the Docker context.
- `Dockerfile` copies that narrow directory into the runtime image for Container Apps Jobs.

## QA / Validation

- PASS: local Source v4 canary job plan-only run before this packaging fix.
- PENDING: ACA main deploy, runtime invariant, and private operator lab canary apply with answer
  baseline using the packaged evidence files.

## Rollout Plan

Merge through the normal PR path. The repo-owned ACA main deploy workflow builds the digest-pinned
image and shifts traffic after the runtime invariant passes. Then run the private operator Source v4
lab canary job with the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: ACA main deploy workflow only.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending merge/deploy.
- Worker image invariant: pending merge/deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no, because this is an operator data-load packaging fix.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. The operator job will again be unable to
run the Source v4 answer baseline unless the question-evidence files are supplied by another
controlled path. No database rollback is required for the packaging change.

## Audit Evidence

- PR checks and release check output.
- ACA deployment evidence artifact.
- Source v4 lab canary operator proof bundle after rerun.

## Known Gaps

- This does not itself create Cube models or Source UI proof.
- The Source v4 package remains synthetic pressure-test data, not client truth.
