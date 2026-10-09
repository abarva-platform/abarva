# 2026-10-08-architecture-artifact-export-readback — Restore structured architecture on export

## Release ID

`2026-10-08-architecture-artifact-export-readback`

## Status

`candidate`

## Plain-English Summary

An architecture artifact stores both a document and a structured architecture model. On later PowerPoint download or draft acceptance, the product used only the document. This change restores and validates the saved model before either render, so the exported deck carries its governed exhibits and must pass semantic checks. A missing or invalid model fails the architecture export.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: generated deliverable export and approval paths use the complete stored artifact. Canonical data and source adapters do not change.

## Client Applicability

- All clients: architecture artifact PowerPoint downloads and draft acceptance.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing architecture generation enrollment remains unchanged.

## Changes Included

- Restore the persisted architecture model in the artifact download and draft-acceptance routes.
- Mark renderer-created architecture section dividers in PowerPoint metadata so the physical deck judge can apply its existing divider role. Other thin slides, empty canvases, and off-canvas objects remain failures.
- Verify an exported deck from the API route has all governed architecture exhibits and that export fails when the required model is absent.

## QA / Validation

- PASS: 51 focused route and deck tests; scoped ESLint; coverage census regenerated.
- PASS: full typecheck and release check, 11 of 11 gates.
- NOT RUN: signed-in artifact export and rendered slide review after deployment.

## Rollout Plan

Squash merge the scoped PR to main. The repo-owned ACA main deploy workflow builds and deploys the approved digest. Verify web and worker image parity before the signed-in export check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, download and inspect a generated architecture PowerPoint file.

## Rollback Plan

Revert the PR through the protected branch and redeploy the prior approved digest via the repo-owned workflow. Existing stored artifact metadata is unchanged.

## Audit Evidence

PR checks, route test output, deck inspection, ACA deploy run, runtime invariant proof, and signed-in exported-file inspection.

## Known Gaps

Previously generated artifacts without a stored architecture model cannot produce the governed architecture deck. They need a new governed generation run.

The Word export still uses the document's own exhibit payload and does not draw the separately stored architecture model. Its figure coverage requires a separate quality fix and review.
