# 2026-10-11-intelligence-visual-restoration — Executive exhibits and compact answers

## Release ID

`2026-10-11-intelligence-visual-restoration`

## Status

`candidate`

## Plain-English Summary

Intelligence numeric exhibits use Recharts again. Strategic tradeoffs can use a qualitative low/high matrix, explicitly labeled as advisory judgment requiring validation. Claude authors every label, category and rationale. The prompt asks for shorter openings, prose and exhibit cells. Successful model output remains intact in the product and export appendix.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: Intelligence prompt, exhibit transport and presentation, HTML/PDF exports. No intake, adapter, canonical data, schema or ingestion change. No numeric priority score is inferred from a qualitative category.

## Client Applicability

- All signed-in Intelligence clients using the executive answer path.
- Other answer contracts retain their existing behavior.
- No feature flag, client-specific data change or load.

## Changes Included

- Answer flow: direct answer, relevant current-state context and a decision hinge, with three short follow-ups derived from the answer rather than a fixed menu.
- Executive brief prompt: opening target 20–30 words, maximum 35; at most 90 prose words, 65 with an exhibit; default total visible answer under 160 words; compact table cells.
- Model-authored numeric charts pass every authored row and value to Recharts without scoring, filtering or rewriting.
- Strict categorical matrix protocol; low/high categories remain qualitative, with the authored advisory caveat required.
- Browser, HTML and PDF matrix rendering; original model output preserved.
- Opening-length observation matches the revised prompt ceiling. Observations never shorten an answer.

## QA / Validation

- PASS: 21 focused tests across five suites, including numeric transport preservation, qualitative matrix validation, export fidelity and the sequential review runner.
- PASS: Node 24 TypeScript and changed-file ESLint.
- PASS: actual three-page React PDF fixture rendered and visually inspected; matrix categories, numeric values and original appendix retained.
- PASS: browser fixture rendered all three supported numeric chart kinds using actual Recharts, plus the categorical matrix. Fixtures are illustrative layout validation only.
- PASS: all eleven release-control gates after recording these outcomes.
- Live answer quality: not run for this candidate; requires deployment and signed-in ten-question review.

## Rollout Plan

Squash merge the validated candidate, then use the repo-owned ACA main deploy workflow. Verify digest-pinned template, full-traffic revision and required workers, then run the signed-in Intelligence review and export its actual answers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: captured by the main deploy workflow after build.
- ACA runtime invariant: template and 100% traffic revision must match the approved digest.
- Worker image invariant: all required worker jobs must match that digest.
- Feature/env flag update path: no flag or environment update.
- Live signed-in proof required: actual answer length, authored exhibits and ten-question PDF export.

## Rollback Plan

Revert this candidate through a PR and the repo-owned ACA main deploy workflow. No data migration or corpus rollback is required.

## Audit Evidence

Candidate diff, focused preservation/rendering tests, local QA logs, rendered PDF fixture, PR, ACA workflow digest proof, and private signed-in ten-question export. Fixture validation is not live answer-quality proof.

## Known Gaps

The model can still exceed a prompt budget or author an invalid exhibit. Such output remains reviewable. Numeric charts require supplied numeric evidence; a qualitative matrix is advisory judgment, not certified readiness or measured value. Live results remain unverified until deployment and signed-in review complete.
