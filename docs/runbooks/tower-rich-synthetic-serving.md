# Tower rich synthetic serving selector

This operator changes only the Layer 4 active assessment selector. It must run through the private, digest-pinned ACA Job lane. A successful private Layer 4 stage publishes an immutable tar bundle at an assessment-scoped Blob path and reports its URI and SHA-256. Keep that pair together.

## Before the check job

Confirm the source package is the versioned repaired candidate; the original retained package remains untouched. The package must declare `no_runtime_load=false` under a reviewed release. The dataset manifest must have a named load approval for that exact assessment, source hash, object count, and load release record. The private Layer 2, Layer 3, and Layer 4 jobs must have passed their quality and readback gates. The Layer 4 stage proof must show that the active selector did not change and that the candidate is still invisible.

The check job uses `tower:rich-synthetic:serving-check-job`. Supply the same private Blob account/container and exact `TOWER_RICH_SERVING_STAGE_BUNDLE_URI` and `TOWER_RICH_SERVING_STAGE_BUNDLE_SHA256` emitted by the stage. Supply `TOWER_RICH_SERVING_TENANT_KEY`, `ASSESSMENT_ID`, `RUN_ID`, `JOB_NAME`, `IDEMPOTENCY_KEY`, `BUILD_VERSION`, `INPUT_SOURCE_VERSION`, `OPERATOR_IDENTITY`, `IMAGE_DIGEST`, `GIT_SHA`, and `RELEASE_RECORD`, plus `DATABASE_URL`, a Blob credential, `ABARVA_OPERATOR_IMAGE_DIGEST`, and `TOWER_RICH_SERVING_EXECUTION_LANE=aca_operator_job`. The release record is the serving approval record; it may differ from the private load record in the stage proof.

The check job does not change the selector. It compares the immutable stage proof with the committed source set, manifest, active tenant registry, named serving approval, and all nine physical page row fingerprints. It uploads an immutable `preflight.json` with a `ready` or `blocked` result. A blocked result is not a serving decision.

## Promote

Run `tower:rich-synthetic:serving-promote-job` with the same bindings and image digest, plus `TOWER_RICH_SERVING_PREFLIGHT_URI` and `TOWER_RICH_SERVING_PREFLIGHT_SHA256` for the reviewed ready check. The operator rereads the selector and physical rows under a serializable transaction, retires exactly the current active assessment, inserts the approved candidate as active, and verifies all nine serving views before commit. It then performs an independent readback and publishes `promotion.json`. A `promotion-pending.json` is published before the selector change for recovery if the later proof write fails.

## Roll back

Run `tower:rich-synthetic:serving-rollback-job` with the exact immutable `TOWER_RICH_SERVING_PROMOTION_URI` and `TOWER_RICH_SERVING_PROMOTION_SHA256` for `promotion.json` or the pending proof. It requires the candidate to be the current active generation and the prior generation's physical rows to match the recorded fingerprints. It restores the prior selector and verifies its serving rows before and after commit. The job publishes `rollback.json`.

Treat ACA data readback, web deployment, and signed-in product proof as separate results. Do not call Tower client-ready from an offline source QA report or a staged candidate alone.
