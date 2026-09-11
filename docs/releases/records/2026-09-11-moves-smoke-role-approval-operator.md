# 2026-09-11-moves-smoke-role-approval-operator — Moves Smoke Role Approval Operator

## Release ID

`2026-09-11-moves-smoke-role-approval-operator`

## Status

`candidate`

## Plain-English Summary

Adds a constrained operator script for approved synthetic Moves smoke runs that need distinct role approvals recorded through the private data-plane lane. The script validates the target Move and signed-off deliverable, writes only the required role approval rows for the deliverable's signed-off version, and reads the result back before exiting.

## Layer Impact

`client-data-lane`: Adds an internal operator entry point that can write role approval rows only when explicitly run with `APPLY=1` and target identifiers.

Client intake and product surfaces are unchanged. Canonical product data is affected only when an operator explicitly runs the new script with `APPLY=1`, a Move ID, a deliverable ID, and a JSON approval decision list.

## Client Applicability

- All clients: No automatic runtime behavior change.
- Specific clients: None.
- Internal only: Operator support for approved synthetic smoke execution.
- Public/demo only: Synthetic Moves proof runs.
- Feature flag: None.

## Changes Included

- `scripts/programs/record-smoke-role-approvals.ts`
- `package.json` script `moves:smoke:role-approvals:apply`

## QA / Validation

- Pass: `npx eslint scripts/programs/record-smoke-role-approvals.ts`
- Pass: operator wrapper `--plan-only` accepted the script, digest-pinned image, env overrides, and database secret reference shape.
- Pending: live operator execution after merge and ACA deployment, using the deployed digest-pinned image.

## Rollout Plan

Merge through PR, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then run the new npm script through the approved private ACA operator wrapper for the active synthetic smoke Move.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web image that also backs private operator jobs.
- Shared runtime mutators: Repo-owned deploy workflow for web runtime; private operator wrapper for the one approved data-plane write.
- Approved image digest: Captured after ACA deployment.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, as part of the synthetic Moves smoke run.

## Rollback Plan

Revert the script and package entry. Any role approvals already written are ordinary approval rows and must not be deleted without separate data-plane approval.

## Audit Evidence

- PR URL and CI checks.
- ACA deploy workflow run and runtime invariant proof.
- Private operator output directory with request, logs, summary, and readback JSON.
- Synthetic Moves smoke output directory.

## Known Gaps

The script does not create approvals automatically; an approved operator run must provide the target identifiers and approval decisions.
