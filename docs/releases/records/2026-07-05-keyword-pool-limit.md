# 2026-07-05-keyword-pool-limit — Widen loaded-context candidate pool for broad-token queries

## Release ID

`2026-07-05-keyword-pool-limit`

## Status

`candidate`

## Plain-English Summary

Follow-on to the loaded-context retrieval fixes (#4465/#4467). Those made freshly-loaded tenant context retrievable, and it is proven live (an Intelligence answer cited uploaded legal-intake KPIs: 663 avoidable inquiries, 320 obligation gaps). One residual gap remained: when a question contains a very common word like "status" — which matches nearly every chunk in a tenant's corpus — the keyword retriever's candidate pool (previously `LIMIT 240`, ordered newest-first) filled entirely with older corpus rows before reaching the newly-loaded uploads, so those questions missed the fresh context. This change raises the candidate `LIMIT` to 1500 so a whole tenant's matching chunks are fetched and relevance ranking (not the fetch cap) decides what surfaces, making retrieval robust to natural phrasing.

## Layer Impact

- `global-control-lane`: `readKeywordContextChunkSource` in `src/lib/knowledge/tenant-enterprise-context.ts` — read-path candidate pool size for the loaded-context keyword retriever. No schema/data change.

## Client Applicability

- All clients: Yes — improves retrieval recall for every tenant's Intelligence answers.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts`: `readKeywordContextChunkSource` candidate SQL `LIMIT 240 → 1500` (aligns with the tenant-wide `LIMIT 1200` used by `retrieveEnterpriseContextChunks` in `enterprise-context/retrieval.ts`). Ordering (`updated_at DESC`) and in-memory relevance ranking unchanged.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Pre-change live proof: **PASS with selective phrasing** — "avoidable inquiries and obligation ownership" cited 663/320; **FAIL with broad phrasing** — "how many status inquiries are avoidable" missed (crowding).
- Post-deploy live proof: **NOT-RUN (pending redeploy)** — confirm the broad-phrased "status inquiries" question now cites the loaded values.

## Known Gaps

- For an extremely large tenant (»1500 matching chunks) a broad token could still crowd the pool; the durable fix is relevance-ranked SQL (e.g. full-text/tsvector) rather than a fetch-then-rank cap. Out of scope here; 1500 covers current tenants in full.
- No unit test added; correctness established by live answer proof.

## Rollout Plan

Merge to `main` → ACA main deploy → `ca-abarva-web-lab-eastus` → shift traffic → verify with a live signed-in ask using broad phrasing.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the one-line `LIMIT` change and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind.

## Audit Evidence

- PR URL: (to be filled on open).
- Live pre/post ask captures from `app.abarva.ai` (Lakeshore Holdings).
