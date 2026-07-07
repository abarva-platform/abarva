# 2026-06-22-ask-exhibit-intent-routing — Ask Ava Exhibit Intent Routing

## Release ID

`2026-06-22-ask-exhibit-intent-routing`

## Status

`candidate`

## Plain-English Summary

Ask Ava now recognizes explicit requests for tables, charts, and visual answers as renderable exhibit requests. This prevents a user asking for a visual or table from being routed as prose-only, which previously kept the canonical renderer from showing any table even when cited evidence existed.

## Layer Impact

- `global-control-lane`: updates deterministic Intelligence answer routing shared by all tenants.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; behavior follows the existing Intelligence surface rollout.

## Changes Included

- `src/lib/intelligence/answer/router.ts`
- `src/lib/intelligence/answer/__tests__/router.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/router.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/answer/router.ts src/lib/intelligence/answer/__tests__/router.test.ts`
- Pass: `npm run release:check`
- Not run: live signed-in Ask Ava proof, requires merge and deploy.

## Rollout Plan

Merge to `main`; the repo-owned ACA deploy workflow builds and deploys the new web image. No data migration or environment variable change is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none expected outside the repo-owned workflow.
- Approved image digest: populated by deploy evidence.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the deployed main digest.
- Worker image invariant: unchanged behavior, but deploy workflow should keep jobs on the same image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Ask Ava should render a table for explicit table/visual asks.

## Rollback Plan

Revert the router change or redeploy the previous known-good main image. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment run: pending.
- Live proof: pending.

## Known Gaps

This does not fabricate charts. True charts still require validated `AgentAnswer.charts`; chart-shaped asks without validated chart data render a cited evidence table instead.
