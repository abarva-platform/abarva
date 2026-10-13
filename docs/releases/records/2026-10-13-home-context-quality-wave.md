# Home Context Quality Wave

## Release ID

`2026-10-13-home-context-quality-wave`

## Status

`candidate`

## Plain-English Summary

This candidate improves the executive context experience without changing its source data. It preserves complete supplier names, distinguishes record counts from attribute pairs, and makes shared-value and summary/detail labels more precise. Chapter presentation, maps, assistant responses and briefing export are being validated together against the same selected record.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product presentation and response formatting only. Home remains a reader of the selected canonical projection or visibly labelled reviewed snapshot.
- No intake, adapter, canonical-schema, tenant-data, source-generation, model-provider or financial-definition changes. No cross-module data alignment in this candidate.

## Client Applicability

- All clients: shared Home presentation and assistant behavior; applicability depends on available record families.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no; synthetic records retain their explicit basis.
- Feature flag: none added.

## Changes Included

- Scalar supplier and service fields retain punctuation; only declared list fields are tokenized.
- Association counts distinguish source rows from attribute pairs.
- Shared-value disclosure no longer assumes every invariant field is an uncompleted default.
- Destination navigation resets content and document scroll position.
- Exact field formatting preserves cost basis, generator and model-date values instead of treating every cost-prefixed field as money.
- Chapter coverage distinguishes compiled summaries, declared profiles, inspectable detail and missing families. Executive and business readouts use the selected record; operating structure and system accountability remain separate.
- Leadership excerpts deduplicate without losing reference identities or their modelled/synthetic basis. Theme mentions do not establish agreement.
- Renewal flags describe eligibility, not observed decisions. Review roles are explicitly suggested unless the row records an owner. Time-relative claims require a valid record as-of date.
- Maps open on bounded focused slices, retain full-map access, preserve units and explain the distinction between recorded associations and canonical dependencies. Supplied reference identities remain inspectable without inventing source links.
- Assistant recovery preserves complete claims and uncertainty; follow-up questions belong to the latest answer. Chat follows the latest answer while respecting deliberate scroll-up and offers a return-to-latest control.
- Briefing PDFs explicitly preserve text, tables and source basis, not interactive chart/map parity. Notes stay with final rows; pages have running sections and numbers.
- Lucide React is an exact, lockfile-pinned ISC runtime dependency for familiar accessible icon controls.

## QA / Validation

- Pass: supplier cardinality regression tests, including preserved punctuation, duplicate list tokens, missing endpoints and counting units.
- Pass: initial focused record-browser regression sweep, 52 tests.
- Pass: final integrated Home sweep, 760 tests across 56 suites, including independent-review regression cases.
- Pass: full repository typecheck through the owned Node 24 typecheck command.
- Pass: focused lint, zero errors. Four pre-existing unused-variable warnings remain in an existing test fixture.
- Pass: controlled-release gates, 11 of 11 executed and passed.
- Pass: context/corpus dataset-manifest validation; existing approval-metadata warnings are unchanged. No dataset is added or loaded.
- Pass: local component browser review of all eight chapter overviews at narrow width; no document-width overflow. Focused maps render at desktop and narrow widths with a fitted default, full-map access, zoom and visible-reference inspection.
- Pass: actual local 26-page PDF render; tables retain their cells, notes remain with their final table rows, and source/synthetic scope remains visible.
- Independent review: all five reproduced semantic and map-reference issues were corrected with regression coverage before merge. Final independent acceptance is required before merge.
- Not run: post-release runtime invariant and signed-in browser acceptance. No live completion claim is made.

## Rollout Plan

Publish a PR against the organization repository after integrated validation. Squash merge through protected main. Only `.github/workflows/aca-main-deploy.yml` may build and deploy the shared runtime. Validate the deployed digest and signed-in behavior before acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main only.
- Shared runtime mutators: none invoked by this candidate outside that workflow.
- Approved image digest: resolved from the successful main workflow; not assigned in advance.
- ACA runtime invariant: web template and healthy 100%-traffic revision must use the approved digest.
- Worker image invariant: every worker maintained by the main workflow must use the same approved digest.
- Feature/env flag update path: no updates planned.
- Live signed-in proof required: affected Home chapters, record browsers, maps, assistant interactions and PDF scope.

## Rollback Plan

Revert the merged PR through another protected-main PR and deploy through the same main workflow. No schema rollback or tenant-data restoration is needed.

## Audit Evidence

Focused regressions and review results are recorded below as completed. Merge, deploy and signed-in acceptance references will be reported separately. Private runtime and browser evidence stays outside the public repository.

## Known Gaps

Canonical detail refresh, cross-module data alignment and new governed source generation remain gated and outside this release. PDF visual parity is not claimed. Reviewed snapshots are not described as live governed records or current independently attested enterprise facts.
