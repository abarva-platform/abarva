# 2026-06-07-admin-loader-wave2-integration — Admin Loader Wave 2 (live end-to-end wiring)

## Release ID

`2026-06-07-admin-loader-wave2-integration`

## Status

`candidate`

## Plain-English Summary

The Admin Loader foundation (PR #3279) shipped the building blocks: a shared
contract, Gate 0 blob preservation, a Claude mapping proposer, deterministic
Steward checks, and presentational UI. This change wires those blocks into a
working, governed flow an operator can actually run:

1. **Drop anything** — CSV, JSON, XLSX, an org chart, a financial pack, a PDF.
2. **Gate 0 first** — every original is preserved to Azure Blob (hash-verified)
   *before* any parsing or reasoning. If preservation fails, nothing else runs.
3. **Understand** — the file is parsed (structured parsers, or Azure Document
   Intelligence for PDFs/documents), Claude proposes a mapping to a canonical
   dimension, and Steward validates it (deterministic checks + an open-ended
   Claude reviewer that fails *open* and never blocks the pipeline).
4. **Review** — the operator sees the proposal, Steward's findings, and any
   clarification questions; documents are held back as review-required and never
   auto-commit.
5. **Commit** — accepted proposals are turned into a manifest that the *existing
   governed bulk pipeline* consumes, so blob staging, attestation, the worker
   queue, and the tenant-context commit are reused with no new ingestion path.

A new admin page (`/admin/setup/loader`) drives this; a landing-zone scan lets
IT drop originals straight into Azure Blob (the Storage-Explorer exception) and
still have them picked up under the same tenant-scoped flow.

## Layer Impact

- **global-control-lane**: New control-plane API routes under
  `/api/admin/context-layer/loader/*` (understand, commit, landing-zone) and a
  new admin page. These are shared app/control-plane surfaces gated by the same
  tenancy + pilot attestation as the existing bulk-upload route. No client-data
  schema change in this PR (the Gate 0 columns shipped in #3279).

## Client Applicability

- All clients: Yes — available to any admin/operator with a resolved tenant; the
  flow is strictly tenant-scoped (`canonicalTenantKey` + landing prefix
  `landing/<tenantKey>/`). Reasoning calls (mapping, Steward) require
  `ANTHROPIC_API_KEY` and a permitted `ai_policy`; without them the mapper falls
  back deterministically and Steward returns no agent findings.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None (route is admin-gated, not flagged).

## Changes Included

- New lib: `src/lib/context-ingestion/loader/understand-pipeline.ts` (preserve →
  parse → map → validate orchestrator; fully injectable).
- New lib: `src/lib/context-ingestion/loader/landing-zone.ts` (tenant-scoped
  blob landing-zone scan; injectable lister).
- New routes: `src/app/api/admin/context-layer/loader/{understand,commit,landing-zone}/route.ts`.
- New page: `src/app/(maestro)/admin/setup/loader/page.tsx` +
  `src/components/setup/loader/AdminLoaderClient.tsx`.
- Wave 2 libs merged from parallel lanes: `parse-adapter.ts`,
  `steward-reviewer.ts`, `commit-adapter.ts` (+ tests).
- Tests: `understand-pipeline.test.ts`, `landing-zone.test.ts`, plus the three
  lane test suites.

## QA / Validation

- `npx jest src/lib/context-ingestion/loader/__tests__/ src/components/setup/loader/__tests__/`
  → **9 suites, 75 tests passed** (no network: Azure/Anthropic/DB all stubbed via
  injectable seams).
- `npx eslint` on all new files → clean (exit 0).
- `tsc --noEmit` (full project) → **0 errors in any new/changed loader file**.
  The only 3 remaining project errors are pre-existing `Cannot find module`
  artifacts for `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`
  in a partial local install; both are declared deps (`^1.1.0`, `^4.11.3`) and
  resolve under CI `npm ci` (these files are already on green `main`).
- Migration replay: no new migration in this PR (Gate 0 migration shipped + made
  replay-safe in #3279).

## Rollout Plan

Merge to `main`. The routes + page deploy with the normal Azure Container Apps
control-lane deploy (and Vercel preview). No migration apply needed. Live
mapping/Steward reasoning activates wherever `ANTHROPIC_API_KEY` + a permitted
`ai_policy` are present; otherwise the flow degrades gracefully (deterministic
mapping fallback, no agent findings). First real use should be a pressure-test
per `docs/build/setup-admin-loader/DESIGN.md` §9 before pilot exposure.

## Rollback Plan

Revert this PR. The new routes/page/libs are additive and isolated — reverting
removes the `/admin/setup/loader` surface and the three routes with no effect on
the existing `bulk-upload` path or any committed data. No migration to roll back.

## Audit Evidence

- PR URL: (this PR)
- CI run: GitHub Actions on the PR (Typecheck, jest, release:check, migration
  replay, architecture rules, hygiene gate).
- Test output: 9 suites / 75 tests passing (captured in PR description).
- Governed-path proof: commit route delegates to `runBulkContextUpload`
  (existing audited pipeline) — no parallel ingestion route introduced.

## Known Gaps

- **Commit re-uploads bytes**: the commit route currently re-accepts the original
  file bytes from the browser rather than re-reading the Gate-0-preserved blob by
  `objectKey`. Functionally correct (the governed pipeline re-stages + re-hashes),
  but a follow-up should commit directly from the preserved blob to avoid a second
  upload and to bind commit to the exact preserved bytes. Tracked for Wave 2.1.
- **Ask-Steward dock** is wired for display/echo only; the live scoped
  conversation (round-trip to the Claude reviewer) is not yet connected.
- **DOCX/PPTX parsing** routes through the injected `DocumentParser`, but the
  production Azure parser only handles PDF; a format-appropriate docx/pptx parser
  must be supplied before those formats are pilot-ready.
- **No end-to-end live proof yet**: this PR is validated with stubs; the
  preserve→commit→retrieval golden-question proof (per the context-ingestion
  truth standard) is the next step and is not claimed here.
