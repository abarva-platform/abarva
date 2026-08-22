# ECL Legacy Table Retirement Map

Static repo-visible SQL inventory only. This does not connect to Azure/Postgres, does not authorize deletion, and does not prove whether a table is live.

## Summary

| Metric                             | Count |
| ---------------------------------- | ----: |
| CREATE TABLE statements            |   562 |
| Unique table names                 |   483 |
| Duplicate table names across files |    75 |

## Status Counts

| Status                               | Count |
| ------------------------------------ | ----: |
| `ARCHIVE_ONLY`                       |    25 |
| `HOLD_PLATFORM_CONTROL`              |    30 |
| `HOLD_UNTIL_ECL_CONTEXT_PARITY`      |    60 |
| `HOLD_UNTIL_LIVE_READBACK`           |   226 |
| `NEW_ECL_TARGET`                     |    26 |
| `REPLACE_OR_BRIDGE`                  |     1 |
| `REPLACE_WITH_ECL_PROJECTION`        |   161 |
| `REVIEW_FOR_MOVES_OR_CONTEXT_BRIDGE` |    33 |

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
