# 2026-06-06-skyharbor-moves-source-artifact-seed — SkyHarbor Moves and Source Artifact Seed

## Release ID

`2026-06-06-skyharbor-moves-source-artifact-seed`

## Status

`candidate`

## Plain-English Summary

Adds a controlled Admin Data Loader-backed runner for SkyHarbor demo readiness. The runner creates realistic, tenant-scoped Strategic Moves and Source events for the CTO/product-development story, with value ranges, owners, evidence themes, Source intake details, scaffolded Source artifacts, and evidence readiness placeholders. It is dry-run by default, requires `--apply` before writing, and records the committed run in `data_ingestion_runs`.

## Layer Impact

- `client-data-lane`: Adds a SkyHarbor-only, loader-backed data runner for Strategic Moves and Source event artifacts. The runner records `data_ingestion_runs` audit evidence and is documented as no side-load. The runner preflights the ingestion-ledger table when a demo database is missing the existing setup-data substrate object.
- `internal-admin`: Adds an operator command for controlled seed execution and reset of deterministic seeded rows.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor only.
- Internal only: Seed execution is internal/operator controlled.
- Public/demo only: Supports private signed-in demo proof for SkyHarbor.
- Feature flag: None.

## Changes Included

- `src/scripts/seed/seed-skyharbor-moves-source-artifacts.ts`
- `package.json` script `seed:skyharbor-artifacts`
- Release record for this candidate.

## QA / Validation

- PASS: `npm run seed:skyharbor-artifacts -- --plan-only`
- BLOCKED: `npx tsc --noEmit --pretty false` could not run in the clean worktree because local `node_modules` is absent and `npx` resolved the placeholder `tsc` package. Run again in CI or after dependency install.
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- FAIL, then fixed in follow-up: Azure dry-run execution `job-skyharbor-load-0528-p6ht1ub` reached the runner and failed on `column "key" does not exist`; the client lookup now detects available `clients` columns instead of assuming `key` / `slug`.
- FAIL, then fixed in follow-up: Azure dry-run execution `job-skyharbor-load-0528-b2ar93c` resolved SkyHarbor and then failed on `relation "public.data_ingestion_runs" does not exist`; the runner now verifies/creates the ingestion-ledger table before starting the audit row.
- FAIL, then fixed in follow-up: Azure dry-run execution `job-skyharbor-load-0528-ec7r8a6` verified the ingestion ledger and started a dry-run row, then failed on `invalid input syntax for type json`; the runner now inspects target column types and explicitly serializes JSON/JSONB payloads before database writes.
- FAIL, then fixed in follow-up: Azure dry-run execution `job-skyharbor-load-0528-sdgdfbv` advanced through JSON serialization and then failed on `there is no unique or exclusion constraint matching the ON CONFLICT specification`; the runner now uses schema-tolerant manual select/update/insert upserts instead of assuming every demo database has the expected unique indexes.

Live Azure apply and signed-in crawl proof remain required before marking the SkyHarbor Moves/Source backlog item complete. The apply path writes a `data_ingestion_runs` ledger row; no side-load path is approved for completion.

## Rollout Plan

Merge the script to main, then run the Admin Data Loader-backed artifact command from an approved operator environment with `DATABASE_URL` pointed at the intended Azure/Postgres data plane. Use dry-run first, then apply with:

```bash
DATABASE_URL=... npm run seed:skyharbor-artifacts -- --apply --reset-seeded
```

After apply, crawl the SkyHarbor signed-in routes and confirm `/strategic-moves`, `/source/queue`, `/source/portfolio`, and one Source detail/artifact surface show the seeded content.

## Rollback Plan

Because this release does not include migrations, rollback is data-only. Delete the deterministic rows by provenance tag `skyharbor_demo_artifact_seed_2026_06_06` and exact SkyHarbor Source event names, or use a temporary reset-only operator variant if needed. App rollback is the normal PR revert.

## Audit Evidence

- Seed runner command output, including `data_ingestion_runs` run id.
- Azure job/container logs for dry-run and apply.
- Signed-in SkyHarbor crawl report after apply.
- PR checks for typecheck and release control.

## Known Gaps

- This only creates controlled demo artifacts. It does not claim a true client private subscription or client-approved production evidence.
- The live apply and browser proof are not complete until run against the target data plane.
