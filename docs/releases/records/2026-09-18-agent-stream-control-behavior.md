# 2026-09-18-agent-stream-control-behavior - Verify the visible answer sink

## Release ID

`2026-09-18-agent-stream-control-behavior`

## Status

`candidate`

## Plain-English Summary

Agent text now holds an unfinished decision claim until it can be checked as a complete phrase. A behavioral CI check executes the route's visible stream handler, so a source-code token alone cannot prove this control works.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 answer presentation only. No canonical data, tenant identity, approval state, or model-provider change.

## Client Applicability

- All clients: Shared agent chat route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Shared decision-language streaming sanitizer and route sink wiring.
- A behavioral test of model and tool output on direct and redacted stream paths.
- AI surface control catalog evidence and CI job updated to run the behavioral test.

## QA / Validation

- Focused route and sanitizer suites: 12 passed. The split-phrase test failed on the prior per-chunk sink and passes with the buffered sink.
- AI surface control catalog: 18 surfaces passed.
- Scoped ESLint and TypeScript: passed.
- Wider route-test folder: 7 failures in 3 suites on both this branch and clean `origin/main`; no additional failures on this branch.
- Release gate: passed. Deployed signed-in check: pending.

## Rollout Plan

Squash merge by PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Verify runtime and worker image parity, then check signed-in agent streaming on the deployed revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful deploy.
- ACA runtime invariant: Verify template, active revision, traffic and workers against that digest.
- Worker image invariant: Same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR through the normal release lane if answer streaming regresses, then redeploy the previous healthy digest through the repo-owned workflow. This would restore chunk-by-chunk scrubbing, so the split-phrase gap would reopen until a replacement is released.

## Audit Evidence

Focused test result, catalog check, PR CI, ACA deployment evidence, and signed-in stream proof when available.

## Known Gaps

The streaming sanitizer may hold an unfinished sentence longer than the prior per-chunk path. Signed-in latency and visual acceptance remain to be checked. Seven pre-existing route source-string assertions remain red.
