# 2026-09-08-source-event-intake-evidence-binding - Event Intake Evidence Binding

## Release ID

`2026-09-08-source-event-intake-evidence-binding`

## Status

`candidate`

## Plain-English Summary

Source artifact generation now binds the persisted event trigger and scope as separate intake facts. Parsed agreement files with structured facts can support filename-cited governed drafts, while page or row locator review remains required before external issue.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source event context binding and consulting-grade artifact review.

## Client Applicability

- All clients: Yes.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Preserve the persisted trigger and scope independently in Source event detail reads.
- Bind explicit intake fields into generation with compatibility fallbacks for older seeded events.
- Recognize parsed agreement files with bound excerpts or structured facts as usable governed-draft evidence.
- Keep page and row locator review visible as a remaining pre-issue action.
- Teach the quality reviewer to distinguish evidence-gap statements from unsupported market assertions.
- Bump the Strategy prompt contract to version 4.

## QA / Validation

- Focused Source context, prompt, quality-review, and event-mapping tests: 74 passed.
- Scoped ESLint: pass.
- TypeScript no-emit validation: required before merge.
- Release and diff policy checks: required before merge.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Regenerate the controlled Strategy artifact and require the deterministic and consulting-grade gates to pass before event progression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof? Yes

## Rollback Plan

Revert the squash commit through a new PR and deploy the revert SHA. No schema or tenant-data rollback is required.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, release-check, and diff-check output
- Controlled signed-in generation response and artifact readback

## Known Gaps

- Parsed files remain governed draft evidence. Final external issue still requires citation locator review and the normal approval gate.
