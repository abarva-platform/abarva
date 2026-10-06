# 2026-10-03 Moves P1 capture evidence binding

## Release ID

`2026-10-03-moves-p1-capture-evidence-binding`

## Status

`candidate`

## Plain-English Summary

Moves P1 capture fields now identify the evidence family that can support each field. A field is not considered complete until its value is saved and a human-approved source in the matching family exists. The final transition-readiness workbook remains a separate requirement; this change does not mark evidence sufficient or approve a phase.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Adds an in-step evidence upload and review status to the P1 capture flow, and makes the gate API enforce the same field-level requirement as the UI.
- Layer 3 Canonical Model: Reads existing tenant-scoped approved evidence references and records declared family keys through the existing governed upload and review path. No schema or canonical-object write path is added.

## Client Applicability

- All clients: Moves P1 capture and phase-gate approval.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

Existing P1 captures without family-linked approved evidence will remain incomplete until the source is uploaded and reviewed. Discovery-family uploads made during P1 remain distinct from P1 charter evidence.

## Changes Included

- Bind each P1 capture section to one charter evidence family.
- Offer a fixed-family upload directly within the P1 capture section and show the approved source reference after review.
- Keep free-form uploads in the existing human-review-required ingestion path; P1 charter families cannot be used as discovery evidence by keyword fallback.
- Require the gate API to verify a matching approved P1 evidence reference for each mapped capture section before allowing P1 approval.
- Keep phase-transition evidence readiness and approval as separate checks.

## QA / Validation

- Focused Jest suites for the P1 capture UI, phase-capture contract, family validation, discovery readiness isolation, upload route, phase-gate route, and direct phase-advance route: 7 suites / 205 tests passed.
- `npm run typecheck`: clean.
- Scoped ESLint: zero errors and two unused-symbol warnings in `MovesPhaseStandaloneClient.tsx`; both are present at the branch base.
- `npm run release:check -- --base origin/main --head HEAD`: all 11 gates passed.
- Mutation check: deliberately removing the family match makes the P1 capture test, P1 gate tests, and direct-advance test fail; the guard was restored and the full focused suite passed.
- Signed-in upload, human review, and P1 gate walkthrough are required after deployment; not yet proven.

## Rollout Plan

Merge through a squash PR to `main`; deploy only through `.github/workflows/aca-main-deploy.yml`. After deploy, verify the digest-pinned ACA web template and 100%-traffic revision plus required worker images, then perform a signed-in P1 walkthrough using synthetic evidence. Existing P1 records may need source uploads and human review before they can advance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: To be captured from the successful main deploy workflow.
- ACA runtime invariant: Verify template image and 100%-traffic revision image match the approved digest.
- Worker image invariant: Verify required worker jobs use the same approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; demonstrate upload, pending review, human approval, matching-family readback, and gate behavior on a synthetic Move.

## Rollback Plan

Revert through a reviewed PR and the same ACA main deploy workflow. No schema rollback is required. Existing evidence-review rows remain intact; reverting only removes the new P1 family-specific gate requirement and inline upload presentation.

## Audit Evidence

Inspect the PR diff and CI results, the release-check output, the ACA main deploy run and digest invariant, and the signed-in synthetic P1 walkthrough. Runtime evidence is not yet captured.

## Known Gaps

Local tests do not prove that production upload parsing, human review, approved-reference readback, and phase transition work together. The signed-in walkthrough remains outstanding.
