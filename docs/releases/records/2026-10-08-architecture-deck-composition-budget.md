# 2026-10-08-architecture-deck-composition-budget — Shorter architecture deck

## Release ID

`2026-10-08-architecture-deck-composition-budget`

## Status

`candidate`

## Plain-English Summary

Architecture presentations now combine short adjacent narrative sections, place the decision before a linked reference appendix, and give diagrams more room and larger labels. Every governed architecture visual remains in the exported file. Export validation checks the visual's source identity, interpretation, provenance, and flow records.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: generated presentation and architecture HTML layouts change. The canonical model and exhibit data contract do not change.
- Quality control: the exported presentation is rejected when its governed visual source or interpretation fails the semantic check. Existing physical slide checks remain in force.

## Client Applicability

- All clients: architecture presentations generated through the shared renderer.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing deliverable availability controls continue to apply.

## Changes Included

- Compact pairs of short narrative sections while retaining each section's governing message, points, and notes.
- A bounded architecture body and linked appendix following the closing decision.
- Larger architecture labels, wider headline figures, and removal of drawn connections that have no declared edge set.
- Source digests and semantic checks for all 13 exported architecture visuals.

## QA / Validation

- Architecture composition, export, and HTML-renderer suites: 29 tests passed locally.
- Full typecheck, scoped lint, test census, and release check (11/11) passed locally.
- Local synthetic preview reopened in LibreOffice and visually reviewed as a full contact sheet: 21 slides, reduced from 25; all 13 visual keys embedded, body before appendix, no physical slide findings.
- Signed-in generated presentation review remains pending deployment and the phase build gate.

## Rollout Plan

Squash merge through the controlled PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Verify the shared runtime invariant and reopen a signed-in generated presentation before claiming live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no manual runtime mutation in this change.
- Approved image digest: record after deployment.
- ACA runtime invariant: verify template and 100% traffic revision match the approved digest.
- Worker image invariant: verify required worker job images before live claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and release through the repository-owned ACA main deploy workflow. Keep prior approved image digest available for the controlled rollback window.

## Audit Evidence

The PR diff, local test output, exported deck key checks, physical slide verdict, and local PDF contact sheet. Add workflow and signed-in proof after deployment.

## Known Gaps

The local preview uses a synthetic fallback architecture model; a real generated phase presentation and its decision content still require signed-in visual review. The export metadata source digest does not replace review of the diagram's factual grounding.
