# 2026-06-26-tower-materialized-read-model-isolation — Tower Materialized Read Model Isolation

## Release ID

`2026-06-26-tower-materialized-read-model-isolation`

## Status

`candidate`

## Plain-English Summary

Tower now has an additive `tower_*` materialized read-model contract for demo-readiness work. The visible Tower runtime fallback no longer reaches directly into the enterprise context projection; it reads only the Tower read-model tables when the existing AI initiatives registry is empty.

Pass B also adds the Tower L3 answer-dossier store and deterministic dossier builder. This creates governed, business-language Tower packets by tenant/scope/CIO view for human review before any surface wiring.

Pass B delta updates the dossier validator and review bundle so Stage 1 skeletons are not overclaimed as enriched dossiers. Prompt/render-facing business bodies are separated from internal citations, known structural gaps are named, and every sampled dossier emits a prompt-to-render trace package.

## Layer Impact

- `global-control-lane`: changes shared Tower runtime fallback behavior for all clients once deployed.
- `client-data-lane`: adds additive `tower_*` schema for materialized Tower read models, gaps, spend realism audit, forbidden identifiers, answer traces, and versioned L3 answer dossiers.

## Client Applicability

- All clients: runtime fallback path now expects Tower materialized read models.
- Specific clients: Lakeshore and SkyHarbor are the first demo-readiness targets.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none in this slice.

## Changes Included

- Migration: `supabase/migrations/20260626130000_tower_demo_readiness_materialized_plane.sql`
- Runtime reader: `src/lib/tower/tower-materialized-read-model.ts`
- Materialization planner: `src/lib/tower/tower-materialization.ts`
- Materialization CLI: `src/scripts/tower/materialize-read-model.ts`
- L3 dossier builder: `src/lib/tower/tower-l3-dossiers.ts`
- L3 dossier report CLI: `src/scripts/tower/build-l3-dossiers.ts`
- Runtime refactor: `src/lib/atlas/tower-grounding.ts`
- Tests: `src/lib/tower/__tests__/tower-materialized-read-model.test.ts`, `src/lib/tower/__tests__/tower-materialization.test.ts`, `src/lib/tower/__tests__/tower-l3-dossiers.test.ts`
- Decision record: `NEEDS_DECISION.md`
- Pass B delta: prompt version `tower-l3-dossier-v2`, skeleton verdicts, prompt/render-safe `businessBody`, full trace emitter, render harness, prompt rubric, render parity summary, and delta report.

## QA / Validation

- Targeted Jest: pass — `npx jest src/lib/tower/__tests__/tower-materialized-read-model.test.ts src/lib/tower/__tests__/tower-materialization.test.ts --runInBand` (7 tests passed).
- Targeted Jest: pass — `npx jest src/lib/tower/__tests__/tower-l3-dossiers.test.ts --runInBand` (6 tests passed; repo emits pre-existing duplicate mock warnings).
- ESLint: pass — `npx eslint src/lib/tower/tower-materialized-read-model.ts src/lib/tower/tower-materialization.ts src/lib/tower/__tests__/tower-materialized-read-model.test.ts src/lib/tower/__tests__/tower-materialization.test.ts src/lib/atlas/tower-grounding.ts src/scripts/tower/materialize-read-model.ts`.
- ESLint: pass — `npx eslint src/lib/tower/tower-l3-dossiers.ts src/lib/tower/__tests__/tower-l3-dossiers.test.ts src/scripts/tower/build-l3-dossiers.ts`.
- Local L3 dossier build: pass — `npx tsx src/scripts/tower/build-l3-dossiers.ts --source-dir=/tmp/abarva-lakeshore-portfolio-reference --out-dir=/Users/anand/Downloads/abarva-tower-passB-delta-20260626T153940Z` generated `63` Lakeshore dossiers, `63` validation pass, `0` fail, verdict distribution `57 SKELETON_COMPLETE / 6 SKELETON_PARTIAL`.
- Human-review bundle: `/Users/anand/Downloads/abarva-tower-passB-delta-20260626T153940Z/`.
- Pass B delta literal checks: `0` raw-id/path hits in `01_PROMPT_SENT.txt` and `05_RENDER_INPUT.json`; `0` render parity failures in `RENDER_PARITY_SUMMARY.csv`; `63` trace folders with `630` trace files; validation-summary has `0` failures for `business_language_clean`, `verdict_honesty`, `coverage_honesty`, and `insight_grounding`.
- TypeScript: blocked — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` now runs past the heap issue, but full-repo typecheck is blocked by pre-existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Release check: pass — `npm run release:check`.
- Live Azure/Postgres migration apply: not-run in this PR.
- Live L3 dossier store population: not-run in this PR.
- Signed-in browser proof: not-run in this PR.

## Rollout Plan

1. Merge to main.
2. Apply the additive migration in Azure/Postgres.
3. Run the approved Tower materialization job to populate `tower_read_model_*` from governed upstream sources.
4. Run the approved Tower L3 dossier job to populate `tower_l3_answer_dossiers`.
5. Deploy through the repo-owned Azure Container Apps path.
6. Browser-prove Lakeshore and SkyHarbor Tower surfaces with the proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA rollout.
- Shared runtime mutators: no manual non-main mutation.
- Approved image digest: captured during deploy.
- ACA runtime invariant: active revision/template/traffic must match approved main digest.
- Worker image invariant: materialization job image must be recorded before live apply.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Lakeshore and SkyHarbor.

## Rollback Plan

Code rollback: revert the Tower runtime fallback refactor and redeploy the previous main image.

Data rollback: migration is additive. Leave tables in place if rollback is urgent; stop the materialization job and clear feature/runtime usage. Dropping additive tables requires a separate approved destructive migration.

## Audit Evidence

- PR: draft `#4010`
- Tests: to be attached before ready-for-review.
- Live proof: not in this slice.

## Known Gaps

- Materialization job is scaffolded and test-covered, but not yet run against live Azure/Postgres.
- L3 dossier builder is scaffolded, test-covered, and locally report-proven against the supplied Lakeshore portfolio reference pack; it is not live-populated yet.
- Build-time Claude enrichment did not run in the local shell because `ANTHROPIC_API_KEY` was not present. The report marks Stage 2 as unavailable rather than fabricating derived CIO insights.
- Stage 2 trace files (`02_CLAUDE_RAW.json`, `03_PARSED.json`, `04_GROUNDING.json`) are emitted locally with `pending_aca_run` status. Full model-response grounding remains the ACA/VNet run.
- Gates A-F are not all proven yet.
- Lakeshore Level 2/Level 3 portfolio-company views can now be built from the supplied reference pack after explicit approval to use the Path B portfolio-company input.
