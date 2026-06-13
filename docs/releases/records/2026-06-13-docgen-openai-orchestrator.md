# 2026-06-13-docgen-openai-orchestrator — Move Deliverable Orchestrator Uses OpenAI

## Release ID

`2026-06-13-docgen-openai-orchestrator`

## Status

`candidate`

## Plain-English Summary

The governed deliverable orchestrator now uses the audited OpenAI egress path for board-grade document generation instead of the previous Claude/Anthropic caller. This keeps the existing multi-pass plan gate, quality gate, source-register discipline, and durable artifact persistence contract intact while honoring the current OpenAI-only execution constraint.

## Layer Impact

- `global-control-lane`: shared AI egress and document-generation policy now resolve OpenAI model ids for deliverable orchestration.
- `experimental`: the affected live path is still gated by `moves_orchestrated_deliverables`; flag-off deterministic generation remains available.

## Client Applicability

- All clients: no change unless a tenant has the orchestrated Moves deliverable flag enabled.
- Specific clients: SkyHarbor lab proof path uses this when `moves_orchestrated_deliverables` is enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_orchestrated_deliverables`.

## Changes Included

- `src/lib/deliverables/orchestrator/model-caller.ts` now calls `preflightOpenAIDirectClient` and OpenAI Responses.
- `src/lib/ai/document-generation-policy.ts` now resolves OpenAI document-generation model env vars.
- `src/lib/integrations/ai-egress/policy.ts` allows audited OpenAI under the same data-class ceiling used by sanctioned reasoning egress.
- Focused tests updated for OpenAI model policy and model-caller behavior.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts src/lib/ai/__tests__/document-generation-policy.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts --runInBand`
- Pass: `npx eslint src/lib/deliverables/orchestrator/model-caller.ts src/lib/ai/document-generation-policy.ts src/lib/ai/__tests__/document-generation-policy.test.ts src/lib/integrations/ai-egress/policy.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts`

## Rollout Plan

Merge to main, build the ACA lab image, deploy it to `ca-abarva-web-lab-eastus`, keep `moves_orchestrated_deliverables` scoped to SkyHarbor for live verification, and re-run the Moves Workspace Explorer generate flow after governed evidence is uploaded.

## Rollback Plan

Revert this PR or disable `moves_orchestrated_deliverables` for affected tenants. The deterministic board-grade renderer remains the fallback path.

## Audit Evidence

- PR link once opened.
- CI checks for the PR.
- SkyHarbor live ACA proof after deployment: Workspace generate → artifact API → generated artifact persisted and retrievable.

## Known Gaps

Live SkyHarbor orchestration still requires at least one committed `program_evidence_items` row before the OpenAI path will author a grounded business case. Evidence upload/retest is the next step after this runtime change is deployed.
