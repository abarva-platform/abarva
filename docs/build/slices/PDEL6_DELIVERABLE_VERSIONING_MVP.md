# PDEL6 · Deliverable Versioning MVP

Slice ID: PDEL6
Slice name: Deliverable Versioning MVP
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (Lane C)

Adds the deterministic deliverable version read-model used by the
future canvas / steward workflow to render a version timeline, pin the
"current" version, and compute the legal next-state set when promotion
is wired. Composes from the PDEL artifact inventory only. **Does not
generate deliverables, does not export files, and does not write to any
database.** Read-model only.

## What changed

- New view-model module
  [src/lib/programs/deliverable-versioning.ts](../../../src/lib/programs/deliverable-versioning.ts):
  - Public types: `DeliverableVersion`, `DeliverableVersionState`,
    `DeliverableVersionSource`, `DeliverableApprovalState`,
    `DeliverableVersionChangeReason`,
    `DeliverableVersionEvidenceBasis`, `DeliverableVersionSummary`.
  - Public helpers:
    - `buildDeliverableVersionHistory(artifact)` — pure: artifact -> ordered version list.
    - `summarizeDeliverableVersions(versions)` — aggregate counts.
    - `getCurrentDeliverableVersion(versions)` — pull the unique current row.
    - `validateDeliverableVersionTransition(from, to)` — boolean transition gate.
    - `createDeterministicVersionSeed(artifact)` — deterministic v1 seed.
  - Re-exports for test introspection:
    `DELIVERABLE_VERSION_STATES_IN_ORDER`,
    `DELIVERABLE_APPROVAL_STATES_IN_ORDER`,
    `DELIVERABLE_VERSION_SOURCES_IN_ORDER`,
    `DELIVERABLE_VERSION_CHANGE_REASONS_IN_ORDER`,
    `PROGRAM_ARTIFACT_STATUSES_IN_ORDER`.
  - Every seed row is tagged
    `createdFrom: 'deterministic_deliverable_version_seed'`.
- New tests
  [src/__tests__/integration/programs/deliverable-versioning.test.ts](../../../src/__tests__/integration/programs/deliverable-versioning.test.ts):
  determinism (byte-equal); shape coverage; ordinal continuity; unique
  ids; exactly one `current` per artifact; signed-off promotion; no
  fake `approved` verdicts; no fake dollar amounts / E-### citations;
  transition gate covers legal + illegal + self-transitions; module
  hygiene assertions on the source file.

## Version state machine

| State        | Allowed transitions                            |
| ------------ | ---------------------------------------------- |
| `draft`      | `current`, `superseded`, `archived`, `rejected` |
| `current`    | `superseded`, `locked`, `archived`, `rejected` |
| `superseded` | `archived`                                     |
| `locked`     | `archived`                                     |
| `archived`   | (terminal)                                     |
| `rejected`   | `archived`                                     |

Self-transitions (from === to) are rejected. Resurrection paths
(`superseded` / `locked` / `rejected` -> `current`) are rejected. Only
`draft` may move to `current`.

## Approval state mapping

| Artifact status | Seed approval state    | Promoted v2 approval state    |
| --------------- | ---------------------- | ----------------------------- |
| `draft`         | `not_reviewed`         | (not produced)                |
| `pending`       | `not_reviewed`         | (not produced)                |
| `in_review`     | `in_review`            | (not produced)                |
| `signed_off`    | `in_review` (demoted)  | `approved_with_conditions`    |
| `archived`      | `locked`               | (not produced)                |

The fully `approved` verdict is intentionally never emitted in MVP. It
requires Steward gate wiring, which is deferred. Until that lands every
signed-off promotion stays at `approved_with_conditions`.

## Source mapping

| Artifact type           | Version source        |
| ----------------------- | --------------------- |
| `generated_deliverable` | `generated`           |
| `html_deliverable`      | `generated`           |
| `uploaded_document`     | `uploaded`            |
| `workshop_notes`        | `workshop_capture`    |
| any other type          | `deterministic_seed`  |

## What is deterministic today

- `buildDeliverableVersionHistory` is byte-equal across repeated calls
  for every canonical demo artifact (test enforced).
- Every seed and promotion row carries
  `createdFrom: 'deterministic_deliverable_version_seed'`.
- Exactly one `current` version per artifact in the canonical seed
  (test enforced).
- Ordinals are dense: 1..N without gaps (test enforced).
- Version ids are unique within a single history (test enforced).
- No `approved` verdict, no fake citations, no fake dollar amounts, no
  `https://` token in any version field (test enforced).

## What is NOT yet wired

- No live persistence of versions to a database.
- No edit / regenerate flow that opens a new version (PDEL7).
- No Steward gate that flips `approved_with_conditions` -> `approved`.
- No live evidence registry binding; `hasEvidence` is `true` only when
  the upstream artifact's `evidenceUsability === 'usable'`.
- No UI rendering yet; this is read-model only — the canvas will mount
  this view-model in a follow-up slice.

## What is deferred

- **Persistence + write path** — `INSERT INTO deliverable_versions`
  pipeline lands when production write surfaces ship.
- **Edit / regenerate** — PDEL7 owns these flows, which open new
  versions with `changeReason: 'iteration'` or `'rework_required'`.
- **Steward verdict** — flips `approved_with_conditions` -> `approved`
  when the gate lands.
- **Evidence registry** — promotes `hasEvidence: false -> true` when
  E-id citations are wired (ADM3 lifecycle).
- **Canvas integration** — surfaces a version timeline in the right
  rail of the artifact canvas; deferred to a later canvas slice.

## Honest fallbacks used

- Every version's `evidenceBasis` records explicitly what evidence is
  missing, in plain English (no fake placeholders).
- `evidenceCount` is always `0` in MVP because no live citation
  registry is wired.
- `approvalState` defaults are intentionally conservative
  (`not_reviewed` / `in_review` / `locked` / `approved_with_conditions`)
  and the fully `approved` verdict is never emitted today.
- `honestFallback` carries the artifact-level honest caption verbatim
  on the seed row; the promoted v2 row honestly discloses the
  deferred Steward gate.
- Module imports nothing from Source UI, Sentinel / Atlas / Nexus /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or supabase.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/deliverable-versioning.test.ts` — pass
- `npx jest src/__tests__/integration/programs/program-artifact-inventory.test.ts` — pass (regression)
- `npx jest src/__tests__/integration/programs/program-artifact-canvas.test.ts` — pass (regression)
- `npm run build` — pass

## Status

Code complete. Pending founder review.
