# ADM2 · Steward Setup Home / Control Center

Slice ID: ADM2
Slice name: Steward Setup Home / Control Center
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

First Apple-like Admin / Setup landing surface implementing the ADM1
contract. Renders the deterministic Steward Brief above readiness
panels, then recommended actions and an object-inspector slot. **No
live Steward runtime, no live retrieval, no Atlas / Claude / OpenAI
invocation, no upload pipeline, no connector sync, no permission
editor backend, no migrations.**

## What changed

- New deterministic read-model module
  [src/lib/admin/steward-setup-readiness.ts](../../../src/lib/admin/steward-setup-readiness.ts):
  - Public types: `EvidenceReadinessState`, `DatasetDomainStatus`,
    `AgentName`, `AgentReadinessStatus`, `AdminSurfaceName`,
    `SetupHealth`, `AdminModuleStatus`, `StewardBriefSourceLabel`,
    plus the ADM1 view-model interfaces:
    `EvidenceReadinessAggregate`, `DatasetDomainReadiness`,
    `AgentReadiness`, `AdminModuleReadiness`,
    `AdminRecommendedAction`, `StewardBriefFollowUp`,
    `StewardBriefAgentReadinessLine`, `StewardBrief`,
    `StewardSetupReadinessView`.
  - Public helpers: `buildStewardSetupReadinessView()` (pure;
    seed-driven; same call → identical view object every time).
  - Re-exports: `EVIDENCE_STATES_IN_PROGRESSION_ORDER` (canonical
    9-state list from ADM1 §J), `ADMIN_AGENT_NAMES` (Nexus,
    Sentinel, Atlas, Steward).
  - Module hygiene: imports nothing from Source UI, Nexus / Sentinel
    / Atlas / Agent runtime, legacy `/programs`, `mock.ts`, auth, or
    Supabase.

- New control-center component
  [src/components/admin/StewardSetupControlCenter.tsx](../../../src/components/admin/StewardSetupControlCenter.tsx):
  - Renders the five canonical zones from ADM1 §F:
    - Zone A · Admin header / setup health (eyebrow, page title,
      one-line rationale, setup-health chip)
    - Zone B · Steward brief (severity / confidence chips, top
      admin gaps, agent readiness sentences, recommended next
      action panel, three disabled "Ask Steward" follow-up chips,
      interpretation-basis caption)
    - Zone C · Readiness cards grid: dataset domains, evidence
      readiness, users + access posture, connector posture, agent
      readiness matrix
    - Zone D · Recommended actions list + canonical Admin modules
      with status chips + route links
    - Zone E · Object inspector slot (honest empty placeholder;
      lights up once ADM4 / 5 / 7 / 9 land)
  - Visual system inherits the canonical AbarVa palette: cream
    surface, Georgia serif headlines, DM Sans body, JetBrains Mono
    eyebrows / chips, teal / amber / red accents per status.
  - Component imports only `next/link` and the ADM2 read-model
    module.

- Wired into the existing Admin landing route
  [src/app/(maestro)/platform/admin/page.tsx](../../../src/app/%28maestro%29/platform/admin/page.tsx):
  - Adds a `Setup · Control Center` nav item at the top of the
    sidebar.
  - Default active section is now `'control-center'`; the surface
    boots on the new control center instead of `Maestros`.
  - Existing sections (Maestros, Roles & Permissions, Security,
    Active Clients, Contract Terms, Sensitive Data Approvals,
    Quality Ops, Access Logs, Pending Requests, Build Progress,
    Audit Log, API Keys, Compliance) are preserved unchanged.
  - Existing `assertTenantAccess`-style admin guard
    (email-allowlist + role check) is preserved unchanged.
  - Build Progress route remains accessible from the sidebar.

- New tests
  [src/__tests__/integration/admin/steward-setup-control-center.test.ts](../../../src/__tests__/integration/admin/steward-setup-control-center.test.ts):
  31 deterministic tests across 8 describe blocks covering: read
  model determinism + shape, the 12 canonical Enterprise Dataset
  Domains (ADM1 §H), evidence aggregate progression invariants,
  Agent Readiness Matrix presence + shape, Steward Brief required
  fields + dollar-pattern absence + no-live-runtime claim, Admin
  modules including Build Progress, recommended-actions parity with
  brief recommendedNextAction, and module hygiene across the
  read-model + the component.

## How it implements ADM1

| ADM1 section | ADM2 implementation |
|---|---|
| §H · 12 Canonical Enterprise Dataset Domains | `DatasetDomainReadiness[]` with all 12 entries by canonical key + ordinal; per-domain status, loaded / available / usable counts, example datasets, missing inputs, agents, surfaces, Steward guidance. |
| §J · Loaded → Usable evidence model | `EvidenceReadinessAggregate.byState` covers all 9 canonical states (`loaded`, `parsed`, `indexed`, `classified`, `scoped`, `cited`, `quality_checked`, `usable_as_evidence`, `blocked`). `totalLoaded` / `totalAvailable` / `totalUsable` reconcile to the byState counts. The aggregate is monotonic across the progression (test enforced). |
| §O · Agent Readiness Matrix | `AgentReadiness[]` for Nexus, Sentinel, Atlas, Steward — each with `status`, `canUse`, `missingContext`, `safeToAnswer`, `mustDefer`, `nextAdminAction`. The control-center card surfaces these as a calm five-row table. |
| §G · Canonical Admin modules | `AdminModuleReadiness[]` covers all ten canonical modules with per-module status (`live` / `partial` / `planned` / `deferred`), routeHref, and a one-sentence description. |
| §P · Steward Brief | `StewardBrief` exposes title, tenantSetupHealth (label + rationale), top admin gaps, dataEvidenceReadiness, userSecurityRisk, connectorRisk, agentReadiness sentences (one per agent), recommendedNextAction, three deterministic disabled `suggestedFollowUps`, sourceLabel (`setup_state_read_model` when populated, `deterministic_seed` otherwise), and interpretationBasis. |
| §F · Five canonical zones | Component renders Zone A header, Zone B brief, Zone C readiness cards, Zone D recommended actions + admin modules, Zone E object-inspector placeholder. |
| §E · Apple-like experience principles | Calm hierarchy (one headline per zone), progressive disclosure (brief → cards → actions → inspector), click-to-explore (every chip / count / module / action routes somewhere), every panel carries a Steward interpretation, every gap shows a recommended action. |

The slice does **not** wire the dataset explorer drilldown (ADM4),
the per-agent readiness drilldown (ADM7), the per-program evidence
usability drilldown (ADM9), or the AI Control Tower per-dimension
view (ADM10). All four lift the same read-model contract this slice
establishes.

## What is deterministic today

- View is byte-equal across repeated calls.
- All 12 canonical dataset domain keys are emitted in canonical
  ordinal order (test enforced).
- Evidence aggregate is monotonic across the progression
  (`loaded` ≥ `parsed` ≥ `indexed` ≥ ... ≥ `usable_as_evidence`)
  (test enforced).
- Per-domain count invariants
  (`loadedCount` ≥ `availableCount` ≥ `usableEvidenceCount`)
  (test enforced).
- Steward Brief follow-up ids are fixed and ordered:
  - `steward-followup-walk-setup-health`
  - `steward-followup-domains-needing-owners`
  - `steward-followup-unblock-atlas`
- All follow-ups render `enabled: false`; clicking does nothing.
- Brief never invents a dollar amount in any string field (test
  enforced).
- Brief never claims a live runtime; connector posture honestly
  reads "0 of 0 connectors are wired today; live connector sync is
  deferred."
- The brief's `recommendedNextAction` equals the first ranked action
  in `recommendedActions` (test enforced).
- All admin module routes start with `/`.

## What is NOT yet live Steward runtime

- No Claude / OpenAI / Pinecone invocation.
- No live retrieval.
- No persisted operator decisions.
- No live tenant-state sync.
- No live audit row inspector.
- The "Ask Steward" follow-up chips are visible but disabled —
  clicking does nothing today; they exist to advertise the future
  affordance.

## What is deferred to ADM3 +

- **ADM3 — Dataset Domain Inventory Read Model.** Promote the
  per-domain seed counts into a richer read model that can dispatch
  to ADM4's drillable dataset explorer.
- **ADM4 — Dataset Explorer UI.** Drillable list + drawer per ADM1
  §I; lights up Zone E.
- **ADM5 — Users & Access Surface.** Replaces today's Users /
  Maestros placeholder with the ADM1 §K contract.
- **ADM6 — Security & Governance Posture.** Implements ADM1 §L on
  top of the existing tenant-isolation probe (S7).
- **ADM7 — Agent Readiness Matrix drilldown.** Per-agent
  drillable panel with safe-to-answer / must-defer detail.
- **ADM8 — Steward Brief metadata binding.** Wires the brief to
  more granular read models (Tenant State + Connector State +
  Audit State) once they land.
- **ADM9 — Audit / Evidence Usability Drilldown.** Per-program
  evidence usability state per ADM1 §J.
- **ADM10 — AI Control Tower Dataset Readiness View.** Surface
  per ADM1 §N.
- **Live Steward runtime.** A future Sentinel / Atlas / Nexus
  upgrade slice can promote this surface from `setup_state_read_model`
  to a live runtime view; no contract change required here.
- **Production upload + parsing pipeline.** Once the upload pipeline
  lands, the evidence aggregate counts will populate from real
  state instead of seed; no contract change required here.
- **Connector sync jobs.** Same as above — the connector card will
  populate once a live sync engine lands.

## How this supports Programs / Tower / Intelligence readiness

- The Steward Brief is the single surface where an admin sees
  whether Programs / Tower / Intelligence can produce decision-grade
  guidance for the active tenant set.
- Atlas (S9g brief), Sentinel (I1 / I2 / I3 detection model), and
  Nexus (S4 adapter) consume the same evidence-state contract the
  ADM2 read model surfaces. The control center makes the contract
  visible to operators.
- The "next admin action" per agent is the same reasoning the
  Programs / Tower / Intelligence surfaces apply when they decide
  whether to refuse or compose substantive output. Operators can
  resolve gaps at their root in Setup.

## Honest fallbacks used

- Empty / not-started domains report `status: 'not_started'` with
  `loadedCount: 0` rather than fabricating a populated state.
- Connector posture is honest: 0 of 0 connectors today; live
  connector sync deferred.
- The Steward suggested follow-up chips render `disabled` +
  `aria-disabled="true"` + a `deferred · live steward runtime`
  sub-label; the tooltip names the deferral.
- Object-inspector slot (Zone E) renders an explicit "honest and
  empty" placeholder until ADM4 / 5 / 7 / 9 land.
- Setup health rationale always names the load-bearing limit
  ("X of 12 dataset domains have no captured data; tenant-isolation
  guard is intact").
- Sentinel agent readiness is `ready` because I1 / I2 / I3 are
  wired; recurrence claims are still flagged as deferred. Atlas
  and Nexus and Steward each report `partial` with the named
  unblock-action.
- Component never imports Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or Supabase
  (test enforced).
- Existing admin guard, sidebar items, and Build Progress access
  are preserved unchanged.

## Validation

- `npx tsc --noEmit --pretty false` — pass (after clearing stale
  `.next` cache).
- `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts` — 31 passed
- Regression suites pass (S7, S9e, S9f, S9g, I1, I2, I3).
- `npm run build` — pass; existing routes preserved.

Promotion to `verified` requires a live walk by founder confirming
`/platform/admin` boots on the new Setup · Control Center, the
Steward Brief renders correctly, the recommended-action route works,
the disabled "Ask Steward" chips are visible-but-non-interactive,
and Build Progress remains accessible from the sidebar.

## Status

Code complete. Pending founder review.
