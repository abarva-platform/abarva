# 2026-09-08-source-generation-evidence-alias-binding - Canonical Evidence Binding

## Release ID

`2026-09-08-source-generation-evidence-alias-binding`

## Status

`candidate`

## Plain-English Summary

Source artifact generation now reads uploaded evidence across the registered aliases of the signed-in tenant. The quality reviewer also receives the approved event trigger and scope, so supported contract dates and intake facts are not rejected merely because they came from the event record.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source generation binds the complete tenant-scoped evidence set and reviews narrative claims against both uploaded evidence and approved event intake.

## Client Applicability

- All clients: Yes, where an application client key and canonical tenant key differ.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Resolve the registered alias set once and apply it at the artifact, chunk, and fact query hops.
- Preserve tenant fencing by accepting only aliases mapped to the same canonical tenant.
- Add approved event trigger and scope text to the deterministic quality-review source context.
- Bind up to sixteen parsed evidence files to flagship narrative prompts.
- Require strategy citations to use business filenames instead of internal identifiers.

## QA / Validation

- Source context-binder, quality-review, and prompt-registry tests: 67 passed.
- Alias-path regression test covers application key, canonical key, and session metadata alias.
- ESLint for touched files: pass.
- `git diff --check`: pass.
- TypeScript no-emit validation: pass with an 8 GiB heap after the default 4 GiB process exhausted memory.
- Release check: pass.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. Regenerate a controlled Source strategy artifact and verify that the full parsed evidence set is bound and that supported facts pass the deterministic gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof required: Yes

## Rollback Plan

Revert the squash commit through a new PR and deploy the revert SHA. No schema or tenant-data rollback is required.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, and release-check output
- Controlled generation response showing evidence filenames and supported event facts
- Signed-in artifact readback

## Known Gaps

- Parsed evidence remains draft evidence until human acceptance. This release improves binding and claim review; it does not change evidence approval state.
