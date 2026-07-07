# 2026-07-01-source-p1-mve-profile-runtime — Source P1 Vendor Response Profile Runtime

## Release ID

`2026-07-01-source-p1-mve-profile-runtime`

## Status

`candidate`

## Plain-English Summary

This release candidate implements the first Source P1 runtime slice. For the
SkyHarbor AMS sourcing event, Source can now show three synthetic vendor
response profiles generated from realistic long-response package structures:
sectioned narrative plus required exhibits. The profile is intentionally narrow:
it extracts sourcing-critical information needed to assess response readiness,
pricing, productivity commitments, staffing, SLA, exceptions, transition, and
clarification needs. It does not add scoring, BAFO, or generic document Q&A.

## Layer Impact

- `global-control-lane`: Adds shared Source proposal-intelligence types and a
  deterministic profile builder.
- `public-demo`: Adds SkyHarbor synthetic demo vendor response profiles on the
  Source Responses stage when the event is SkyHarbor-scoped.

## Client Applicability

- All clients: Shared code path, but profile fixture only binds when the event
  identity is SkyHarbor.
- Specific clients: SkyHarbor demo event only for this slice.
- Internal only: None.
- Public/demo only: Synthetic vendor response profile fixture.
- Feature flag: Uses existing Source event surface; no new flag.

## Changes Included

- Added Vendor Response Profile contracts to proposal intelligence.
- Added deterministic MVE profile builder for three SkyHarbor synthetic
  vendors.
- Added Source Responses-stage profile panel.
- Wired Source event page to pass SkyHarbor profile data into the canvas.
- Added unit tests for profile generation, mismatch detection, and non-SkyHarbor
  tenant binding.

## QA / Validation

- PASS: `npx jest src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/proposal-intelligence src/components/source/canvas/responses 'src/app/(maestro)/source/events/[eventId]/page.tsx'`
- BLOCKED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
  reaches repo-wide pre-existing missing dependency/type declarations after the
  slice-local type issue was fixed: `js-yaml`,
  `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- PASS: `npm run release:check`

## Rollout Plan

Merge by PR. Deploy through the approved Azure Container Apps main lane only
after review. Browser proof should open the SkyHarbor AMS event at the Responses
stage and confirm the Vendor Response Profiles panel appears with three profiles.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: None.
- Approved image digest: To be recorded by deploy workflow.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives the image for the
  merge SHA.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes before claiming production-visible.

## Rollback Plan

Revert the PR or disable the panel wiring. No migration or data-plane rollback is
required.

## Audit Evidence

- PR diff.
- Test output.
- Browser screenshot of the Source Responses stage after deploy.

## Known Gaps

This slice is deterministic and fixture-backed. It does not load vendor response
packages into the Azure data plane, parse uploaded PDF/DOCX/XLSX files, run
scoring, generate BAFO packs, or send vendor communications.
