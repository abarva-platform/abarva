# 2026-08-16-source-ava-literal-surface-routing — Source aVa literal surface routing

## Release ID

`2026-08-16-source-ava-literal-surface-routing`

## Status

`candidate`

Release lane: `global-control-lane`

## Plain-English Summary

This change makes the Source chat route treat the literal `source` surface value as a Source surface. Some Source aVa callers already send that value, but the route only recognized URL-shaped Source values and a separate event-detail value, so Source-scoped grounding could be skipped for portfolio-level questions.

## Layer Impact

Product projection layer (`global-control-lane`): Source aVa routing now applies the same Source-scoped prompt and grounding logic to the literal `source` surface value as it already does for `/source`, `/source/*`, and `source-detail`.

Canonical model / data layer: no schema, data, adapter, or tenant-data mutation.

## Client Applicability

- All clients: yes, for Source aVa turns using the literal `source` surface value.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/6436
- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts --runInBand` — passed, 3 suites / 27 tests.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. Live proof requires the ACA runtime invariant and Source aVa hard-QA rerun.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: assigned by the ACA deploy workflow
- ACA runtime invariant: required before live claim
- Worker image invariant: required before live claim
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6436
- CI checks for the PR
- ACA runtime invariant artifact after merge
- Source aVa hard-QA captured-response report after deploy

## Known Gaps

This does not change any response after Claude emits it and does not perform upload, parsing, persistence, or data-plane mutation.
