# 2026-06-22-ask-ava-typed-visual-output — Ask Ava Typed Visual Output

## Release ID

`2026-06-22-ask-ava-typed-visual-output`

## Status

`candidate`

## Plain-English Summary

Ask Ava could return a table-looking answer as one long paragraph with pipe characters, leaving Home and Intelligence unable to render the requested table or chart. This release normalizes that live answer shape into the shared `AgentAnswer` typed table channel and creates a chart only when an extracted table contains exact numeric or currency values.

## Layer Impact

- `global-control-lane`: changes shared Ask Ava answer post-processing used by client surfaces that consume `/api/intelligence/ask`.
- `client-data-lane`: no schema, ingestion, tenant data, or private data-plane changes.

## Client Applicability

- All clients: yes, any tenant using the shared Ask Ava engine benefits from the typed exhibit extraction.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: follows the existing surface flags; no new flag.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` passed.
- Regression covers collapsed inline Markdown tables from live Ava prose.
- Regression covers route-level `agent-answer` emission with typed table and chart payloads.
- Regression covers directional percentage ranges, proving they do not become fabricated charts.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: captured by deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and traffic image must match after deploy.
- Worker image invariant: not applicable to this API-only change.
- Feature/env flag update path: no new flag.
- Live signed-in proof required: run the tenant matrix gate plus an Apex Ask Ava visual question proving `/home` and `/intelligence` render typed exhibits.

## Rollback Plan

Revert the PR and redeploy the prior approved image. The fallback behavior returns to prose plus evidence/source tables; no data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy evidence: pending.
- Live proof: pending.

## Known Gaps

Tower's dedicated `/api/tower/ask` path is still text-first and needs a separate shared `AgentAnswer` wiring fix before Tower can claim the same visual-output behavior.
