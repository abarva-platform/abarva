# 2026-09-22-source-evidence-review-reconciliation — Reconcile parsed review evidence

## Release ID

`2026-09-22-source-evidence-review-reconciliation`

## Status

`candidate`

## Plain-English Summary

The evidence-review route can now recognize an already-parsed event artifact when an older evidence-state row has not yet been linked to it. Reconciliation is allowed only when the existing canonical filename matcher maps that tenant-scoped, event-scoped, stage-scoped artifact to the exact requested evidence requirement.

## Layer Impact

- **Release lane — `global-control-lane`:** Shared Source New evidence-review behavior changes for all clients.
- **Layer 3 — Canonical model:** A human availability review can persist the exact parsed artifact link onto an existing evidence-state row. No bulk rebuild, migration, or inferred business fact is introduced.
- **Layer 4 — Products:** The signed-in review action and the checklist now use the same parsed-artifact basis.

## Client Applicability

- All clients: Yes, when an event has parsed artifacts and older unlinked evidence-state rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Update the Source evidence availability-review route to query parsed artifacts inside the resolved tenant, event, and stage.
- Reuse the canonical upload matcher and accept only an exact requirement match.
- Persist the matched artifact ID when the named human records an availability-only review.
- Add positive and negative route behaviors plus mutation proof for the matching guard.

## QA / Validation

- Red-first route test reproduced an unlinked legacy evidence row next to a matching parsed artifact.
- Focused route suite passes 10 of 10 behaviors.
- Mutation changing the exact requirement match makes the new reconciliation behavior fail.
- A parsed artifact mapped to another requirement remains rejected.
- Scoped ESLint, TypeScript, release check, and diff check are required before merge.
- Signed-in Source New replay is required after deployment.

## Rollout Plan

Squash-merge to `main`, deploy the exact commit through the repo-owned ACA main workflow, verify the digest-pinned web and worker runtime invariant, then replay the signed-in evidence-review preview before any governed write.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Template image, 100% traffic revision, and required worker images must match the approved digest.
- Worker image invariant: Required before deployment is reported complete.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main workflow. Existing review records are not deleted or downgraded.

## Audit Evidence

- Focused red/green and mutation output.
- Pull request and hosted CI results.
- Repo-owned ACA deployment and runtime-invariant artifact.
- Signed-in preview and separately confirmed availability-review before/after capture.

## Known Gaps

This release does not parse files, approve their content, advance an event, contact a supplier, or infer a match outside the canonical filename contract.
