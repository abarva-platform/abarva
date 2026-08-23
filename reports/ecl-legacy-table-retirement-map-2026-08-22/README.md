# ECL Legacy Table Retirement Map

Static repo-visible SQL inventory only. This does not connect to Azure/Postgres, does not authorize deletion, and does not prove whether a table is live.

## Summary

| Metric | Count |
| --- | ---: |
| CREATE TABLE statements | 897 |
| Unique table names | 736 |
| Duplicate table names across files | 133 |

## Status Counts

| Status | Count |
| --- | ---: |
| `ARCHIVE_ONLY` | 25 |
| `HOLD_PLATFORM_CONTROL` | 46 |
| `HOLD_UNTIL_ECL_CONTEXT_PARITY` | 153 |
| `HOLD_UNTIL_LIVE_READBACK` | 394 |
| `NEW_ECL_TARGET` | 28 |
| `REPLACE_OR_BRIDGE` | 1 |
| `REPLACE_WITH_ECL_PROJECTION` | 215 |
| `REVIEW_FOR_MOVES_OR_CONTEXT_BRIDGE` | 35 |

## Boundary

- No Azure read or write.
- No migration authorization.
- No deletion authorization.
- No product route repointing.

## Next Use

Use `legacy_table_retirement_map.csv` as the starting table-by-table retirement pressure map. Rows marked `HOLD_*` require live writer/reader readback before any retirement call. Rows marked `REPLACE_WITH_ECL_PROJECTION` are the first parity targets for Home, Source, Tower, Moves, Intelligence, and cube projections.

The CSV includes execution columns: `owner_to_confirm`, `live_readback_required`, `parity_target`, and `deletion_authorization_required`. These fields are routing aids, not authorization.

## Files

- `legacy_table_retirement_map.csv`
- `legacy_table_retirement_summary.json`
