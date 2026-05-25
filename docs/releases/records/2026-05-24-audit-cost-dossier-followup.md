# 2026-05-24-audit-cost-dossier-followup — Agent Audit Cost Trace and Dossier Handoff

## Release ID

`2026-05-24-audit-cost-dossier-followup`

## Status

`candidate`

## Plain-English Summary

This release closes the two follow-ups from the Apex and Meridian two-task agent audits. The audit reports now include a real Design Contribution Analysis and populated LLM cost traces from `ai_egress_audit`. The Strategic Move origination path also carries Intelligence-originated Moves into a Decision Dossier thread so Move-detail chat can resolve "this Move" against the Move the user just created.

## Layer Impact

- `app-control-lane`: Move origination, Move detail chat, and Intelligence Shape Move links now carry the decision-thread context required for Packet 22 continuity.
- `ops-release-lane`: Adds the reusable audit cost-trace reader and the one-task audit rerun script so future crawls can report per-turn USD cost from `ai_egress_audit`.

## Client Applicability

- All clients: Decision-thread handoff and Move chat pronoun resolution apply to any tenant using Intelligence to shape a Move.
- Specific clients: The existing Apex and Meridian audit HTML reports were updated on disk with Design Contribution Analysis and cost summaries.
- Internal only: The new audit scripts are operator tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/ai-egress-cost-trace.ts`.
- Adds `scripts/audit/update-agent-report-sections.ts`.
- Adds `scripts/audit/run-agent-2task-eval.ts` and `npm run audit:agent-2task`.
- Updates Intelligence Shape Move links to carry `intelligenceSessionId`.
- Updates Move origination submit to call `ensureThreadForMove()` at submit time and return `decisionThreadId` / `dossierUrl`.
- Updates Move detail chat to pass `decisionThreadId` in `surfaceContext`.
- Updates `/api/chat/agent` to inject an explicit decision-thread pronoun-resolution prompt.
- Updates P22 smoke and component/static contract tests.

## QA / Validation

- PASS: `DOTENV_CONFIG_PATH=/Users/anand/Projects/nexus/.env.local npx tsx scripts/audit/update-agent-report-sections.ts`
- PASS: `DOTENV_CONFIG_PATH=/Users/anand/Projects/nexus/.env.local npm run audit:agent-2task -- --base-url https://app.abarva.ai --tenant apex,meridian --turn-limit 1 --output-root /Users/anand/Projects/nexus/audit-artifacts`
- PASS: `npm test -- --runTestsByPath src/lib/programs/__tests__/origination-submit-contract.test.ts src/components/strategic-moves/__tests__/StrategicMoveDetailClient.test.tsx`
- PASS: `npm run smoke:p22-decision-dossier`
- PASS: `npx eslint scripts/audit/ai-egress-cost-trace.ts scripts/audit/update-agent-report-sections.ts scripts/audit/run-agent-2task-eval.ts src/lib/programs/origination-submit.ts src/lib/decisions/auto-linker.ts src/components/strategic-moves/StrategicMoveDetailClient.tsx src/components/strategic-moves/StrategicMoveDetailView.tsx src/app/'(maestro)'/strategic-moves/new/page.tsx src/components/intelligence-v4/IntelligenceBrief.tsx src/components/intelligence-v3/MyStrategyCxoCanvas.tsx src/components/intelligence-v3/PatternsCxoCanvas.tsx`

## Rollout Plan

Merge to `main` and let the standard production deploy run. No migration is included. The already-updated local report HTML files remain in `audit-artifacts/` as audit artifacts; future runs can regenerate cost traces through the new audit scripts.

## Rollback Plan

Revert this PR. The reports and generated audit artifacts are external artifacts and can remain as historical evidence. There is no schema rollback.

## Audit Evidence

- Apex report updated: `/Users/anand/Projects/nexus/audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/APEX_AGENT_INTELLIGENCE_REPORT.html`
- Meridian report updated: `/Users/anand/Projects/nexus/audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/MERIDIAN_AGENT_INTELLIGENCE_REPORT.html`
- Apex historical cost summary: `/Users/anand/Projects/nexus/audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/cost-trace/summary.json`
- Meridian historical cost summary: `/Users/anand/Projects/nexus/audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/cost-trace/summary.json`
- Apex live rerun cost summary: `/Users/anand/Projects/nexus/audit-artifacts/apex-task1-cost-rerun-2026-05-25T00-31-25-811Z/cost-trace/summary.json`
- Meridian live rerun cost summary: `/Users/anand/Projects/nexus/audit-artifacts/meridian-task1-cost-rerun-2026-05-25T00-31-52-121Z/cost-trace/summary.json`

## Known Gaps

The current `ai_egress_audit` table does not persist provider-reported token usage on every row. The cost reader uses provider metadata when present and otherwise marks the USD value as an estimate based on the audited model row and turn text. A future egress wrapper improvement should persist provider usage directly.
