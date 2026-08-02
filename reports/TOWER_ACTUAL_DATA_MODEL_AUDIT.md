# Tower Actual Data Model Audit

This report is superseded by `reports/TOWER_DATA_MODEL_AUDIT.md`.

The current finding is that local Tower data lives in `tower.*`; `cio_tower.mart_*` is retired for the `/tower` runtime path and should be archived/sunset/purged only through the approved database change lane.

