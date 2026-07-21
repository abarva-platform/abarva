# Isolated Governed Moves Test Tenant — Design (MOVES-TEST-001)

Status: **design — not yet implemented; no infrastructure provisioned**
Author: Claude Code, 2026-07-20
Enables: `MOVES-QUALITY-002` (live E2E proof, P4 business-case generation + approval cycle), and any
future live phase-transition proof this program needs, without touching production client Moves.

## 0. Why this exists

The MEMBER AI ASSIST incident (this session's Phase Advancement Control program) happened because a
live phase transition was clicked through against a real, shared-production Move. The incident
audit's own standing constraint is: **no further live phase transitions against shared production
data.** That constraint is correct and stays in force. But it leaves `MOVES-QUALITY-002` (and any
future live-proof need) permanently blocked unless a real, safe place to run one exists. This
document designs that place. Building it is a separate backlog item (`MOVES-TEST-001`, added below)
— this document is the design only.

## 1. Synthetic tenant identity

- **Tenant key**: `moves-e2e-test` (a new entry in `CANONICAL_TENANT_KEYS`, per the repo's own rule
  that tenants come from code, never a hand-typed list — this tenant must be added there like any
  real tenant, not special-cased around that governance).
- **Display name / cover name**: "Meridian Test Harbor" or similar — follows the same cover-name
  convention every other synthetic/demo tenant in this codebase already uses (never a real client
  name, per `CONTEXT_CORPUS_POLICY.md`).
- **Client record**: a real row in whatever table backs tenant identity (`clients`/`engagements`'
  parent tenant concept), flagged `is_synthetic_test_tenant: true` (new boolean, additive) — this
  flag is what every safety check below keys on, so "is this the test tenant" is never inferred from
  a name string.
- **No real users**: the tenant's operator/persons rows use clearly-synthetic identities (e.g.
  `qa-reviewer-business@moves-e2e-test.internal`) — never real employee or client emails, so no
  accidental notification/email delivery to a real person ever originates from this tenant's test
  activity.

## 2. Seed-data boundaries and isolation from all demonstration and client tenants

- **Complete data isolation**: the test tenant's `engagement_id`s, `deliverables_v2` rows, and every
  other tenant-scoped table row exist under its own `client_id`/tenant key — standard multi-tenant
  isolation, not a special carve-out. The `is_synthetic_test_tenant` flag additionally gates it out
  of: demo-account lists, sales/investor-facing surfaces, any cross-tenant analytics rollups, and any
  production alerting/notification fan-out (a gate advance in this tenant must never page anyone).
- **Never appears in production tenant pickers** shown to real users — the flag hides it from any
  UI/API surface that lists "your tenants," the same way archived/deleted tenants are already hidden.
- **Separate from existing demo tenants** (SkyHarbor, Lakeshore, Apex Retail, Meridian, First
  Capital) — those are sales-demo tenants with real-looking synthetic data meant to be shown to
  prospects; this tenant is a **test-execution harness**, not a demo, and must not be listed
  alongside them or be reachable from the demo-account switcher.
- **Runs in the same Azure/Postgres environment** as production (no separate database) — isolation is
  enforced by tenant scoping and the RLS/RBAC boundary already governing every other tenant, not by
  physical separation. This is deliberate: a separate test database would prove nothing about the
  real, shared-schema behavior this program needs to validate.

## 3. Reset strategy

- **Reset-by-truncate-and-reseed, tenant-scoped only.** A dedicated, sanctioned ACA Job (per
  `docs/ops/aca-data-build-job-rule.md` — not an ad-hoc script) deletes every row scoped to
  `moves-e2e-test`'s `client_id` across the full set of Moves-related tables, then re-inserts the
  fixture set from §5. This job is idempotent and safe to re-run at will.
- **No soft-delete accumulation**: unlike production data (which is never hard-deleted), this
  tenant's test data is expected to be reset frequently; hard delete scoped strictly to its own
  tenant key is acceptable and intended here, specifically because §1's isolation guarantees make a
  cross-tenant mistake structurally hard to make (every delete is `WHERE client_id = <test tenant
  uuid>`, the same predicate every other tenant-scoped query already requires).
- **Repeatable, deterministic seed**: the seed fixture (§5) uses fixed, version-controlled data (not
  randomly generated), so two consecutive resets produce byte-identical starting state — required for
  any test that asserts on exact content.

## 4. Minimum P0–P5 fixture set

One Move (`"AMS Sourcing Pilot"` or similar cover name), seeded at each phase boundary so a test can
start from any phase without having to click through every prior phase first:

| Phase | Fixture state |
|---|---|
| P0 | A real, complete origination brief (sponsor-attested, per the `origination_brief` type in `MOVES-DESIGN-002`'s matrix) — `human_approved`, not `client_final` (P0 has no client-final concept). |
| P1 | A real, generated `charter` — one version at `human_approved` (internal review complete, not yet client-final) to test the "blocked because not yet client_final" path, and a second seeded Move variant with the charter at `client_final` to test the "gate passes" path. |
| P2 | A real, generated `discovery_report` at `human_approved`, plus its `root_cause_worksheet` companion (non-gate working doc). |
| P3 | A real, generated `target_state_architecture` with all three required exhibits (conceptual/logical/physical diagrams) present, one version at `human_approved` with `architecture`-role approval recorded, and — critically — this is where `MOVES-EVIDENCE-001`'s fixed class of bug gets a positive regression fixture: a `phase_3_*` `program_modules` row exists and is `completed`, proving free-text capture alone cannot satisfy the gate. |
| P4 | The `MOVES-QUALITY-002` target phase — a real, generated `business_case` and `execution_roadmap`, seeded in multiple lifecycle states across separate fixture variants (see §7) so both the gate-pass and gate-fail paths are exercisable without regenerating content live. |
| P5 | A real, generated `handoff_package` and `value_measurement_contract`, both at `client_final` with `executive_sponsor` approval recorded, to test the terminal Tower-handoff path. |

## 5. Artifact versions and lifecycle states — required coverage

For the P4 `business_case` specifically (the direct `MOVES-QUALITY-002` target), seed **multiple
versions across its full lifecycle**, not just one final state:

```text
v1 · ai_draft            — freshly generated, no review yet
v2 · in_review            — submitted for review, no decision yet
v3 · changes_requested    — a reviewer requested changes (with recorded comments)
v4 · human_approved       — business + finance approvals recorded (separate identities, per
                             MOVES-DESIGN-001's separation-of-duties rule)
v5 · client_final          — the same content additionally marked client_final
v6 · superseded            — an even later version exists, so v5's authority has been replaced
```

## 6. Approval identities and roles

Fixture reviewer identities, one per `reviewer_role_code` actually exercised by the P4 fixtures
(mirroring `MOVES-DESIGN-001`'s enum, synthetic emails only, per §1):

```text
qa-business-owner@moves-e2e-test.internal      (business_owner)
qa-finance@moves-e2e-test.internal              (finance)
qa-architecture@moves-e2e-test.internal         (architecture)
qa-executive-sponsor@moves-e2e-test.internal    (executive_sponsor)
qa-client-authority@moves-e2e-test.internal     (client_authority)
qa-abarva-quality@moves-e2e-test.internal       (abarva_quality)
```

Each identity is distinct (never the same person recorded for two required roles on the same
version), so the separation-of-duties rule from `MOVES-DESIGN-001` is exercisable and testable, not
just assumed.

## 7. Required test-case coverage

The fixture set must make every one of these directly exercisable without live generation:

- **Generated** — a fresh `ai_draft` version exists with real orchestrator-produced content (not
  placeholder text).
- **Failed** — a version whose generation job is recorded as failed (a `deliverable_versions` row
  tagged with a failure marker, or simply absent where a job attempt was logged) — proves the
  gate correctly reports "generation failed," not silently proceeding.
- **Changes-requested** — v3 above.
- **Approved (`human_approved`)** — v4 above.
- **Client-final** — v5 above.
- **Superseded** — v6 above.
- **Gate-pass scenario**: a Move fixture variant where every P4 gate requirement is genuinely met
  (business_case at `client_final`, both required roles approved, `requires_revalidation = false`) —
  `evaluateGate()` must return `pass: true`.
- **Gate-fail scenarios**, one fixture variant per failure mode: (a) business_case only at
  `human_approved` when the artifact's policy requires `client_final`; (b) only one of the two
  required roles (business/finance) approved; (c) `requires_revalidation = true` on the otherwise-
  eligible version; (d) a newer, unapproved version exists on top of the approved one (must not be
  treated as current).

## 8. Expected Files Explorer lineage

For the P4 `business_case` fixture, the expected lineage tree (feeds Workstream E once it exists):

```text
Business Case
├── v1 · AI Generated Draft
├── v2 · AI Generated Revision — In Review
├── v3 · AI Generated Revision — Changes Requested
├── v4 · AI Generated Revision — Human Approved (business + finance)
├── v5 · AI Generated Revision — Client Final · Authoritative (superseded by v6)
└── v6 · Client Uploaded — Client Final · Authoritative
```

## 9. Expected PDF/DOCX outputs

For at least the P3 `target_state_architecture` and P4 `business_case` fixtures, the fixture set
includes a **pinned, version-controlled expected-output snapshot** (byte-stable HTML per the
existing `golden-regression.test.ts` pattern already used in this codebase, plus a "renders without
error" assertion for DOCX and PDF given `MOVES-QUALITY-001` now exists) — so a live E2E proof run can
assert generated exports match known-good output, not just "didn't crash."

## 10. Cleanup and repeatability

- Every test run either resets via §3 before starting, or — for a run that intentionally mutates
  state (e.g. an actual phase-advance E2E proof) — resets via §3 immediately after, so the tenant
  never accumulates drift between runs.
- The reset job itself is idempotent and safe to run before every single test invocation as a
  matter of course (cheap, tenant-scoped, no cross-tenant risk).

## 11. Deployment environment

- **Same ACA/Postgres environment as production** (per §2's rationale) — not a separate
  environment, and not local/dev-only, since the entire point is proving real, shared-schema
  behavior under the real deployed application, the same way this session's other live-proof work
  (e.g. the SkyHarbor/Lakeshore flag rollout proofs) already does.
- **Reachable only via the same signed-in browser/API paths every other tenant uses** — no special
  bypass route. This is what makes an E2E proof against it actually representative of real user
  behavior.

## 12. Explicit prohibition

**This tenant must never be a real client's data, and no fixture in it may ever be copied from or
reference a real client's actual facts, deliverables, or identities.** All content is synthetic,
generated fresh for this purpose, following the same "cover name, no real client data" discipline
`CONTEXT_CORPUS_POLICY.md` already requires everywhere else in this codebase. Using it does not
relax — and must never be treated as relaxing — the standing constraint against running live phase
transitions against **production client Moves**.

## New backlog item

```text
MOVES-TEST-001 — Isolated governed Moves test tenant

Problem statement: MOVES-QUALITY-002 (and any future live-proof need) is blocked because no safe,
isolated place exists to run a live phase transition without touching shared production data.

User/business impact: without this, live E2E verification of the phase-gate/approval-lifecycle
system can only ever be proven via unit/integration tests, never a true signed-in, end-to-end
browser proof — a real gap in this program's own evidence standard.

Severity: P2 (test-infrastructure gap, not a defect)
Workstream: Automation and efficiency / test enablement
Status: Needs Design Review
Dependencies: this design document's review/approval; MOVES-ARTIFACT-001's schema (recommended to
  land first, so the test tenant's fixtures are seeded against the FINAL lifecycle schema rather
  than needing to be reseeded once that schema changes)
Acceptance criteria: the isolated tenant exists, is provisioned via a sanctioned ACA Job (never
  ad-hoc), is invisible to production tenant pickers/demo surfaces, and its fixture set covers every
  case in this design document's §7
Required tests: a reset-and-reseed run produces byte-identical fixture state twice in a row; every
  §7 scenario is independently exercisable; no fixture data ever appears in a production-tenant
  query
PR: not yet opened
Discovered from: the standing "no further live phase transitions against production data"
  constraint from the MEMBER AI ASSIST incident audit, combined with MOVES-QUALITY-002 being
  otherwise permanently blocked
Notes / remaining gaps: infrastructure is NOT provisioned by this design document — building it is
  the separate, still-to-be-scoped implementation work this backlog item tracks
```
