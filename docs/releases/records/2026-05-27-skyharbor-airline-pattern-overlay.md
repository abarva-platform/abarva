# 2026-05-27-skyharbor-airline-pattern-overlay - SkyHarbor Airline Industry Pattern Overlay

## Release ID

`2026-05-27-skyharbor-airline-pattern-overlay`

## Status

`candidate`

## Plain-English Summary

Adds a reusable airline industry pattern overlay for the SkyHarbor Air synthetic tenant. The overlay gives Sentinel a substantial airline modernization, operations, sourcing, AI, SDLC, finance, cyber, and governance corpus to combine with SkyHarbor's tenant-specific facts during Intelligence, Moves, and Source demos.

## Layer Impact

- Knowledge fabric: adds 184 pattern packs, 2,760 industry patterns, and 2,760 loader-ready enterprise context chunks.
- Data plane: adds a SkyHarbor extra corpus under `datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/`.
- Loader/tooling: wires the SkyHarbor tenant loader to ingest the overlay alongside the 480 core tenant chunks.
- Founder/demo docs: adds the airline overlay markdown, a demo artifact README, and Packet 29 demo capture script.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: SkyHarbor Air synthetic/demo tenant only.
- Internal only: generation, verification, and demo-capture artifacts.
- Public/demo only: intended for airline modernization demo rehearsal and methodology review.
- Feature flag: none.

## Changes Included

- Scripts: `scripts/skyharbor/generate-airline-pattern-overlay.mjs`, `scripts/skyharbor/verify-airline-pattern-overlay.mjs`
- Dataset: `datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/`
- Docs: `docs/build/delta-pilot/AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md`, `docs/build/delta-pilot/PACKET_29_DEMO_CAPTURE.md`
- Loader: `scripts/seed/load-tenant-substrate.ts`
- Package scripts: `generate:skyharbor-overlay`, `verify:skyharbor-overlay`

## QA / Validation

- Passed: `node scripts/skyharbor/generate-airline-pattern-overlay.mjs`
- Passed: `node scripts/skyharbor/verify-airline-pattern-overlay.mjs`
- Passed: `node scripts/skyharbor/verify-skyharbor-substrate.mjs`
- Passed: `TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --dry-run --only-chunks`
- Pending before production data mutation: run the real loader from an approved private Azure runtime if the production database remains reachable only through Private Link.

## Rollout Plan

Merge to main and deploy the code/artifact update. For live data-plane activation, run `TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks --concurrency=8` from the approved Azure private lane so the extra corpus is embedded and loaded into `enterprise_context_chunks`.

## Rollback Plan

Revert the PR to remove the overlay artifacts, loader extra-corpus registration, package scripts, and demo capture docs. If the real loader has already run, reload the prior SkyHarbor corpus without the overlay or delete overlay chunks by `chunk_id LIKE 'SHA-AIR-PATTERN-CHUNK-%'` scoped to client ID `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301`.

## Audit Evidence

- Human overlay: `docs/build/delta-pilot/AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md`
- Pattern JSONL: `datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl`
- Chunk JSONL: `datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl`
- Verification reports: `datasets/skyharbor-air-synthetic-v1/verification/airline_pattern_overlay_report.md`, `datasets/skyharbor-air-synthetic-v1/verification/airline_pattern_overlay_report.html`
- Demo capture packet: `docs/build/delta-pilot/PACKET_29_DEMO_CAPTURE.md`

## Known Gaps

- This release creates and wires the overlay corpus. It does not by itself mutate production data; live chunk availability depends on running the private-lane loader.
