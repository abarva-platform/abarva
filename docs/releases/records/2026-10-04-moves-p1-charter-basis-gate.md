# 2026-10-04-moves-p1-charter-basis-gate — Moves: P1 charter minimum-viable-evidence gate (flag OFF)

## Release ID

`2026-10-04-moves-p1-charter-basis-gate`

## Status

`candidate`

## Plain-English Summary

Advancing out of the P1 Charter today requires an approved evidence upload for
every charter field. That is the wrong bar for a charter: a charter is where a
sponsor scopes the bet, and most of what is stated there is a judgement, not a
document. This change relaxes that gate — behind a feature flag
(`moves_charter_basis_v1`, **off for every tenant**) — to a *minimum-viable
evidence* rule: each charter field records **how it is known** (its basis).

A field's basis is one of three things:

- **approved evidence** — an approved upload, exactly as today;
- **a workspace assertion** — the signed-in user is stating it; or
- **an assumption** — stated with an **owner** and a **plan to validate it in
  Discover (P2)**.

An assertion or an owned assumption is enough to complete the charter and
advance — no upload required. Crucially, a field that is not backed by approved
evidence is never presented as "evidence covered": assumptions stay visibly
classified as assumptions and carry into Discover to be validated. The P2+
evidence gates are unchanged — this relaxation is scoped to P1 only.

Because the flag is off everywhere, there is **no change to the live product**:
the legacy approved-evidence lock stays fully in force for every tenant until one
is explicitly enabled. This lands the gate, the API persistence and the data
model so the per-field basis UI can be wired on top in the next increment.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_basis_v1`, off for all tenants). When off, the P1 advance/gate
path is byte-for-byte the current behaviour.

- `4 PRODUCTS` (Moves): the P1 Charter advance and gate-approval checks gain a
  second, flag-gated mode. When the flag is on for a tenant, a saved field with a
  recorded basis (assertion or owned assumption) satisfies the gate without an
  approved upload; an `approved_evidence` basis still requires a matching
  approved upload. When off, the existing approved-evidence lock is used
  unchanged.
- `3 CANONICAL MODEL`: the per-field basis is persisted on the phase-capture
  module state (`p1_charter_basis`), pinned to the field's value revision so it
  cannot silently outlive an edit to the value it was recorded against. No schema
  migration — it is stored in the existing capture state JSON. The capture
  revision hash now incorporates the basis map; with no basis present it is
  byte-identical to the previous hash, so existing saved captures are unaffected.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_charter_basis_v1` (tenant policy, `includeTenants: []`).

## Changes Included

- `src/lib/programs/p1-charter-evidence.ts` — `missingP1CaptureSections` gains a
  `requireBasis` option (default **false** = legacy approved-evidence lock,
  preserved exactly). When true, a saved field plus a recorded basis satisfies
  the gate; only an `approved_evidence` basis still needs a matching approved
  upload. Adds the basis data model (`parseP1CharterBasisInput`,
  `createP1CharterBasisRecord`, `readP1CharterBasisRecord` — null unless the
  record matches the current value revision — and `isP1CharterBasisValidForSection`).
- `src/lib/programs/phase-capture-integrity.ts` — `computeCaptureRevision` folds
  the basis map into the revision; empty/absent basis hashes identically to
  before.
- `src/app/api/v1/programs/[programId]/advance/route.ts` and
  `.../phase-gate-approval/route.ts` — resolve `moves_charter_basis_v1` per
  tenant and pass `requireBasis` to the gate.
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — parses and
  persists the per-field basis; the save-time basis completeness check is gated
  on the flag (no-op when off, matching current save behaviour).
- `src/lib/features/registry.ts` — registers the `moves_charter_basis_v1` flag
  (off for all tenants).
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  reads persisted basis to hydrate the capture revision (the per-field basis UI
  that consumes it lands in the next increment).
- `src/lib/programs/__tests__/p1-charter-evidence.test.ts` — basis-model cases
  plus a case proving the flag-off default is the legacy approved-evidence lock.

## QA / Validation

- `jest` (`p1-charter-evidence`) — **PASS**: 9/9, including the flag-off
  legacy-lock fallback case.
- `jest` (affected route + integrity suites: `phase-capture-integrity`,
  `advance/route`, `phase-gate-approval/route`) — **PASS**: 79/79.
- `tsc --noEmit` — **PASS**: 0 type errors across the whole project (fixed 4
  pre-existing type errors inherited in the draft).
- `eslint` — **PASS**: 0 errors on all changed files.
- Visual signed-in walk — **NOT RUN**: no signed-in data-backed render off the
  private data plane from a dev box; and there is no UI on this increment. Owed
  once the basis UI increment is enabled for a tenant.

## Rollout Plan

Merge to `main` via squash PR. The flag is off for all tenants, so there is no
runtime behaviour change on merge — the legacy P1 approved-evidence lock stays in
force. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enabling for a tenant (adding it to `includeTenants`, or the env
override) is a separate controlled change, and should follow the per-field basis
UI increment so an enabled tenant has a way to record a basis.

## Rollback Plan

Revert the PR, or set `includeTenants: []` (already the state) — either returns
every tenant to the legacy approved-evidence lock immediately, with no data
migration required (persisted basis records are simply ignored by the off path).

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template or secrets. Because the
flag is off for all tenants, the merged code is inert at runtime until a separate
controlled change enables a tenant.

## Known Gaps

- The per-field basis **UI** is not in this increment. The gate, API persistence
  and data model are landed; the capture flow does not yet render a "how do you
  know this?" affordance, so no tenant should be enabled until that UI ships
  (otherwise an enabled tenant has no way to record a basis and the P1 gate would
  effectively block). Tracked as the next increment.
- No signed-in visual proof (none possible off the private data plane from a dev
  box, and there is no UI to show on this increment).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The gate's two modes and the flag-off = legacy-lock equivalence are covered by
  `src/lib/programs/__tests__/p1-charter-evidence.test.ts`.
