# 2026-07-25-home-v4-book-live-cutover — Home Book V4: chart resolver, persistence, live-route wiring

## Release ID

`2026-07-25-home-v4-book-live-cutover`

## Status

`candidate` — code path complete and locally verified; no data has been persisted to Postgres and
no tenant has been approved. Live signed-in browser proof still open (see Known Gaps).

## Plain-English Summary

Today's earlier session shipped the "book-mode" Home Knowledge V4 generator (one shared
`enterprise_book` narrative plus a deterministic `dimensions[]` array with declarative
`visual_binding`/`graph_binding` pointers Claude never fills in) and proved it with a real paid
run across three tenants (skyharbor-air, first-capital, meridian-health). This PR closes the gap
between "the generator produces good content" and "a real client sees it on `/home`":

1. **Chart-data resolver** — turns each `visual_binding` pointer into real, resolved chart data
   (`primary_visual`) by reading the exact CSV the deterministic dataset registry already names,
   computed entirely in code with zero Claude involvement.
2. **Postgres persistence** — a new script that writes book-mode candidates into the existing
   `home_knowledge_packs` table (same table V2 uses; no migration needed) as `status='candidate'`
   only. A separate, explicit action is required to approve any tenant.
3. **Renderer additions** — new types and a new `HomeV4BookOverview` landing page so the existing
   V4 explorer shell can render book-mode content (executive narrative, material gaps/advantages,
   industry comparison) alongside the existing per-dimension chart rendering.
4. **Live route wiring** — the real, Clerk-authenticated `/home` page now checks for an approved
   V4 book pack before falling back to the existing V2 pack, using the same tenant-scoping the
   page already has (no new query param, no bypass of `src/proxy.ts`).

### What this is not

**No tenant is live on V4 after this PR merges.** The persist script's default path never writes
`status='approved'`; the live-route read only activates once a `status='approved'` row exists.
Nothing in this PR runs the persist job or approves any tenant — that is a separate, explicit,
post-merge action, run only after a human has reviewed the real content (via `/home/v4-preview`
on the deployed environment, where local rendering is unreachable — same private-VNet-Postgres
limitation documented in `2026-07-24-home-v4-preview-route.md`).

## Layer Impact

- `global-control-lane`: the live `/home` route read path now races an additional Postgres query
  before its existing V2 read. No behavior change for any tenant without an approved V4 pack (the
  default, for every tenant, until someone explicitly approves one).
- `client-data-lane`: a new persistence path exists for book-mode V4 content, but this PR does
  not invoke it against production data.

## Client Applicability

- All clients: unaffected until a tenant is explicitly approved (post-merge, separate action).
- Specific clients: none yet approved.
- Internal only: the chart resolver and persist script are operator tooling, run via the existing
  governed ACA operator-job path.
- Feature flag: none — gating is the `home_knowledge_packs.status = 'approved'` row itself, which
  starts absent for every tenant.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - `readCsvRows`, `DATASET_LABEL_COLUMN`, `resolveVisualDataPoints`, `DIMENSION_VALUE_FALLBACK`,
    `resolveDimensionValue` — the chart-data resolver.
  - `renderDimensionsFromBook()` now also constructs `dimension.primary_visual` (matching the
    existing `HomeV4ChartVisual` type exactly) alongside the declarative `visual_binding`.
  - New `--reresolve-visuals=<path>` offline mode: re-runs `renderDimensionsFromBook()` against an
    already-generated real candidate's stored `enterprise_book`, using today's dataset registry —
    zero Claude calls. Used to prove the resolver against the real 3-tenant paid run without
    paying for regeneration, and to backfill `primary_visual` into the fixtures below.
- `scripts/knowledge/persist-home-knowledge-v4-book.mjs` (new) — Postgres persist script, default
  path writes `status='candidate'` only; `--approve=<tenantKey> --approved-by=<name> --write-db`
  is a separate, explicit single-tenant action.
- `package.json`: `home:knowledge-v4:reresolve-visuals`, `home:knowledge-v4:persist-book`,
  `home:knowledge-v4:persist-book:write`, `home:knowledge-v4:persist-book:approve`.
- `src/components/home/v4/homeV4Visual.ts`: `primary_visual` is now optional on `HomeV4Dimension`
  (book mode legitimately omits it for the 32/38 dimensions with no dataset binding — real,
  confirmed against the paid-run output, not a hypothetical). New additive types:
  `HomeV4EnterpriseBook`, `HomeV4BookSection`, `HomeV4Conclusion`, `HomeV4MaterialItem`,
  `HomeV4VisualBinding`, `HomeV4GraphBinding`, `HomeV4DataBinding`, and additive optional fields
  on `HomeV4Dimension` (`chapter`, `headline`, `executive_takeaway`, `key_insights`,
  `material_gaps`, `material_advantages`, `strategic_implication`, `recommended_actions`,
  `related_dimensions`, `confidence_statement`, `open_questions`, `data_binding`,
  `visual_binding`, `graph_binding`). `HomeV4Candidate.enterprise_book` (new, optional).
- `src/components/home/v4/HomeV4BookOverview.tsx` (new) — book-mode landing page (executive
  narrative, strategic agenda/tensions, material gaps/advantages, industry comparison,
  decisions/recommendations/open questions) plus `HomeV4GraphBindingSummary` (informational
  node/edge-count summary — `graph_binding` is deliberately not rendered as a graph; see Known
  Gaps).
- `src/components/home/v4/HomeV4ExplorerShell.tsx`: when `candidate.enterprise_book` is present,
  defaults to a book-mode nav group/landing page instead of the Change & Transformation group
  (which book mode never populates — explicit hide, not a silently empty page); guards the
  existing `HomeV4VisualRenderer` call for dimensions with no `primary_visual`; renders book-mode
  headline/takeaway text when no `summary_tab` exists; renders `graph_binding` summaries.
- `src/lib/home/home-knowledge-v4-pack.ts` (new) — `readHomeKnowledgeV4PackForTenantFromPostgres`,
  modeled directly on the V2 equivalent (same query shape, same "never throw, return null"
  contract), filtered to `artifact_type = 'NexusHomeKnowledgePackV4Book'`.
- `src/app/(maestro)/home/page.tsx`: races the new V4 read (via the existing
  `withHomePageTimeout` pattern) before the existing V2 read, using the same `homeTenantKey`
  resolution already on this page. Falls through unchanged to V2 for every tenant without an
  approved V4 pack.
- `src/app/(maestro)/home/v4-preview/_fixtures/{skyharbor-air,first-capital,meridian-health}.json`
  — replaced with the real, resolved (post-resolver-fix) book-mode candidates from today's earlier
  paid run, re-run through `reconcile-tenant-applications.mjs` to keep the `apps` dimension's real
  `full_rows` (900/260/150 real application rows respectively).
- `scripts/knowledge/__fixtures__/enterprise-book/*.json` — replaced with the real
  `enterprise_book` objects from today's paid run (previously reshaped-from-a-different-run
  fixtures), so the zero-cost `--preflight` renderer-proof tests the actual real content.

## QA / Validation

- `pass` — `node --check` and `npx eslint` on all changed/new `.mjs` scripts, exit 0.
- `pass` — `npx eslint` on all changed/new `.ts`/`.tsx` files, exit 0.
- `pass` — Full production `npm run build`, zero errors, including with the real book-mode
  fixtures loaded (raw `tsc --noEmit` crashes with a stack overflow in this worktree independent
  of this change — a pre-existing environment issue; `npm run build` is the authoritative check
  per this repo's own convention).
- `pass` — `npm run home:knowledge-v4:test-manifest-validator` (12/12 fixture cases) and
  `npm run home:knowledge-v4:test-prompt-preflight` (6/6 fixture cases) unaffected.
- `pass` — Zero-cost `--preflight` re-run for all 3 tenants against the real `enterprise_book`
  fixtures: 0 hard failures for skyharbor-air/first-capital, 0 hard failures + 40 disclosed
  evidence-quality warnings for meridian-health (matches the already-known, already-disclosed gap
  from the original paid run).
- `pass` — `--reresolve-visuals` proof against the real 3-tenant paid-run candidates (zero new
  Claude calls): all 18 dimension×tenant combinations that carry a dataset binding resolved real
  `loaded_fact` data (0 `missing_evidence`), validated by `validateIntegratedManifest()` — the
  same validator the real pipeline uses for book mode.
- `pass` — Hand-verification of resolved numbers against source CSVs, independent of the
  generator code: evidence review-state counts (71 approved / 9 review_required, exact match
  against a hand tally), vendor dollar aggregate ($3,773,949,998 "Managed Service", exact match
  against `csv.DictReader` summation), applications domain breakdown (top-7-of-9 domains summing
  to 720 of 900 real rows, correctly reflecting the declared `limit: 7`).
- **`fail → fixed`, caught by this verification, not by review**: the first resolver draft leaked
  raw CSV file paths (`tower-standardized-v1/.../F05_applications-systems.csv`) into
  `primary_visual.source_basis`/`evidence_boundary`, which are part of `clientVisiblePayload()` —
  tripping the existing `client_visible_technical_leakage` validator check across every resolved
  data point. Fixed by using the registry's existing safe `grain`/`business_definition` fields
  instead of the raw file path. Re-verified clean after the fix (see above).
- **`fail → fixed`, same pass**: `evidence` dimension resolved 0 data points for skyharbor-air
  despite 80 real evidence rows, because `review_state` is genuinely blank for that tenant's T10
  rows (pre-normalization schema gap, real, not a parsing bug — `legacy_trust_status` carries the
  equivalent value). Fixed with the same per-row fallback `loadTenantEvidenceIndex()` already
  uses elsewhere in this file, normalizing legacy `"usable"` to canonical `"approved"` so the
  resulting chart groups consistently across tenants.
- **`blocked` — no local signed-in browser screenshot.** Same pre-existing, documented limitation
  as `2026-07-24-home-v4-preview-route.md`: the private-VNet Postgres (and, for `/home` itself,
  the Postgres-backed Responsible AI acknowledgment ledger, which fails closed when unreachable —
  correct behavior, not a bug) is unreachable from a laptop, blocking every Clerk-protected route
  locally regardless of this change. A throwaway unauthenticated diagnostic route was attempted
  and abandoned (hit an unrelated Next.js App Router 404 not worth further investigation for a
  disposable diagnostic aid); it was fully removed before this record was written — `git status`
  confirms `src/proxy.ts` has no diff. **Live signed-in browser verification against the deployed
  environment is required after merge, before any tenant is approved.**
- `not run` (by design) — the actual persist-to-Postgres job and any `--approve` action. Both are
  explicitly deferred to a separate, post-merge, human-reviewed step.

## Rollout Plan

1. Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys automatically.
   This alone changes no tenant's live experience (no approved V4 row exists yet for anyone).
2. Post-merge, as a separate governed ACA operator job: run
   `home:knowledge-v4:persist-book:write` (writes `status='candidate'` only) for the 3 proven
   tenants.
3. Review the persisted content — via `/home/v4-preview` on the deployed environment (admin-only,
   already correctly gated per `2026-07-24-home-v4-preview-route.md`'s post-merge correction) —
   before approving anything.
4. Only after explicit human review: run `home:knowledge-v4:persist-book:approve --approve=<tenant>
   --approved-by=<name> --write-db` for exactly one tenant at a time. This is the actual "go live"
   moment for that tenant and is not part of this PR.
5. After each approval: live signed-in browser verification on `/home` for that tenant, plus a
   regression check that a tenant with no approved V4 pack (e.g. `apex-retail`) still renders the
   unchanged V2 experience.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge — no ad-hoc `az` commands
  used for this PR.
- Shared runtime mutators: none in this PR. The persist/approve scripts exist but are not
  invoked here.
- Migration application: none — reuses the existing `home_knowledge_packs` table and its existing
  `UNIQUE(tenant_key, pack_version)` / partial-approved-index constraints as-is.
- Feature/env flag update path: none — gating is the presence/absence of an approved DB row.
- Live signed-in proof required: **yes**, before any tenant is approved (see Rollout Plan step 5).

## Rollback Plan

- This PR alone: revert it. No data was written to Postgres by merging it, so rollback is a pure
  code revert.
- Post-approval, per-tenant: retire the approved V4 row
  (`UPDATE home_knowledge_packs SET status='retired', effective_to=now() WHERE id=...`) — the live
  route falls straight back to the existing V2 read for that tenant, unchanged.

## Audit Evidence

- `docs/audits/artifacts/home-knowledge-v4-persist-dry-run.json` — the dry-run persist summary
  (pack versions, content hashes, validation status) for all 3 tenants, no DB write performed.
- Zero-cost preflight and `--reresolve-visuals` console output, hand-verification arithmetic, and
  the client-visible-leakage/evidence-fallback bug-and-fix sequence are recorded in the session
  transcript.

## Known Gaps

- Live signed-in browser proof is the explicit open item before any tenant is approved (see QA /
  Validation and Rollout Plan).
- `graph_binding` ships in persisted content but is rendered only as an informational
  node/edge-count summary, not an actual relationship graph — disclosed in the UI copy itself
  (`HomeV4GraphBindingSummary`), not silently dropped. Building a real graph visual from
  `graph_binding`'s counts-only shape is out of scope for this cutover.
- Only 3 of 5 tenants have book-mode content at all (skyharbor-air, first-capital,
  meridian-health); apex-retail and lakeshore-holdings are unaffected by this PR either way.
