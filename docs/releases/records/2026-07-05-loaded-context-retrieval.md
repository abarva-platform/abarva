# 2026-07-05-loaded-context-retrieval — Make loaded tenant context retrievable for every domain

## Release ID

`2026-07-05-loaded-context-retrieval`

## Status

`candidate`

## Plain-English Summary

When an operator loads context into a tenant (via the Admin CSV upload + Triage confirm path), the Intelligence assistant should be able to cite that context when it answers a related question. Before this change, the tenant context retriever only ran when the question used IT/CIO vocabulary (applications, vendors, initiatives, DORA, data platforms). A legal-, HR-, or finance-operations question (e.g. "how many status inquiries are avoidable?", "what is the average contract request age?") never triggered the retriever, so freshly-loaded evidence was committed to the database but never read back — "loaded but not retrievable." Additionally, even when the retriever did run, it fetched only a small fixed number of keyword-matched chunks biased toward the file name, so newly-loaded targeted evidence was crowded out by the large pre-existing synthetic corpus.

This change makes the loaded-context retriever run for any substantive question (not just IT vocabulary), and widens its candidate pool ordered by recency and operator-confirmation so freshly-loaded / confirmed context is guaranteed to be considered and is then relevance-ranked.

## Layer Impact

- `global-control-lane`: Alters shared Intelligence retrieval (`retrieveStructuredTenantSources` / `readKeywordContextChunkSource` in `src/lib/knowledge/tenant-enterprise-context.ts`). Affects how the assistant grounds answers for all tenants. No schema, seed, or client-private data changed. Purely a read-path relevance/gating change.

## Client Applicability

- All clients: Yes — retrieval behavior applies to every tenant's Intelligence answers.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None (behavior-improving read-path change; no gate).

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts` (first cut, PR #4465 — merged):
  - `retrieveStructuredTenantSources`: the loaded-context keyword retriever now runs for any question with a usable keyword token, not only when an IT/CIO `wants*` gate matched. Domain-specific readers (profile/apps/vendors/initiatives/DORA) remain gated as before.
  - `readKeywordContextChunkSource`: raised the candidate `LIMIT` 18 → 240; keyword token window widened 8 → 12. Final selection still done by in-memory relevance ranking (`rankChunks`), unchanged, taking the top 8.
- `src/lib/knowledge/tenant-enterprise-context.ts` (correction, follow-up PR — this record updated):
  - **Outer gate fix**: `retrieveTenantEnterpriseSources` previously early-returned `[]` when `isTenantEnterpriseQuestion(query)` was false (an IT/enterprise-vocab classifier, `ENTERPRISE_QUERY_RE`). Legal/HR/finance-ops questions failed that classifier, so the query never reached the inner keyword retriever — the first cut's inner change had no effect for those domains. Now the domain-agnostic loaded-context keyword retriever (`retrieveStructuredTenantSources`) runs regardless; only the leadership/segment readers stay gated behind `isTenantEnterpriseQuestion`.
  - **Ordering fix**: removed the `classification_source = 'OPERATOR_CONFIRMED'`-first ordering. The legacy corpus defaults `classification_source` to `OPERATOR_CONFIRMED`, while fresh Admin uploads are `NEEDS_CLASSIFICATION` until triaged — so confirmed-first ordering buried exactly the newly-loaded rows. Candidate pool now ordered purely by `updated_at DESC NULLS LAST, chunk_id ASC` so freshly-loaded chunks are always in the pool for relevance ranking.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors; node_modules symlinked into worktree).
- Schema precondition check: **PASS** — columns referenced (`classification_source`, `updated_at`) confirmed present on `public.enterprise_context_chunks` (migrations `20260616180000_context_classification_and_insights.sql`, `20260514100000_enterprise_context_layer.sql`).
- Pre-change live evidence (app.abarva.ai, Lakeshore Holdings): **reproduced the defect** — uploaded legal-intake KPI baseline committed (20 records/chunks, diagnostics-confirmed) but four ask phrasings never surfaced the values; retriever either skipped (domain gate) or crowded out (LIMIT 18).
- Post-deploy live signed-in ask proof (first cut, PR #4465): **FAIL** — after deploy the loaded values still did not surface. Diagnosed two remaining causes (outer `isTenantEnterpriseQuestion` gate skipped legal-ops queries entirely; `OPERATOR_CONFIRMED`-first ordering buried fresh NEEDS_CLASSIFICATION uploads). Both corrected in the follow-up.
- Post-deploy live signed-in ask proof (follow-up): **NOT-RUN (pending redeploy)** — re-run the Lakeshore ask after the follow-up deploys and confirm the loaded KPI values are cited.
- Automated tests for this file: **NOT-RUN** (no unit test added; behavior is verified by live ask proof per the verify standard).

## Rollout Plan

Merge to `main` → ACA main deploy builds image from the merged SHA → deploy to `ca-abarva-web-lab-eastus` → shift 100% traffic to the new revision → verify `https://app.abarva.ai` with a live signed-in ask.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy (build + deploy on push to main).
- Shared runtime mutators: none (no migration, no worker, no env/flag change).
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — cited loaded-context values in an Intelligence answer.

## Known Gaps

- Operator confirmation currently flips the `enterprise_context_records` row to `active`/`OPERATOR_CONFIRMED` but does NOT propagate that state to the corresponding `enterprise_context_chunks` rows (they remain `review`/`NEEDS_CLASSIFICATION`). This retrieval fix works regardless (the keyword retriever has no lifecycle filter and recency ordering surfaces the chunks), but the `OPERATOR_CONFIRMED`-first ordering only takes effect once a separate follow-up syncs chunk classification/lifecycle on triage confirm. Tracked as a follow-up, not included here to keep this a tight read-path change.
- The keyword retriever grounds on `review`-state chunks (no lifecycle filter). Governance-stricter behavior (answer only from operator-confirmed context) is deferred and depends on the chunk-sync follow-up above.
- No automated unit test added; correctness is established by live signed-in ask proof (pending deploy).

## Rollback Plan

Revert the single-file commit and redeploy the prior image revision, or shift ACA traffic back to the previous healthy revision. No migration or data change to unwind.

## Audit Evidence

- PR URL: (to be filled on open)
- Typecheck output: 0 errors.
- Live pre/post ask captures from `app.abarva.ai` (Lakeshore Holdings).
