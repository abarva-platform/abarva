# 2026-09-08-source-scope-evidence-and-citation-hygiene - Scope Evidence and Citation Hygiene

## Release ID

`2026-09-08-source-scope-evidence-and-citation-hygiene`

## Status

`candidate`

## Plain-English Summary

Source scope generation now receives the approved event trigger, intake boundaries, and parsed uploaded evidence. Model and quality-review context uses business filenames and neutral evidence references instead of internal artifact identifiers.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source artifact generation and consulting-grade review context only.

## Client Applicability

- All clients: Yes.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Bind approved event trigger and scope intake to Scope Memo generation.
- Bind parsed uploaded evidence to Scope Memo generation.
- Remove internal artifact identifiers from model and reviewer context while preserving evidence linkage semantics.
- Advance the Scope Memo prompt version so regenerated drafts use the stronger context contract.

## QA / Validation

- Focused Source prompt-registry and quality-review tests: pass.
- ESLint for touched TypeScript files: pass.
- TypeScript no-emit validation: pass with an 8 GiB heap.
- Release policy validation: pass.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Regenerate a controlled Scope Memo and verify that it cites business filenames, respects approved intake boundaries, and contains no internal identifiers.

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
- Controlled Scope generation response and signed-in artifact readback

## Known Gaps

- Parsed evidence remains draft evidence until human acceptance. This change improves drafting context and client-facing hygiene; it does not change evidence authority.
