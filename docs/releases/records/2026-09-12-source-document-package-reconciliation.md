# 2026-09-12-source-document-package-reconciliation — Source document package reconciliation

## Release ID

`2026-09-12-source-document-package-reconciliation`

## Status

`candidate`

## Plain-English Summary

When a governed contract document package is reloaded, stale document rows from that same package
are removed before the current document set is written. This prevents an earlier file identity from
remaining visible after the package has corrected it, while preserving a fail-closed boundary for
files that belong to another contract.

## Layer Impact

- **Lane:** `client-data-lane`
- **Layers:** Layer 2 source loading and Layer 3 document evidence projection. The loader reconciles
  package-scoped `doc.file`, `doc.page`, `doc.span`, and `doc.extraction` rows without changing the
  canonical contract facts.

## Client Applicability

- All clients: No.
- Specific clients: The synthetic tenant package used for Source Contract 360 validation.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/load-contract-depth-document-evidence.mjs` — package-provenance stale-file
  reconciliation and existing cross-contract identity guard.
- `scripts/source/__tests__/load-contract-depth-document-evidence.test.mjs` — behavior coverage for
  the narrow cleanup selector.
- `docs/releases/records/2026-09-12-source-document-package-reconciliation.md` — release controls.

## QA / Validation

- PASS: document evidence loader behavior tests, including same-package stale-file selection.
- PASS: JavaScript syntax and diff validation.
- PASS after merge: ACA deployment, runtime invariant, and the scoped document evidence job.
- Required after the follow-up reload: signed-in Source Evidence proof confirms the stale file is
  absent and the current package file set is visible.

## Rollout Plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, prove the digest-pinned
web and worker image invariant, then run the scoped ACA operator job for the affected package.

## Deployment Authority

- Repo-owned ACA deploy workflow: Required.
- Data mutation: ACA operator job only; no production web request performs the load.
- Live signed-in proof: Required for the affected Source Contract 360 Evidence tab.

## Rollback Plan

Rollback the web runtime to the prior approved digest if the loader regresses. No schema rollback is
required. The data job is idempotent and can be rerun with the approved package after correction.

## Audit Evidence

- PR: `https://github.com/abarva-platform/abarva/pull/7634`.
- ACA deployment digest and runtime invariant: captured in the deployment workflow artifact.
- ACA data-job proof: captured in the scoped operator-job output.

## Known Gaps

This release reconciles package-scoped document rows only. It does not invent missing documents or
resolve the separate portfolio register/depth identity gap.
