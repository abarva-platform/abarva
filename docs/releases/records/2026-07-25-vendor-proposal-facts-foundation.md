# 2026-07-25-vendor-proposal-facts-foundation — Governed vendor-proposal ingestion foundation (PR 3)

## Release ID

`2026-07-25-vendor-proposal-facts-foundation`

## Status

`released` — merged to `main` via [#5605](https://github.com/abarva-platform/abarva/pull/5605)
(squash-merge `cdc1858c568c436ba641cb950bf536f3bbeb64d8`), all CI checks passed including "Fresh
Postgres migration replay". Deployed (digest
`sha256:b94bc8a8393d9734b454e0433aba42337d86e6b104cc80b6b61d7f0472014a48`), the governed migration
lane applied the new tables (`db-migration-lab.yml`, `status` → `apply`, confirmed "No pending
migrations" afterward), and the full closure criterion — ingest → extract → review → accept →
non-silent supersession → lineage preserved — was proven live against `app.abarva.ai` with a real
uploaded document. See QA / Validation for the exact evidence.

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
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — 19 release-relevant
  files, this release record found and matched.
- `pass` — governed migration lane. First `status` dispatch correctly showed the new migration
  absent (image not yet redeployed with the merge); after the ACA deploy completed, a second
  `status` dispatch showed it pending (8 total, including 7 pre-existing unrelated migrations from
  other already-merged PRs that had never been applied). Per explicit user decision, all 8 were
  applied together as one batch (the lane has no per-migration selection — it applies whatever is
  pending, and all 8 were already merged/reviewed via normal PR/CI). Two `apply` dispatches hit the
  same shared-job collision documented earlier this session
  (`job-abarva-private-operator-eus` — `verifyIdle()`/`restoreIdle()` failing because a
  concurrent, unrelated execution was mid-flight); both times the underlying `db:migrate:ci` step
  itself completed and applied cleanly ("✓ 8 migrations applied") — confirmed directly in the
  container log — before the wrapper's own idle-verification false-failed on someone else's
  concurrent job. A final `status` dispatch, run after the shared job returned to idle, confirmed
  "✓ No pending migrations. Applied: 296 / 292" — proving the schema change is durably live,
  independent of the wrapper's cosmetic reporting.
- `pass` — live signed-in proof on `app.abarva.ai` (2026-07-25, post-deploy/post-migration), the
  full closure criterion, against a real Meridian Health sourcing event, using the browser's
  authenticated session (no synthetic mocks):
  1. `POST .../vendor-proposals/acme-managed-services/ingest` with a real uploaded text file
     ("Price: $185,000/year", "SLA: 99.9% uptime", "Warranty: 2 years...") → `200`,
     `candidateFactsInserted: 3`, real fact rows with real `sourceQuote`s.
  2. `GET .../facts?status=candidate` → all 3, confirming the review queue.
  3. `POST .../facts/:factId/accept` on the price fact → `200`, real review row persisted.
  4. `GET .../facts?status=candidate` → now 2 (the accepted one left the queue); `?status=accepted`
     → exactly the 1 accepted fact.
  5. Re-ingested a revised proposal with a conflicting price ($199,000) for the same
     vendor+fact-key → the new candidate carried `supersedesFactId` pointing at the first
     ($185,000) fact — proving non-silent supersession-detection, not a silent overwrite.
  6. Accepted the revised ($199,000) fact → `?status=accepted` now shows only $199,000 (the old
     $185,000 fact is gone from authoritative); `?status=superseded` shows exactly the old
     $185,000 fact; the unfiltered `GET .../facts` still lists all 4 rows — full lineage
     preserved, nothing destroyed. This is the exact closure criterion: "one real vendor proposal
     can move from upload through governed fact review into downstream use, with no unreviewed,
     superseded, cross-event, or cross-tenant facts treated as authoritative."

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
- Approved image digest: `sha256:b94bc8a8393d9734b454e0433aba42337d86e6b104cc80b6b61d7f0472014a48`
  (`acrabarvalab001.azurecr.io/abarva/web`), deployed via run
  [30176284108](https://github.com/abarva-platform/abarva/actions/runs/30176284108), 100% traffic
  shifted, runtime invariant + health endpoint verified in-workflow.
- ACA runtime invariant: verified — template image, 100%-traffic revision image, and worker job
  images match the digest above.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — captured, see QA / Validation.

## Rollback Plan

Revert the merge commit. The two new tables are additive and unreferenced by any existing product
surface outside this release's own new routes — reverting the code removes every caller of them,
leaving inert empty tables behind (harmless; a follow-up migration can drop them if desired, but
that is a separate, deliberate destructive-migration decision, not part of this rollback path). No
existing table, route, or generation prompt loses functionality if this release is reverted.

## Audit Evidence

- PR: [#5605](https://github.com/abarva-platform/abarva/pull/5605), squash-merged
  `cdc1858c568c436ba641cb950bf536f3bbeb64d8`, 2026-07-25.
- Deploy run: [30176284108](https://github.com/abarva-platform/abarva/actions/runs/30176284108).
- Migration-apply run: [30176946160](https://github.com/abarva-platform/abarva/actions/runs/30176946160)
  (`db:migrate:ci` applied all 8 pending migrations cleanly; the run's own reported failure was
  the wrapper's `verifyIdle()` post-check colliding with an unrelated concurrent job execution —
  confirmed by container log and a subsequent clean `status` dispatch showing zero pending).
- Live proof: captured 2026-07-25 against `app.abarva.ai`, Meridian Health tenant — see QA /
  Validation for the full request/response sequence.
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
