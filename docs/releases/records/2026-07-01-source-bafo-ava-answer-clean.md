# 2026-07-01-source-bafo-ava-answer-clean — Source BAFO aVa Answer Cleanup

## Release ID

`2026-07-01-source-bafo-ava-answer-clean`

## Status

`candidate`

## Plain-English Summary

Source aVa now answers BAFO questions from the vendor-specific BAFO instruction
pack instead of flattening those asks into generic current-state prose. The
answer tells the sourcing team what should go into BAFO, which vendors remain
conditional, what structured exhibits are required, and why scoring should stay
open until the revised commitments are evidenced.

## Layer Impact

- `global-control-lane`: Updates the shared Source answer engine for all
  clients when BAFO-style prompts are backed by BAFO instruction evidence.
- No data-plane migration.
- No UI layout change.
- No external vendor communication is sent.

## Client Applicability

- All clients: Shared Source aVa answer path, activated only for BAFO prompts
  with BAFO instruction evidence.
- Specific clients: SkyHarbor/Airline Demo synthetic AMS event is the live proof
  tenant for this candidate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Inherits existing Source/simple-front gating; no new flag.

## Changes Included

- Adds a BAFO-specific answer formatter inside
  `src/lib/source/source-answer-engine.ts`.
- Keeps the existing deterministic evidence ranking and citations.
- Adds a regression test proving BAFO answers mention Vendor A/B/C, structured
  exhibits, scoring holdbacks, and do not lead with `Mode:` / `Current state:`
  or expose `source_events` / `Sourcing Artifacts` in answer prose.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts --runInBand`:
  `pass`.
- `npx eslint src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts`:
  `pass`.
- `npm run release:check`: `not-run` until this record is committed.
- PR CI: `not-run` until PR creation.
- ACA main deploy: `not-run` until merge to `main`.
- Signed-in Source browser/API proof: `not-run` until ACA deploy completes.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for healthy revision and 100% traffic, then rerun the signed-in
Source proof against the SkyHarbor/Airline Demo response stage.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps main lane only
- Approved image digest: Captured after deploy
- ACA runtime invariant: Required
- Worker image invariant: Required by deploy workflow
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert this PR and redeploy through the ACA main lane. Since this is a
non-destructive code-only release with no migration, rollback does not require
data repair.

## Audit Evidence

- PR URL: to be filled after PR creation
- CI checks: to be filled after PR validation
- ACA deploy run: to be filled after deploy
- Signed-in proof package: to be saved under `/Users/anand/Downloads/`

## Known Gaps

This cleanup does not parse arbitrary uploaded 100-page proposal packages and
does not send vendor-facing BAFO communications. It only improves the aVa answer
quality for BAFO questions already grounded in Source P1 BAFO instruction
evidence.
