# Freeze Notice

Status: active for this workstream as of 2026-08-21.

## Paused

- Home golden snapshot promotion.
- Broad Layer 1-4 refresh.
- Canonical table backfills.
- Table drops, renames, and destructive cleanup.
- Consumer read-path repointing.
- Shared projection refresh as migration proof.
- New model-derived enrichment.
- Generated artifact promotion as source truth.
- Pilot migration or cutover authorization.

## Allowed

- Static code and migration inventory.
- Read-only file/source/hash inventory.
- Read-only database catalog and row-count profiling where network access permits.
- Runtime evidence capture through signed-in browser probes, route logs, query logs, and ACA job logs.
- Candidate-branch planning artifacts that do not mutate shared runtime or tenant data.

## Hard Gates

Migration cannot begin until all exit criteria are met:

- 100% of persisted objects have a disposition.
- 100% of active writers are identified.
- 100% of active consumer paths are identified.
- Every enterprise object family has exactly one target authority.
- Every shared projection has a rebuild path.
- Every snapshot has freshness and source-hash metadata.
- Generated artifacts are explicitly marked as projections.
- Every active route has a target read contract.
- Tenant isolation, dual-run, and rollback are proven.
- No hidden fallback reads old authority.

