# 2026-07-22-tower-ava-native-visual-exhibits — Tower aVa Native Visual Exhibits

## Release ID

`2026-07-22-tower-ava-native-visual-exhibits`

## Status

`candidate`

## Plain-English Summary

This release improves how aVa renders executive visuals for Tower-style answers. Value-proof and value-funnel chart payloads now render as a native proof ladder instead of a generic bar chart, portfolio matrix payloads get clearer quadrant guidance, and CXO-visible prose no longer exposes raw substrate counts such as rows, facts, nodes, or edges.

## Layer Impact

- `global-control-lane`: Updates the shared aVa answer renderer and public answer scrubber used by aVa answer surfaces.
- `presentation/rendering`: Adds native executive visual treatment for value-proof charts and portfolio quadrant charts.
- `governed language`: Removes numeric internal substrate-count phrasing from CXO-visible aVa prose while preserving the business conclusion.

## Client Applicability

- All clients: Shared aVa answer rendering and public prose cleanup apply wherever the shared renderer is used.
- Specific clients: Tower/Meridian is the motivating proof path.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`
- `src/lib/ava-answer/public-answer-scrub.ts`
- `src/lib/ava-answer/__tests__/public-answer-scrub.test.ts`

## QA / Validation

- `npm test -- src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` — passed, 13/13.
- `npm test -- src/lib/ava-answer/__tests__/public-answer-scrub.test.ts --runInBand` — passed, 16/16.

## Rollout Plan

Merge through the protected PR lane. The shared ACA main deploy workflow will build and deploy the resulting image. No data migration, data-build job, candidate promotion, or Azure data-plane write is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai` runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured by the ACA main deploy workflow.
- ACA runtime invariant: Required before claiming live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for affected Tower/aVa answer rendering before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- Focused Jest output for renderer and scrubber tests.
- PR diff for renderer exhibit handling and public prose scrub.
- Post-deploy ACA runtime invariant and signed-in Tower/aVa browser proof, once deployed.

## Known Gaps

This PR does not change Claude prompts, Tower data marts, Azure/Postgres data, or aVa retrieval. It only improves the shared rendering and public-language cleanup for existing structured answer payloads.
