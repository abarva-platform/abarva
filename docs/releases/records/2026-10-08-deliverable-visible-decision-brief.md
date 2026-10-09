# 2026-10-08-deliverable-visible-decision-brief — Reader-visible planning fields

## Release ID

`2026-10-08-deliverable-visible-decision-brief`

## Status

`candidate`

## Plain-English Summary

The deliverable planner now requests a concise decision brief whose fields can be shown to the reader. It still requires the current state, observed gaps, design implications, target hypothesis, decisions, exhibits, assumptions, and missing inputs before an artifact is assembled.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Shared generated-deliverable planning prompt and tool description. No canonical data, ingestion, or tenant-scoping change.

## Client Applicability

- All clients: Applies when the governed deliverable planning path is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing structured-exhibit enrollment remains unchanged.

## Changes Included

- Replace an instruction for a hidden plan with reader-visible decision content in the planner's system message, user message, and tool description.
- Keep the structured plan schema, evidence requirements, validator, output budgets, model policy, and provider-refusal handling unchanged.
- Add a focused regression test for the visible-content instruction and required evidence language.

## QA / Validation

- Focused planner tests: pass, 18/18.
- Targeted ESLint: pass, 0 errors.
- TypeScript `tsc --noEmit`: pass with an 8 GiB heap.
- `npm run release:check`: pass, all 11 gates.
- Signed-in generation proof: not run; pending deployment.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Verify the runtime invariant and one signed-in governed deliverable build before calling this live proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the deploy workflow after merge.
- ACA runtime invariant: Verify the template and 100% traffic revision images match the approved digest.
- Worker image invariant: Verify required worker jobs use that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a structured deliverable build.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

PR and deploy workflow links after merge; focused test results; signed-in build outcome after deployment.

## Known Gaps

The generator can still return a provider refusal or an incomplete brief. Those remain blocking outcomes and are reported with the provider's stop reason; this change does not route the request to another model.
