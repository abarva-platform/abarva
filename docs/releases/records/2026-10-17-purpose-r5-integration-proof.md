# Round-five export integration and proof controls

## Release ID

`2026-10-17-purpose-r5-integration-proof`

## Status

`draft` - feature-branch integration only; not approved for main or runtime enrollment.

## Plain-English Summary

The two stacked export changes were squash-merged into the existing review branch in order.
Fresh-generation verification exposed a remaining contradiction in the offline writing schema:
it offered longer titles and scope notes than the phase validator permitted. The schema now
defers to the phase contract rather than maintaining another limit.

The numeric guard now recognizes exact record identifiers from explicitly declared ID columns
in hash-checked source extracts. It still rejects unknown identifiers, partial matches and
unbound numeric amounts. An additional Markdown parsing correction classifies recommendation
bullets as rendered text, without treating formatting punctuation as part of the claim.
An all-zero chart series is described as steady rather than decreasing.

## Layer Impact

Release lane: `experimental`.

- Layers 1-3: no changes to client inputs, adapters, canonical records or financial values.
- Layer 4: experimental export claim parsing and trend description; offline proof harness
  schema, record-reference checks and optional review-edition metadata.

## Client Applicability

- All clients: none enrolled by this change.
- Specific clients: none.
- Internal only: offline synthetic export review.
- Public/demo only: no published artifact or route change.
- Feature flag: `moves_purpose_page_design_v1` remains an empty enrollment.

## Changes Included

- PR #9586, then #9588, merged into `codex/moves-p1-p2-r4`, not `main`.
- `purpose-number-display.ts`: declared source-record references and exact-match handling.
- `purpose-story-contract.ts`: parse recommendation Markdown before classifying claims.
- `purpose-page-plan.ts`: preserve a steady label for an all-zero series.
- `purpose-fresh-source.ts`: one authoritative writing limit, record-reference proof, and
  caller-declared review edition/date. Dates do not establish an input snapshot date.
- Regression cases in the existing purpose-control and page-craft suites.

## QA / Validation

- Combined integration baseline: 78 orchestrator suites, 1,285 tests passed.
- Corrected controls: 78 suites, 1,297 tests passed.
- Final TypeScript and changed-file lint checks passed. All 11 release gates passed.
- Native golden text claim-policy oracle: 432 blocks, zero flags. Native Office files do not
  carry the complete authoring schema; this is not a full schema-oracle claim.
- Offline replay preserves the earlier drafts and rejects their over-long deck titles/scope notes.
- Fresh four-case generation, native rendering and independent page review are tracked in the
  private proof bundle. No visual acceptance or score is inferred from passing tests.

## Rollout Plan

Keep the parent PR draft and keep export enrollment empty. The period, traceability, charter
content and rendered-page balance addendum remains open. Every case must satisfy source controls,
the review threshold and human acceptance before a separate main-merge or deployment decision.

## Deployment Authority

- Repo-owned deploy workflow: not invoked.
- Shared runtime mutators: none.
- Approved image digest: not applicable; no runtime change.
- ACA runtime invariant: unchanged, not re-queried by this offline proof.
- Worker image invariant: unchanged, not re-queried.
- Feature/env flag update path: no update.
- Live signed-in proof required: remains a separate acceptance step for eventual enrollment.

## Rollback Plan

Revert this follow-up commit on the review branch. No data rollback or runtime traffic change
is required. Earlier generated candidates and rejected responses remain available privately.

## Audit Evidence

- Ordered merge commits `21b1fb03ebe648313d399198baa8d90f268f10fe` and
  `b502f2302d0a0dc313d9d749bdaddc87119059bc`.
- Private proof bundle ID `purpose-r5-review-20261017`: source hashes, responses and refusals,
  model-egress records, rendered pages, reviewer image hashes, figure readback and comparisons.
- No source-pack contents or client-specific findings are published in this record.

## Known Gaps

The R5a period metadata, restatement traceability, charter completeness and pixel-based page
balance requirements are not implemented by this change. Passing tests does not grant export
acceptance. P3-P5 expansion, client loading, main merge and deployment remain out of scope.
