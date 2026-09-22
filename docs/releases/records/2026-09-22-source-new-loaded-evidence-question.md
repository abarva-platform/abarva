# 2026-09-22-source-new-loaded-evidence-question — Source New Loaded Evidence Question

## Release ID

`2026-09-22-source-new-loaded-evidence-question`

## Status

`candidate`

## Plain-English Summary

Source New Intelligence now tells the operator to review or promote a current loaded evidence file
when that file matches a required evidence family but is not yet agent-ready. Truly absent required
evidence still asks the operator to provide the source document. The evidence remains blocked until
the governed readiness path clears it.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: changes only the Source New Intelligence read projection and operator-facing
  next-question/action wording.
- Layers 1-3: no intake, adapter, canonical model, schema, parser, indexer, or data-plane behavior
  changed.

## Client Applicability

- All clients: yes, wherever Source New Intelligence is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source New availability controls apply.

## Changes Included

- `src/lib/source/new-workspace/event-intelligence.ts` distinguishes current loaded evidence
  families from agent-ready families for next-question/action wording only.
- `src/lib/source/new-workspace/event-intelligence.test.ts` covers loaded-but-not-ready evidence
  wording and preserves the truly absent evidence request path.
- No migrations, tenant-data writes, uploads, approvals, lifecycle transitions, or external sends.

## QA / Validation

- Red-first focused test: `npx jest src/lib/source/new-workspace/event-intelligence.test.ts --runInBand`
  failed on the stale duplicate-upload wording before the implementation.
- Focused behavior: `npx jest src/lib/source/new-workspace/event-intelligence.test.ts --runInBand`
  passed after the implementation.
- Scoped lint: `npx eslint src/lib/source/new-workspace/event-intelligence.ts src/lib/source/new-workspace/event-intelligence.test.ts`
  passed.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  passed.
- Release control: `npm run release:check` passed.
- Mutation proof: temporarily disabling loaded-family detection restored the duplicate-upload wording
  and failed the focused suite; restoring the guard returned the suite to green.

## Rollout Plan

Merge through PR into `main`. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the digest-pinned image. Do not mutate shared runtime traffic, image, flags, worker jobs, or
environment variables outside that workflow.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: pending after merge/deploy.
- ACA runtime invariant: pending after merge/deploy.
- Worker image invariant: pending after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming signed-in Source New acceptance.

## Rollback Plan

Revert the PR. This restores the prior Source New Intelligence question/action wording. No database
rollback or tenant-data cleanup is required.

## Audit Evidence

PR URL, focused Jest output, scoped ESLint output, TypeScript output, release-check output, mutation
probe output, repo-owned deploy run, ACA runtime invariant readback, and any later signed-in Source
New acceptance evidence.

## Known Gaps

- Signed-in Source New acceptance is not performed by this release record.
- This does not parse, index, cite-verify, approve, or promote any loaded evidence to agent-ready.
