# 2026-06-24-ai-opportunity-expert-pack-corpus — AI Opportunity Expert Pack Corpus

## Release ID

`2026-06-24-ai-opportunity-expert-pack-corpus`

## Status

`candidate`

## Plain-English Summary

Adds a structured AbarVa expert-pack corpus for AI Opportunity Discovery and
Process Intelligence. The corpus gives Intelligence, Moves, and Ava reusable
consulting knowledge for ServiceNow/ITSM, Jira delivery, observability, process
mining, AI automation archetypes, human-agent operating models, AI governance,
architecture, value/ROM estimation, and 90-day pilot roadmaps.

The pack corpus is explicitly not client evidence. It interprets tenant evidence
and supplies patterns, controls, value logic, and roadmap guidance only with
caveats and source separation.

## Layer Impact

- `global-control-lane`: Adds shared expert-pack corpus types, seed records,
  matching logic, and tests for all clients/modules.
- `client-data-lane`: Adds an additive Postgres read-model migration scaffold
  for retrieving the corpus alongside tenant evidence. No live tenant data is
  changed in this slice.

## Client Applicability

- All clients: yes, once the corpus is loaded and bound into runtime prompts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this slice.

## Changes Included

- `src/lib/intelligence/opportunity-expert-corpus.ts`
- `src/lib/intelligence/__tests__/opportunity-expert-corpus.test.ts`
- `supabase/migrations/20260624173000_ai_opportunity_expert_pack_corpus.sql`
- `docs/architecture/azure/AI_OPPORTUNITY_EXPERT_PACK_CORPUS.md`
- `docs/releases/records/2026-06-24-ai-opportunity-expert-pack-corpus.md`

## QA / Validation

- Targeted Jest for `opportunity-expert-corpus.test.ts` — PASS, 6 tests.
- Focused ESLint for corpus source and tests — PASS.
- `npm run release:check` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — FAILS on pre-existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no corpus-specific type error was reported before those project-level dependency errors.
- Live Azure/Postgres migration apply — not run in this slice.
- Browser answer proof — not run in this slice.

## Rollout Plan

Merge to `main`. Apply the additive migration through the approved Azure/Postgres
VNet migration lane. Load the authored corpus into the new read-model tables,
then bind `buildOpportunityExpertContext(...)` into Moves AI Opportunity
Discovery artifacts and Intelligence/Ava advisor answers.

## Deployment Authority

- Repo-owned deploy workflow: required only when runtime wiring is deployed.
- Shared runtime mutators: none in this slice.
- Approved image digest: not applicable until runtime wiring.
- ACA runtime invariant: not affected by this corpus-only candidate.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: required for the later runtime binding slice.

## Rollback Plan

Revert this PR. If the migration has been applied, disable read paths and drop
only the `ai_opportunity_expert_pack_*` tables after confirming no runtime
answer path depends on them.

## Audit Evidence

Inspect the corpus source, migration, tests, architecture note, and CI output.

## Known Gaps

- Migration is additive but not applied live in this slice.
- Corpus rows are authored in git but not yet loaded into Azure/Postgres.
- Moves and Intelligence/Ava prompt binding are not wired in this slice.
- No browser or live answer proof is claimed here.
