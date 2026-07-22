# 2026-07-22-source-artifact-acceptances — SOURCE-SHELL-004: two-track artifact approval

## Release ID

`2026-07-22-source-artifact-acceptances`

## Status

`candidate` — PR open, migration not yet applied through the governed lane.

## Plain-English Summary

The user's Source Event Shell mockup specifies that accepting an artifact as authoritative
and advancing the stage gate are two distinct approvals — an artifact must be explicitly
*accepted* (author, timestamp, rationale, append-only) independent of the gate being armed.
Today, acceptance was only inferred from status flags; nothing recorded who accepted an
artifact, when, or why.

This adds a new, real, auditable "accept as authoritative" action: a new append-only table
(`source_artifact_acceptances`), a repository module, a `POST .../accept` route, and an
"Artifact status" panel on each File Cabinet artifact card (plain language throughout — never
"Track A"/"Track B" on screen, per the user's explicit rejection of that framing in an earlier
session). The existing "Stage gate" panel (the Approvals ledger, `SOURCE-SHELL-003`) is
unchanged, placed alongside the new panel.

Investigation before writing any migration found significant reuse opportunity: a live
5-stage governance function (`deriveSourceArtifactGovernanceStage()`) already answers most of
what "artifact status" needs, and two of the mockup's eleven proposed fields
(`supersedes_artifact_id`, `artifact_origin`) already exist as exact-match existing columns.
Given this, the user was asked directly whether to build a narrowed reuse-first version or the
full originally-specified schema — the user chose the full 11-field build. This release
implements all eleven concepts: new storage for the eight genuinely new fields, explicit reuse
(via join, not duplication) for the two that already exist, and a reconciled, non-duplicate
persistence of the `artifact_role` concept (which already existed as a computed-only UI field).
Full field-by-field accounting is in the plan
(`/Users/anand/.claude/plans/staged-meandering-pony.md` at build time).

## Layer Impact

- `global-control-lane`: new table + repository + route + UI panel, shared across all
  tenants. No tenant-specific behavior — acceptance records are scoped by `event_id` →
  `source_events.client_key`, matching the existing `source_event_approvals` pattern.

## Client Applicability

- All clients: yes — no gate, no flag. The "Accept" action is visible on every artifact card;
  the server route enforces `canUploadSourceArtifacts` (same gate the existing artifact-status
  PATCH route uses).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260722150000_source_artifact_acceptances.sql` (new) — append-only
  table: `artifact_id`/`event_id`/`stage_key` FKs, `artifact_state` (snapshot of governance
  stage at accept time), `authoritative_version_id`, `artifact_role` (reconciled with the
  existing authoritative/evidence UI concept), `content_drift_status` (named to avoid
  colliding with this repo's "migration drift" terminology), `gate_precondition_status`,
  `downstream_context_policy` (a real hook for the mandatory Context & Corpus Governance
  policy — enforcement itself is out of scope, see Known Gaps), `diff_summary`,
  `approval_rationale` (required), `accepted_by`/`accepted_at`. `supersedes_artifact_id` and
  `artifact_origin` are deliberately NOT duplicated — read via the existing
  `source_artifacts.supersedes_artifact_id` / `source_artifacts.source_origin` columns
  instead.
- `src/lib/source/artifact-acceptances.ts` (new) — repository: `insertArtifactAcceptance`,
  `listArtifactAcceptances`, `getLatestArtifactAcceptance`,
  `getLatestArtifactAcceptancesByArtifactIds` (batch, avoids N+1 on the File Cabinet list).
- `src/lib/source/client-final-artifacts.ts` — `resolveAuthoritativeArtifact()` gains one new
  optional pool (`hasActiveAcceptance`), inserted between client-final and the existing
  inferred `isCurrentAuthoritative` pool. Backward compatible: existing callers that don't
  populate the field are unaffected (pool stays empty, falls through as before).
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/route.ts` (new) — mirrors
  the existing `.../status/route.ts` auth/lookup pattern. `artifactState` and `artifactRole`
  are computed server-side from the real persisted artifact record and never trusted from the
  client. Requires a non-empty `approvalRationale`.
- `src/lib/source/source-event-shell-v2.ts` — `SourceShellFileItem.latestAcceptance`,
  `BuildSourceEventShellViewInput.latestArtifactAcceptancesById`, `toFileItem()` threading.
- `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx` (new) — the "Artifact
  status" panel + Accept form, wired into `FileCard` in `SourceAnalyticsCanvas.tsx`.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — fetches latest acceptances (real
  artifact UUIDs only — synthetic pseudo-artifact ids are filtered out before the query) and
  passes them as a plain array (server → client component props must be JSON-serializable; the
  Map is built client-side).
- `src/lib/source/verify-artifact-acceptances-readback.ts` (new) — governed-lane repository
  readback. Creates its own fully-synthetic, tenant-isolated `source_events` +
  `source_artifacts` fixture rows before accepting against them — deliberately never writes a
  verification row against a real client's real artifact (which would otherwise show up in
  that client's live "Artifact status" panel).
- `.github/workflows/db-migration-lab.yml` — new "Repository readback — artifact acceptances"
  step, added alongside (not replacing) the existing stage-guidebooks readback step.
- `package.json` — new `db:verify:source-artifact-acceptances` script.
- New tests (see QA / Validation).

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean on every changed/new file. Only the pre-existing, unrelated
  `@xyflow/react`/`@dagrejs/dagre` missing-type-declaration errors remain (confirmed present
  on clean `origin/main`).
- `pass` — `npx eslint` on all changed/new TypeScript/TSX files — 0 errors.
- `pass` — new tests, all passing:
  - `src/lib/source/__tests__/artifact-acceptances.test.ts` (7 cases) — insert/map, DB-error
    honesty (`ok:false`, never throws), latest-lookup, batch-latest-per-artifact-id.
  - `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/__tests__/route.test.ts`
    (6 cases) — rejects missing rationale; confirms `artifactState`/`artifactRole` are
    computed server-side and a client-supplied value is ignored; enum defaults; 404 on
    no-linked-content; 403 on missing upload rights; 500 surfaced on insert failure.
  - `src/lib/source/__tests__/client-final-artifacts.test.ts` (+2 cases) — the new
    `hasActiveAcceptance` pool resolves correctly relative to client-final and the existing
    inferred-authoritative pool; confirms existing callers that never populate the field are
    unaffected.
  - `src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx`
    (5 cases) — honest empty state when never accepted; renders the real latest acceptance's
    rationale/accepted-by/drift/gate-precondition; blocks submission without a rationale; real
    POST body assembly and `onAccepted` callback on success; server error surfaced on failure.
- `pass` — full regression sweep, `npx jest src/lib/source src/components/source
  src/app/api/v1/source` — 13 failed suites both before (stashed, clean `origin/main`) and
  after this change, byte-identical set of failing suite names in both runs — confirmed via
  `git stash` / re-run / `git stash pop` — zero regressions. None of the 13 relate to this
  change (Ava/aVa copy casing, vendor-response-pack renderer coverage, markdown export, pricing
  parser — pre-existing, unrelated drift from other concurrent work on `main`).
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` (after this record
  was added).
- `NOT YET PERFORMED` — governed migration lane (`mode=status` then `mode=apply`) and live
  signed-in proof — both require explicit user confirmation before dispatching, per this
  repo's highest-scrutiny migration governance. Tracked as the immediate next step after this
  PR merges.

## Rollout Plan

1. Merge this PR to `main` via the repo-owned ACA main-deploy workflow (application code only
   — the migration is NOT applied by this deploy; migrations are a separate, deliberately
   un-automatic action per `db-migration-lab.yml`'s own design).
2. Separately dispatch `db-migration-lab.yml` with `mode=status` (read-only preflight), review
   the plan, then `mode=apply` with `confirm=APPLY`, under the required-reviewer `production`
   Environment gate.
3. Confirm the workflow's schema readback, the new "Repository readback — artifact
   acceptances" step, and the affected-feature health check all pass.
4. Live signed-in proof: accept a real artifact on a real event, confirm the panel shows the
   real rationale/accepted-by, confirm the Stage gate panel is unaffected.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (app code only).
- Migration deploy workflow: `.github/workflows/db-migration-lab.yml` (schema, separate
  dispatch, requires explicit `APPLY` confirmation).
- Shared runtime mutators: none beyond the two workflows above.
- Approved image digest: to be recorded once the app-code PR is merged and deployed.
- ACA runtime invariant: to be verified after app-code deploy.
- Worker image invariant: N/A — no worker code touched.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — deferred until after the migration is applied (the new
  UI panel gracefully shows the honest "never accepted" state before that, so app-code deploy
  is safe to land ahead of the migration; the Accept action itself will fail with a clear
  500/insert error until the table exists — acceptable for a `candidate` release, called out
  explicitly here rather than silently).

## Rollback Plan

- App code: revert the merge commit. The UI panel and route degrade to the honest "not yet
  accepted" state / route error respectively if the table doesn't exist yet — no crash, no
  silent wrong data.
- Migration: this repo's standard migration rollback constraints apply (see
  `db-migration-lab.yml`'s own documented model) — the table is purely additive (no altered or
  dropped columns on any existing table), so rollback is `DROP TABLE
  source_artifact_acceptances` with no cascading impact on other tables.

## Audit Evidence

- PR: to be added once opened.
- Migration lane run: to be added once dispatched.
- Typecheck/lint/test logs: see QA / Validation.

## Known Gaps

- `downstream_context_policy` is captured but not yet enforced — `buildValidatedAgentContextBundle`
  does not yet read this field to decide what's eligible as agent context. This is a real,
  deliberate hook for the mandatory Context & Corpus Governance policy (AGENTS.md), flagged as
  separate follow-up work, not silently omitted.
- No backfill of historical acceptance records for already-approved artifacts — new records
  start now; older approvals stay honestly un-attributed, matching the same pattern
  `SOURCE-SHELL-003`'s approval ledger already established for pre-migration rows.
- Governed migration lane not yet dispatched — see QA / Validation and Rollout Plan.
- Live signed-in proof not yet performed — depends on the migration being applied first.
