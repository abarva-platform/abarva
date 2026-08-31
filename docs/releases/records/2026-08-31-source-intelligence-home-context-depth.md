# 2026-08-31-source-intelligence-home-context-depth — Home Source Context Depth

## Release ID

`2026-08-31-source-intelligence-home-context-depth`

## Status

`candidate`

## Plain-English Summary

Extends the Home page-packet builder so a page writer can receive the selected source files'
full source content alongside accepted source-intelligence artifacts. This closes the gap where a
Home page prompt could be rich in design intent but narrow in evidence context.

## Layer Impact

Affected lane: `global-control-lane`.

- `Layer 1 - Client Intake`: reads source-content prompt envelopes generated from the source CSVs;
  does not mutate intake files.
- `Layer 2 - Source Adapters`: enriches the Home page-packet preparation step with source content
  context when an inventory directory is supplied.
- `Layer 3 - Canonical Enterprise Model`: no canonical table mutation.
- `Layer 4 - Products`: no runtime route mutation; this changes the build-time prompt/context
  contract that future Home page writers consume.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: applies to internal Home narrative/context preparation.
- Public/demo only: supports synthetic demo Home source-context preparation.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_source_intelligence_home_packets.mjs`
  - Adds `--inventory-dir`.
  - Adds `source_content_context` to page packets when source-content prompt envelopes are present.
  - Adds `context_depth` to writer prompts so the prompt states whether full source files are
    included.
- `scripts/ecl/__tests__/run-source-intelligence-home-packets-tests.mjs`
  - Proves that full selected source content reaches the page packet and prompt.

## QA / Validation

- Pass: `npm run test:ecl-source-intelligence-home-packets`
- Pass: `npm run ecl:source-intelligence:home-packets -- --source-dir /tmp/source-intelligence-model-pass-20260831-mock-v3 --inventory-dir /tmp/source-intelligence-inventory-20260831-full-v2 --out-dir /tmp/source-intelligence-home-packets-20260831-v2`

## Rollout Plan

Merge to main only. There is no Azure Container Apps rollout, migration apply, traffic shift,
feature flag, or data-plane mutation in this slice.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this does not affect runtime routes.

## Rollback Plan

Revert the commit. No data-plane or product-runtime state is changed.

## Audit Evidence

- Unit proof: `npm run test:ecl-source-intelligence-home-packets`
- Full-context packet proof: `/tmp/source-intelligence-home-packets-20260831-v2/manifest.json`
- Download artifact: generated locally for operator inspection; not committed to the public repo.

## Known Gaps

This slice does not run Claude, publish Home narrative rows, change the Home renderer, or deploy
runtime code. It makes the prompt/context packet deep enough for the next narrative generation pass.
