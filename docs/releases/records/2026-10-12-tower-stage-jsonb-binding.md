# 2026-10-12-tower-stage-jsonb-binding — Correct JSONB stage bindings

## Release ID

`2026-10-12-tower-stage-jsonb-binding`

## Status

`candidate`

## Plain-English Summary

The private Tower stage job now sends JSON arrays and objects to PostgreSQL as JSON. An empty admission-results list must remain `[]` so the database can apply its admission rule. This corrects the write path for the already approved inactive candidate. It does not alter source data, computed amounts, or the serving selection.

## Layer Impact

Release lane: `client-data-lane`.

- Layers 1–3: source files, source adapters, and canonical candidate content are unchanged. The stage operation now writes the existing candidate's JSON fields in the database's required form.
- Layer 4: inactive projection rows use the same JSON binding. No serving pointer or product UI changes.

## Client Applicability

- All clients: no automatic data change.
- Specific clients: an exact approved assessment may be staged by its private operator job after readback confirms a safe retry.
- Internal only: stage operation and verification.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Serialize objects and arrays in `*_json` columns before binding SQL parameters. Ordinary scalar and SQL array fields keep their existing binding.
- Verify the empty admission-results list and representative source-lineage payloads at the SQL boundary.
- Update focused preflight tests to reflect that an exact load approval is now present.

## QA / Validation

- Focused stage and candidate tests passed (12 of 12). Integrated-insights behavior tests passed (51 of 51). Manifest validation passed. All 11 release gates passed. Focused ESLint and `git diff --check` passed locally. CI must repeat on the final PR head.
- The prior private stage run failed its admission constraint before commit. An independent read-only candidate-footprint check is required before another write.

## Rollout Plan

Merge by protected PR. The repo-owned ACA main workflow builds and deploys a digest-pinned image. Verify runtime digest parity, then use that exact image for a private ACA stage job with a new run ID and the existing assessment/source-set binding. Independently read back staged rows and proof. Serving promotion requires separate approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` exclusively shifts shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture after the main deploy and bind the private operator job to it.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required workers match the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved serving promotion, not for this inactive stage.

## Rollback Plan

Revert this code through a PR and rebuild the image. Keep an unverified candidate inactive. If any stage rows committed, stop automatic retries and reconcile them by exact assessment readback before further action.

## Audit Evidence

Inspect the PR diff and CI, focused test output, main deploy record, runtime digest readback, private ACA job execution, exact candidate row counts, inactive lifecycle selection, and private proof receipt.

## Known Gaps

The candidate's existing source conflicts and unknown amounts are unchanged. This release does not approve or perform serving promotion.
