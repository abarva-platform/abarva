# 2026-06-22-ask-ava-consultant-readability — Ask Ava Consultant Readability

## Release ID

`2026-06-22-ask-ava-consultant-readability`

## Status

`candidate`

## Plain-English Summary

Ask Ava could now render typed tables and charts, but the answer prose could still appear as a dense paragraph that was hard for a CXO to read. This release strengthens the shared answer contract so Home, Intelligence, and Tower ask paths prefer a consultant-style structure: direct read, evidence, implication, and next move.

## Layer Impact

- `global-control-lane`: changes shared Ask Ava prose post-processing and prompts used by Home, Intelligence, and Tower surfaces.
- `client-data-lane`: no schema, ingestion, tenant data, migration, or private data-plane change.

## Client Applicability

- All clients: yes, any tenant using the shared Ask Ava engine benefits from more readable answer prose.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; follows existing surface activation flags.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/app/api/tower/ask/route.ts`
- `src/app/api/tower/synthesis/route.ts`
- Focused regression tests for response shaping, structured exhibits, Home/Intelligence rendering, and Tower prompt inheritance.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/app/api/tower/synthesis/route.test.ts src/app/api/tower/ask/route.test.ts --runInBand` passed.
- Regression proves dense Apex-style answer prose becomes `Read / Evidence / Implication / Next move` sections.
- Regression proves typed table extraction still works and the remaining prose is formatted after table removal.
- Regression proves Tower prompt paths inherit the same consultant answer-shape contract.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, DNS change, or manual feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: captured by deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and traffic image must match after deploy.
- Worker image invariant: unchanged; deploy workflow should continue exporting worker job image evidence.
- Feature/env flag update path: no new flag.
- Live signed-in proof required: ask the same visual/readability question on at least Apex and SkyHarbor, then confirm Home and Intelligence render readable sections plus typed exhibits where data supports them.

## Rollback Plan

Revert the PR and redeploy the prior approved image. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy evidence: pending.
- Live signed-in proof: pending.

## Known Gaps

Tower receives the same consultant answer-shape prompt, and AgentDock can render `AgentAnswer` when supplied, but Tower still needs the separate typed `AgentAnswer` API convergence before it can claim full chart/table parity with Home and Intelligence.
