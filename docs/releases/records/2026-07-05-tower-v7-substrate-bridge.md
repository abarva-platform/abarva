# 2026-07-05-tower-v7-substrate-bridge — Tower V7 Substrate Bridge

## Release ID

`2026-07-05-tower-v7-substrate-bridge`

## Status

`candidate`

## Plain-English Summary

Tower could show value and renewal "gap" states when its older AI Control Tower refresh tables, CIO Tower metric tables, materialized Tower read-model tables, or context projection did not contain Tower-shaped rows, even though the validated V7 intelligence substrate contained spend, initiative value, measured AI value, vendor renewal, and evidence records. This release adds a V7-to-Tower bridge so Tower reads the validated V7 substrate before falling back to older projections or synthetic demo states. It also fixes the live Lakeshore masking case where partial old Tower spend rows existed and caused the first read-model path to stop before checking V7, and the visible `/tower` page path still ignored V7.

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
  - Supplements partial committed Tower rows with V7 records instead of treating any old spend row as a complete Tower substrate.
  - Ignores `data_thin:*` placeholders as executive-facing values.
- `src/lib/tower/v7-tower-projection.ts`
  - Adds a read-only V7 projection for the visible Tower dashboard path.
  - Maps V7 program, AI initiative, vendor contract, and spend/value records into the existing Tower UI initiative/vendor/metric-packet contracts.
  - Canonicalizes the app's `lakeshore-holdings` tenant alias to the loaded V7 key `lakeshore-industries`.
  - Normalizes V7 dimension keys case-insensitively so loaded `V7_09...` / `V7_10...` records are not missed by lowercase runtime filters.
  - Projects `V7_08_spend_value` rows into Tower initiative rows, because Lakeshore's V7 monetary envelope is carried in the spend/value ledger rather than only in the priority/program rows.
- `src/lib/atlas/tower-grounding.ts`
  - Uses the V7 Tower projection when the older materialized Tower page rows are empty or lack program/vendor value.
  - Runs supporting-row, band-metric, pressure, and 2x2 logic against the V7-backed visible Tower state.
- `src/lib/cio-tower/metric-packet-store.ts`
  - Supplements missing CIO Tower metric packets from V7-derived runtime packets so the KPI strip does not show false value gaps.
- `src/lib/ai-control-tower/__tests__/read-model.test.ts`
  - Adds a Lakeshore V7 regression test proving value, spend, benefits, and renewal date are mapped instead of rendering false empty/gap states.
  - Adds a regression for the live failure mode: committed spend rows exist, portfolio/value/vendor rows are missing, and V7 must fill the missing Tower model slices.
- `src/lib/tower/__tests__/v7-tower-projection.test.ts`
  - Adds a visible-page seam regression proving Lakeshore V7 records produce Tower initiatives, vendor renewal exposure, and non-gap metric packets.
  - Covers uppercase V7 dimension keys matching the Azure-loaded file naming style.
  - Covers V7 spend/value rows creating committed-value program rows and vendor exposure.

## QA / Validation

- Pass: `npx eslint src/lib/ai-control-tower/read-model.ts src/lib/ai-control-tower/__tests__/read-model.test.ts`
- Pass: `npx jest src/lib/ai-control-tower/__tests__/read-model.test.ts --runInBand -t "maps validated V7"`
- Pass: `npx jest src/lib/ai-control-tower/__tests__/read-model.test.ts --runInBand -t "supplements partial"`
- Pass: `npx jest src/lib/ai-control-tower/__tests__/read-model.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/v7-tower-projection.ts src/lib/atlas/tower-grounding.ts src/lib/cio-tower/metric-packet-store.ts src/lib/tower/__tests__/v7-tower-projection.test.ts`
- Pass: `npx jest src/lib/tower/__tests__/v7-tower-projection.test.ts --runInBand`
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
- First deployed bridge proof showed ACA deployment succeeded but signed-in Lakeshore `/tower` still rendered false gaps because old partial Tower rows masked V7. This record now includes the follow-up hotfix and regression coverage for that masking path.
- The follow-up visible-page binding is required because signed-in browser proof after the first hotfix still showed false `gap` states on `/tower`.
- Signed-in browser proof after the visible-page binding still showed false gaps because the Azure-loaded V7 dimension keys use `V7_...` casing while the runtime projection filtered only lowercase `v7_...` keys. This record now includes the case-insensitive dimension-key fix.
- Signed-in browser proof after the case-insensitive deploy still showed false gaps because the visible Tower projection did not turn `V7_08_spend_value` into Tower initiative/program rows. This record now includes the spend/value-to-program projection.
- Post-deploy audit still required after the visible-page binding: active ACA revision/image digest plus signed-in browser proof that Lakeshore Tower no longer renders false `gap` states when V7 records exist.

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
- Live signed-in retrieval or answer QA: First bridge deployment, first hotfix deployment, visible-page binding deployment, and case-insensitive dimension-key deployment failed signed-in Lakeshore Tower proof for the visible page; spend/value projection browser proof still required.

## Known Gaps

- V7 spend/value projection production/browser proof has not been run yet.
