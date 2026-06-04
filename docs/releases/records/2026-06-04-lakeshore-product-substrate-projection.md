# 2026-06-04-lakeshore-product-substrate-projection — Lakeshore Product Substrate Projection

## Release ID

`2026-06-04-lakeshore-product-substrate-projection`

## Status

`candidate`

## Plain-English Summary

Adds a Lakeshore-specific product-substrate loader that projects the already-governed Lakeshore synthetic bundle into the app tables used by Setup/Data Trust, Source, Strategic Moves, Intelligence/Tower initiative substrate, and Tower cost/vendor views. It does not regenerate the bundle or invent a new corpus; it reshapes the existing loaded files into the surfaces the demo reads.

## Layer Impact

- `client-data-lane`: writes Lakeshore-only setup inventory, Source events, engagements, AI initiatives, initiative child evidence, and Tower rows from the loaded Lakeshore bundle.
- `global-control-lane`: fixes Strategic Moves client-name rendering so Lakeshore programs do not fall back to Apex labeling.

## Client Applicability

- All clients: Strategic Moves client-name fallback supports Lakeshore.
- Specific clients: Lakeshore Holdings only for the loader.
- Internal only: loader is operator-run from the repo.
- Public/demo only: Lakeshore synthetic demo substrate.
- Feature flag: none.

## Changes Included

- `src/scripts/lakeshore/load-product-substrate.ts`
- `src/lib/programs/transformers.ts`
- `src/lib/programs/types.ui.ts`
- `docs/build/lakeshore/loaded/load-runs/lakeshore-product-substrate-dry-run-latest.json`
- `docs/build/lakeshore/loaded/load-runs/lakeshore-product-substrate-commit-latest.json`

## QA / Validation

- PASS: `npm run lakeshore:product-substrate:load -- --dry-run --out=docs/build/lakeshore/loaded/load-runs/lakeshore-product-substrate-dry-run-latest.json` resolved Lakeshore client `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61` and planned 9 setup segments, 1,329 setup records, 2 Source events, 66 Source artifact states, 78 Source gate criteria, 42 Source evidence states, 6 Strategic Moves engagements, 40 AI initiatives, 80 initiative KPIs, 40 initiative decisions, 82 Tower vendor-spend rows, 40 Tower program-financial rows, and 24 Tower cloud-cost rows.
- PASS: `npm run lakeshore:product-substrate:load -- --out=docs/build/lakeshore/loaded/load-runs/lakeshore-product-substrate-commit-latest.json` committed the same counts transactionally with 0 warnings.
- PASS: live DB proof found Lakeshore `clients=1`, `person_client_memberships=2`, `data_inventory_segments=9`, `data_inventory_records=1329`, `enterprise_context_chunks=1329`, `embeddedContextChunks=1329`, `source_events=2`, `source_event_artifact_states=66`, `source_event_gate_criterion_states=78`, `source_event_evidence_states=42`, `engagements=6`, `ai_initiatives=40`, `ai_initiative_kpis=80`, `ai_initiative_decisions=40`, `tower_vendor_spend=82`, `tower_program_financials=40`, and `tower_cloud_cost=24`.
- PASS: live DB bleed probe found 0 Apex/Meridian/SkyHarbor/First Capital terms in Lakeshore enterprise context chunks.
- PASS: `npm run test:behaviors` passed 6 suites / 103 tests.
- PASS: `npm run test:nav` passed 1 suite / 26 tests.
- PASS: `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts src/lib/source/canvas-substrate/__tests__/scaffold.test.ts --runInBand` passed 2 suites / 24 tests, including Lakeshore Source tenant-scope coverage.
- PASS: Lakeshore verifier chain passed: `npm run lakeshore:synthetic-context:verify`, `npm run lakeshore:loader-hardening:verify`, `npm run lakeshore:agent-grounding:verify`, `npm run lakeshore:corpus-map:check`, and `npm run lakeshore:live-activation:verify`. The live activation verifier remains `ready_with_warnings` only for missing optional Azure Document Intelligence env vars.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to main, then run the loader with production `.env.local` credentials for Lakeshore. The script is idempotent for rows tagged with `lakeshore-product-substrate-v1`.

## Rollback Plan

Revert the PR to remove the loader and client-name fix. For data rollback, delete rows tagged with `loaded_via_template = 'lakeshore-product-substrate-v1'`, `source_events.created_by_user_id = 'lakeshore-product-substrate-v1'`, Lakeshore engagement rows with `graph_node_id like 'move:lakeshore:%'`, and Lakeshore `data_inventory_*` rows written with tenant key `lakeshore-holdings`.

## Audit Evidence

- Loader output JSON under `docs/build/lakeshore/loaded/load-runs/` after commit.
- Live DB proof query counts for Lakeshore client id `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61`.
- Source events: `LSH-AMS-MODERNIZATION-2026`, `LSH-KYRIBA-TREASURY-2026`.

## Known Gaps

- The loader projects product substrate from synthetic evidence; it does not claim real client production data.
- Move template instances remain out of scope because the live `move_templates` registry is empty.
