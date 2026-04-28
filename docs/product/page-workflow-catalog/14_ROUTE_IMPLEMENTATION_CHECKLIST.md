# Route Implementation Checklist (CAT2)

Status: Canonical (CAT2)
Authored: 2026-04-25
Depends on: CAT1 page and workflow catalog

This checklist binds the **page and workflow catalog** (CAT1) to the
**actual app-router state** of `src/app/`. For every canonical route
it records whether the route exists today, which agent owns the
primary brief, what data contract and read-model are required, what
components, actions and validation tests are required, which design
blueprint is the visual reference, the MVP / V1 / V2 priority, the
known gaps, and the next implementation slice.

All routes below live under the `(maestro)` route group at
`src/app/(maestro)/...` (the route group does not appear in the URL).
Status reflects HEAD `861d765` of the
`pack/cat2-route-implementation-checklist` branch.

Conventions used in this document:

- **Status** — one of `exists`, `partial`, `missing`, `legacy`.
  - `exists` — `page.tsx` exists at the canonical app-router path.
  - `partial` — page renders but is missing a contract, action, or
    validation that the catalog requires.
  - `missing` — no `page.tsx` at the canonical path.
  - `legacy` — an older page exists at a non-canonical path and must
    be migrated.
- **Primary agent** — which of Nexus / Sentinel / Atlas / Steward
  owns the canonical brief on the page. A page may render multiple
  agent briefs but exactly one is primary.
- **MVP / V1 / V2 priority** — MVP routes must ship for the Prat
  demo; V1 routes ship the first month after Prat; V2 routes ship
  later. Priority follows the CAT1 roadmap.
- **Visual blueprint reference** — path under `docs/design/pages/`
  (DES1 blueprints) when the route has a canonical visual recipe.

Routes are ordered to mirror the operator journey: arrival → admin →
programs portfolio → program canvas → tower → intelligence → source.

---

## 1. `/home`

- **Status**: exists. `src/app/(maestro)/home/page.tsx`.
- **Primary agent**: Nexus.
- **Primary question answered**: "Where should I look first today
  across my whole portfolio?"
- **Data contract required**: tenant inventory + cross-tenant home
  aggregate. Inputs: tenant_id, persona, last_visit_at. Outputs:
  prioritized brief lines + 3 follow-up prompts + jump targets.
  Implemented by `src/lib/home/aggregate.ts` and
  `src/lib/home/tenant-inventory.ts`.
- **Read model required**: `loadHomeAggregate(persona)` returning
  `{ brief, jumpTargets, recentActivity, pendingActions }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (variant=light, agent=nexus), `MetricStrip` (≤5 KPIs), portfolio
  jump-target list, recent-activity rail.
- **Actions required**: "Open program", "Open tenant", "Ask Nexus
  follow-up". No mutations from this page.
- **Validation tests required**: integration test that
  `loadHomeAggregate` returns a deterministic brief for the demo
  fixture, and that jump targets resolve to real tenant slugs.
- **Visual blueprint reference**: none yet — `/home` is not in the
  DES1 blueprint set; it follows the Programs blueprint's
  `AgentBriefPanel + MetricStrip` pattern.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: brief-line generator does not yet personalize per
  persona (admin vs investor); jump targets static; no follow-up
  prompts wired to a /home Ask thread.
- **Next implementation slice**: `HOME2` — wire persona-aware brief
  lines and three deterministic follow-up prompts to the existing
  `Ask` thread surface.

---

## 2. `/platform/admin`

- **Status**: exists. `src/app/(maestro)/platform/admin/page.tsx`.
- **Primary agent**: Steward.
- **Primary question answered**: "What does the platform need from
  me to run safely today?"
- **Data contract required**: setup readiness inputs (connector
  health, tenant count, audit posture, governance posture). Outputs:
  readiness score + action queue. Implemented by
  `src/lib/admin/steward-setup-readiness.ts` and
  `src/lib/admin/dataset-domain-inventory.ts`.
- **Read model required**: `loadAdminSetupReadiness()` returning
  `{ score, blockers, queue, evidence }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=steward), `MetricStrip`, queue table linking to admin
  sub-pages, `EvidenceChip` strip per blocker.
- **Actions required**: navigate to admin sub-pages
  (approvals / audit / connectors / users / quality / data-governance);
  no destructive mutations from the index page.
- **Validation tests required**: integration test on
  `loadAdminSetupReadiness` for the demo fixture, plus a visual
  smoke that all sub-page links resolve.
- **Visual blueprint reference**:
  `docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md`.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: queue is static; readiness score does not
  recompute on connector/audit/users state changes.
- **Next implementation slice**: `ADM6` — recompute Steward
  readiness score from live Postgres state (not the demo fixture)
  and surface the recompute timestamp in the brief.

---

## 3. `/platform/admin/build-progress`

- **Status**: exists.
  `src/app/(maestro)/platform/admin/build-progress/page.tsx`.
- **Primary agent**: Steward.
- **Primary question answered**: "How much of the AbarVa platform
  itself has been built, and what's still in flight?"
- **Data contract required**: build roadmap (categories, slices,
  status, risk, owner agent). Inputs: `docs/build/build-slices.json`.
  Outputs: per-category roll-up + per-slice detail. Implemented by
  `src/lib/build-progress/roadmap.ts`.
- **Read model required**: `loadBuildRoadmap()` returning
  `{ categories, slices, summary }` from the manifest.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=steward, brief="What I built today"), `MetricStrip` (slice
  counts by status), category accordion, slice table.
- **Actions required**: navigate to slice detail (out-of-scope for
  MVP); deep-link to `docs/build/slices/<id>.md`.
- **Validation tests required**: a fixture-driven test that
  `loadBuildRoadmap` matches `build-slices.json` byte-for-byte and
  that lifecycle filters are honored.
- **Visual blueprint reference**: none — follows the Admin Setup
  blueprint's brief-panel-plus-table pattern.
- **MVP / V1 / V2 priority**: V1 (used internally during cycles; not
  a Prat-demo route).
- **Known gaps**: page does not warn when the manifest's
  `lastUpdated` is more than 7 days stale; CAT2 entry missing until
  this slice lands.
- **Next implementation slice**: `ADM7` — surface a stale-manifest
  banner when `lastUpdated` is older than 7 days and link to the
  CAT2 checklist.

---

## 4. `/tenant/[tenantSlug]/programs`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx`.
- **Primary agent**: Nexus.
- **Primary question answered**: "Across this tenant's programs,
  which one needs me first today?"
- **Data contract required**: tenant programs canonical view.
  Implemented by `src/lib/programs/programs-canonical-view.ts`,
  `src/lib/programs/programs-nexus-rail-view.ts`, and
  `src/lib/programs/programs-control-tower-signals.ts`. Outputs:
  portfolio rows (code, name, phase, gate, evidence, steward) +
  Nexus brief + control-tower pressure signals.
- **Read model required**: `loadTenantProgramsView(tenantSlug)`
  returning `{ brief, metrics, rows, pressure }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=nexus), `MetricStrip`, portfolio table with row-click
  drilldown, `PressureCard` strip.
- **Actions required**: row click → program canvas; "Drive G2 close
  on PRG-02 today" recommended action triggers a navigation
  intent (no mutation).
- **Validation tests required**: integration test on
  `loadTenantProgramsView` for Apex Retail (4 programs) and
  Meridian fixtures; visual smoke for table → drilldown.
- **Visual blueprint reference**:
  `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md`.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: pressure signals are derived from a fixture, not
  yet recomputed from live program state on every load; table
  filters are not URL-stateful.
- **Next implementation slice**: `PW2` — make portfolio table
  filters URL-stateful (phase, gate, evidence) and persist between
  reloads.

---

## 5. `/tenant/[tenantSlug]/programs/[programSlug]`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx`.
- **Primary agent**: Nexus (with Steward signing gates).
- **Primary question answered**: "On this one program, what gate is
  next and what's blocking it?"
- **Data contract required**: per-program canvas — phases (1-6),
  gates (G1-G4), deliverables, evidence chips, steward signature
  state. Implemented by
  `src/lib/programs/programs-canonical-view.ts` (per-program slice)
  and `src/lib/programs/quality-gates.ts`.
- **Read model required**: `loadProgramCanvas(tenantSlug, slug)`
  returning `{ brief, journey, phases, gates, deliverables,
  steward }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=nexus), `JourneyRail` (six phases, four gate caps), phase
  cards, `EvidenceChip` strip, `DetailDrawerShell` for any artifact.
- **Actions required**: open phase canvas, open deliverable canvas,
  "Ask Nexus" follow-ups (3 chips), gate-sign request (Steward
  only).
- **Validation tests required**: integration test that gate state
  partition `signed / missing_inputs / not_wired` is rendered
  correctly; smoke that journey rail shows exactly 6 phases and 4
  gates (no G5).
- **Visual blueprint reference**:
  `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md`.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: gate-sign action stub-only (no Steward audit
  trail); no inline mutation guard for non-Steward personas.
- **Next implementation slice**: `PW3` — wire gate-sign action to
  the Steward audit log and surface a deterministic
  `signedAt + signedBy` chip on the rail.

---

## 6. `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]/page.tsx`.
- **Primary agent**: Nexus (Maestro for Plan, Engineering for Build,
  Steward for Verify).
- **Primary question answered**: "On this one phase, which
  deliverables are ready, which are partial, and which are blocked?"
- **Data contract required**: phase view — phase number (1-6),
  deliverables for that phase, evidence chips, owner. Implemented
  by `loadProgramCanvas(...).phases[n]` plus
  `src/lib/programs/program-artifact-inventory.ts`.
- **Read model required**: `loadPhaseCanvas(tenantSlug, slug,
  phaseNum)` returning `{ brief, deliverables, evidence, owner }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=nexus, scoped to phase), phase canvas, deliverable cards,
  `EvidenceChip` strip, `DetailDrawerShell`.
- **Actions required**: open deliverable canvas; mark evidence as
  reviewed (Steward only on Verify phase).
- **Validation tests required**: integration test that phaseNum 1-6
  resolve and 0 / 7 / non-numeric return 404; smoke that owner badge
  matches phase mapping (Origination → Maestro+Nexus, Verify →
  Steward).
- **Visual blueprint reference**:
  `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md` (per-program
  canvas section).
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: phase brief reuses program brief without
  rescoping; no per-phase evidence aggregation in the metric strip.
- **Next implementation slice**: `PW4` — rescope `AgentBriefPanel`
  per phase and add a per-phase evidence aggregation to the metric
  strip.

---

## 7. `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx`.
- **Primary agent**: Nexus.
- **Primary question answered**: "What does this single deliverable
  say, and is the evidence usable?"
- **Data contract required**: deliverable canvas — deliverable code
  (e.g. `D-CC-CDP-01`), HTML canvas content, evidence chip set
  (E-ids), owner, last update. Implemented by
  `src/lib/programs/program-artifact-inventory.ts` and the HTML
  deliverable canvas contract from PDEL4.
- **Read model required**: `loadDeliverableCanvas(tenantSlug, slug,
  code)` returning `{ html, evidence, owner, updatedAt, brief }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel` (small,
  agent=nexus), HTML canvas region, `EvidenceChip` strip,
  `FileTypeChip` row, `DetailDrawerShell` for evidence drilldown.
- **Actions required**: open evidence drawer, "Ask Nexus" follow-up
  scoped to deliverable, mark deliverable reviewed (Steward only).
- **Validation tests required**: integration test that the HTML
  canvas contract is honored (no inline scripts, no off-canon
  fonts); smoke that all `E-` ids resolve to real evidence rows.
- **Visual blueprint reference**:
  `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md` (deliverable
  canvas section).
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: evidence drawer renders raw blob ids in a few
  edge cases; no print stylesheet for the canvas.
- **Next implementation slice**: `PDEL6` — render evidence drawer
  with a stable, readable header (id + type + source) and ship a
  print-friendly stylesheet for the deliverable canvas.

---

## 8. `/tenant/[tenantSlug]/tower`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx` and
  `src/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page.tsx`.
- **Primary agent**: Atlas.
- **Primary question answered**: "Where is the tenant's portfolio
  under pressure, and which surface should I open?"
- **Data contract required**: tower aggregate (vendor portfolio,
  enterprise summary, program pressure). Implemented by
  `src/lib/tower/aggregate.ts`,
  `src/lib/tower/program-pressure-view.ts`,
  `src/lib/tower/vendor-portfolio.ts`, and
  `src/lib/tower/enterprise-summary.ts`.
- **Read model required**: `loadTowerView(tenantSlug)` returning
  `{ brief, surfaces, pressure, vendor, summary }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=atlas), `MetricStrip`, `PressureCard` grid, surface tile
  grid linking to `[surface]` sub-routes.
- **Actions required**: open surface, "Surface in Programs"
  cross-link (no mutation).
- **Validation tests required**: integration test that pressure
  cards render the canonical pressure partition; smoke that all
  surface sub-routes resolve.
- **Visual blueprint reference**:
  `docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md`.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: cross-link from PressureCard back to the
  triggering Programs row is not wired; tower brief is static and
  does not yet recompute on program state changes.
- **Next implementation slice**: `TWR3` — wire PressureCard
  cross-link to `programs?focus=<programCode>` and rescope tower
  brief on every load.

---

## 9. `/tenant/[tenantSlug]/intelligence`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx`.
- **Primary agent**: Sentinel.
- **Primary question answered**: "What patterns does Sentinel see
  for this tenant, and which one should I act on?"
- **Data contract required**: tenant intelligence view — pattern
  detections, pattern manifest, deliverable references. Implemented
  by `src/lib/intelligence/sentinel-pattern-view.ts`,
  `src/lib/intelligence/sentinel-pattern-detections.ts`,
  `src/lib/intelligence/pattern-manifest.ts`, and
  `src/lib/intelligence/library.ts`.
- **Read model required**: `loadTenantIntelligenceView(tenantSlug)`
  returning `{ brief, patterns, library, kpis }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=sentinel), `PatternCard` grid, library shelf,
  `DetailDrawerShell` for pattern.
- **Actions required**: open pattern, "Apply pattern to program"
  cross-link, "Ask Sentinel" follow-up.
- **Validation tests required**: integration test on
  `loadTenantIntelligenceView` for the Meridian fixture (canonical
  intelligence demo); smoke that pattern cards link to the pattern
  detail page.
- **Visual blueprint reference**:
  `docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md`.
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: KPI shelf not yet wired into the tenant
  intelligence view; cross-link "apply pattern" is a navigation
  stub only.
- **Next implementation slice**: `INTEL3` — wire KPI shelf to
  `loadKpiDetail` and surface the canonical KPI strip on the
  intelligence index.

---

## 10. `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]`

- **Status**: exists.
  `src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx`.
- **Primary agent**: Sentinel.
- **Primary question answered**: "What does this single pattern
  mean for this tenant, and which deliverables already implement
  it?"
- **Data contract required**: pattern detail — pattern key,
  augmentations, impact data, deliverable references. Implemented
  by `src/lib/intelligence/pattern-augmentations.ts`,
  `src/lib/intelligence/pattern-impact-data.ts`, and
  `src/lib/intelligence/pattern-deliverable-query.ts`.
- **Read model required**: `loadPatternDetail(tenantSlug, key)`
  returning `{ brief, augmentations, impact, deliverables, kpis }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=sentinel, scoped to pattern), pattern body, deliverable
  list, KPI strip, `DetailDrawerShell`.
- **Actions required**: open referenced deliverable, "Apply to
  program" cross-link, "Ask Sentinel" follow-up.
- **Validation tests required**: integration test that pattern
  graph validation passes for every key (no orphan refs); smoke
  that deliverable list resolves.
- **Visual blueprint reference**:
  `docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md` (pattern
  detail section).
- **MVP / V1 / V2 priority**: MVP.
- **Known gaps**: vertical-key sub-page exists in the maestro
  intelligence preview surface but not in the tenant surface;
  augmentations not yet surfaced as discrete chips.
- **Next implementation slice**: `INTEL4` — render augmentations as
  discrete chips and add a `[verticalKey]` sub-segment to the
  tenant surface for vertical-scoped views.

---

## 11. `/source`

- **Status**: exists. `src/app/(maestro)/source/page.tsx`.
- **Primary agent**: Nexus (with Sentinel briefing layer).
- **Primary question answered**: "What's the current source posture
  — events flowing, value captured, gaps?"
- **Data contract required**: source aggregate. Implemented by
  `src/lib/source/queries.ts`, `src/lib/source/multi-agent-briefing.ts`,
  `src/lib/source/value-ledger.ts`, and `src/lib/source/lifecycle.ts`.
- **Read model required**: `loadSourceView()` returning
  `{ brief, lifecycle, valueLedger, recentEvents }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (multi-agent), `MetricStrip` (events ingested, value captured),
  recent-events rail, value-ledger table.
- **Actions required**: open event, jump to event scorecard.
- **Validation tests required**: integration test on
  `loadSourceView` for the deterministic source fixture; smoke that
  the multi-agent briefing renders Nexus + Sentinel + Steward in
  canonical order.
- **Visual blueprint reference**: none — follows the Programs
  blueprint's brief-panel + metric strip + table pattern.
- **MVP / V1 / V2 priority**: V1 (Prat demo shows source via the
  events route; the index is V1).
- **Known gaps**: value ledger not yet linked from the index;
  multi-agent brief renders only Nexus today.
- **Next implementation slice**: `SRC4` — render the full
  multi-agent brief (Nexus + Sentinel + Steward) on the index and
  link the value ledger from the metric strip.

---

## 12. `/source/events`

- **Status**: exists. `src/app/(maestro)/source/events/page.tsx`.
- **Primary agent**: Nexus.
- **Primary question answered**: "Which source events have arrived,
  and which need attention?"
- **Data contract required**: source events list. Implemented by
  `src/lib/source/queries.ts` (events) and
  `src/lib/source/lifecycle.ts`.
- **Read model required**: `loadEventsList()` returning
  `{ events, brief }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`,
  events table (id, type, source, lifecycle, scorecard), filter
  rail.
- **Actions required**: open event detail.
- **Validation tests required**: integration test that lifecycle
  filter renders only the requested partition; smoke that row click
  resolves.
- **Visual blueprint reference**: none — table pattern from the
  Programs blueprint.
- **MVP / V1 / V2 priority**: V1.
- **Known gaps**: filters are not URL-stateful; lifecycle counts
  not surfaced on the metric strip.
- **Next implementation slice**: `SRC5` — make filter rail
  URL-stateful and add a lifecycle count strip.

---

## 13. `/source/events/[eventId]`

- **Status**: exists.
  `src/app/(maestro)/source/events/[eventId]/page.tsx`.
- **Primary agent**: Nexus (with Sentinel/Steward in the briefing
  layer).
- **Primary question answered**: "What is this single source event,
  and what artifacts/scorecard does it carry?"
- **Data contract required**: event detail. Implemented by
  `src/lib/source/queries.ts` (event), `src/lib/source/attachments.ts`,
  and `src/lib/source/multi-agent-briefing.ts`.
- **Read model required**: `loadEventDetail(eventId)` returning
  `{ brief, event, artifacts, scorecard }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (multi-agent), event header, artifacts list, scorecard summary,
  `DetailDrawerShell`.
- **Actions required**: open artifact, open scorecard, "Ask Nexus"
  follow-up.
- **Validation tests required**: integration test that
  `loadEventDetail` returns a non-null briefing for every fixture
  event; smoke that artifact links resolve.
- **Visual blueprint reference**: none — multi-agent briefing
  pattern from the Intelligence blueprint.
- **MVP / V1 / V2 priority**: V1.
- **Known gaps**: scorecard summary on the event page is a stub;
  artifact rendering does not honor `FileTypeChip` partition yet.
- **Next implementation slice**: `SRC6` — render artifact rows
  with `FileTypeChip` and link the scorecard summary to the
  scorecard route.

---

## 14. `/source/events/[eventId]/artifacts/[artifactId]`

- **Status**: exists.
  `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx`.
- **Primary agent**: Nexus.
- **Primary question answered**: "What does this single source
  artifact contain, and is it usable as evidence?"
- **Data contract required**: artifact detail (id, type, mime,
  blob ref, derived evidence ids, scorecard signal). Implemented
  by `src/lib/source/attachments.ts`.
- **Read model required**: `loadArtifactDetail(eventId, artifactId)`
  returning `{ brief, artifact, evidence, scorecard }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (small, agent=nexus), artifact viewer (text/HTML/PDF), evidence
  strip, scorecard chip.
- **Actions required**: download original, copy evidence id,
  "Ask Nexus" follow-up.
- **Validation tests required**: integration test that artifact
  type partition (`pdf / html / md / xlsx / csv / json / image`)
  is honored by `FileTypeChip`; smoke that download link resolves.
- **Visual blueprint reference**: none — follows the deliverable
  canvas pattern from the Programs blueprint.
- **MVP / V1 / V2 priority**: V1.
- **Known gaps**: PDF preview not yet inline; evidence ids render
  as raw strings in a few edge cases.
- **Next implementation slice**: `SRC7` — inline PDF preview and
  render evidence ids as `EvidenceChip` rows.

---

## 15. `/source/events/[eventId]/scorecard`

- **Status**: exists.
  `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx`.
- **Primary agent**: Sentinel (with Nexus brief).
- **Primary question answered**: "How well did the multi-agent
  briefing layer score this event, and where are the gaps?"
- **Data contract required**: scorecard detail (per-agent scores,
  overall score, gap list). Implemented by
  `src/lib/source/scorecard.ts`,
  `src/lib/source/agent-validation.ts`, and
  `src/lib/source/agent-validation-report.ts`.
- **Read model required**: `loadScorecardDetail(eventId)` returning
  `{ brief, scores, gaps, evidence }`.
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=sentinel), per-agent score cards, gap list, evidence
  chip strip.
- **Actions required**: open evidence, "Ask Sentinel" follow-up,
  re-run scorecard (admin only — out of MVP scope).
- **Validation tests required**: integration test on
  `loadScorecardDetail` for every fixture event; smoke that gap
  list links resolve to evidence rows.
- **Visual blueprint reference**:
  `docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md` (scorecard
  section is a sibling pattern).
- **MVP / V1 / V2 priority**: V1.
- **Known gaps**: re-run action stub-only; per-agent score cards
  do not yet render confidence partition.
- **Next implementation slice**: `SRC8` — render per-agent score
  cards with the canonical confidence partition (high / medium /
  low / blocked).

---

## 16. `/tenant/[tenantSlug]/programs/[programSlug]/artifacts/[artifactId]`

- **Status**: missing (proposed). The closest legacy route is
  `src/app/tenant/[tenantSlug]/programs/[programSlug]/evidence/[evidenceId]/page.tsx`,
  which scopes to evidence rather than artifacts and lives outside
  the `(maestro)` route group.
- **Primary agent**: Nexus.
- **Primary question answered**: "On this one program, what does
  this single artifact (e.g. attached PDF, generated HTML) say,
  and how does it map to evidence and deliverables?"
- **Data contract required**: program artifact detail. Should
  reuse `src/lib/programs/program-artifact-inventory.ts` for the
  artifact-side and bind to source attachments via a join key. New
  read model needed: `loadProgramArtifact(tenantSlug, slug,
  artifactId)` returning `{ brief, artifact, evidence,
  deliverables }`.
- **Read model required**: `loadProgramArtifact` (proposed).
- **Components required**: `AbarVaTopNav`, `AgentBriefPanel`
  (agent=nexus, scoped to artifact), artifact viewer (mirroring
  `/source/events/[eventId]/artifacts/[artifactId]`), evidence
  strip, deliverable cross-link list, `FileTypeChip` row.
- **Actions required**: open referenced deliverable, "Ask Nexus"
  follow-up scoped to artifact, mark artifact reviewed.
- **Validation tests required**: integration test that the new
  read model returns a deterministic artifact for the demo fixture;
  smoke that evidence and deliverable cross-links resolve.
- **Visual blueprint reference**:
  `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md` (artifact viewer
  is a sibling of the deliverable canvas).
- **MVP / V1 / V2 priority**: V2 (proposed; not required for Prat).
- **Known gaps**: route does not exist; the artifact-vs-evidence
  distinction is not yet resolved in the program data contract; the
  legacy `evidence/[evidenceId]` route should be migrated under the
  `(maestro)` group during this slice.
- **Next implementation slice**: `PW5` — propose the artifact
  viewer surface, define the read model `loadProgramArtifact`, and
  migrate the legacy evidence route under `(maestro)`.

---

## Status roll-up

| # | Route | Status | Priority |
| -- | --- | --- | --- |
| 1 | `/home` | exists | MVP |
| 2 | `/platform/admin` | exists | MVP |
| 3 | `/platform/admin/build-progress` | exists | V1 |
| 4 | `/tenant/[tenantSlug]/programs` | exists | MVP |
| 5 | `/tenant/[tenantSlug]/programs/[programSlug]` | exists | MVP |
| 6 | `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]` | exists | MVP |
| 7 | `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]` | exists | MVP |
| 8 | `/tenant/[tenantSlug]/tower` | exists | MVP |
| 9 | `/tenant/[tenantSlug]/intelligence` | exists | MVP |
| 10 | `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` | exists | MVP |
| 11 | `/source` | exists | V1 |
| 12 | `/source/events` | exists | V1 |
| 13 | `/source/events/[eventId]` | exists | V1 |
| 14 | `/source/events/[eventId]/artifacts/[artifactId]` | exists | V1 |
| 15 | `/source/events/[eventId]/scorecard` | exists | V1 |
| 16 | `/tenant/[tenantSlug]/programs/[programSlug]/artifacts/[artifactId]` | missing (proposed) | V2 |

15 of 16 canonical routes exist at HEAD `861d765`; the 16th is
proposed for V2 and is the only **missing** route in the catalog.
The next 20 implementation slices that close the documented gaps
are listed in
[15_NEXT_20_IMPLEMENTATION_SLICES.md](./15_NEXT_20_IMPLEMENTATION_SLICES.md).
