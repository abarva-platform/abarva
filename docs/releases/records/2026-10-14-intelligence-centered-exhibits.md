# Intelligence Centered Conversation and Evidence-Fit Exhibits

## Release ID

`2026-10-14-intelligence-centered-exhibits`

## Status

`candidate`

## Plain-English Summary

Intelligence opens with a centered greeting and composer, then uses a narrow reading column with a persistent bottom composer. Existing aVa branding, attachments, sources, follow-ups and session exports remain. Question-specific guidance prefers comparison or evidence-gate tables where appropriate, reserves numeric charts for compatible sourced measurements, and does not make a quadrant the default. Compact charts keep their original values and source notes; data and rationale remain inspectable.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 products: Intelligence presentation and its existing model-authored response guidance. Shared answer components gain opt-in compact rendering; existing full/export matrix geometry remains the default.
- Layers 1-3: no source intake, adapter, canonical schema, record, graph, metric or tenant-data change. This is not a data refresh.

## Client Applicability

- All clients: Intelligence users receive the centered presentation. The current model-authored answer path receives evidence-fit exhibit guidance.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no; centered layout is explicitly opted into by Intelligence only. Other dock callers keep their existing presentation.

## Changes Included

- Intelligence opts into centered entry, centered conversation and answer-start scroll behavior.
- Shared dock preserves its default modes and uses real attachment/send controls in the new presentation.
- Question-specific exhibit guidance is appended to the active executive model-authored synthesis path, not the legacy score-driven path.
- Compact numeric charts and categorical matrices retain complete authored datasets, source notes, full analysis and exports.

## QA / Validation

- Combined dock/shell/Intelligence/provider, answer parser, reading-view, matrix layout and model-authored export tests: 231 passed across 21 suites.
- Node 24 repository typecheck: clean. Scoped ESLint: clean.
- Private local actual-component preview: inspected entry and answer states at 1440x900, 1366x768 and 390x844. No document horizontal overflow; bottom composer remains visible. Recharts numeric bars and eight same-quadrant matrix markers render. Fixtures are synthetic renderer tests, not live model evidence.
- Release check: all 11 gates passed. Context-corpus governance gate passed with existing approval-metadata warnings; no dataset changed.
- Protected PR merge, ACA deployment and three signed-in production questions remain release gates. Do not describe the candidate as live-proven before those complete.

## Rollout Plan

Validate locally, open a public-safe PR, squash merge, then deploy the exact main commit through `.github/workflows/aca-main-deploy.yml`. Prove the runtime invariant independently and test three signed-in questions: delivery-option comparison, sourced numeric comparison, and an explicitly requested qualitative quadrant. Inspect concise/full views, sources and follow-ups.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: workflow only; no local Azure template or traffic mutation.
- Approved image digest: resolve from the successful main deploy; digest-pinned images required.
- ACA runtime invariant: template and healthy 100%-traffic revision must match the approved digest.
- Worker image invariant: all jobs derived from the deployment worker list must match the approved digest.
- Feature/env flag update path: no flag or environment update required.
- Live signed-in proof required: yes; layout, three actual responses, exhibit fit, evidence boundaries and source inspection.

## Rollback Plan

Revert this PR through a new protected PR and redeploy through the same ACA workflow. No data rollback, migration or regeneration is needed.

## Audit Evidence

PR diff, local validation output, private responsive screenshots, ACA run and approved digest, independent invariant report, and private signed-in response/screenshots. Keep tenant-specific answers out of public release artifacts.

## Known Gaps

Visual selection is evidence-sensitive model guidance, not a promise that every answer emits a chart. Missing measurements remain missing. Full analysis may be needed for large exhibits. This release does not refresh data, change other products' layouts, add chart types, or complete a broader product-readiness program.
