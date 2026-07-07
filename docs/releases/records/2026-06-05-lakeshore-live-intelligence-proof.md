# 2026-06-05-lakeshore-live-intelligence-proof — Lakeshore Live Intelligence Answer Proof

## Release ID

`2026-06-05-lakeshore-live-intelligence-proof`

## Status

`candidate`

## Plain-English Summary

Adds a live Lakeshore Intelligence QA harness and captured production proof packet. The harness signs in as the Lakeshore CFO persona, pins the active client to Lakeshore, calls the deployed `/api/intelligence/ask` route from an authenticated browser session, scores tenant safety and answer quality, and writes JSON plus HTML evidence.

## Layer Impact

Release lanes: `public-demo` lane and `internal-admin` lane.

- `public-demo`: Adds concrete live-product evidence that Lakeshore Intelligence can answer finance, treasury, Source, Moves, Tower, tenancy, and readiness questions from the deployed app.
- `internal-admin`: Adds a repeatable internal QA harness for refreshing Lakeshore live-answer proof.

## Client Applicability

- All clients: None.
- Specific clients: Lakeshore Holdings only.
- Internal only: The harness and report are internal QA evidence.
- Public/demo only: The proof supports Lakeshore demo readiness.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/intelligence-live-answer-qa.mjs`
- `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-26-03-013Z-ec02c1041/`

## QA / Validation

- Ran `node --check scripts/lakeshore/intelligence-live-answer-qa.mjs`.
- Ran `node scripts/lakeshore/intelligence-live-answer-qa.mjs` with production credentials from `.env.local`.
- Live production result: 12 authenticated `/api/intelligence/ask` turns, 11 pass, 1 watch, 0 fail, average 9.75 / 10.
- Verified tenant safety checks passed with no Apex/Meridian/Northstar/SkyHarbor bleed failures.
- Verified the Azure AI Search versus Pinecone boundary passed live.

## Rollout Plan

Merge to main as a QA harness and evidence package. No database migration, product runtime rollout, or feature flag is required. The report captures the production state at run time and can be refreshed by rerunning the harness.

## Rollback Plan

Revert the harness and report package. No runtime rollback is required.

## Audit Evidence

- `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-26-03-013Z-ec02c1041/summary.json`
- `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-26-03-013Z-ec02c1041/report.html`
- `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-26-03-013Z-ec02c1041/transcript.json`
- `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-26-03-013Z-ec02c1041/intelligence-ask-start.png`

## Known Gaps

One of twelve live turns is a watch because the answer did not explicitly include every expected handoff term in the AI success-loop framing. There were no live failures. This proof does not expand the Lakeshore corpus.
