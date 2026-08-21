# 2026-08-20-stage-readiness-workbook-p2-context-loader — Stage Readiness Workbook P2 Context Loader

## Release ID

`2026-08-20-stage-readiness-workbook-p2-context-loader`

## Status

`candidate`

## Plain-English Summary

This change lets Strategic Moves generation read accepted stage-readiness workbook responses as next-phase context. It only reads the current human-review artifact, and it excludes pending, rejected, and needs-validation proposals.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Strategic Moves generation can include accepted workbook review responses in its context assembly. No tenant data, canonical records, registry state, or product projection tables are loaded or refreshed by this change.

## Client Applicability

- All clients: Strategic Moves workbook-to-next-phase generation context.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a server-only accepted stage-readiness context loader.
- Exclude incomplete reviews before reading artifact bytes.
- Preserve accepted `unknown` and `insufficient_evidence` responses as explicit context caveats instead of converting them into ready facts.
- Append accepted workbook response context to the governed Moves generation context path.

## QA / Validation

- Pass: `npx jest src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/stage-readiness-workbooks/accepted-context.ts src/lib/deliverables/moves-generate-deps.ts src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts`
- Pass: `npm run release:check`

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow may rebuild the web image after merge. No migration, data-plane load, tenant data mutation, registry activation, or runtime configuration change is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required if a deploy runs after merge.
- Worker image invariant: Required if the deploy workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming live behavior.

## Rollback Plan

Revert the PR. Existing review artifacts remain stored but are no longer appended to generation context.

## Audit Evidence

- PR URL: to be added when opened.
- Local tests listed in QA / Validation.
- CI and deploy evidence to be added by the PR and deploy workflow.

## Known Gaps

This does not advance or approve the live Move. It only makes accepted workbook responses eligible for P2 generation context.
