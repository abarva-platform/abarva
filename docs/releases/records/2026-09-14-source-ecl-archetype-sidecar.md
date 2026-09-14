# 2026-09-14-source-ecl-archetype-sidecar - Source ECL archetype coverage

## Release ID

`2026-09-14-source-ecl-archetype-sidecar`

## Status

`candidate`

## Plain-English Summary

Source Coverage can now read declared contract archetypes from the canonical
data layer when the ECL serving projection does not carry the archetype field.
This prevents the archetype section from appearing empty when governed
classification exists, while keeping the contract-book denominator explicit.

## Layer Impact

- **Release lane: `global-control-lane`.**
- **Layer 3 - Canonical model:** read-only access to declared archetype values
  already persisted on canonical contract objects. No schema or data mutation.
- **Layer 4 - Products:** the Source ECL portfolio adapter and Coverage
  projection enrich matching register rows and show non-matching canonical
  rows as supplemental archetype coverage.

## Client Applicability

- All clients: tenants using the ECL Source workspace provider receive the
  read-path behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source ECL portfolio adapter reads canonical declared archetype rows.
- The follow-up read uses the physical canonical `annual_value` field rather
  than a Layer 4 projection alias.
- Source Coverage groups canonical supplemental rows without changing the
  register denominator or inferring classifications.
- Focused regression coverage protects the ECL read path and Coverage counts.
- No migration, loader, or Azure data-build job is included.

## QA / Validation

- **PASS:** focused Jest suites for the Source ECL adapter and Coverage
  projection; 60 tests passed.
- **PASS:** regression guard rejects projection-only annual-value aliases in
  the canonical archetype query.
- **PASS:** ESLint for all changed Source files.
- **PASS:** `git diff --check`.
- **PASS:** `npm run release:check` after this record was brought into the
  required release schema.
- **BLOCKED:** full local TypeScript validation is affected by pre-existing
  generated Next.js route/type errors outside the changed files; no changed
  file error was reported.
- **REQUIRED after deployment:** live signed-in Coverage proof confirming
  declared rows render when canonical rows exist and the register denominator
  remains separate.

## Rollout Plan

Merge through the protected `main` branch, then use the repo-owned Azure
Container Apps deployment workflow to build the exact merge SHA, deploy the
digest-pinned image, shift traffic, and run the required runtime and signed-in
Source proof. No data-plane job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the repo-owned ACA main deployment workflow only.
- Approved image digest: assigned by the deployment workflow for the exact
  merged commit.
- ACA runtime invariant: template image, 100% traffic revision image, and
  required worker images must match the approved digest.
- Worker image invariant: unchanged; no worker data-build is included.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Coverage route and archetype
  content readback.

## Rollback Plan

Revert the change through a PR or restore the previous digest-pinned ACA image
using the repo-owned deployment workflow. No database rollback is required
because the release only adds a read-only canonical query.

## Audit Evidence

- Pull request and merge commit for this release.
- Focused Jest and ESLint output.
- `npm run release:check` output.
- ACA deployment workflow run and digest/runtime invariant output.
- Post-deployment signed-in Source Coverage proof.

## Known Gaps

The separate register and canonical-depth identifier populations still require
an authoritative identity bridge before all contract-book rows can be
classified. This release does not fabricate that bridge and does not reload or
mutate Azure data. A sanctioned ACA data-build job remains a separate,
manifested operation when that mapping is available.
