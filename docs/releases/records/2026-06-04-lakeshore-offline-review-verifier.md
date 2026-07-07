# 2026-06-04-lakeshore-offline-review-verifier — Lakeshore Offline Review Verifier

## Release ID

`2026-06-04-lakeshore-offline-review-verifier`

## Status

`candidate`

## Plain-English Summary

Hardens the Lakeshore synthetic context package proof so AbarVa can confirm, with one npm command, that the offline client-review ZIP contains the expected manifest, templates, workbook, documents, and how-to pages before anyone sends it to a client reviewer.

## Layer Impact

- `client-data-lane`: Adds a stronger verification path for the Lakeshore synthetic data artifacts already staged under `docs/build/lakeshore/loaded/`. It does not load data into a live tenant data plane.
- `internal-admin`: Gives AbarVa operators a named proof command for the one-time offline review packet.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: Lakeshore Holdings synthetic pilot package only.
- Internal only: AbarVa operator verification before offline review or governed upload.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `npm run lakeshore:synthetic-context:verify`.
- Updates `scripts/lakeshore/verify-synthetic-context.mjs` to validate the offline ZIP without relying on a package import at runtime.
- Keeps the existing Lakeshore data package unchanged.

## QA / Validation

- `npm run lakeshore:synthetic-context:verify` — passed; verified tenant keys, five companies, 1,329 structured records, 18 CSV templates, 21 documents, workbook and ZIP signatures, and 65 offline ZIP entries.
- `npm run release:check -- --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. There is no Vercel runtime behavior change. Operators can run the verifier before sharing the offline review bundle or before starting the governed Lakeshore load rehearsal.

## Rollback Plan

Revert the PR to remove the npm alias and verifier hardening. The existing data package remains governed by its original release record unless that prior release is separately reverted.

## Audit Evidence

- Verifier command: `npm run lakeshore:synthetic-context:verify`
- Offline bundle: `docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip`
- Manifest: `docs/build/lakeshore/loaded/manifest.json`
- Release record: `docs/releases/records/2026-06-04-lakeshore-offline-review-verifier.md`

## Known Gaps

- This verifies the offline review packet only. Live upload, parsing, embedding, approval, commit, and Data Trust verification remain gated by the blocked Lakeshore load-execution PR and live credentials.
