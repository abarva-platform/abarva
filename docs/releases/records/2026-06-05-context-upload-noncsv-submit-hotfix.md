# 2026-06-05-context-upload-noncsv-submit-hotfix — Context Upload Non-CSV Submit Hotfix

## Release ID

`2026-06-05-context-upload-noncsv-submit-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the Admin context upload form so JSON, JSONL, and YAML files can be submitted after an operator chooses a file and accepts the attestation. The backend already supported these formats; the browser-side CSV header preflight was still blocking non-CSV files before they reached the server parser.

## Layer Impact

- `internal-admin`: The upload form now correctly labels the file input as a structured file upload and explains that non-CSV schema validation happens on the server.
- `client-data-lane`: Meridian/PHS YAML and JSON gap-fill files can use the governed loader path without a manual workaround.

## Client Applicability

- All clients: Admin context upload behavior is fixed for JSON, JSONL, and YAML templates.
- Specific clients: Meridian/PHS is the immediate beneficiary for `enterprise-profile.yaml` and `hl7-fhir-integration-topology.json`.
- Internal only: Setup/admin operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updates `src/components/admin/context-layer/CsvUploadConnector.tsx` so CSV still gets client-side header preflight, while JSON/YAML/JSONL submit to the server parser after attestation.

## QA / Validation

- Pass — `./node_modules/.bin/eslint src/components/admin/context-layer/CsvUploadConnector.tsx`
- Pass — `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy to Vercel production. No migration is required.

## Rollback Plan

Revert the PR. Existing uploaded context rows remain intact.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3138.
- User-reported issue: non-CSV structured upload button was not clickable.

## Known Gaps

- This does not perform Meridian live reload. It unblocks the operator UI so the governed upload can proceed.
