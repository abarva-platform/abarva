# 2026-09-22-authenticated-profile-name-precedence — Preserve authenticated profile names

## Release ID

`2026-09-22-authenticated-profile-name-precedence`

## Status

`candidate`

## Plain-English Summary

When an authenticated user has a valid profile name but the linked person row still carries a generic placeholder, the application now uses the authenticated profile name. Valid names already recorded on person rows remain authoritative.

## Layer Impact

- **Release lane — `global-control-lane`:** This is shared authenticated-user resolution behavior used across product surfaces.
- **Layer 4 — Products:** Shared authenticated-user resolution now rejects generic placeholder names before choosing the display and reviewer identity presented to product workflows.
- **Layer 3 — Canonical model:** No canonical records are changed by this release. The existing person identifier and tenant boundaries remain unchanged.

## Client Applicability

- All clients: Yes, for authenticated product workflows that consume `getCurrentUser()`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Update `src/lib/auth/current-user.ts` to treat generic stored person names as unusable when an authoritative authenticated profile name is available.
- Extend `src/lib/auth/__tests__/current-user-authoritative-profile.test.ts` with placeholder and valid-name precedence behavior.

## QA / Validation

- Focused behavioral test passes for missing-person, placeholder-person, and valid-person-name cases.
- Mutation proof: restoring placeholder-first precedence makes the placeholder-person test fail.
- Scoped ESLint, TypeScript, release check, and diff check are required before merge.
- Signed-in Source evidence-review replay is required after the repo-owned deployment.

## Rollout Plan

Squash-merge to `main`, allow the repo-owned ACA main deployment workflow to build and deploy the exact commit, verify the digest-pinned runtime invariant, then replay the affected signed-in workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Template image, 100% traffic revision, and required worker images must match the approved digest.
- Worker image invariant: Required before deployment is reported complete.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main deployment workflow. No database rollback or data mutation is required.

## Audit Evidence

- Focused test and mutation output from the release branch.
- Pull request and hosted CI results.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in evidence-review before/after proof captured separately from deployment evidence.

## Known Gaps

This release repairs authenticated name precedence only. It does not itself approve evidence, advance a sourcing stage, or mutate canonical person rows.

## Signed-in proof reconciliation (item C-548)

- Ran: a signed-in replay was run and is reported in the execution register at `2026-09-22T08:51:52Z`
  by `codex-cpo-source-new-smoke` against PR #8238 — a signed-in replay of the deployed build confirmed the reviewer-identity blocker was removed, and the next live action exposed a separate state contradiction.
- Outcome as the register states it: reported as meeting this record's acceptance. The separate contradiction the same replay exposed was carried forward as its own claim and is not a defect of this release.
- Provenance: this section reconciles the durable record with the operator register under item
  C-548; it is not a first-hand observation by its author, and no proof was re-executed to write
  it. The QA/Validation bullet above was accurate when this record was authored and is superseded
  here by an appended correction rather than by a restamp, per the register time-authority rule.
