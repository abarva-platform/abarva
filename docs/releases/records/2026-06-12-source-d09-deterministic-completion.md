# 2026-06-12-source-d09-deterministic-completion — Source D09 Completion Appendix

## Release ID

`2026-06-12-source-d09-deterministic-completion`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor Source RFP package now gets a deterministic completion appendix before the partner-grade quality validator runs. Claude still drafts the RFP, but the system ensures the gate-critical timeline controls, evaluation-control closure, risk register, source register, and client-to-complete gap register are present even when the long RFP body would otherwise omit or truncate those tail sections.

## Layer Impact

- `client-data-lane`: changes the Source artifact generation path for governed Source events. It affects generated artifact bodies and their quality-gate validation, but does not alter tenant data models, migrations, or source evidence records.

## Client Applicability

- All clients: any client using the governed Source D09 RFP generation path receives the completion appendix behavior.
- Specific clients: live proof target remains SkyHarbor.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/source/agent-generation/d09-completion.ts`.
- Wires D09 completion into `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` before the consulting-grade quality gate.
- Adds focused tests in `src/lib/source/agent-generation/__tests__/d09-completion.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/agent-generation/d09-completion.ts 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN YET: live SkyHarbor Source crawl after Azure deployment. This release must not be called complete until that crawl passes.

## Rollout Plan

Merge to main, build a new Azure Container Apps image, shift traffic to the new revision after health checks pass, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the route wiring and helper module to return D09 to the previous pure-Claude body review path, then redeploy the prior healthy Azure Container Apps image if live proof regresses.

## Audit Evidence

- PR and CI checks for this release candidate.
- Azure Container Apps image/revision smoke after deploy.
- SkyHarbor Source self-healing crawl report and HAR after deploy.

## Known Gaps

This is a D09 RFP completion guard, not the full reusable document-generation policy/orchestrator requested for all Moves and Source artifacts. Broader document-generation architecture remains a follow-up lane.
