# 2026-10-11-intelligence-svg-matrix — Executive decision matrix visuals

## Release ID

`2026-10-11-intelligence-svg-matrix`

## Status

`candidate`

## Plain-English Summary

Intelligence displays qualitative comparisons as an SVG decision matrix with two clearly labeled axes, numbered options and a concise rationale and validation-gate legend. The same categorical layout renders as vector graphics in PDF and HTML exports. Claude authors the labels, rationale, gates and categories; the application formats them without changing the answer.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: executive matrix presentation and matrix-writing prompt.
- No change to intake, adapters, canonical data, graph semantics, corpus admission, schema, data loading or tenant identity.

## Client Applicability

- All signed-in Intelligence executive-answer clients using qualitative matrix exhibits.
- Existing numeric plots continue to use Recharts in the browser and vector graphics in PDF.
- No feature flag or environment update.

## Changes Included

- Shared categorical SVG geometry for browser, PDF and HTML, with labels wrapped without abbreviation or truncation.
- Clear axes, subtle quadrant colors, numbered business labels and readable rationale legends.
- PDF rationale legends use two columns to keep the executive exhibit compact.
- Prompt asks for specific business drivers and measurable validation gates, using the same criteria across all options.
- Original canonical prose, categories, labels and raw response remain intact. No generated numeric score or editorial output filter.

## QA / Validation

- PASS: 13 focused tests across four suites, including crowded-quadrant placement, all authored attributes, output fidelity and private reasoning separation.
- PASS: Node 24 TypeScript and changed-file ESLint.
- PASS: vector PDF fixture rendered and inspected; matching SVG uses the same layout.
- PASS: refreshed test-coverage census and all eleven release-control gates.
- NOT RUN: latest signed-in ten-question review and native PDF verification require the repo-owned ACA deployment.

## Rollout Plan

Squash merge after local QA. Deploy through the ACA main workflow. Prove the approved digest across the template, full-traffic revision and required workers, then run the ten-question signed-in review and native export.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved digest and template, traffic and worker invariants: captured after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: SVG matrix, brevity, evidence qualification, follow-ups and exported visuals.

## Rollback Plan

Revert through a PR and the repo-owned ACA main workflow. No data rollback.

## Audit Evidence

Candidate diff, focused preservation tests, rendered PDF fixture, local QA logs, PR, approved runtime digest proof and private signed-in review/export evidence.

## Known Gaps

Qualitative categories are advisory judgments, not measured scores. Prompt compliance requires observation. Numeric economics and confirmed dependency graphs require verified evidence. The application preserves malformed model protocols for review rather than repairing them.
