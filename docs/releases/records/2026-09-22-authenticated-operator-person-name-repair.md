# 2026-09-22-authenticated-operator-person-name-repair — Preserve Authenticated Operator Names

## Release ID

`2026-09-22-authenticated-operator-person-name-repair`

## Status

`candidate`

## Plain-English Summary

Signed-in operator accounts can have a valid Clerk profile even when their session token omits first and last name fields. The application now reads the authenticated Clerk profile for that missing display name and repairs a canonical person row only when its existing name is a known placeholder. This lets governed human-review actions attribute a real named reviewer without weakening their identity checks.

## Layer Impact

- **Release lane — `global-control-lane`:** shared authenticated identity resolution and guarded reviewer attribution apply consistently across client workspaces.
- **Layer 3 — Canonical model:** identity-only provisioning may replace a placeholder person name with the authenticated Clerk profile name. No business facts, evidence, contracts, sourcing events, or approvals are changed.
- **Layer 4 — Products:** guarded review surfaces can consume the repaired canonical person identity while preserving their existing fail-closed checks.

## Client Applicability

- All clients: Yes, for signed-in operator identities whose JWT omits name claims.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reuse Clerk's authenticated user profile when JWT name claims are absent.
- Repair only blank or known-placeholder canonical person names during existing JIT identity provisioning.
- Preserve valid existing person names and all current tenant, role, and review guards.

## QA / Validation

- Red-first unit coverage proved both prior failures: missing JWT names returned `User`, and an existing placeholder person name was not repaired.
- Focused Jest suite: 12 tests passed.
- Mutation proof removed the authoritative profile fallback and the `User` placeholder classification; both new tests failed.
- TypeScript, focused ESLint, release check, and diff check passed before PR creation.
- The repository-owned test census was refreshed after the new auth test changed the measured directory total; the census check and its behavior ratchet pass at 20 auth tests with 14 covered by pull-request workflows.

## Rollout Plan

Squash merge to `main`, then use the repository-owned Azure Container Apps main deploy workflow. No migration or data-build job is required. The next signed-in request performs the narrowly scoped identity repair when needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Required before deployment is claimed.
- Worker image invariant: Required before deployment is claimed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, repeat the guarded reviewer-preview and evidence-availability action.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned workflow. Existing non-placeholder names are never overwritten, so rollback requires no data correction.

## Audit Evidence

- Focused Jest and mutation outputs.
- Pull request and hosted checks.
- Repo-owned deployment run and runtime-invariant artifact.
- Signed-in reviewer preview and resulting activity/readiness state.

## Known Gaps

This change does not authorize legal, security, commercial, supplier, finance, artifact-final, or lifecycle decisions. Those remain separate governed actions.
