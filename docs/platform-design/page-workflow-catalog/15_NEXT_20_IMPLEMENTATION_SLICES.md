# Next 20 Implementation Slices (CAT2)

Status: Canonical (CAT2)
Authored: 2026-04-25
Depends on: CAT1 catalog, CAT2 route checklist

This document proposes the **next 20 build slices** in priority
order, derived from the gaps recorded in
[14_ROUTE_IMPLEMENTATION_CHECKLIST.md](./14_ROUTE_IMPLEMENTATION_CHECKLIST.md).
Slices are grouped by surface so that pack lanes can pick a coherent
group without colliding:

- Programs (5): PW2, PW3, PW4, PW5, PDEL6
- Intelligence (3): INTEL3, INTEL4, INTEL5
- Tower (3): TWR3, TWR4, TWR5
- Admin / Source (3): ADM6, ADM7, SRC4
- Solution Intelligence (3): SOL3, SOL4, SOL5
- Architecture / Platform (3): PF3, PF4, ARCH1

IDs were chosen to extend existing categories in
`docs/build/build-slices.json` and avoid collisions with the 36
slices already present (highest used IDs at 2026-04-25: `PW1` not
yet used in JSON but reserved by spec, `PDEL` taken by PDEL,
`INTEL` reserved, `ADM4`, `MW2`, `PF2`, `SOL2`, `DES2`, `SRC` not
yet used). Each slice is sized for a single pack lane.

Conventions:

- **Allowed files signature** — short hint at the canonical file
  set for the slice; full `allowedFiles` arrays land in the slice's
  manifest entry when it is queued.
- **Estimated effort** — `low` (≤ 1 cycle, doc/transformer only),
  `medium` (≤ 2 cycles, view-model + page wiring), `high` (≥ 3
  cycles, schema or new surface).
- **Risk** — graded by validator class: `low` (typecheck-only),
  `medium` (jest fixture), `high` (Postgres or migration).

---

## Programs (5)

### PW2 — URL-stateful filters on the tenant programs portfolio

- **Why now**: portfolio table filters reset on reload, breaking
  the operator's ability to share a filtered view with a co-worker
  or return to a focused state.
- **Depends on**: S8, S9, PF1.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx`,
  `src/lib/programs/programs-canonical-view.ts`, integration test,
  slice doc, manifest.
- **Acceptance criteria summary**: filters (phase, gate, evidence)
  read from `searchParams`; round-trip preserves selections;
  shareable URL renders the same filtered view; no client state.
- **Estimated effort**: low.
- **Risk**: low.

### PW3 — Steward gate-sign action with audit trail

- **Why now**: `/tenant/.../programs/[programSlug]` exposes a
  gate-sign affordance but the action is a stub; without a Steward
  audit trail we cannot demo the closing of G1-G4.
- **Depends on**: PW2, ADM4.
- **Allowed files signature**:
  `src/lib/programs/quality-gates.ts`,
  `src/lib/programs/mutations.ts`, page wiring, audit log writer,
  jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: Steward persona can sign G1-G4;
  audit row written with `signedAt + signedBy + signature`; rail
  renders signed chip; non-Steward personas see disabled affordance.
- **Estimated effort**: medium.
- **Risk**: medium.

### PW4 — Per-phase rescoping of `AgentBriefPanel` + per-phase metrics

- **Why now**: phase pages today reuse the program brief verbatim,
  which dilutes the operator's per-phase focus.
- **Depends on**: PW3.
- **Allowed files signature**:
  `src/lib/programs/programs-nexus-rail-view.ts`,
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]/page.tsx`,
  jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: phase brief generated per
  phaseNum (1-6); metric strip renders per-phase evidence
  aggregation; phase 6 shows Steward owner badge.
- **Estimated effort**: medium.
- **Risk**: low.

### PW5 — Program artifact viewer (proposed route + read model)

- **Why now**: the only **missing** canonical route is the program
  artifact viewer at `/tenant/.../programs/[programSlug]/artifacts/[artifactId]`,
  and the legacy `/tenant/.../evidence/[evidenceId]` route still
  lives outside the `(maestro)` route group.
- **Depends on**: PW4, PDEL6.
- **Allowed files signature**: new
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/artifacts/[artifactId]/page.tsx`,
  new read model in `src/lib/programs/program-artifact-inventory.ts`,
  legacy route migration, jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: new route renders artifact via
  `loadProgramArtifact`; deliverable and evidence cross-links
  resolve; legacy evidence route migrated under `(maestro)`; redirect
  in place for old URLs.
- **Estimated effort**: high.
- **Risk**: medium.

### PDEL6 — Print stylesheet + readable evidence drawer for the deliverable canvas

- **Why now**: investors print HTML deliverables for board read-outs;
  the current canvas does not have a print stylesheet and the
  evidence drawer renders raw blob ids in edge cases.
- **Depends on**: PDEL.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx`,
  `src/components/abarva/EvidenceChip.tsx`, print CSS in
  `src/app/globals.css`, jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: `@media print` rules render
  canvas at A4 with no nav/drawer; evidence drawer renders header
  with id + type + source; no inline scripts on the print path.
- **Estimated effort**: low.
- **Risk**: low.

---

## Intelligence (3)

### INTEL3 — KPI shelf on the tenant intelligence index

- **Why now**: `/tenant/.../intelligence` shows pattern cards but
  no KPI strip; the canonical Intelligence blueprint requires a KPI
  shelf so operators can read metric posture before drilling into
  patterns.
- **Depends on**: I3, I4.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx`,
  `src/lib/intelligence/loadKpiDetail.ts`, jest fixture, slice doc,
  manifest.
- **Acceptance criteria summary**: KPI strip renders 3-5 KPIs from
  `loadKpiDetail`; each KPI links to its detail page; metric strip
  honors the canonical status partition.
- **Estimated effort**: low.
- **Risk**: low.

### INTEL4 — Pattern augmentation chips + vertical-keyed sub-segment

- **Why now**: the maestro intelligence preview has a
  `[verticalKey]` segment but the tenant intelligence pattern
  detail page does not; augmentations are also surfaced as prose
  rather than chips.
- **Depends on**: INTEL3.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx`,
  optional new `[verticalKey]` segment under it,
  `src/lib/intelligence/pattern-augmentations.ts`, jest fixture,
  slice doc, manifest.
- **Acceptance criteria summary**: augmentations render as chips
  using the canonical augmentation partition; vertical-keyed
  sub-segment resolves; pattern graph validation passes.
- **Estimated effort**: medium.
- **Risk**: low.

### INTEL5 — Pattern → program "apply" action

- **Why now**: today the cross-link from pattern detail to a target
  program is a navigation stub. To demo closed-loop intelligence
  the action must persist a "pattern applied" reference on the
  program.
- **Depends on**: INTEL4, PW3.
- **Allowed files signature**:
  `src/lib/intelligence/pattern-deliverable-query.ts`,
  `src/lib/programs/mutations.ts`, page wiring, audit log row,
  jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: "Apply pattern to program" writes
  a `pattern_applied` row joined by `(patternKey, programCode)`;
  program canvas surfaces the applied pattern; non-Steward personas
  see disabled affordance.
- **Estimated effort**: medium.
- **Risk**: medium.

---

## Tower (3)

### TWR3 — PressureCard cross-link to focused programs view

- **Why now**: PressureCard is the canonical pressure primitive but
  clicking it does not focus the corresponding program in the
  portfolio; operators have to context-switch manually.
- **Depends on**: ADM4, PW2.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx`,
  `src/components/abarva/PressureCard.tsx`,
  `src/lib/tower/program-pressure-view.ts`, jest fixture, slice doc,
  manifest.
- **Acceptance criteria summary**: PressureCard click navigates to
  `programs?focus=<programCode>`; portfolio view scrolls and
  highlights the focused row; cross-link round-trips.
- **Estimated effort**: low.
- **Risk**: low.

### TWR4 — Tower brief recompute on every load

- **Why now**: the tower brief is generated once from a fixture;
  operators see stale text after program state changes, which
  undermines the agent-led narrative.
- **Depends on**: TWR3.
- **Allowed files signature**:
  `src/lib/tower/aggregate.ts`,
  `src/lib/tower/enterprise-summary.ts`, page wiring, jest fixture,
  slice doc, manifest.
- **Acceptance criteria summary**: tower brief regenerated per
  load; output deterministic for a fixed fixture; brief always
  references at least one current pressure card.
- **Estimated effort**: medium.
- **Risk**: low.

### TWR5 — Tower onboarding dimension wiring

- **Why now**: `/tower/onboard/[dimension]` exists but is not
  reachable from the tenant tower; operators cannot use the
  onboarding flow during a Prat demo.
- **Depends on**: TWR4.
- **Allowed files signature**:
  `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx`,
  `src/app/(maestro)/tower/onboard/[dimension]/page.tsx`,
  `src/lib/tower/onboarding-catalog.ts`, jest fixture, slice doc,
  manifest.
- **Acceptance criteria summary**: tower index links to onboarding
  per dimension; dimension page renders with tenant context;
  back-link returns to tenant tower.
- **Estimated effort**: medium.
- **Risk**: low.

---

## Admin / Source (3)

### ADM6 — Live Steward setup readiness recompute

- **Why now**: readiness score is computed from a fixture;
  Steward's brief on `/platform/admin` does not reflect actual
  connector / audit / users state.
- **Depends on**: ADM3, ADM4.
- **Allowed files signature**:
  `src/lib/admin/steward-setup-readiness.ts`,
  `src/app/(maestro)/platform/admin/page.tsx`, jest fixture, slice
  doc, manifest.
- **Acceptance criteria summary**: readiness recomputed from
  Postgres state on every load; recompute timestamp surfaced on
  the brief; readiness drops when a connector is unhealthy.
- **Estimated effort**: medium.
- **Risk**: medium.

### ADM7 — Stale-manifest banner on `/platform/admin/build-progress`

- **Why now**: the build-progress page is the only operator-facing
  view of the build manifest; without a stale-manifest banner,
  operators do not know when CAT2's `lastUpdated` is older than the
  cycle cadence.
- **Depends on**: ADM6, CAT2.
- **Allowed files signature**:
  `src/lib/build-progress/roadmap.ts`,
  `src/app/(maestro)/platform/admin/build-progress/page.tsx`,
  jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: banner shown when `lastUpdated`
  is older than 7 days; banner links to CAT2 checklist; banner
  hidden when manifest is fresh.
- **Estimated effort**: low.
- **Risk**: low.

### SRC4 — Full multi-agent brief on `/source` index

- **Why now**: the source index renders only Nexus; the canonical
  multi-agent briefing layer expects Nexus + Sentinel + Steward
  in canonical order.
- **Depends on**: MW2.
- **Allowed files signature**:
  `src/lib/source/multi-agent-briefing.ts`,
  `src/app/(maestro)/source/page.tsx`, jest fixture, slice doc,
  manifest.
- **Acceptance criteria summary**: index renders all three agent
  briefs in canonical order; value ledger linked from the metric
  strip; no duplicated brief lines across agents.
- **Estimated effort**: low.
- **Risk**: low.

---

## Solution Intelligence (3)

### SOL3 — Workshop-readiness gating on solution archetypes

- **Why now**: SOL2 ships the analytics-modernization component
  pack but the workshop-readiness gating is not yet wired to the
  solution archetype registry. Without it, operators can pick an
  archetype that the tenant cannot service.
- **Depends on**: SOL1, SOL2.
- **Allowed files signature**:
  `src/lib/solutions/ai-led-pdlc-components.ts`,
  `src/lib/programs/workshop-readiness.ts`, integration test, slice
  doc, manifest.
- **Acceptance criteria summary**: archetype card disabled when
  readiness gate fails; gate failure renders a Steward-shaped
  reason; readiness check deterministic for the fixture.
- **Estimated effort**: medium.
- **Risk**: medium.

### SOL4 — Solution → program scaffolder

- **Why now**: there is no canonical "scaffold a program from a
  solution archetype" path today; operators have to hand-create
  programs, which breaks the agent-led narrative.
- **Depends on**: SOL3.
- **Allowed files signature**:
  `src/lib/solutions/ai-led-pdlc-components.ts`,
  `src/lib/programs/mutations.ts`, scaffolder route, jest fixture,
  slice doc, manifest.
- **Acceptance criteria summary**: scaffolder writes a deterministic
  program tree from an archetype; G1 not auto-signed; Steward audit
  row written with `scaffoldedFrom`.
- **Estimated effort**: high.
- **Risk**: high.

### SOL5 — Cross-link solution archetype to deliverable canvas

- **Why now**: archetypes describe deliverables but the deliverable
  canvas does not reference the originating archetype; closing the
  loop strengthens the demo narrative.
- **Depends on**: SOL4, PDEL6.
- **Allowed files signature**:
  `src/lib/solutions/ai-led-pdlc-components.ts`,
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx`,
  jest fixture, slice doc, manifest.
- **Acceptance criteria summary**: deliverable canvas renders an
  "originating archetype" chip linking to the archetype detail; chip
  hidden when archetype is unknown; cross-link round-trips.
- **Estimated effort**: low.
- **Risk**: low.

---

## Architecture / Platform (3)

### PF3 — Surface-level read-model contract

- **Why now**: read-models live in `src/lib/<surface>/` but their
  shape is not yet codified. PF1 / PF2 set the runtime spine; PF3
  documents the surface contract every page must honor.
- **Depends on**: PF1, PF2.
- **Allowed files signature**:
  `docs/specs/platform/runtime-contracts/READ_MODEL_CONTRACT.md`,
  jest contract test, manifest.
- **Acceptance criteria summary**: contract spec lists required
  fields (`brief`, `metrics`, `rows`, `evidence`, `actions`); jest
  test enforces presence on every implemented read-model; doc
  cross-references CAT2 routes.
- **Estimated effort**: medium.
- **Risk**: low.

### PF4 — Allowed-files lint for surface ownership

- **Why now**: pack lanes can accidentally cross-import (e.g.
  Tower importing Programs internals). DES2 already bans some
  cross-imports for primitives; PF4 generalizes the ban to surfaces.
- **Depends on**: PF3.
- **Allowed files signature**:
  `src/lib/design/abarva-theme.ts` (no change),
  new `src/__tests__/integration/architecture/surface-isolation.test.ts`,
  slice doc, manifest.
- **Acceptance criteria summary**: test fails when a Tower file
  imports `src/lib/programs/`; test fails when a Programs file
  imports `src/lib/source/`; canonical exceptions documented.
- **Estimated effort**: low.
- **Risk**: low.

### ARCH1 — Route → owner-agent map

- **Why now**: CAT2 records the primary agent per route in prose;
  ARCH1 codifies that mapping as a typed module so middleware and
  audit can consume it without reading docs.
- **Depends on**: PF4, CAT2.
- **Allowed files signature**:
  `src/lib/agent/route-owner-map.ts`,
  `src/__tests__/integration/architecture/route-owner-map.test.ts`,
  slice doc, manifest.
- **Acceptance criteria summary**: every CAT2 canonical route maps
  to exactly one of `nexus | sentinel | atlas | steward`; map is
  exhaustive; test fails on a new route lacking an owner.
- **Estimated effort**: low.
- **Risk**: low.

---

## Roll-up

| ID | Surface | Effort | Risk |
| --- | --- | --- | --- |
| PW2 | Programs | low | low |
| PW3 | Programs | medium | medium |
| PW4 | Programs | medium | low |
| PW5 | Programs | high | medium |
| PDEL6 | Programs | low | low |
| INTEL3 | Intelligence | low | low |
| INTEL4 | Intelligence | medium | low |
| INTEL5 | Intelligence | medium | medium |
| TWR3 | Tower | low | low |
| TWR4 | Tower | medium | low |
| TWR5 | Tower | medium | low |
| ADM6 | Admin | medium | medium |
| ADM7 | Admin | low | low |
| SRC4 | Source | low | low |
| SOL3 | Solution | medium | medium |
| SOL4 | Solution | high | high |
| SOL5 | Solution | low | low |
| PF3 | Architecture | medium | low |
| PF4 | Architecture | low | low |
| ARCH1 | Architecture | low | low |

Eight slices are `low / low` and can be picked up by any pack lane
in parallel; PW5 and SOL4 are the only `high` effort items and
should be sequenced after their dependencies are merged.
