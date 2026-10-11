# 2026-10-11-intelligence-clean-executive-export — Readable sources and focused PDFs

## Release ID

`2026-10-11-intelligence-clean-executive-export`

## Status

`candidate`

## Plain-English Summary

Intelligence keeps source aliases in explicit transport metadata and asks Claude to omit those codes from visible answer text. Sources display readable names. The default quality-review PDF presents answers and authored visuals; the original response appendix is an optional export setting. Successful answer prose and original model output remain unchanged.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: Intelligence source transport/presentation and quality-review PDF options. No intake, adapter, canonical model, data-plane, schema, corpus or load change.

## Client Applicability

- All clients using signed-in Intelligence executive answers and quality-review exports.
- Other answer contracts retain their existing source behavior.
- No feature flag or client-specific rollout.

## Changes Included

- Prompt: source aliases belong in a sources transport block, not prose or exhibit labels; select one to three decisive supporting sources.
- Decode explicit source metadata into readable provenance; retain the complete original response.
- Browser and exports show source names rather than transport code badges; PDF source names remain linked when URLs exist.
- Default PDF omits the raw appendix; the user can select Include original response appendix. This changes export presentation, not the stored or displayed answer prose.
- PDF cover omits internal tenant keys; new review titles use the existing active company display name.

## QA / Validation

- PASS: 23 focused tests across five suites; includes source transport fidelity and opt-in appendix behavior.
- PASS: Node 24 TypeScript, changed-file ESLint and all eleven release-control gates.
- PASS: real default and audit PDFs rendered. The default three-page fixture includes a chart, matrix, relationship diagram and readable linked source, with no source alias, internal tenant key or raw appendix. The four-page audit fixture retains the original response. Every default answer/exhibit page was visually inspected. Fixtures are not client answer-quality proof.
- Live signed-in quality and PDF visuals: not run for this candidate; requires deployment and the ten-question review.

## Rollout Plan

Squash merge after local QA. Deploy through the repo-owned ACA main workflow, verify the approved digest invariant, then run the signed-in ten-question review and native export.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: captured after the workflow build.
- ACA runtime invariant: template and full-traffic revision match the approved digest.
- Worker image invariant: all required workers match the approved digest.
- Feature/env flag update path: no flag or environment update.
- Live signed-in proof required: readable sources, ten completed answers and native PDF visuals.

## Rollback Plan

Revert through a PR and the repo-owned ACA main deploy workflow. No data migration or rollback is needed.

## Audit Evidence

Candidate diff, source and export preservation tests, local QA logs, real rendered PDF fixture, PR, workflow digest proof and private signed-in quality exports. Local fixture rendering is not live answer-quality proof.

## Known Gaps

Existing responses retain any inline source codes already authored by the model. They are not rewritten. Malformed transport remains reviewable with a rendering observation. Prompt compliance and actual live visuals must be assessed after deployment.
