# 2026-10-13-intelligence-executive-pressure — Executive brief discipline

## Release ID

`2026-10-13-intelligence-executive-pressure`

## Status

`candidate`

## Plain-English Summary

Intelligence uses lower adaptive reasoning effort to start its executive answer sooner. The initial response stays compact, preserves the population and outcome of proposed targets, and distinguishes separate benefit mechanisms in both the answer and its follow-up questions. Missing measures remain unknown. Provisional context restrictions are repeated at the end of the generation request.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Intelligence generation configuration and executive output instructions.
- No canonical model, adapter, intake, retrieval dataset or client data changes.

## Client Applicability

- All clients: Shared model-authored Intelligence responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing model-authored output mode.

## Changes Included

- Low adaptive effort on the model-authored response path; legacy generation settings remain intact.
- Compact integrated discovery briefs instead of duplicated report sections and closing briefs.
- Target numerator, denominator, eligibility and exclusion discipline; separate benefit measures.
- Follow-ups do not confuse benefit mechanisms or presume missing evidence exists.
- Hypothetical numbers require an explicitly requested synthetic scenario. Projection-only references are identified as lacking original record, page, passage or date evidence.
- The existing provisional context decision guard also ends the model request.

## QA / Validation

- Five focused suites: 49 tests passed, including incremental delivery, private reasoning suppression, final packet preservation, tenant and retired-fact guards, and page reconciliation.
- TypeScript and scoped ESLint: passed. Release checks: all 11 gates passed. Whitespace validation: passed.
- Five aligned signed-in questions: required after deployment to verify actual latency, final answer discipline, exhibits and follow-ups. Private evidence remains outside this public repository.

## Rollout Plan

Squash merge the PR to main and use the repository-owned ACA main deploy workflow. Verify digest parity, healthy revision, full traffic and required workers. Re-run five questions in signed-in Intelligence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Recorded by the main deploy workflow.
- ACA runtime invariant: Template and 100% traffic revision match that digest.
- Worker image invariant: Required worker jobs match that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and deploy through the repository-owned main workflow. No data rollback is needed.

## Audit Evidence

PR, local validation, CI checks, deploy workflow, runtime invariant proof, private signed-in snapshots and observed timings.

## Known Gaps

Lower reasoning effort does not guarantee a fixed latency. Model-authored answers and questions require live quality review; prompt instructions are not a claim of certified accuracy.
