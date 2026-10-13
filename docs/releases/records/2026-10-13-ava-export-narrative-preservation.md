# Advisor Export Narrative Preservation

## Release ID

`2026-10-13-ava-export-narrative-preservation`

## Status

`candidate`

## Plain-English Summary

Answer and chat-session exports preserve admitted supporting prose instead of exporting only the headline. Key points, next-step text and source-basis statements stay with the answer. PDF evidence labels and excerpts are rendered, not merely counted.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no source input, canonical data, schema, corpus, retrieval, graph, approval or serving changes.
- Layer 4: existing HTML/PDF export renderers and their shared narrative formatting helper only. Existing public-text sanitation, artifact handling and visibility rules remain.

## Client Applicability

- All clients: authorized users of the existing advisor answer/session export routes.
- Specific clients: no identity inference or tenant exceptions.
- Internal only: no operator capability added.
- Public/demo only: no new public access or client attestation.
- Feature flag: none.

## Changes Included

- Include supporting prose and avoid repeating a headline already contained in that prose.
- Preserve concise headings, bullet labels, next-step text and existing record-basis statements from admitted packets.
- Include PDF evidence labels and excerpts, using the existing sanitized display packet.
- Keep the explicit answer/session-only export scope and existing charts/tables/graph behavior.

## QA / Validation

- PASS: 28 tests in four focused export and walkthrough-export suites, including narrative preservation, distinct supplementary prose, source-basis text, evidence rendering and HTML/public-text safety.
- PASS: TypeScript and scoped ESLint with Node 24.
- PASS: actual local PDF generated with the production renderers, text extracted and both rendered pages visually inspected. Supporting points, next-step, record basis and evidence are present; no clipped or overlapping content.
- PASS: all eleven `release:check` gates.
- NOT RUN for this candidate: production export after deployment. Earlier actual PDF omission remains in private QA evidence.

## Rollout Plan

Exact-source review, complete new current-head CI and current-main/open-PR guard, protected squash merge and repo-owned ACA main deployment. Re-export the existing unchanged chat session; no new model question or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: capture from the exact main deployment artifact.
- ACA runtime invariant: template and sole healthy 100% traffic revision match the approved pinned digest.
- Worker image invariant: both required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: same-session HTML/PDF export preserving all observed points, next-step, source-basis statements and rendered evidence; PDF text and every rendered page inspected.

## Rollback Plan

Protected revert and the same main workflow. No data rollback required.

## Audit Evidence

Exact source decision, focused tests and local real-render proof, complete current-head CI/conditional skips, fresh fetched-ref guard, official deployment artifact, independent full runtime invariant and private same-session export comparisons.

## Known Gaps

Existing sanitation, citation compaction and artifact display limits remain. This does not prove full Home/workspace export, every possible exhibit, data freshness, canonical graph activation or universal semantic entailment.
