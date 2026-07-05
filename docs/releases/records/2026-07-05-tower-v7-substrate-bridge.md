# 2026-07-05-tower-v7-substrate-bridge — Tower V7 Substrate Bridge

## Release ID

`2026-07-05-tower-v7-substrate-bridge`

## Status

`candidate`

## Plain-English Summary

Tower could show value and renewal "gap" states when its older AI Control Tower refresh tables or context projection did not contain Tower-shaped rows, even though the validated V7 intelligence substrate contained spend, initiative value, measured AI value, vendor renewal, and evidence records. This release adds a V7-to-Tower bridge so Tower reads the validated V7 substrate before falling back to older projections or synthetic demo states.

## Layer Impact

- `global-control-lane`: Updates the shared Tower read model used by `/tower`.
- `client-data-lane`: Reads existing validated V7 tenant records from `intelligence_v7`; no schema or loader change is included.

## Client Applicability

- All clients: Yes, for tenants with validated V7 records.
- Specific clients: Lakeshore/Industrial Demo is the immediate bug case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ai-control-tower/read-model.ts`
  - Adds `intelligence_v7` as a Tower read source.
  - Maps V7 program, AI initiative, spend/value, vendor contract, operational risk, evidence, and fact records into the existing Tower read-model contract.
  - Gives V7 precedence over the older context projection so V7-loaded tenants do not show false gap states.
  - Ignores `data_thin:*` placeholders as executive-facing values.
- `src/lib/ai-control-tower/__tests__/read-model.test.ts`
  - Adds a Lakeshore V7 regression test proving value, spend, benefits, and renewal date are mapped instead of rendering false empty/gap states.

## QA / Validation

- Pass: `npx eslint src/lib/ai-control-tower/read-model.ts src/lib/ai-control-tower/__tests__/read-model.test.ts`
- Pass: `npx jest src/lib/ai-control-tower/__tests__/read-model.test.ts --runInBand -t "maps validated V7"`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps release path, move `ca-abarva-web-lab-eastus` traffic to the corrected revision at 100%, then verify signed-in `/tower` for Lakeshore/Industrial Demo.

## Deployment Authority

`app.abarva.ai` must deploy through the approved Azure Container Apps lane for `ca-abarva-web-lab-eastus`. Vercel deploys, preview URLs, and rollback commands are not valid production evidence for this release.

## Rollback Plan

Revert this release commit to restore the previous Tower read-model order. No migration rollback is required because this change is read-only.

## Audit Evidence

- Local lint output listed above.
- Targeted V7 regression output listed above.
- Post-deploy audit still required: active ACA revision/image digest plus signed-in browser proof that Lakeshore Tower no longer renders false `gap` states when V7 records exist.

## Context Ingestion Evidence

No new ingestion is performed by this release. It consumes existing V7 records already loaded into Azure Postgres.

- Local artifact generated: Not applicable.
- Local parse/preflight: Not applicable.
- Product loader/API acceptance: Not applicable.
- Azure Blob/object storage staging: Not applicable.
- Queue/private worker handoff: Not applicable.
- Parser extraction with source citations: Not applicable.
- Review/approval queue: Not applicable.
- Client data-plane commit: Existing V7 load, not part of this release.
- Embedding/search refresh: Not applicable.
- Live signed-in retrieval or answer QA: Not run yet for this release candidate.

## Known Gaps

- Production/browser proof has not been run yet.
