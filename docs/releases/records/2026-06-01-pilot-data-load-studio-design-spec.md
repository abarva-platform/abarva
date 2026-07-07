# 2026-06-01-pilot-data-load-studio-design-spec — Pilot Data Load Studio Design Spec

## Release ID

`2026-06-01-pilot-data-load-studio-design-spec`

## Status

`candidate`

## Plain-English Summary

Adds a governed design spec and inspectable HTML wireframe for the pilot Data Load Studio. The artifact defines how Setup should support dimension-first data loading, consent, upload, malware and sensitive-data quarantine, parsing, validation, approval, commit, rollback, and audit export before the SkyHarbor data reload proof begins.

## Layer Impact

`client-data-lane`: Defines the client-scoped workflow, controls, and QA contract for loading private pilot data into the context layer.

`global-control-lane`: Defines the shared Setup page experience and Home-vs-Setup boundary that all pilot clients should receive.

## Client Applicability

- All clients: The design pattern applies to the shared Setup data-load surface.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are the pilot validation clients.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/build/PILOT_DATA_LOAD_STUDIO_DESIGN_SPEC_2026-06-01.md`
- `docs/build/PILOT_DATA_LOAD_STUDIO_WIREFRAME_2026-06-01.html`

## QA / Validation

- PASS: `node -e "const fs=require('fs'); const html=fs.readFileSync('docs/build/PILOT_DATA_LOAD_STUDIO_WIREFRAME_2026-06-01.html','utf8'); const required=['Start governed load','Consent and attestation','Scan and quarantine','Owner approval','Commit or roll back','SkyHarbor Air','Application portfolio','Vendor contracts','ERP landscape']; for (const token of required) { if (!html.includes(token)) throw new Error('missing '+token); } const opens=(html.match(/<section/g)||[]).length; const closes=(html.match(/<\\/section>/g)||[]).length; if (opens!==closes) throw new Error('section mismatch '+opens+' vs '+closes); console.log('PASS html wireframe contract checks');"`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after review and CI pass. This is a design-control artifact only; it does not change runtime behavior until follow-on implementation slices land.

## Rollback Plan

Revert the PR to remove the design spec and wireframe. No runtime or data-plane rollback is required.

## Audit Evidence

Audit evidence will include the PR URL, release control gate output, and final merged commit.

## Known Gaps

The spec and wireframe do not implement the full workflow. Follow-on backlog slices must implement durable ingestion schema, consent, quarantine, parsing, validation, approval, commit, rollback, audit export, tenant-isolation tests, and the SkyHarbor clean-load proof.
