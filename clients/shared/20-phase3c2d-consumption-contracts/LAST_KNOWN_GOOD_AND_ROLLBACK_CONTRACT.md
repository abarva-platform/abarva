# Last-Known-Good and Rollback Contract

Baseline activation is atomic. If a downstream projection, Cube validation, aVa packet validation or consumer parity test fails, the new publication remains inactive.

## Failure behavior

- Previous active Knowledge Baseline remains live.
- Previous Home read models remain live.
- Previous Cube semantic snapshot remains live.
- Previous aVa packet remains live.
- Failure is written to `consumption.refresh_run` with failure code and input/output hashes.

## Rollback point

Rollback is a pointer change to the prior active baseline, not a destructive data rewrite.
