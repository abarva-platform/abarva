# 2026-10-04-moves-capture-demo-enablement — Moves capture demo enrollment

## Release ID

`2026-10-04-moves-capture-demo-enablement`

## Status

`candidate`

## Plain-English Summary

Enrolls one synthetic demo tenant in four existing Moves capabilities: P1 charter basis tracking, the redesigned P0 capture flow, capture screen composition, and reviewed fill from pasted notes. The existing redesigned capture flow is already enabled for this tenant and is a prerequisite for the P0 and composition changes. No other tenant is enrolled by this change.

P1 can advance with a saved workspace assertion or an owned assumption with a P2 validation plan; an approved-evidence basis still requires matching approved evidence. P0 keeps its existing evidence and authorization gate. Pasted notes propose verbatim text for review and require a person to insert each fill. These behaviors become available only after the controlled main deployment. Enrollment alone is not signed-in product proof.

## Layer Impact

Release lane: `experimental` — tenant-scoped feature enrollment for an existing, non-default Moves capability.

- `4 PRODUCTS` (Moves): changes feature-flag resolution for one synthetic demo tenant and the generated description of those flags. The Moves presentation and P1 gate use the already merged implementations.
- `3 CANONICAL MODEL`: no new canonical object, key, schema, data load, or data mutation is introduced by this enrollment.
- `1 CLIENT INTAKE` and `2 SOURCE ADAPTERS`: no change.

## Client Applicability

- All clients: No.
- Specific clients: One synthetic demo tenant only, selected by the registry's `includeTenants` entries. No real client is included.
- Internal only: No.
- Public/demo only: Yes, for a signed-in synthetic demo walkthrough.
- Feature flag: `moves_charter_basis_v1`, `moves_capture_p0_v1`, `moves_capture_composition_v1`, and `moves_capture_notes_v1` are tenant-scoped. Other tenants retain their previous flag state.

## Changes Included

- `src/lib/features/registry.ts`: enrolls the synthetic demo tenant in the four flags and updates their descriptions to match the enrollment state.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md`: regenerated feature table from the registry.
- This release record documents scope, validation, rollout, rollback, and remaining proof.
- No migration, private data-plane build, environment-variable change, or shared-runtime command is part of this candidate.

## QA / Validation

- `npm run docs:nexus-manual` — **PASS**; regenerated the manual from the registry.
- `npm run docs:nexus-manual:check` — **PASS**; generated manual is current.
- Flag-scope probe via `isFeatureEnabled` — **PASS**; all four flags resolve on for the selected synthetic tenant and its canonical alias, and off for two other tenants and an absent tenant context.
- Focused Jest suites for feature resolution, P1 basis, phase capture, and notes review — **PASS**, 180 tests across 4 suites.
- `npx eslint src/lib/features/registry.ts` — **PASS**, no diagnostics.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit --pretty false` — **PASS**, no diagnostics.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**, all 11 release gates ran and passed.
- `git diff --check` — **PASS**, no whitespace errors.
- Signed-in walkthrough on the deployed demo tenant — **NOT RUN**; required after the main deployment before any live-proven claim.

## Rollout Plan

Open a PR against `main` and squash merge after local and PR validation. The repo-owned `.github/workflows/aca-main-deploy.yml` is the only path authorized to build and deploy the shared web image. After that workflow finishes, verify the approved digest against the Container App template, the revision holding all ingress traffic, and required worker images. Then perform the signed-in Moves walkthrough for the selected synthetic demo tenant and record the outcome separately. Do not call this release live-proven until both runtime and browser proof exist.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR; only the main workflow may change the shared web runtime or traffic.
- Approved image digest: assigned by the main workflow from the merged git SHA; not yet available for this candidate.
- ACA runtime invariant: template image and full-traffic revision must match the approved digest after deployment.
- Worker image invariant: required worker images must also match the approved digest before a live claim.
- Feature/env flag update path: registry `includeTenants` through the reviewed PR and main deployment; no ad-hoc environment update.
- Live signed-in proof required: Yes, for P0 capture, P1 basis and advancement, composition, and review/insert from notes.

## Rollback Plan

If the walkthrough fails, restore the four `includeTenants` lists to empty in a focused rollback PR and ship it through the same main deployment workflow. This removes the newly enrolled capability without migrating or deleting capture data. Verify the rollback digest and signed-in fallback behavior. Keep the existing capture-flow flag independently controlled.

## Audit Evidence

- The feature registry diff, regenerated manual diff, and this release record in the PR.
- Local manual check, flag-scope probe, focused Jest output, lint output, typecheck result, and `release:check` result recorded with the PR.
- Main workflow run, digest comparison, and signed-in walkthrough evidence are required after merge and are not yet available.

## Known Gaps

- No deployed runtime invariant or signed-in product proof has been captured for this enrollment.
- The release remains a candidate until the main workflow and walkthrough provide that evidence.
