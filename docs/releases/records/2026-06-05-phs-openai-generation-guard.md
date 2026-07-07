# 2026-06-05-phs-openai-generation-guard — PHS OpenAI Generation Guard

## Release ID

`2026-06-05-phs-openai-generation-guard`

## Status

`candidate`

## Plain-English Summary

Adds the guarded OpenAI-only generation harness for the Meridian / PHS
command-center demo. The harness refuses to generate strategy, architecture,
business-case, or mobilization artifacts unless Phase 0 is truly ready: all PHS
loader templates are present, evidence-register rows are in the evidence
ledger, the manifest validates, and the requested artifact supplies both
evidence IDs and corpus pattern IDs.

## Layer Impact

`client-data-lane`: Generation is bound to uploaded PHS context, evidence
ledger rows, and corpus pattern references instead of ad hoc prompts.

`global-control-lane`: Establishes a reusable guarded-generation pattern for
future Moves-led demo artifacts.

## Client Applicability

- All clients: The guard pattern is reusable.
- Specific clients: Meridian / PHS command-center setup is the immediate target.
- Internal only: Yes, this is generation substrate and tests, not a public route.
- Public/demo only: No public route impact.
- Feature flag: None.

## Changes Included

- Added `src/lib/context-ingestion/phs-command-center-generation.ts`.
- Added `src/lib/context-ingestion/__tests__/phs-command-center-generation.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-command-center-generation.test.ts src/lib/context-ingestion/__tests__/phs-stage-readiness.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-command-center-generation.ts src/lib/context-ingestion/__tests__/phs-command-center-generation.test.ts`.
- PASS: `git diff --check`.
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by pre-existing missing
  package types for `@azure-rest/ai-document-intelligence` and
  `@axe-core/playwright`; no new PHS generation files are present in the
  typecheck error list.

## Rollout Plan

Merge to main after CI. No migration or data load is required. Follow-on route or
workflow slices can call this harness after Phase 0 loader uploads complete.

## Rollback Plan

Revert the PR. The PHS loader templates, evidence ledger binding, and readiness
guard remain intact, but no OpenAI-only artifact-generation harness would be
available.

## Audit Evidence

- Guard source: `src/lib/context-ingestion/phs-command-center-generation.ts`.
- Tests: `src/lib/context-ingestion/__tests__/phs-command-center-generation.test.ts`.

## Known Gaps

This does not upload or side-load any Meridian / PHS data. It also does not yet
expose a UI button or API route; it is the guarded server-side generation
contract that those surfaces should use next.

Repo-wide typecheck is currently blocked by pre-existing missing package types
outside this slice, as noted in QA / Validation.
