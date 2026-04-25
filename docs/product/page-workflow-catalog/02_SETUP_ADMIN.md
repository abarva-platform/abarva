# Page · Setup / Admin

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Setup is **not** "settings." It is the Steward-led control plane
where the operator answers whether a tenant is ready to produce
decision-grade guidance. Setup composes users + access, governance
posture, connectors, dataset domain readiness, and the
agent-readiness matrix into a single calm vertical surface. It
must read like the System Settings panel of a premium operating
system: exhaustive, drillable, never noisy. The most leveraged
single fix the operator can take next is always named explicitly
in the Steward Brief.

## Primary user question

"Is this tenant ready, and what is the most leveraged thing to fix
next?"

## Primary agent

Steward (with Nexus / Sentinel / Atlas as readiness contributors in
the Agent Readiness Matrix).

## Route(s)

- `/(maestro)/platform/admin`
- `/(maestro)/platform/users`
- `/(maestro)/platform/data`

## Required data contract / read model

- ADM1 · Steward Setup/Admin Apple-like Control Plane Contract.
- ADM2 · Steward Setup Home Control Center.
- ADM3 · Dataset Domain Inventory Read Model.
- ADM4 · Dataset Explorer UI binding.
- Agent Readiness Matrix derived deterministically from the four
  agent contracts (Nexus / Sentinel / Atlas / Steward).

## What the page knows

- Tenant readiness posture (loaded / available / usable counts per
  domain, percent rollups across the 12 canonical domains).
- Per-user role + attestation evidence state.
- Governance posture: data residency, retention, policy
  attestations and their evidence states.
- Connector inventory (read-only in v2 — Steward seeds only).
- Per-agent × per-domain readiness from the matrix
  (`usable_as_evidence` / `partial` / `blocked` / `not_seeded`).
- The single highest-leverage fix Steward recommends next.

## What the page is missing

- Live connector sync. v2 is read-only; live sync engines are
  deferred.
- Live evidence registry backend. Evidence ids are deterministic
  in v2.
- SSO and SOC2 export tooling. Out of scope for ADM1.
- Live retention enforcement. Policy attestations are seeded; the
  enforcement engine is deferred.

## Key user actions

- Read the Steward Brief and act on the single recommended next
  move (e.g., "Seed PRG-02 contract evidence").
- Drill into a user row (Zone A) to inspect role + attestation
  state in the right-side `DetailDrawerShell`.
- Drill into a governance row (Zone B) to read the policy text
  and current evidence state.
- Drill into a connector row (Zone C) to confirm Steward-seeded
  shape and source labels.
- Drill into a dataset domain card (Zone D) to open the ADM4
  `DatasetExplorerPanel` for that domain.
- Read the Agent Readiness Matrix to confirm which agents can run
  and which must defer per dataset domain.

## Agent actions

- **Steward** composes the brief, owns each row, signs gate
  readiness on dataset domains, and surfaces the single most
  leveraged fix.
- **Nexus** contributes its dataset-domain readiness state to the
  Agent Readiness Matrix (e.g., `partial` for Architecture domain
  if KPI domain is `not_seeded`).
- **Sentinel** contributes its readiness state to the matrix and
  surfaces blocked patterns where domain dependencies are missing.
- **Atlas** contributes its readiness state to the matrix and
  flags when the Tower brief cannot compose because Steward has
  not seeded enough.

## Empty / degraded states

- No users seeded → Zone A renders `EmptyInspector` with caption
  "No users provisioned. Steward provisions users via the
  identity layer."
- No connectors → Zone C renders `EmptyInspector` with caption
  "No connectors registered. Steward seeds connector shape only
  in v2."
- A dataset domain in `not_started` state → render the rollup
  card with MUTED tone and the count tuple `0 / 0 / 0`.
- Object Inspector with no row selected → Zone E renders
  `EmptyInspector` with caption "Select a row to inspect. The
  inspector pulls deterministic ADM3 fields."

## Navigation / drill-down behavior

- Five vertical zones: A · Users & Access, B · Governance,
  C · Connectors & Data Sources, D · Dataset Domain Readiness,
  E · Object Inspector (drawer-mounted).
- Row click opens the right-side `DetailDrawerShell` (Zone E).
  Drawer is the single same-canvas detail surface; modal dialogs
  are forbidden.
- Zone D mounts the existing ADM4 `DatasetExplorerPanel`
  unmodified.
- Top nav exposes `active="admin"`.

## MVP / V1 / V2 scope

- **MVP** — Steward Brief, Zones A / B / C / D / E with
  deterministic seeds, ADM4 DatasetExplorerPanel, Agent Readiness
  Matrix.
- **V1** — adds attestation queue, retention policy preview, and
  evidence-registry surface bindings.
- **V2** — adds live connector sync, SSO expansion, SOC2 export,
  and live Steward runtime authoring.

## Visual blueprint reference

- [`docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md`](../../design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md)
  — five-zone control plane, evidence model, agent matrix.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
