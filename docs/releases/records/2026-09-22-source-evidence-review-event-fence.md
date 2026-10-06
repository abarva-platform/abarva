# 2026-09-22-source-evidence-review-event-fence — Reconcile event-scoped parsed evidence

## Release ID

`2026-09-22-source-evidence-review-event-fence`

## Status

`candidate`

## Plain-English Summary

The Source New evidence-review route can now reconcile a parsed artifact when the event and artifact registries use different accepted aliases for the same client. The exact source-event record, workflow stage, parse state, and canonical filename match remain mandatory, so evidence from another event cannot satisfy the review.

## Layer Impact

- **Release lane — `global-control-lane`:** Shared Source New evidence-review behavior changes for all clients.
- **Layer 3 — Canonical model:** Reconciliation uses the verified source-event identity rather than requiring two canonical registries to repeat the same client-key spelling. No data is inferred or migrated.
- **Layer 4 — Products:** A named reviewer can preview an availability-only review for already-parsed evidence that belongs to the exact event and requirement.

## Client Applicability

- All clients: Yes, when accepted client aliases differ between the event and artifact registries.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Keep parsed-artifact reconciliation fenced to the verified source-event row, workflow stage, parse state, and canonical requirement matcher.
- Remove the redundant client-key equality that rejected the same event under an accepted registry alias.
- Add a regression for the observed scope-evidence filename and an opposite-event isolation behavior.

## QA / Validation

- Red-first route test reproduced the accepted-alias mismatch and failed with `409 parsed_evidence_required` before the route change.
- Focused route suite passes 12 of 12 behaviors after the change.
- Mutation removing the source-event equality makes the opposite-event test fail, proving that the isolation guard is exercised.
- Scoped ESLint, TypeScript, release check, and diff check are required before merge.
- Signed-in Source New replay is required after deployment.

## Rollout Plan

Squash-merge to `main`, deploy the exact commit through the repo-owned ACA main workflow, verify the digest-pinned web and worker runtime invariant, then replay the signed-in review preview before any governed write.

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

- Focused red/green and event-fence mutation output.
- Pull request and hosted CI results.
- Repo-owned ACA deployment and runtime-invariant artifact.
- Signed-in preview and separately confirmed availability-review before/after capture.

## Known Gaps

This release does not parse files, approve content, advance an event, contact a supplier, or infer a match outside the exact source-event and canonical filename contracts.
