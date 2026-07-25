# 2026-07-25-vendor-proposal-facts-foundation — Governed vendor-proposal ingestion foundation (PR 3)

## Release ID

`2026-07-25-vendor-proposal-facts-foundation`

## Status

`candidate` — local tests/lint/typecheck clean.

## Plain-English Summary

`ADR-0013-source-modernization-baseline.md` sequenced Source modernization as: audit baseline
(merged), immediate integrity fixes (merged, live-proven), then this — the governed vendor-proposal
ingestion foundation. Today, a vendor proposal document (PDF/DOCX/XLSX) is parsed by the same
generic regex line-matcher used for pasted meeting notes, with five hardcoded confidence constants
that are never actually computed, and no review gate — a proposal's parsed content can influence a
Decision Brief with no human ever having confirmed it matches what the vendor actually submitted.

This release closes that gap with a real, governed, end-to-end vertical slice:

1. **A canonical `VendorProposalFact` model** — two new append-only tables
   (`source_vendor_proposal_facts`, `source_vendor_proposal_fact_reviews`) capturing tenant, event,
   vendor, proposal document, fact key, section/page locator, normalized value + unit/currency,
   effective period, source quote/pointer, confidence (derived from HOW the fact was captured, not
   a free literal), extraction method, supersession lineage, and created-by/reviewed-by governance
   metadata.
2. **A real three-state lifecycle** — extracted candidate (no review row yet) / accepted
   authoritative (latest review row is `accepted`) / rejected-or-superseded (latest review row is
   `rejected` or `superseded`). Both tables are append-only; nothing is ever mutated in place.
3. **Non-silent supersession** — a new proposal upload that yields a fact sharing the same
   (vendor, fact key) as an already-accepted fact is tagged with `supersedesFactId` at ingest time.
   Accepting that new fact atomically writes a `superseded` review row for the old one — the old
   fact's own row is never touched, so full lineage is always readable.
4. **The smallest complete vertical slice**: ingest one proposal document → extract candidate facts
   → list them for review → accept or reject → only accepted facts become visible to downstream
   consumers, via a single governed accessor (`getAuthoritativeVendorProposalFacts`) wired into
   d16/d19/d22/d24's generation context and proven safe for aVa-context use via the same
   `buildValidatedAgentContextBundle` gate the vendor-coverage chat answer already uses.
5. **Tenant + event isolation** enforced at every read/write boundary, matching the existing
   accept-route idiom (fetch-then-compare `client_key`, 404 — never 403 — on mismatch, so a
   cross-tenant probe can't distinguish "wrong tenant" from "doesn't exist").

## Layer Impact

- `global-control-lane`: new tables, repository, extractor, governed-candidate mapper, four API
  routes, and additive context-binder/prompt-registry wiring. No existing table altered, no
  existing route's behavior changed for callers that don't use the new endpoints.
- `client-data-lane`: the two new tables are tenant-scoped at the application query layer
  (`client_key` column + `source_events.client_key` join), matching `source_artifact_acceptances`
  and `source_event_facts` — not per-row RLS (documented, consistent with existing convention).

## Client Applicability

- All clients: yes — the feature is available to every Source tenant; no tenant-specific behavior.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `supabase/migrations/20260725190000_source_vendor_proposal_facts.sql` — the two new tables.
- `src/lib/source/vendor-proposals/types.ts` — TS mirror of the migration.
- `src/lib/source/vendor-proposals/vendor-proposal-facts.ts` — repository: insert candidates,
  list/review-queue, accept (with atomic supersession), reject, `getAuthoritativeVendorProposalFacts`.
- `src/lib/source/vendor-proposals/extract-vendor-proposal-facts.ts` — minimal labeled-line
  extractor (price/rate/discount/SLA/uptime/term/payment/warranty/support/penalty), confidence
  derived from extraction method.
- `src/lib/source/vendor-proposals/governed-vendor-proposal-facts.ts` — `GovernedCandidate` mapper
  and gate-bundle builder for accepted facts, mirroring `governedCandidateFromVendorLeverFact`.
- `src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/ingest/route.ts` — upload +
  extract + auto-supersession-detection + candidate insert.
- `src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/facts/route.ts` — review queue
  (all facts + derived status, optional `?status=` filter).
- `src/app/api/v1/source/[eventId]/vendor-proposals/facts/[factId]/accept/route.ts` and
  `.../reject/route.ts` — the review decision routes (`canApproveSourceStages`-gated).
- `src/lib/source/agent-generation/context-binder.ts` — new parallel read,
  `authoritativeVendorProposalFacts` added to `SourceGenerationContext`.
- `src/lib/source/agent-generation/prompt-registry.ts` — new `formatAuthoritativeVendorProposalFacts`
  formatter, wired into d16/d19/d22/d24's `buildUserMessage`.
- `docs/architecture/adr/ADR-0013-source-modernization-baseline.md` — amendment recording PR 3's
  actual delivered (narrower) scope.
- 6 new test files (see QA / Validation) — 101 tests total.

## QA / Validation

- `pass` — repository tests (`vendor-proposal-facts.test.ts`, 19 cases): insert, list, accept
  (including atomic supersession and cross-tenant/cross-event denial), reject, and
  `getAuthoritativeVendorProposalFacts` filtering (unreviewed excluded, accepted included,
  rejected excluded, superseded excluded, latest-review-wins).
- `pass` — extractor tests (`extract-vendor-proposal-facts.test.ts`, 10 cases): malformed/empty/
  garbled text yields zero candidates and never throws; dollar/percent parsing; confidence derived
  by extraction method; label allowlist; multi-line locators.
- `pass` — governed-candidate mapper tests (`governed-vendor-proposal-facts.test.ts`, 4 cases):
  honest field mapping, citation fallback, and a real `buildValidatedAgentContextBundle` pass with
  `requireAgentReady: false`.
- `pass` — route tests: accept (5 cases), reject (4 cases), ingest (8 cases: missing vendor key/
  file, unsupported mime, real extraction end-to-end, empty/garbled content, duplicate/re-upload
  supersession detection, permission denial, cross-tenant denial).
- `pass` — regression sweep: `prompt-registry.test.ts`, `quality-review.test.ts`,
  `strategy-authoring.test.ts` — all passing after the prompt-registry/context-binder changes (one
  pre-existing, unrelated failure in `context-binder.test.ts` confirmed present on unmodified
  `origin/main` via `git stash` — not a regression introduced here).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors.
- `pass` — `npx eslint` on all 17 touched/added files — zero errors, zero warnings.
- `pending` — `node scripts/release-check.mjs` — to run before PR open.
- `pending` — governed migration lane (`db-migration-lab.yml`, `status` then `apply`) — this
  release includes a new migration; must run before this feature is usable against the live
  database.
- `pending` — live signed-in proof — after merge/deploy/migration-apply: (a) ingest a real vendor
  proposal document on a real event and confirm candidate facts appear in the review queue; (b)
  accept one and confirm it appears in `getAuthoritativeVendorProposalFacts`; (c) re-ingest a
  conflicting value for the same vendor+fact-key and confirm the new candidate carries
  `supersedesFactId`; (d) accept the new one and confirm the old fact is now excluded from the
  authoritative read while remaining visible via the raw facts list (lineage preserved).

## Rollout Plan

Merge to `main` via PR (code, docs-only for this repo's runtime — the new tables have no reads/
writes from existing product surfaces other than the new routes and the additive context-binder
field, which safely defaults to an empty array when nothing has been accepted yet). Deploy through
the repo-owned ACA main deploy workflow. Separately, run the governed migration lane
(`db-migration-lab.yml`, `status` then `apply`) to create the two new tables on the live database —
this is a distinct, deliberate step per this repo's migration governance discipline, never
auto-triggered by a code merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly; the migration lane
  (`.github/workflows/db-migration-lab.yml`) is dispatched separately, `workflow_dispatch`-only.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be recorded after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation.

## Rollback Plan

Revert the merge commit. The two new tables are additive and unreferenced by any existing product
surface outside this release's own new routes — reverting the code removes every caller of them,
leaving inert empty tables behind (harmless; a follow-up migration can drop them if desired, but
that is a separate, deliberate destructive-migration decision, not part of this rollback path). No
existing table, route, or generation prompt loses functionality if this release is reverted.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run, migration-apply run, and live proof: to be recorded after merge/deploy.
- Baseline audit this release closes items from:
  `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md` (Evidence Upload/Parsing/Storage
  section — the `VendorProposalFact` type spec).
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md` (PR 3,
  with the 2026-07-25 amendment recording this release's actual delivered scope).

## Known Gaps

- The extractor's fact-type coverage is intentionally narrow (price, rate, discount, SLA, uptime,
  term, payment, warranty, support, penalty) — the ADR's full envisioned taxonomy (requirement
  response, commitment, assumption, exception, dependency, missing response, timeline, staffing,
  exclusion) is a named follow-up, not silently dropped.
- No review-queue UI was built in this pass — the four API routes are real and tested, but a
  sourcing lead currently needs a direct API call (or a future UI, out of scope here) to review and
  accept/reject candidates. This matches the "prove one complete vertical slice, not UI polish"
  closure scope.
- aVa-context availability is proven via the governed-candidate mapper and a real
  `buildValidatedAgentContextBundle` pass (unit-tested), not a live chat-answer route — wiring
  accepted proposal facts into an actual aVa chat answer (mirroring the existing vendor-coverage
  chat answer) is separate, explicit follow-on work.
- Only one primary vendor-facing document per ingest call is supported (one file per POST); batch
  ingestion of multiple proposal documents in one call is not built.
- The raw-`pg.Pool`/vestigial-RLS tenant-isolation finding from the audit is explicitly a separate
  security-architecture workstream (per ADR-0013) and is not addressed by this release — the new
  tables use the same application-layer tenant-scoping convention as `source_artifact_acceptances`
  and `source_event_facts`, consistent with (not a regression from) the rest of Source today.
