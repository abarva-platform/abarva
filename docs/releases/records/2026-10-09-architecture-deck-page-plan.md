# 2026-10-09-architecture-deck-page-plan — Governed architecture page plan

## Release ID

`2026-10-09-architecture-deck-page-plan`

## Status

`candidate`

## Plain-English Summary

A generated architecture presentation now plans its complete page count before export. The authoring contract budgets narrative and table pages together with the governed diagrams. Section breaks appear as slim bands on the first visual pages. Sparse prose merges into decision pages while its full source wording and caveats remain in speaker notes and the Word companion. Recorded flows remain paginated and visibly identified.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: shared deliverable authoring and PPTX presentation change; the exhibit data contract and canonical data do not change.
- Quality control: a pre-render count refuses decks outside the approved core and physical limits. The exported-deck and governed-visual judges continue to reject missing, altered, empty, off-canvas, undersized, or over-dense visual content.

## Client Applicability

- All clients: shared target architecture presentations when that deliverable is generated.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing deliverable availability controls apply.

## Changes Included

- Six-page combined narrative/table ceiling; eight-page architecture-body ceiling; 16-page core ceiling; 27-page hard physical ceiling. A reference appendix can use up to eleven pages with a warning above 24 total pages.
- Six decision beats replace the conflicting eleven-step authoring instruction for this presentation profile. Full source statements, citations, caveats, and other detail remain in notes and the document companion.
- Two architecture section dividers become in-page bands. Flow cards show recorded IDs and larger labels, with complete flow text retained in accessible notes and alternative text.
- Page-planner, authoring, exact visual-identity, flow pagination, and exported-canvas regression coverage.

## QA / Validation

- Full deliverables unit lane: 114 suites, 1,339 tests, and all three golden snapshots passed locally. The architecture HTML golden snapshot was updated for the intentional larger SVG labels.
- Full typecheck passed. Scoped lint, test census, and release check passed before PR creation.
- Two local synthetic architecture decks were converted to PDF and visually inspected. The 19-edge case produced 19 physical pages, retained all edges over 12+7 full-size flow pages, and passed the physical and governed-visual judges with zero findings. This is layout evidence, not signed-in generated-artifact acceptance.

## Rollout Plan

Squash merge through the controlled PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Verify web template, 100% traffic revision, and required worker images, then generate and inspect a signed-in architecture deliverable before claiming live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: verify template and sole 100% traffic revision match the approved digest.
- Worker image invariant: verify both required deliverable worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and release through the repository-owned ACA main deploy workflow. Preserve the prior approved digest in the controlled rollback window.

## Audit Evidence

The PR diff and checks, local PPTX/PDF render, exact exhibit-key and edge-ID tests, physical slide verdict, and subsequent deploy and signed-in proof.

## Known Gaps

The local render uses a synthetic fallback model. The signed-in generated presentation, its Word companion, and the phase gate remain subject to live review. When a source needs more than 27 physical pages, the planner refuses with exact counts and identifies a bound companion appendix as the required remediation; companion packaging is not silently fabricated by this change.
