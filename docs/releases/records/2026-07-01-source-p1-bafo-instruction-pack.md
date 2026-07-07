# 2026-07-01-source-p1-bafo-instruction-pack — Source P1 BAFO Instruction Pack

## Release ID

`2026-07-01-source-p1-bafo-instruction-pack`

## Status

`candidate`

## Plain-English Summary

Source P1 now takes the vendor response MVE profiles and the challenge/leverage
intelligence from Slice 2 and turns them into a buyer-ready BAFO instruction
pack. The response stage shows vendor-specific BAFO asks, common response
rules, completeness criteria, required response formats, and scoring holdbacks.
This keeps BAFO preparation tied to sourcing-critical evidence instead of broad
proposal summarization or generic negotiation advice.

## Layer Impact

- `global-control-lane`: Adds shared Source response-stage runtime behavior,
  typed proposal-intelligence contracts, and client-visible canvas rendering for
  all events that qualify for vendor response MVE profiles.
- No schema or data-plane migration.
- No external vendor communication is sent by this release.

## Client Applicability

- All clients: Shared Source code path, activated only when the event has a
  qualifying vendor response MVE profile set.
- Specific clients: SkyHarbor/Airline Demo synthetic AMS event is the proof
  tenant for this candidate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Inherits existing Source/simple-front gating; no new flag.

## Changes Included

- Adds `VendorBafoInstructionPack` contracts and
  `buildVendorBafoInstructionPack`.
- Adds `VendorBafoInstructionPackPanel` to the Source response-stage canvas.
- Binds BAFO pack generation in the Source event page.
- Adds BAFO pack rows into Source aVa event evidence.
- Adds focused unit/render tests.

## QA / Validation

- Focused Jest for proposal intelligence and response-stage panels: `pass`.
- Scoped ESLint for touched Source files: `pass`.
- `npm run release:check`: `pass` after this release record update.
- TypeScript: `blocked` by unrelated pre-existing missing dependency
  declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and
  `@axe-core/playwright`; no Slice 3 file errors were emitted before those
  repository-level blockers.
- PR CI: `not-run` until PR creation.
- ACA main deploy: `not-run` until merge to `main`.
- Signed-in Source browser proof on the SkyHarbor/Airline Demo response stage:
  `not-run` until ACA deploy completes.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for healthy revision and 100% traffic, then run signed-in browser
proof against `https://app.abarva.ai/source/events/... ?stage=responses`.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps main lane only
- Approved image digest: Captured after deploy
- ACA runtime invariant: Required
- Worker image invariant: Required by deploy workflow
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. Since this is a
non-destructive code-only release with no migration, rollback does not require
data repair.

## Audit Evidence

- PR URL: to be filled after PR creation
- CI checks: to be filled after PR validation
- ACA deploy run: to be filled after deploy
- Signed-in proof package: to be saved under `/Users/anand/Downloads/`

## Known Gaps

This release does not parse arbitrary uploaded 100-page proposal packages and
does not send vendor-facing BAFO communications. It proves the runtime bridge:
MVE profiles plus challenge/leverage seeds become a structured BAFO instruction
pack.
