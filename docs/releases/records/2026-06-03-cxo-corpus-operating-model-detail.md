# 2026-06-03-cxo-corpus-operating-model-detail — CXO Corpus Operating Model Detail

## Release ID

`2026-06-03-cxo-corpus-operating-model-detail`

## Status

`candidate`

## Plain-English Summary

Expanded the CXO HTML operating-model brief so a non-technical executive can understand how AbarVa corpus materials are parsed, stored, governed, retrieved, and used by Sentinel, Nexus, Moves, and Source. The update adds simple workflow/dataflow sections, concrete corpus examples, Azure-native storage and parsing explanations, and hallucination-control examples.

## Layer Impact

- `public-demo`: Updates a founder/client-facing HTML artifact under `docs/build/`.
- `global-control-lane`: Clarifies the intended enterprise corpus operating model, but does not change runtime behavior, data schemas, APIs, migrations, or product UI.

## Client Applicability

- All clients: The explanation applies to all AbarVa pilot clients and future tenant-scoped corpus uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Yes, this is a shareable executive artifact.
- Feature flag: None.

## Changes Included

- Updated `docs/build/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html`.
- Added detail sections for end-to-end workflows, corpus contents, Azure parsing/storage, Next.js/React data binding, Sentinel vs Nexus usage, client customization, and hallucination controls.
- Refreshed the copy intended for `/Users/anand/Downloads/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html`.

## QA / Validation

- Pass: `git diff --check`.
- Pass: content smoke check confirms the added CXO sections are present in the HTML.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge the docs-only PR to `main`. No database migration, application deploy dependency, or feature flag rollout is required. The updated HTML can be opened directly from the repo or from Anand's Downloads folder.

## Rollback Plan

Revert the docs-only commit or restore the prior `docs/build/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html` version. No data rollback is required.

## Audit Evidence

- PR URL and CI status.
- Diff for `docs/build/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html`.
- Release check output.
- Refreshed local Downloads artifact path.

## Known Gaps

This is an explanatory artifact only. It does not implement additional parsers, Azure resources, data-plane migrations, agent retrieval changes, or product UI controls.
