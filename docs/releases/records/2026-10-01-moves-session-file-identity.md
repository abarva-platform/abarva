# 2026-10-01 — Preserve Independent Moves Session Files

## Release ID

`2026-10-01-moves-session-file-identity`

## Status

`candidate`

## Plain-English Summary

Workshop and session uploads are now versioned by phase and filename, so distinct sessions remain independently current in the Move artifact vault. Re-uploading a corrected file under the same name continues that file's version history rather than replacing unrelated session notes.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical artifact registry: session artifact identity is scoped to its phase and filename, preserving separate uploaded records and their version lineage.
- Moves File Cabinet: distinct session uploads remain available together to review and downstream generation.

## Client Applicability

- All clients: Applies to Moves session/workshop uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `artifactTypeForUpload` assigns a stable, phase- and filename-scoped artifact type to session files.
- Upload helper tests cover independent session identities and same-file revisions.

## QA / Validation

- Targeted upload identity suite: `pass` (4/4 tests).
- Typecheck: `pass`.
- ESLint on changed TypeScript files: `pass`.
- Release check: `fail` on this candidate because the record initially omitted the required lane and result-state declarations; correction is in this candidate and the gate will be rerun.
- CI and signed-in synthetic smoke: `not run` pending push, deployment, and resumed product verification.

## Rollout Plan

Merge to `main`; deploy only through the repository-owned ACA main deploy workflow. Existing artifact rows are not rewritten. New session uploads use the corrected identity; to restore any prior superseded session as current, upload that source again through the normal File Cabinet flow after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Verify template image and 100%-traffic revision image match the approved digest.
- Worker image invariant: Verify required worker jobs use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify two differently named session files remain current together and a same-name revision versions only its own file.

## Rollback Plan

Revert the code through a reviewed PR and deploy the rollback through the repository-owned ACA workflow. No migration or existing row rewrite is required. Session uploads made after deployment remain intact; the prior identity behavior would affect only subsequent uploads.

## Audit Evidence

- PR and CI results: Pending.
- Deployment SHA, revision, and image digest: Pending.
- Signed-in smoke result: Pending.

## Known Gaps

Existing session records already superseded by the former shared identity remain in version history. Re-upload those source files after deployment if they need to be current again.
