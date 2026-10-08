# 2026-10-08 — Architecture PPTX visual parity

## Release ID

`2026-10-08-architecture-pptx-visual-parity`

## Status

`candidate`

## Plain-English Summary

Target architecture presentations now include the governed diagrams already shown in their browser preview. The final PowerPoint file carries each diagram with its interpretation and decision implication. Component lists and recorded flow edges no longer appear as a false sequence of connected arrows. Export stops if a planned visual cannot be rendered.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the generated PowerPoint companion for a Moves target architecture includes the structured architecture visuals.
- Canonical model: no source record, tenant mapping, or data build changes.

## Client Applicability

- All clients: applies when a target architecture is generated with a structured architecture model.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing structured architecture preview enrollment controls model availability; this change adds no flag.

## Changes Included

- Carry the structured architecture model into the PowerPoint renderer.
- Render the same 13 planned SVG exhibits used by the HTML preview as presentation slides, with the interpretation visible and the decision implication in speaker notes.
- Show unordered components and individual recorded flow edges without implying a chain of relationships that the model does not contain.
- Verify visual presence and slide bounds in a focused export test.

## QA / Validation

- Focused architecture PowerPoint export test passes and confirms 13 embedded diagrams and no off-canvas shapes.
- Existing persistence and renderer tests pass.
- A synthetic presentation was converted to PDF and its conceptual architecture and data-flow slides were visually inspected after the semantic layout change.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Rebuild a governed target architecture package after deployment; existing files are not silently rewritten.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the approved digest.
- Worker image invariant: verify required deliverable worker images match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: download and inspect the regenerated PowerPoint file and confirm gate review state before phase approval.

## Rollback Plan

Revert this change through a pull request and redeploy through the same workflow. Existing generated files and their review records remain available for inspection; regenerate only after a corrected export is deployed.

## Audit Evidence

- Pull request and CI results.
- Local architecture export test, PDF render, and visual inspection.
- Post-deploy runtime invariant and signed-in artifact readback.

## Known Gaps

Diagrams in the PowerPoint file are images of the governed SVG exhibits. Their individual nodes and labels are not editable PowerPoint objects.
