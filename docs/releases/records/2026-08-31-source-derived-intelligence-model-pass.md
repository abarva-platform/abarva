# 2026-08-31-source-derived-intelligence-model-pass — Source-Derived Intelligence Model Pass

## Release ID

`2026-08-31-source-derived-intelligence-model-pass`

## Status

`candidate`

## Plain-English Summary

Adds an executable source-intelligence model-pass runner. The runner takes the prompt envelopes
created by the source inventory builder, requires full source-file content by default, calls Claude
when an Anthropic key is present, and writes raw responses, accepted artifacts, and verification
ledgers. It also includes a deterministic mock mode so CI can prove the artifact contract without a
model call.

## Layer Impact

Affected lane: `global-control-lane`.

- `Layer 1 - Client Intake`: reads source-file prompt envelopes that include the original CSV
  content and deterministic inventory metadata.
- `Layer 2 - Source Adapters`: adds the model-assisted source intelligence execution step and
  provenance capture.
- `Layer 3 - Canonical Enterprise Model`: no canonical table mutation.
- `Layer 4 - Products`: no product runtime mutation.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: applies to internal build tooling for source-intelligence preparation.
- Public/demo only: supports synthetic demo source-intelligence generation.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_source_intelligence_model_pass.mjs`
- `scripts/ecl/__tests__/run-source-intelligence-model-pass-tests.mjs`
- `docs/architecture/SOURCE_DERIVED_INTELLIGENCE_LAYER_2026_08_31.md`
- `package.json` scripts:
  - `ecl:source-intelligence:model-pass`
  - `test:ecl-source-intelligence-model-pass`

## QA / Validation

- Pass: `npm run test:ecl-source-intelligence-model-pass`
- Pass: model-pass mock run over the current synthetic source-inventory package.

## Rollout Plan

Merge to main only. There is no Azure Container Apps rollout, migration apply, traffic shift,
feature flag, or data-plane mutation in this slice. Real model runs require `ANTHROPIC_API_KEY` and
should execute in the governed data-build lane for private-client packages.

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

- Unit proof: `npm run test:ecl-source-intelligence-model-pass`
- Mock run proof: `/tmp/source-intelligence-model-pass-20260831/run-manifest.json`
- Download artifact: generated locally for operator inspection; not committed to the public repo.

## Known Gaps

This slice does not run a real Claude pass unless an Anthropic key is supplied by the execution
environment. It does not publish accepted artifacts into ECL, regenerate Home pages, deploy runtime
code, or mutate Azure data.
