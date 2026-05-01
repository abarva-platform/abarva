# AbarVa Programs Module · Autonomous Build Spec

**Version:** 1.0 · April 28 2026
**Status:** Build-ready · for agent execution loop
**Target:** Programs module converged onto the shell-era route family, with canonical smoke coverage and documented wave sequencing

This document is the operational spec for the Programs module. It is written for the next agent, not for a marketing reader. The goal is simple: make Programs safe to pick up wave by wave without re-discovering the architecture, the current flagship state, or the route-family trap that still exists in this repo.

---

## §1 · Purpose & role

Programs is the **Nexus-led strategy-to-approval surface** for AI and transformation initiatives. It is where a tenant shapes, proves, designs, roadmaps, packages, approves, and hands off a program for monitored execution. Programs owns phases, gates, evidence, handoffs, deliverables, contradictions, approvals, and the next best move.

Programs is **not** the portfolio view. Tower handles portfolio capital allocation, pressure, cross-program ROI, and execution monitoring once the monitoring contract is accepted. Programs is not the sourcing workspace either. Source handles vendor events, BAFO, scorecards, and commercial evidence. Programs sits between them: it absorbs evidence from Source and Intelligence, turns it into an approved program package, and exposes the monitoring contract Tower needs.

Programs is not where complex implementation is executed. The actual execution happens in client delivery systems, vendor PMOs, SI project plans, Jira, ServiceNow, Smartsheet, Epic/Workday plans, spreadsheets, and steering routines. Programs defines what execution should look like and hands monitoring to Tower.

**Lead agent:** Nexus. The Programs register is operational-maestro, not portfolio CFO and not validator. Nexus on Programs sounds like, "here is the next move, here is the blocker, here is what unlocks the phase." That is distinct from Nexus on Tower, which is portfolio-level and comparative.

**Flagship storyline:** `APX-CDP-2026` (Apex Retail CDP Activation), currently at **P3 Design**. This is not aspirational future state. It is the current demo anchor and must be treated as the default Programs smoke storyline.

---

## §2 · State baseline

### Route inventory (verified from repo extraction)

The canonical shell-era route family exists under `src/app/programs/**`:

- `/programs`
- `/programs/[id]`
- `/programs/new`
- `/programs/patterns`

The legacy route family still exists under tenant-scoped paths:

- `/tenant/[tenantSlug]/programs`
- `/tenant/[tenantSlug]/programs/[programSlug]`
- `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]`
- `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]`
- `/tenant/[tenantSlug]/programs/[programSlug]/evidence/[evidenceId]`

Additional non-canonical program-adjacent routes also exist:

- preview routes under `src/app/(maestro)/preview/programs/**`
- a demo origination route under `src/app/demo/programs/new/page.tsx`
- a Tower drill-in route at `/tower/programs/[programId]`

This is the single most important Programs architecture fact: **the canonical shell routes and the legacy tenant routes coexist today**. Any wave that touches the legacy tenant family must be treated as an escalation until the convergence strategy in §13 is executed deliberately.

### Shell state

The canonical `/programs` family is already shell-wired. The modern surfaces use `AppShell`, `AgentColumn`, shared shell tokens, and the current shell primitives. The old tenant routes still carry older route assumptions and are not yet formally retired.

The flagship detail surface already includes the modern execution affordances:

- `GateRibbon` for pending phase gates
- `GateApproveModal`
- `EvidenceDrawer`
- `ContradictionModal`
- `SuggestedActionOverlay`
- `FileUploadOverlay`
- `AgentHandoffOverlay`
- `PhaseTransitionOverlay`
- `LinkedProgramChip`
- `useToast()` integration for success and failure feedback

### Component count

Verified command result:

```bash
find src/components/programs -name "*.tsx" | wc -l
25
```

The module has **25 TSX components** in `src/components/programs/`. This is enough surface area that future waves must stay decomposed. Programs is not a one-PR cleanup candidate.

### Data layer count

Verified command result:

```bash
find src/lib/programs -name "*.ts" | wc -l
51
```

The module has **51 TypeScript data/read-model/helper files** under `src/lib/programs/`. That count matters because Programs is not just a UI surface. It is already a dense read-model and workflow module with fixture, DB-override, mutation, export, gate, and workbench logic.

### Current-state facts that must be treated as shipped

These are already real and should not be re-proposed as future work:

- `src/lib/programs/programs-fixture.ts` now places `APX-CDP-2026` at **P3 Design**
- `gateStatus: 'pending'` on the flagship program drives the visible **Execution Roadmap gate ribbon** at 2 of 5 criteria
- `buildProgramDetailView` accepts `overrideCurrentPhase` for DB-backed phase override
- `APX_CDP_2026_P3_WORKBENCH` exists in `src/lib/programs/programs-detail-view.ts`
- P3 action C deep-links to `/intelligence/t3-h03` through the action `href` field
- the cross-surface Source route is `/source/events/apex-retail-ams-outsourcing-2026`
- `LinkedProgramChip` is a shared primitive in `src/components/shell/`
- the shell toast system shipped in [Toast.tsx](/Users/anand/Projects/nexus/src/components/shell/Toast.tsx) and is already used in [ProgramDetailPage.tsx](/Users/anand/Projects/nexus/src/components/programs/ProgramDetailPage.tsx)

### Data-layer shape

The module is currently a hybrid of deterministic fixture-driven views and DB overrides. That is not a bug. It is the current architecture.

Important files:

- `programs-fixture.ts` for canonical seed programs and phase slots
- `programs-detail-view.ts` for canonical detail read model construction
- `programs-page-view.ts` for portfolio and origination view composition
- `queries.ts` and `db-phase-queries.ts` for server-side fetch and phase override support
- `mutations.ts` and `phase-gate-advancement-flow.ts` for gate/phase mutation logic

That hybrid pattern is worth preserving until the route convergence and smoke coverage are stable.

---

## §3 · Target architecture

### Shell decision

The target state is simple:

- canonical user-facing Programs work happens under `/programs/**`
- every canonical Programs page is wrapped in `AppShell`
- Nexus occupies the agent column
- working-pane components stay data-rich but visually calm

### Agent column contract

Nexus on Programs is not Sentinel and not Atlas. The voice rules are:

- lead with the next decision, not the history
- state the blocker in operational terms
- stay phase-specific
- cite linked evidence when necessary, but do not turn the quote into an evidence dump

Example:

> "Execution Roadmap gate is pending on three remaining criteria: Vendor C contract, privacy sign-off, and roadmap brief approval. Clear those and P4 opens cleanly."

### Provenance contract

Programs should adopt the same hidden-plumbing rule as Source and Intelligence: data-rendering components accept provenance even when they do not display it directly. The next code waves should use a consistent Programs provenance shape at the component boundary:

```ts
type ProgramProvenance = {
  createdFrom:
    | 'deterministic_seed'
    | 'deterministic_read_model'
    | 'db_override'
    | 'human_authored'
    | 'gateway_compose';
  storeKey?: 'relational' | 'graph' | 'object' | 'evidence_ledger';
  evidenceLedgerEntryId?: string;
  freshness?: { observedAt: Date; ttlSeconds?: number };
};
```

This does not need to be implemented everywhere in one wave. It does need to become the explicit contract for all future Programs slices.

### Route-family decision

Canonical state belongs to `/programs/**`. Legacy `/tenant/[tenantSlug]/programs/**` routes are now a compatibility burden. The target architecture is:

- no new feature work lands only in legacy tenant routes
- canonical logic lives once
- legacy routes become wrappers, redirects, or are retired after parity is proven
- smoke coverage binds to canonical routes, not the legacy family

---

## §4 · Scope · catalog entries

Programs currently maps to 20 `PRG-*` catalog entries from `pages.yaml`.

| ID | Name | Current implementation status | Build priority | Mockup status |
|---|---|---|---|---|
| PRG-IDX-DEFAULT | Programs portfolio index | built | P0 | in-shell |
| PRG-IDX-EMPTY | Empty state | partial | P1 | pending |
| PRG-IDX-FILTERED | Filtered portfolio view | partial | P1 | pending |
| PRG-FLW-ORIGINATE | Originate new program | built | P0 | pending |
| PRG-DTL-P1 | Program detail · Phase 1 Discovery | partial | P0 | pending |
| PRG-DTL-P2 | Program detail · Phase 2 Synthesis | partial | P0 | matched + in-shell |
| PRG-DTL-P3 | Program detail · Phase 3 Design | built | P0 | pending |
| PRG-DTL-P4 | Program detail · Phase 4 Execution Roadmap | partial | P0 | pending |
| PRG-DTL-P5 | Program detail · Phase 5 Business Case & Mobilization Approval | partial | P1 | pending |
| PRG-DTL-P6 | Program detail · Phase 6 Tower Handoff & Execution Monitoring Setup | partial | P1 | pending |
| PRG-STA-GATE-PENDING | Gate review ribbon | built | P0 | pending |
| PRG-MOD-GATE-APPROVE | Gate approval modal | built | P0 | pending |
| PRG-MOD-CONTRADICTION | Contradiction modal | built | P1 | built |
| PRG-MOD-EVIDENCE-DRAWER | Evidence drawer | built | P1 | built |
| PRG-MOD-CUSTOM-ACTION | Custom action modal | partial | P2 | built |
| PRG-STA-PHASE-TRANSITION | Phase transition state | built | P2 | built |
| PRG-STA-FILE-UPLOAD | File upload parse state | built | P1 | built |
| PRG-STA-AGENT-HANDOFF | Agent handoff state | built | P1 | built |
| PRG-STA-SUGGESTED-ACTION | Suggested action flow | built | P1 | built |
| PRG-MOD-SCORECARD-OVERRIDE | Scorecard override modal | partial | P2 | built |

Status guidance:

- `built` means there is an explicit current implementation in the canonical shell flow
- `partial` means the surface exists but needs convergence, state hardening, or visual drift correction
- `missing` would mean no meaningful implementation exists today

Programs is in better shape than the backlog suggests. It is not unspecced because it is empty. It is unspecced because a large amount of work landed in sprints without being decomposed into waves.

---

## §5 · Build waves

Programs should ship in eight waves, `P0` through `P7`.

| Wave | Title | Catalog entries | Est. PR size | Dependencies | Smoke impact |
|---|---|---|---|---|---|
| P0 | Audit + convergence plan | spec + route audit only | docs-only | none | defines `P-SMOKE-CDP` |
| P1 | Route family convergence | all canonical routes + legacy wrappers | 500-800 lines | P0 | smoke must stay on canonical `/programs/**` |
| P2 | Portfolio index states | PRG-IDX-DEFAULT, PRG-IDX-EMPTY, PRG-IDX-FILTERED | 300-500 lines | P1 | home-to-program navigation covered |
| P3 | Detail core canonicalization | PRG-DTL-P1, P2, P3, P4 | 500-800 lines | P1 | flagship detail path hardened |
| P4 | Strategy roadmap + approval phases | PRG-FLW-ORIGINATE, PRG-DTL-P4, PRG-DTL-P5, PRG-DTL-P6 | 400-700 lines | P3 | no regression to flagship path |
| P5 | Evidence + gate governance | gate ribbon, gate approve, evidence, contradiction, scorecard override | 400-700 lines | P3 | gate assertions expand |
| P6 | Interaction states | file upload, handoff, suggested action, phase transition, custom action | 300-600 lines | P3 | action C deep-link becomes mandatory |
| P7 | Cross-surface integration + legacy retirement | Source/Tower/Intelligence linkage, cleanup, final redirects | 400-700 lines | P4-P6 | full `P-SMOKE-CDP` must pass end-to-end |

The critical-path insight is that Programs should not start with cosmetic work. It must start with **route convergence and canonical-path stabilization** or every later wave will keep tripping over duplicate surfaces.

---

## §6 · Plan phase spec

Every Programs wave must start with `docs/build/programs/WAVE-P{N}-PLAN.md` or equivalent module-local plan path.

Mandatory contents:

- scope
- out-of-scope list
- file-level diff table
- dependency graph
- risk and rollback notes
- knowledge-fabric contract changes
- smoke impact statement
- model class declaration (`Sonnet` for routine, `Opus` for ambiguous per orchestration v1.1)
- auto-approval claim

Programs plan docs must explicitly call out:

- whether legacy tenant routes are touched
- whether canonical `/programs/**` routes are touched
- whether `ProgramDetailPage.tsx` is touched
- whether `programs-detail-view.ts` changes read-model behavior

If any plan touches both canonical and legacy route families in the same wave without a narrow reason, the plan should be rejected and split.

---

## §7 · Design phase spec

### Mockup conventions

Primary mockup path:

- `/mnt/user-data/outputs/abarva-mockups/programs/`

Fallback when the mounted outputs path is unavailable:

- `docs/build/mockups/programs/`

One HTML mockup per catalog entry touched in the wave. Programs mockups must preserve:

- shell rail
- top bar
- middle strip
- Nexus column
- working-pane phase context

### Nexus voice on Programs

Programs Nexus is phase-local and operator-facing:

- Discovery: what is still missing
- Synthesis: what must be resolved before design opens
- Design: what unlocks build
- Build: what blocks activation
- Activate: what proves rollout readiness
- Tower Handoff: what value will be monitored, by whom, through which cadence and escalation path

Suggested actions should be navigational unless the working pane itself is the mutation surface.

---

## §8 · Build phase spec

### File conventions

- canonical route work belongs under `src/app/programs/**`
- legacy tenant changes are wrapper, redirect, or parity-only changes
- shared cross-surface primitives belong in `src/components/shell/**` or a future components module, not ad hoc inside Programs

### Component patterns

Preferred composition:

- page component wires shell and query
- read-model builder shapes the data
- focused pane components render specific states
- overlays remain explicit, not hidden inside generic abstractions

### Knowledge-fabric contract

Every data-rendering Programs component should accept `provenance`, even if invisible. This applies first to:

- gate evidence rows
- linked source chips
- contradiction surfaces
- scorecard override state
- value-bearing deliverables

### Forbidden patterns

- new feature logic only in legacy tenant routes
- direct client fetches that bypass existing query/mutation boundaries
- hardcoded legacy Source URLs
- duplicate linkage primitives outside the shared shell component set
- new toast implementations instead of `useToast()`

---

## §9 · Test phase spec

The module smoke is **`P-SMOKE-CDP`**. Its future implementation lives in `tests/e2e/smoke/programs-cdp.smoke.ts`, aligned with the verification infrastructure spec's future smoke layout.

Required navigation chain:

1. `/home`
2. confirm `APX-CDP-2026` is surfaced
3. action A navigates to `/programs/apx-cdp-2026`
4. detail page renders **P3 Design**
5. Execution Roadmap gate ribbon is visible at **2 of 5**
6. action C opens the suggested-action flow and deep-links to `/intelligence/t3-h03`
7. linked Source event chip resolves to `/source/events/apex-retail-ams-outsourcing-2026`
8. return navigation resolves back into the canonical Programs path

Assertions:

- canonical route only, no legacy route fallback
- gate ribbon visible
- action C link exists
- linked Source chip exists
- no 404/500 on any step in the chain

Visual regression:

- portfolio index baseline
- flagship detail page baseline
- gate ribbon state baseline

Snapshot coverage:

- gate ribbon text
- P3 workbench action strip
- linked Source route hint

---

## §10 · Auto-approval policy

Programs waves are eligible for auto-approval only if all eight criteria are true:

1. The wave plan exists and was approved at the required trust tier.
2. Net PR size stays within the active tier cap.
3. No escalation trigger from §13 fired.
4. Local verification gates are green (`typecheck`, `lint`, and targeted tests as defined by the wave plan).
5. `Smoke Tests on Vercel Preview` is green on the PR.
6. Required snapshots or visual baselines were updated when UI changed.
7. No new dependencies, config drift, or route-family expansion was introduced without approval.
8. PR description includes rollback notes, smoke impact, and explicit touched catalog entries.

If any Programs wave fails criterion 5, it is held immediately. There is no "manual smoke equivalent" once the verification infrastructure is live.

---

## §11 · PR & merge conventions

- one branch per wave
- one PR per wave
- no unrelated cleanup in Programs PRs
- branch naming: `programs/wave-P{N}/{slug}` or equivalent
- PR title: `[Programs P{N}] <wave title>`
- PR body must list touched catalog entries, smoke impact, rollback path, and whether legacy tenant routes were touched

Programs waves may auto-merge only when orchestration criteria are met. This Session 1 spec PR is different: it is founder-reviewed and not self-merged.

---

## §12 · The build loop

Programs loop:

1. read this spec
2. pick the next unshipped Programs wave whose dependencies are complete
3. write the wave plan
4. verify whether legacy routes are in scope
5. produce or refresh the matching mockups
6. implement only the planned slice
7. run local verification for the slice
8. wait for Vercel preview and smoke checks
9. merge if criteria pass, otherwise hold or escalate
10. append the outcome to the journal and unlock the next wave

The module-specific rule is that **route-family work must lead**. Do not postpone convergence until the end and keep layering features onto two route trees.

---

## §13 · Escalation rules

Programs-specific escalation triggers:

1. Any wave touching `/tenant/[tenantSlug]/programs/*` beyond wrapper, redirect, or parity work.
2. Any wave introducing a third Programs route family.
3. Any wave changing `buildProgramDetailView` semantics across multiple phases at once.
4. Any wave altering gate mutation behavior or approval semantics without a tightly scoped plan.
5. Any wave changing cross-surface link contracts to Source, Tower, or Intelligence.
6. Any wave introducing new shared shell primitives instead of reusing `LinkedProgramChip` or `useToast()`.
7. Any wave touching both canonical and preview/demo programs routes in the same PR without explicit justification.

### The route family convergence problem

This deserves explicit treatment because it is the biggest Programs-specific risk in the repo.

Current problem:

- `/programs/**` is the shell-wired canonical family
- `/tenant/[tenantSlug]/programs/**` is still present and still routable
- both families express overlapping detail concepts

Required deprecation strategy:

1. freeze new feature work in the legacy tenant family
2. achieve feature parity or wrapper forwarding from legacy to canonical
3. bind smoke coverage to canonical routes
4. add redirects or route notices only after canonical parity is stable
5. retire the legacy family in a dedicated cleanup wave, not opportunistically

Any wave that tries to "quietly fix both" without making that plan explicit should halt and escalate.

---

## §14 · Per-wave detailed spec

| Wave | Exact files to touch | Components affected | Mockups required | Nexus voice variant | Exit criteria |
|---|---|---|---|---|---|
| P0 | `docs/build/PROGRAMS_BUILD_SPEC.md` plus audit notes | none | none | none | spec authored |
| P1 | canonical routes, legacy route wrappers, route helpers | route wrappers, page adapters | portfolio + detail route parity | route-convergence register | canonical routes are source of truth |
| P2 | `/programs` index files, filter helpers, empty state components | portfolio table, empty/filter states | `prg-idx-default`, `prg-idx-empty`, `prg-idx-filtered` | portfolio triage | index states visually and behaviorally aligned |
| P3 | detail route + read-model files for P1-P4 | `ProgramDetailPage`, phase panels, workbench read model | `prg-dtl-p1` through `prg-dtl-p4` | phase-local execution | flagship detail path stable |
| P4 | origination page + future-phase builders | `ProgramOriginationPage`, P5/P6 workbench panels | `prg-flw-originate`, `prg-dtl-p5`, `prg-dtl-p6` | origination then future-phase steering | origination and future phases no longer backlog-only |
| P5 | gate and evidence files | gate ribbon, approve modal, evidence drawer, contradiction, scorecard override | gate/evidence state mocks | governance decision register | gate and evidence surfaces consistent and provenance-ready |
| P6 | interaction overlays and transition states | suggested action, handoff, upload, transition, custom action | interaction-state mocks | execution feedback register | interactive states consistent and smoke-safe |
| P7 | cross-surface links, cleanup, route retirement | shared chips, route hints, redirects | cross-surface storyline mocks | convergence register | full `P-SMOKE-CDP` passes and legacy route retirement is explicit |

Notes by wave:

- `P1` is `Opus`-class work because route convergence is ambiguous and deletion-sensitive.
- `P2`, `P5`, and `P6` are good `Sonnet` waves.
- `P7` should be held for careful review if it removes legacy routes.

---

## §15 · Glossary

| Term | Meaning |
|---|---|
| canonical route family | the modern shell-wired `/programs/**` routes |
| legacy tenant family | `/tenant/[tenantSlug]/programs/**` routes retained from earlier architecture |
| P-SMOKE-CDP | Programs flagship smoke storyline for `APX-CDP-2026` |
| gate ribbon | visible pending-gate state rendered from `gateStatus: 'pending'` |
| overrideCurrentPhase | detail-view builder input allowing DB-backed phase truth to override fixture default |
| P3 workbench | `APX_CDP_2026_P3_WORKBENCH`, the current flagship design-phase content |
| linked Source event | the canonical Source event route `/source/events/apex-retail-ams-outsourcing-2026` |

---

## §16 · Document control

- **Authoritative location:** [PROGRAMS_BUILD_SPEC.md](/Users/anand/Projects/nexus/docs/build/PROGRAMS_BUILD_SPEC.md)
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder
- **Session:** Codex Session 1 morning doc run
- **Companion documents:** `ORCHESTRATION_SPEC.md`, `SOURCE_BUILD_SPEC.md`, `TOWER_DESIGN_SPEC.md`, `VERIFICATION_INFRASTRUCTURE_SPEC.md`

When Programs waves start shipping against this spec, the journal becomes the authoritative record of what matched plan and what drifted.
