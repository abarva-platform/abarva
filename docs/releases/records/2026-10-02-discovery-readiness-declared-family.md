# 2026-10-02 — Discovery Readiness Honours the Declared Evidence Family

## Release ID

`2026-10-02-discovery-readiness-declared-family`

## Status

`candidate`

## Plain-English Summary

Before a discovery-phase build can run, the product checks that each required kind of evidence has an approved file behind it. Files can be uploaded against a named evidence family, and a person then reviews and approves each one.

The build check ignored the family the file was uploaded against. It re-guessed a family from keywords in the file's title and opening lines, and gave each file to the single best-scoring family. A workflow walkthrough whose first rows mention claims and eligibility was therefore counted as data-access evidence, and the workflow-map requirement stayed open — with the approved workflow map sitting in the Move. The build was blocked on evidence that had been supplied, reviewed and approved.

The check now uses the family the uploader declared. Keyword guessing remains only for files uploaded without a declared family, and never overrides or adds to a declaration.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves discovery-readiness behavior for every client; not behind a feature flag.

- **Product layer — Moves discovery readiness:** How approved evidence is credited to required evidence families for the build gate and the phase's evidence list. The set of required families is unchanged, and so is the rule that an uncovered required family blocks the build. Nothing is relaxed: a file is credited only to the family it was uploaded against.
- **Canonical model:** No schema or data changes. One additional column is read from an existing table.

## Client Applicability

- All clients using Moves discovery receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/discovery/evidence-readiness.ts`: read the declared family with each approved evidence item; a declared-family table that carries the upload family across to the discovery families it evidences; declared first, keyword inference as fallback.
- Tests that pin the misrouting, the declared-family credit, the two-family case, the fallback, and a blueprint that does not contain the target.

## QA / Validation

- Targeted Jest: pass — `98 suites, 902 tests` across the Moves library, 7 new.
- The misrouting is pinned as a test: the keyword scorer alone files a workflow walkthrough under data access.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, the workflow-map and knowledge families were shown as missing while approved files uploaded against exactly those families were present.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, reload the discovery phase of the synthetic workflow and confirm the families whose files were uploaded against them read as covered.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The declared-family table covers one archetype's upload families. Other archetypes still rely on keyword inference until their families are added.
- Files uploaded through the general file cabinet carry no declared family and are still credited by keyword inference, one family per file.
- Three required discovery families have no upload family that maps to them (model risk controls, measurement owner and cadence, finance baseline and value plan); they can only be satisfied by keyword inference.
- The phase's evidence list says a missing family can be waived by an accountable owner. No waiver action exists for a Move's evidence family.
- The same keyword scorer is still used when grouping evidence for the context extract.
