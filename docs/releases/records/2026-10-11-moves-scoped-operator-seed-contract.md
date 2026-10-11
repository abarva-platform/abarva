# 2026-10-11 — Scoped Moves operator and register binding

## Release ID

`2026-10-11-moves-scoped-operator-seed-contract`

## Status

`candidate`; no account, Move, register row, or value case has been created by this release candidate.

## Plain-English Summary

An automated proof account can be recognized only when its signed Clerk profile declares one synthetic tenant, Programs access, assigned-program scope, and the exact delegated capabilities. Its person record binds to the Clerk user ID, its sole client membership carries limited create, gate, and financial rights without user administration, and its own newly created Move receives a participant row. Other Moves remain outside its assigned scope. A separate seed contract freezes 22 proposed synthetic register rows and refuses a changed source pack, missing Move/operator binding, or stale register IDs. The load manifest has no load approval.

## Layer Impact

- Release lanes: `global-control-lane` for signed-in access, `client-data-lane` for the scoped seed declaration, and `internal-admin` for operator identity handling.
- Layer 1: no intake change. The proposal remains a synthetic preparation artifact.
- Layer 2: no adapter change.
- Layer 3: potential identity and participant rows only after a signed-in account uses the flagged product path. The seed contract writes no register row.
- Layer 4: Programs and Moves access policy can resolve the dedicated account as a scoped member rather than a tenant administrator.

## Client Applicability

- All clients: existing user paths are unchanged.
- Specific clients: one canonical synthetic demo tenant under the tenant feature flag and exact signed account profile.
- Internal only: account provisioning and operator seed preparation.
- Public/demo only: synthetic proof runs after separate activation.
- Feature flag: `moves_synthetic_e2e_operator_v1`, enabled only for the synthetic demo tenant.

## Changes Included

- Exact signed-profile validation, Clerk-to-person identity binding, scoped membership, and tenant audit entry.
- Explicit denial of Source and tenant-admin approval routes for the dedicated profile; the Programs policy bypasses legacy email-based admin shortcuts for this profile.
- Participant assignment for a newly created Move through the product write adapter.
- A read-only source-set and register-ID binding contract for the 22-row proposal.
- A manifest declaring the proposed dataset with `load_approval: null`.

## QA / Validation

- Focused identity and binding tests passed, including cross-tenant, elevated-role, changed-source, and ID-collision refusals.
- The new Source denial test passed. Four existing Source policy tests expecting a separate canonical-admin email mapping remain failing in the broader Source suite; they do not exercise this profile.
- Typecheck, scoped lint, release check, manifest validation, and whitespace check passed locally.
- Regenerated the CI test-coverage census from this rebased tree: 2,999 to 3,005 tests, 2,835 to 2,841 reached by pull-request workflows, and 164 still unreached. The tenancy-fence census and Nexus manual regenerated with no diff.
- No live account or data-plane mutation was used to validate this candidate.

## Rollout Plan

Review and merge through a PR. The repo-owned main deployment workflow is the only path to activate shared web code. The dedicated Clerk account and feature flag must be verified against the exact signed profile before it creates a fresh Move. Bind the seed to that Move's authenticated client, fresh register census, source hash, operator person, and approval reference. A separate reviewed operator job and named load approval are required before any register apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: pending main deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: no worker update.
- Feature/env flag update path: tenant-scoped flag in the committed registry.
- Live signed-in proof required: yes, for own-tenant access and denial of other-tenant and unassigned-Move access.

## Rollback Plan

Revert the candidate through a PR and the main deployment workflow. A created identity or participant row, if any, needs a separately authorized scoped correction with its audit history retained. No seed row needs rollback because this candidate cannot apply it.

## Audit Evidence

Review this release record, the manifest, proposal/source hashes emitted by the seed contract, focused tests, and the PR checks when available. Production identity and tenant-access evidence are pending.

## Known Gaps

The fresh Move, live ID/revision preflight, bound seed, apply writer, named load approval, and signed-in product proof are pending. The current P3 page holds one selected pod; a two-option owner choice is not persisted by this candidate. Move creation and participant assignment use separate writes; if assignment fails, the route stops and an operator must inspect the fresh Move before retrying.
