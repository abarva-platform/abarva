# 2026-07-23 — Nexus Pricing Engine PR6: Approval, Immutable Snapshot, Business-Case Summary

## Release ID

`2026-07-23-pricing-engine-pr6-approval-snapshot`

## Status

`draft`

## Plain-English Summary

This PR turns PR5's Cost & Effort draft workflow into something that can be
formally approved and locked in. A user finishes an estimate, runs it, and
now can call a new `/approve` action: the system re-runs the estimate one
final time against the current confirmed inputs (so the approved number is
always freshly computed, never a stale cache), checks that a different
person confirmed the inputs than the one now approving them (segregation of
duties), and — if both pass — writes one permanent, never-edited record
(`pricing_estimate_snapshots`) capturing the approved low/expected/high cost
range, the model/taxonomy/rate-card versions behind it, the top assumptions
and uncertainty drivers, and who approved it and why. A companion function,
`getApprovedSnapshotForMove`, can answer "does this Move have a current,
trustworthy approved estimate, or has the underlying scope drifted since it
was approved?" for whatever future PR wants to ask that question.

**Deliberate, explicit scope decision — read this before assuming this PR
gates the live business-case route.** The brief (§9.5), read literally,
says the generation route for the costed P4 ROM/business-case artifact
should require an approved, non-stale pricing snapshot and block otherwise.
This PR does **NOT** apply that rule to
`src/app/api/v1/moves/board-grade-business-case/route.ts` — the real,
currently-LIVE business-case generator used by every Move in the product
today, powered entirely by `src/lib/programs/expert-kernel/` and its own
researched rate cards. Almost no Move today uses PR5's Cost & Effort wizard
(it is brand new and flag-gated OFF, `moves_pricing_engine`). Gating the
live route on an approved `pricing_estimate_snapshots` row would mean every
Move that has never touched the new pricing engine — which is effectively
all of them — would suddenly be BLOCKED from generating a business case at
all. That is a production-breaking behavior change for the entire existing
product, and it directly contradicts the PR0 audit's "coexist, don't
replace" direction decision
(`docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14): expert-kernel and
the new `pricing_*` engine run side by side for the duration of this build;
reconciling or replacing expert-kernel is explicitly out of scope for this
PR sequence. Instead, this PR builds the brief's approval/immutability/
staleness rule as new, additive capability that governs ONLY the new
pricing engine's own outputs (`getApprovedSnapshotForMove`), and wires it
into nothing outside PR5's own Cost & Effort workspace. Whether/how the live
business-case route should eventually consume an approved pricing snapshot
is a real, separate decision that changes live product behavior for every
existing Move — it needs its own explicit product sign-off and its own PR,
not a side effect of this one. `git diff` confirms
`board-grade-business-case/route.ts` and everything under
`src/lib/programs/expert-kernel/` are byte-identical to before this PR (see
QA/Validation).

There is no live ACA proof in this environment (no live Azure Postgres
credentials here, matching every prior PR in this sequence).

## Layer Impact

- `client-data-lane`: the entire PR. A new, tenant/Move-scoped write path
  (`pricing_estimate_snapshots` INSERTs), a new companion migration adding
  an `estimate_id` link column to that table, and one new Move-scoped API
  route (`/api/v1/programs/:programId/pricing/estimates/:estimateId/approve`).
  Every read/write is scoped by `(tenant_key, move_id)` / `(tenant_key,
  estimate_id)`, same as every prior PR in this sequence.
- `global-control-lane`: none. No shared/global behavior changed. No
  feature-flag registry change was needed — this PR only adds capability
  reachable through the SAME `moves_pricing_engine`-flag-gated Cost &
  Effort workspace PR5 already gated (the new `/approve` route sits under
  the same Move-scoped `pricing/**` API surface PR5 built; it does not add
  a new entry point outside that gate).

## Client Applicability

- All clients: **no** — reachable only through the same
  `moves_pricing_engine` flag PR5 introduced (default OFF,
  `includeTenants: []`). No client's existing Move workflow — including the
  live business-case generation path every Move uses today — changes at
  all.
- Specific clients: none enrolled yet (unchanged from PR5).
- Internal only: the new route/service functions are reachable code, but
  only through the flag-gated wizard or a direct, authenticated API call.
- Public/demo only: no.
- Feature flag: unchanged — still `moves_pricing_engine` (defined in PR5),
  still default OFF for every tenant.

## Changes Included

- `supabase/migrations/20260724020000_pricing_estimate_snapshots_pr6_estimate_link.sql`
  (new) — additive `ALTER TABLE pricing_estimate_snapshots ADD COLUMN IF
  NOT EXISTS estimate_id UUID NULL REFERENCES pricing_estimates (id)` plus a
  `(estimate_id, created_at DESC)` index. See the migration's own header:
  the PR2 skeleton had no FK to `pricing_estimates` because that table
  didn't exist yet; PR5 then gave `pricing_estimates` multi-scenario
  support per Move (`scenario_group_id`), which means "the approved
  snapshot for this Move" is only well-defined if the snapshot names WHICH
  estimate/scenario it approved. No backfill needed — the skeleton table
  had zero rows before this PR.
- `src/lib/pricing/types.ts` (extended) — `PricingEstimateSnapshotRow` gets
  the new `estimate_id: string | null` field.
- `src/lib/pricing/effort-engine/snapshot-service.ts` (implemented for
  real — was a throwing PR6 stub):
  - `computeUpstreamScopeFingerprint` — sha256 (via the SAME
    `computeContentHash`/`canonicalize` helper `versioning.ts` already uses
    for every other pricing content hash) of the SETTLED confirmed scope
    inputs (archetype, model version, scenario, selected rate card, and
    every input that is confirmed or explicitly marked unknown with an
    override + confidence — the same "settled" rule
    `validation-gate.ts`'s `isInputSettled` already uses).
  - `resolvePreparedBy` / `assertSegregationOfDuties` /
    `SelfApprovalViolationError` — segregation-of-duties check (see
    dedicated section below).
  - `createEstimateSnapshot` — writes ONE append-only, `status: 'approved'`
    row. Requires a non-empty `approvalRationale`; enforces segregation of
    duties before writing anything.
  - `checkSnapshotStaleness` — pure, read-time fingerprint comparison; never
    writes.
  - `getApprovedSnapshotForMove(moveId, tenantKey)` — the ONE new
    integration point (see Plain-English Summary). Returns
    `{status:'none'}`, `{status:'approved', snapshot}`, or
    `{status:'stale', snapshot, currentFingerprint}`.
- `src/lib/pricing/governed-load/business-case-projection.ts` (new) —
  `buildBusinessCasePricingSummary(snapshot)`: a sibling to PR3's
  `buildGovernedPricingProjection`, projecting ONLY the safe summary fields
  from an approved snapshot (model/taxonomy/rate-card versions,
  low/expected/high totals, top assumptions/uncertainty drivers, approval
  identity/timestamp) — never the full line items or the granular
  labor/manual/hours breakdown. Wired into `governed-load/index.ts`'s
  barrel. **Has no consumer in this PR** — same "shape proven, not wired"
  boundary as `governed-projection.ts` itself.
- `src/app/api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve/route.ts`
  (new) — the one approve route PR5 explicitly left unbuilt. Three
  outcomes: success (201, returns the snapshot), not ready (409
  `estimate_not_ready` — the SAME shape `/run` already returns), and a
  segregation-of-duties violation (409 `self_approval_violation`). On
  success, also flips `pricing_estimates.status` to `'approved'` (the enum
  value PR5's migration added specifically for this PR to write).
- `src/app/api/v1/programs/[programId]/pricing/_shared.ts` (extended) —
  `snapshotToJson` row-shaping helper, following the file's existing
  `estimateToJson`/`inputToJson` convention.
- `src/lib/pricing/__tests__/pr5-estimates-migration.test.ts` (edited) — one
  assertion relaxed: it previously asserted the PR5 migration file was the
  *globally last* file in `supabase/migrations/` alphabetically. This PR's
  new migration necessarily sorts after it, so the assertion now checks
  "sorts after the latest PR4 migration" (the actual intent) without
  requiring it to be the last file ever again. No other PR5 test was
  touched.
- Tests (new): `src/lib/pricing/effort-engine/__tests__/snapshot-service.test.ts`,
  `src/lib/pricing/governed-load/__tests__/business-case-projection.test.ts`,
  `src/lib/pricing/__tests__/pr6-snapshot-estimate-link-migration.test.ts`,
  `src/app/api/v1/programs/[programId]/pricing/__tests__/approve-route.test.ts`.

## Design Decision — append-only, no UPDATE, ever (documented, not an oversight)

`pricing_estimate_snapshots` is strict append-only for this PR's write
path. `createEstimateSnapshot` only ever INSERTs. **No prior row is ever
UPDATEd** — not to `superseded`, and not to `stale_for_current_scope` —
even though both are valid `status` CHECK-constraint values and the brief's
prose about "the prior row's status flips to superseded" can be read either
way. This is a deliberate reading of the PR2 skeleton migration's own
footer comment, which is unambiguous for this specific table: *"no
UPDATE/DELETE path is exposed by any PR2 code. A later, real-population PR
(PR6) must preserve this — a re-snapshot is always a new INSERT, never an
UPDATE of an approved row."* The precedent table it was modeled on,
`source_artifact_acceptances`, is the same shape — no UPDATE/DELETE
statement anywhere, "latest wins" achieved purely by querying
`accepted_at DESC`, never by writing back into an older row. This is a
DIFFERENT judgment call than `pricing_taxonomy_versions`/`pricing_rate_cards`
make (those tables DO flip a prior row's `is_current` flag on
supersession, per `versioning.ts`) — `pricing_estimate_snapshots` was
explicitly modeled on `source_artifact_acceptances` instead, and that
migration's convention is followed exactly: "superseded" is achieved purely
by a newer row existing (`getApprovedSnapshotForMove` orders by
`created_at DESC`), and staleness (`checkSnapshotStaleness`) is a pure,
read-time comparison that never issues a write. See
`snapshot-service.ts`'s file header for the full reasoning, including the
explicit note that a future PR could decide a real "mark stale" background
job is worth adding the mutation — this PR does not add one.

## Segregation of Duties — pattern followed, and why

Two existing repo conventions handle actor-vs-preparer distinction:

1. `src/lib/auth/gate-approval-strict-mode.ts`'s `passesSeparationOfDuties()`
   — FLAG-GATED (`GATE_APPROVAL_STRICT_MODE`): pilot tenants may
   self-approve a gate advance; only production (flag ON, admin/maestro
   role) enforces separation of duties.
2. `src/lib/programs/deliverable-role-approvals.ts`'s
   `recordRoleApprovalDecision()` — UNCONDITIONAL: any approver equal to
   `deliverable.created_by` is rejected with the literal string
   `self_approval_violation`, no flag, no pilot exception.

This PR follows convention #2, unconditionally. `resolvePreparedBy`
resolves "who prepared this estimate" as the `confirmed_by` of whichever
input was confirmed most recently, falling back to the estimate's own
`created_by` when no input has ever been confirmed (an input settled only
via an unknown-with-override carries no identity column in the PR5
schema). `assertSegregationOfDuties` then throws
`SelfApprovalViolationError` — named and messaged to match the existing
`self_approval_violation` identifier — whenever the approver equals that
identity. A pricing estimate becoming an approved, immutable snapshot is a
financial-integrity control analogous to a deliverable's final
role-approval lock, not a pilot-vs-production gate-advance workflow;
gating it behind `GATE_APPROVAL_STRICT_MODE` would let a pilot tenant
approve its own cost estimate, which contradicts brief §10's plain,
unconditional wording ("a user must not approve their own override").

## QA / Validation

- `npx jest src/lib/pricing` — **350/350 passed**, 34 suites (320 PR1-5
  baseline + 22 new `snapshot-service.test.ts` + 3 new
  `business-case-projection.test.ts` + 5 new
  `pr6-snapshot-estimate-link-migration.test.ts` = 350; the one PR5 test
  edited in this PR — the migration-file-ordering assertion — is a
  relaxation of an existing case, not a removal, so the suite count is
  additive).
- `npx jest "src/app/api/v1/programs"` (the full programs route tree,
  matching the scope this PR's route lives under) — **87/87 passed**, 20
  suites (82 PR1-5 baseline + 5 new `approve-route.test.ts` cases: success,
  bad_request on missing rationale, estimate_not_ready with
  blockingReasons, same-user `self_approval_violation`, and a cross-tenant
  404).
- **Snapshot creation (literal proof)**: `snapshot-service.test.ts`'s
  "approving twice for the same Move" test approves the same Move twice
  with different confirmed-scope fingerprints, asserts BOTH rows persist,
  asserts the FIRST row's `status` and `upstream_scope_fingerprint` are
  byte-identical before and after the second approval (proving no mutation
  occurred — the fake store port exposes no update method at all, so this
  is a structural guarantee, not just an assertion), and asserts
  `getLatestSnapshotForMove` returns the SECOND row.
- **Staleness (literal proof)**: `checkSnapshotStaleness` tests prove an
  unchanged confirmed-input scope stays non-stale, and a changed confirmed
  value flags `stale: true` with a different `currentFingerprint`.
  `getApprovedSnapshotForMove` tests prove the full path: `none` when no
  snapshot exists, `approved` when the Move's current estimate scope still
  matches, and `stale` — never silently treated as valid — when the current
  scope has drifted, plus two defensive-fallback cases (no `estimate_id` on
  the snapshot; the named estimate no longer resolving for the tenant).
- **Segregation of duties (literal proof)**: `resolvePreparedBy` tests
  prove it picks the most-recently-confirmed input's `confirmed_by`, falls
  back to `created_by` when nothing is confirmed, and returns `null` when
  neither exists. `assertSegregationOfDuties` / `createEstimateSnapshot`
  tests prove a same-identity approval throws `SelfApprovalViolationError`
  and writes nothing, while a different-identity approval succeeds.
- **API route (literal proof)**: `approve-route.test.ts` covers all three
  outcomes end-to-end through the route handler: success (201, snapshot
  returned, `runEstimate` called with the right args,
  `createEstimateSnapshot` called with the expected candidate shape,
  `updateEstimateHeader` called to flip status to `'approved'`), not-ready
  (409, `estimate_not_ready`, `blockingReasons` passed through, snapshot
  creation and header update never called), and same-user violation (409
  `self_approval_violation`, header update never called) — plus a
  bad-request case (missing rationale, nothing runs) and a cross-tenant 404
  case.
- **Business-case projection shape (literal proof)**:
  `business-case-projection.test.ts` proves the exact safe-summary shape
  (versions, low/expected/high, top assumptions/drivers, approval
  identity), then explicitly asserts `lineItems`, `costByActivityPack`,
  `costByRole`, `internalVsExternal`, and even the snapshot's OWN granular
  `totalLaborCostCents`/`totalManualCostCents`/`gapCount` fields are all
  `undefined` on the projected summary — narrower than what the snapshot
  technically stores, matching `buildGovernedPricingProjection`'s "never
  the full rate lines" discipline. A third test proves graceful
  degradation (nulls/empty arrays, no throw) against a malformed/empty
  `totals` payload.
- **Untouched-route confirmation (explicit, as required)**: `git diff
  --quiet -- src/app/api/v1/moves/board-grade-business-case/route.ts
  src/lib/programs/expert-kernel/` exits 0 (no diff) — confirmed
  byte-identical to before this PR. `git status --porcelain` for both paths
  is empty. No test, route, or service in this PR imports from
  `expert-kernel/`.
- Full-project `tsc --noEmit -p tsconfig.json` — **zero NEW errors**. The
  same 4 pre-existing, unrelated errors from PR5's own release record
  remain (`Cannot redeclare block-scoped variable` cross-file noise in
  `src/app/api/v1/programs/[programId]/__tests__/route.test.ts`, a file
  this PR does not touch, confirmed via `git diff --quiet` on that path).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (Azure deployment lane check, legacy-tenant-input audit, Release Control
  Gate, Deploy Authority Gate, Pilot Data Loader Gate all green).

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR1-PR5). No deploy, no ACA
involvement. The new migration only adds a nullable column + index to an
empty table — no data migration, no lock-risk on a populated table (the
skeleton table has zero rows in every environment this sequence has run
in). `moves_pricing_engine` stays OFF for every tenant at merge time —
unchanged from PR5; this PR adds no new flag and enrolls no tenant.

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, environment variables, worker jobs, traffic, or
DNS.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: unchanged from PR5 (`moves_pricing_engine`)
  — this PR adds no new flag.
- Live signed-in proof required: no — flag is OFF for every tenant at merge
  time, and this PR adds no new consumer of `getApprovedSnapshotForMove` or
  `buildBusinessCasePricingSummary` outside the still-flag-gated Cost &
  Effort workspace, so there is nothing live to prove yet.

## Rollback Plan

Revert the PR. The companion migration's rollback is a single `ALTER TABLE
pricing_estimate_snapshots DROP COLUMN IF EXISTS estimate_id` (no
down-migration is included, matching this repo's forward-only convention);
since the flag ships OFF, no tenant is enrolled, and the skeleton table has
zero rows in any live environment, dropping the column loses nothing. No
live data was written by this PR in this environment (no live database
credentials available here, matching every prior PR in this sequence).

## Audit Evidence

- `npx jest src/lib/pricing` and `npx jest "src/app/api/v1/programs/[programId]/pricing"`
  — full pass counts captured this session (see QA/Validation).
- `git diff --quiet -- src/app/api/v1/moves/board-grade-business-case/route.ts src/lib/programs/expert-kernel/`
  — exit 0, confirmed this session.
- Full-project `tsc --noEmit` — 4 pre-existing errors, 0 new (captured this
  session).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (captured this session).
- PR URL: recorded after PR is opened.

## Known Gaps

- **No live ACA/Azure Postgres proof.** Same limitation as every prior PR
  in this sequence.
- **`getApprovedSnapshotForMove` and `buildBusinessCasePricingSummary` have
  no consumer in this PR.** Both are built, tested, and ready — wiring
  either of them into `board-grade-business-case/route.ts` (or any other
  expert-kernel-consuming path) is an explicit, separate, future decision
  requiring its own product sign-off, per the Plain-English Summary above.
- **`client_profile_version_id` is always written `null` on a new
  snapshot.** `pricing_estimates` (PR5 schema) has no
  `selected_client_profile` column to read from — this PR does not add
  one. A future PR that wants an estimate to name a specific
  `pricing_client_profiles` version would need that schema addition first.
- **No background "mark stale" job.** `checkSnapshotStaleness` /
  `getApprovedSnapshotForMove` are pure, read-time checks by design (see
  Design Decision above) — nothing periodically re-checks every approved
  snapshot and writes `stale_for_current_scope` into the database. If a
  future PR decides that's worth having, it would be a new, explicit
  mutation path, not a silent addition to this one.
- Pre-existing, unrelated to this PR: the same handful of modified
  `reports/`, `.github/workflows/ai-cost-daily.yml`, and `scripts/ai-cost/*`
  files noted in PR4/PR5's own release records were still present in this
  worktree's git status at the start of this PR's work; not touched by
  this PR.
