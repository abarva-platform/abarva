# 2026-10-11-intelligence-matrix-transport — Native matrix transport

## Release ID

`2026-10-11-intelligence-matrix-transport`

## Status

`candidate`

## Plain-English Summary

The Intelligence native renderer accepts a valid qualitative matrix when Claude names its fenced block with the matrix type. The existing chart block remains supported. Every authored label, category, reason, gate and raw response is preserved.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: decoding an explicit native exhibit transport name.
- No editorial answer filter, canonical data, intake, source admission or provenance change.

## Client Applicability

- All clients using model-authored Intelligence answers and native exports.
- No feature flag or environment mutation.

## Changes Included

- Recognize the literal `quadrant-matrix` fence using the existing strict matrix schema.
- Preserve malformed blocks verbatim; do not infer another exhibit, repair JSON, invent values or rewrite prose.
- Verify the accepted alias preserves the raw response and every authored exhibit field; reject a numeric chart under the matrix alias.

## QA / Validation

- PASS: eighty-two tests across five transport, viewport, prompt and unchanged-output suites.
- PASS: Node 24 TypeScript, changed-file ESLint, refreshed census and all eleven release gates.
- Actual signed-in ten-question review and native PDF inspection required after deployment.

## Rollout Plan

Squash merge after local QA and use the repo-owned ACA main deploy. Verify the digest-pinned template, full-traffic revision and required workers, then run the signed-in review and inspect native visuals and PDF pages.

## Deployment Authority

- Shared runtime mutator: `.github/workflows/aca-main-deploy.yml` only.
- ACA template, traffic revision and worker digest invariants required.
- Live signed-in proof required; no feature or environment mutation.

## Rollback Plan

Revert through a PR and the same ACA workflow. No data rollback.

## Audit Evidence

Transport diff, strict-schema preservation tests, release gates, PR, ACA invariant proof and private signed-in native export inspection.

## Known Gaps

Unsupported or malformed transport remains visible for honest review. Rendering a valid matrix does not certify its evidence or guarantee model adherence to prompt instructions.
