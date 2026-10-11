# 2026-10-11-intelligence-executive-quality-review — Executive briefs and quality review

## Release ID

`2026-10-11-intelligence-executive-quality-review`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The Intelligence advisor receives one executive writing contract with a short decision-first opening, sourced reasons, action guidance and relevant authored exhibits. Successful Claude answers are displayed without prose rewriting or automatic source-table attachments. A repeatable ten-question review exports answers, exhibits, sources, length observations and complete original responses to one PDF.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4, Products: Intelligence prompt, answer transport, presentation and review/export controls.
- Layers 1–3: no intake, adapter, canonical data, schema, ingestion or graph-substrate changes. Existing context governance and tenant boundaries remain enforced upstream.

## Client Applicability

- All clients: authenticated Intelligence executive surface and its quality-review panel.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: explicit executive output mode selected by the Intelligence page; shared legacy callers keep their existing path.

## Changes Included

- Unified executive prompt and model-authored protocol decoder.
- Validated context bundle before generation; blocked objects excluded and legacy readiness floors retained.
- Scoped route/pipeline path that preserves successful model output and omits deterministic prose/artifact additions.
- Native tables, bar/line charts and confirmed relationship graphs from authored payloads.
- Ten editable questions, fresh sessions, sequential requests, cancellation and explicit failures.
- PDF/HTML preservation and original-response appendix; structural export checks reject inconsistency instead of changing content.
- User workflow: `docs/intelligence/EXECUTIVE_QUALITY_REVIEW.md`.

## QA / Validation

- Focused pipeline, route, decoder and component suites: 54 tests passed across eight suites.
- TypeScript under Node 24 with sufficient heap: passed.
- Actual React PDF renderer: ten-question illustrative fixture generated, rendered to PNG and inspected; fixtures do not represent live Claude answer quality.
- ESLint: passed. `npm run release:check`: all 11 gates passed. Context/corpus manifest validation: passed with existing attribution warnings.
- After reconciling current main, updated current CI directory inventories while preserving historical triage draws, and updated route reachability to reflect the governed Intelligence context path. All 74 cases across the three affected behavior controls and two new feature suites passed.
- All required GitHub checks passed on the unchanged implementation before a generated-census-only conflict was reconciled. The behavior gate passed 209 suites and 2,185 cases. The rebased candidate passed 122 focused cases across 11 suites, TypeScript, ESLint and all 11 release gates.
- No live quality acceptance, shared runtime deployment or tenant-data mutation performed.

## Rollout Plan

Review the candidate PR. Merge via the protected PR lane after authorization. The repo-owned ACA main workflow builds and deploys the exact merged commit. Verify the approved digest and runtime invariant, then run the ten-question suite in the signed-in Intelligence product. Review that PDF for answer quality before declaring live acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: assigned by the authorized main workflow; no digest approved by this candidate.
- ACA runtime invariant: template, traffic revision and required worker images must match the approved digest.
- Worker image invariant: verify required workers through the release lane.
- Feature/env flag update path: no environment update required.
- Live signed-in proof required: Intelligence answers, requested exhibits, isolated review run, partial failure reporting and PDF download.

## Rollback Plan

Revert this PR through a protected PR and redeploy using the repo-owned ACA main workflow with its approved digest. No migration or tenant-data rollback is required.

## Audit Evidence

PR diff and local validation results; illustrative PDF layout check; audited Anthropic request path; post-deploy signed-in review PDF and runtime-invariant evidence when available.

## Known Gaps

Legacy source adapters retain their conservative not-reviewed and not-indexed status; no source is promoted to agent-ready by this release. Model context treats this evidence as provisional. The writing contract is a prompt instruction, not a deterministic length guarantee. Poor or long answers remain visible for assessment. Charts require numeric evidence; confirmed graphs require evidenced edges. Local preservation and layout checks do not establish live answer quality. No merge, deploy or signed-in acceptance is claimed by this candidate.
