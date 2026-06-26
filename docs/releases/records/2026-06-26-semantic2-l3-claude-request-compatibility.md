# 2026-06-26 Semantic2 L3 Claude Request Compatibility

## Release ID

`2026-06-26-semantic2-l3-claude-request-compatibility`

## Status

`candidate`

## Plain-English Summary

This release fixes the build-time Semantic2 L3 dossier generator so it can call the current Claude model successfully and remain operable in the ACA/VNet proof lane. The previous request included a deprecated sampling parameter that the selected model rejects before generating derived insights, the Stage 2 prompt now sends bounded evidence cards instead of large raw fact payloads, live operator runs now emit per-dossier progress with bounded Claude call timeouts, tenant discovery now resolves canonical tenant keys while querying any client-id aliases, and empty evidence slices now bypass Claude with deterministic insufficiency output.

## Layer Impact

- `global-control-lane`: Updates a shared Semantic2 operator script used to populate enriched L3 dossiers. It does not change runtime answer rendering or route any product surface to the new dossiers.
- `client-data-lane`: Enables a controlled write into the existing `semantic2_dossiers` store under the new L3 prompt version when the approved operator build is run.

## Client Applicability

- All clients: Applicable to every tenant included in the L3 dossier build.
- Specific clients: None.
- Internal only: Operator build script and proof bundle generation.
- Public/demo only: None.
- Feature flag: Not feature-flagged; surfaces remain unwired until separately approved.

## Changes Included

- `scripts/semantic2/build-enriched-l3-dossiers.mjs`: removes the deprecated `temperature` request parameter from the build-time Anthropic call.
- `scripts/semantic2/build-enriched-l3-dossiers.mjs`: bounds the Stage 2 Claude prompt projection to compact fact and relationship cards while keeping local `fact_id` support for derived insights.
- `scripts/semantic2/build-enriched-l3-dossiers.mjs`: adds per-dossier progress logging and a bounded Claude timeout with grounded fallback insight handling so ACA/VNet operator runs cannot hang silently.
- `scripts/semantic2/build-enriched-l3-dossiers.mjs`: canonicalizes tenant scopes from `clients` and source tables so UUID client identifiers can be queried as aliases but L3 dossiers are written under business tenant keys.
- `scripts/semantic2/build-enriched-l3-dossiers.mjs`: skips Claude calls for dimensions with zero facts and records an honest insufficiency insight instead.

## QA / Validation

- `npm run semantic2:l3-dossiers:self-test` passed.
- `npx eslint scripts/semantic2/build-enriched-l3-dossiers.mjs` passed.
- `npm run release:check` passed with this release record.
- Live VNet rerun is required after deploy to prove the Stage 2 Claude call completes.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA `aca-main-deploy` workflow, then rerun the L3 dossier builder from the deployed/VNet runtime. The build writes only the new L3 dossier prompt version and does not overwrite existing L1/L2 evidence or current surface-facing dossiers.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps deploy workflow only.
- Approved image digest: Resolved by the ACA deploy workflow.
- ACA runtime invariant: Verified by the ACA deploy workflow.
- Worker image invariant: Verified by the ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this patch is an operator build script and no surface wiring changes.

## Rollback Plan

Revert the script change or redeploy the prior image. Any L3 dossiers created by the operator run use their own `prompt_version` and can be ignored by runtime surfaces because no surface reads that version yet.

## Audit Evidence

- PR and CI for this patch.
- ACA deploy run after merge.
- VNet build log showing the Claude request succeeds and emits the L3 dossier proof bundle.

## Known Gaps

The L3 dossier build still stops at the human gate. Home, Intelligence, Moves, Source, and Tower are not wired to the new enriched L3 dossier version in this release.
