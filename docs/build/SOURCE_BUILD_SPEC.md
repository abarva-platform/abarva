# AbarVa Source Module · Autonomous Build Spec

**Version:** 1.0 · April 28 2026
**Status:** Build-ready · for agent execution loop
**Target:** Source module fully shipped on new shell, paper aesthetic, knowledge fabric bound

This spec is the single document an autonomous agent (Code Desktop, Cowork, or any planner-builder loop) needs to plan, design, develop, test, merge, and self-trigger the next wave for the Source module. It assumes the agent has read access to the repo and write access via PRs, and that human review is reserved for the escalation conditions defined in §13.

---

## §1 · Purpose & role

Source is the **Sentinel-led surface** for strategic sourcing events — vendor RFPs, BAFO negotiations, scorecards, contracts, and the artifacts that flow from them. It is the ground-truth layer that feeds Programs, Tower, and Intelligence: when a Program asks "what does the vendor architecture look like," Source has the answer.

Source is **not** a generic "data" surface. It is specifically the strategic-sourcing event lifecycle, modelled as a 10-stage workflow (intake → value_realization), with each stage producing artifacts that downstream surfaces depend on.

**Lead agent:** Sentinel (validator). Sentinel describes what is verified, asserted, or unknown. Sentinel does not decide; it grounds. Compare with Nexus voice in Programs ("here's the next move"); Sentinel says "here's what is and isn't true today."

**Anchored demo source:** AMS Vendor Consolidation 2026, currently at Stage 7 (`orals_bafo`), linked to APX-CDP-2026 via `source-program-link.ts`. Every wave must keep this storyline rendering correctly end-to-end.

---

## §2 · State baseline (verified from repo extraction · April 27 2026)

### Routes that exist (under `src/app/(maestro)/source/`)
- `/source` → SourceDashboardPage (uses `getSourceDashboardData`)
- `/source/events` → SourceEventsPage (uses `listSourcingEvents`)
- `/source/events/[eventId]` → SourceEventDetailPage (uses `getSourcingEvent`)
- `/source/events/[eventId]/scorecard` → scorecard page
- `/source/events/[eventId]/artifacts/[artifactId]` → artifact detail
- `/source/value` → SourceValuePage (uses `getSourceValueLedger`)
- API: `/api/v1/source/[eventId]/nexus/ask`

**No `/tenant/[tenantSlug]/source/*` parallel route family exists.** Source does not have the route convergence problem that Programs has. Routes are clean.

### Shells (3 layers — convergence target)

Current chain:
```
SourceRouteShell (6.4 KB)
  └─ SourceCanonShell (1.5 KB)
       └─ SourceFoundationShell (4.7 KB)
            └─ <page content>
```

`SourceCanonShell` is just a thin wrapper providing the `activeRoute` + summary strip. `SourceFoundationShell` provides chrome (sidebar, tenant mark, route labels). `SourceRouteShell` adds Nexus engagement panel on detail pages.

**Target:** Replace all three with `AppShell` from `src/components/shell/`. Inner panels (Dashboard, Events Portfolio, Detail Canvas, Scorecard, Artifact, Value Ledger) remain — they get re-mounted inside `AppShell` working pane.

### Components (47 in `src/components/source/`)

**Shells to retire:** `SourceCanonShell`, `SourceFoundationShell`, `SourceRouteShell`, `foundationStyles.ts`

**Index/portfolio components:** `AbarVaSourceDashboard`, `SourceEventsPortfolio`, `SourcingEventCard`, `SourcingEventTable`

**Detail / canvas components:** `SourceActiveStageWorkspace`, `SourceScopeStageWorkspace`, `SourceJourneyTracker`, `SourceStagePanel`, `SourceStageGatePanel`, `SourceArtifactStatusStrip`

**Stage-specific panels:** `AmsBafoPanel`, `AmsIntelligenceSignalsPanel`, `AmsVendorStorylinePanel`, `SourceBafoNegotiationPanel`, `SourceBafoNegotiationModelPanel`, `SourceRfpReadinessPanel`, `SourcePricingComparisonPanel`, `VendorPricingComparison`, `SourceVendorResponseCompletenessPanel`, `SourceVendorSelectionReadinessPanel`, `ScorecardGovernancePanel`, `EvaluationCriteriaEditor`

**Commercial intelligence subsystem (Wave-14 leftover, partially redundant):** `SourceCommercialActionQueue`, `SourceCommercialEventSection`, `SourceCommercialExecutiveBrief`, `SourceCommercialHub`, `SourceCommercialMissionsPanel`, `SourceCommercialReadinessView`, `SourceCommercialRiskPanel`, `SourceCommercialSignalsPreview`, `SourceCommercialSummaryPanel`, `SourceCommercialSummarySurface`, `SourceCommercialWorkflowCanvas`, `SourceDataReadinessPanel`

**Cross-surface / linkage:** `LinkedProgramBadge`, `EventLifecycleStatusBadge`, `SourceAlertPanel`, `SourceArtifactDrawer`, `SourceExecutiveDecisionSummaryPanel`, `SourceValueLedger`

**Agent integration:** `NexusEngagementCanvas`, `PersistentNexusPanel`

**Note:** Many of these have overlapping responsibility (e.g., 5+ "Commercial*" panels). Wave-S5 explicitly converges these.

### Data layer (`src/lib/source/`)

**Query surface (5 entry points · all in `queries.ts`):**
- `getSourceDashboardData(): AbarvaSourceDashboardData`
- `listSourcingEvents(): SourcingEventSummary[]`
- `getSourcingEvent(eventId): SourcingEventDetail | null`
- `getSourcingEventArtifact(eventId, artifactId): SourceArtifactDetail | null`
- `getSourceValueLedger(): SourceValueLedgerSnapshot`

**Type system (rich, well-defined in `types.ts`):**
- 10 stage keys: `intake | scope | sourcing_strategy | rfp_rfi_package | vendor_responses | evaluation | orals_bafo | selection | contract_mobilization | value_realization`
- 9 lifecycle statuses: `active | waiting_on_client | waiting_on_vendor | waiting_on_procurement | waiting_on_executive_decision | paused | at_risk | completed | archived`
- 6 stage statuses: `not_started | active | blocked | complete | needs_approval | reopened`
- 5 stage gate statuses: `not_started | ready | in_review | approved | blocked`
- 6 artifact kinds: `charter | scorecard | decision_memo | artifact_packet | value_ledger | trace`
- 8 artifact statuses: `not_started | draft | needs_inputs | needs_review | approved | locked | superseded | archived`
- 3 artifact tiers: `rich | outline | stub`
- 7 scorecard lifecycle states: `default_generated → client_edited → rationale_added → reviewed → approved → locked → used_for_vendor_evaluation`

**Validation infrastructure exists:** `agent-validation*`, `workflow-validation*`, `__tests__/`. CI gates already wired against these.

### Aesthetic state

- New shell tokens at `src/lib/shell/shell-tokens.ts` are byte-identical to spec (paper #faf7f1, ink #0c1a3a, Fraunces+Inter+JetBrains Mono).
- `src/app/globals.css` still has dark-teal tokens (`--background #060a12`, `--color-teal #14b8a6`) — Source pages currently render against these via `SourceFoundationShell`'s inline styles using the old palette.
- The single existing Source mockup `/mnt/user-data/outputs/abarva-mockups/04-source-canvas.html` uses the **old dark/teal aesthetic** and must be re-rendered in paper/navy before serving as a build target.

---

## §3 · Target architecture

### Shell wrap
Every Source page is wrapped in `AppShell` which provides: rail (5 icons), top bar (with `AbarVa` wordmark + tenant pill + LOCKED badge), middle strip (filter slot), agent column (480px, dark navy, Sentinel voice), and working pane (fills remaining width).

```tsx
<AppShell
  surface="source"
  leadAgent="sentinel"
  middleStrip={<SourceMiddleStrip ... />}
  agentColumn={<AgentColumn agent="sentinel" quote={...} actions={...} />}
>
  <SourceWorkingPane>
    {/* page-specific content */}
  </SourceWorkingPane>
</AppShell>
```

### Knowledge-fabric binding (per page, invisible by default)
Every page that renders Source data passes a `provenance` prop down to working-pane components. The component never displays it visually unless rendering inside `CMP-EVIDENCE-ROW` or `PRG-MOD-EVIDENCE-DRAWER`. The data is present so it can be surfaced on-demand and so `<MissingInputChip>` can be shown if a required input is unavailable.

```ts
type SourceProvenance = {
  createdFrom:
    | 'deterministic_read_model'
    | 'deterministic_seed'
    | 'deterministic_pattern_pack'
    | 'gateway_compose'
    | 'human_authored';
  storeKey?: 'relational' | 'vector' | 'graph' | 'object' | 'evidence_ledger';
  evidenceLedgerEntryId?: string;
  freshness: { observedAt: Date; ttlSeconds?: number };
};
```

### Iceberg principle (per Part H of the session dump)
Working surfaces show the answer, not the machinery. Sentinel's voice quote should sound expert because of what it knows — not because it announces "I read 14 sources." The provenance prop is for the system; it surfaces visibly only on the Evidence Drawer (`PRG-MOD-EVIDENCE-DRAWER`) and Missing-Input chip.

---

## §4 · Scope · 12 catalog entries

| ID | Name | Existing route/component basis | Mockup |
|---|---|---|---|
| SRC-IDX-DEFAULT | Source dashboard (overview) | `/source` + `AbarVaSourceDashboard` | Stale (04, dark) |
| SRC-IDX-EVENTS | Sourcing events portfolio | `/source/events` + `SourceEventsPortfolio` | None |
| SRC-IDX-VALUE | Value ledger index | `/source/value` + `SourceValueLedger` | None |
| SRC-DTL-CANVAS | Sourcing event detail canvas | `/source/events/[eventId]` + many panels | Stale (04, dark) |
| SRC-DTL-SCORECARD | Scorecard editor / governance | `/source/events/[eventId]/scorecard` + `ScorecardGovernancePanel` | None |
| SRC-DTL-ARTIFACT | Artifact detail | `/source/events/[eventId]/artifacts/[artifactId]` + `SourceArtifactDrawer` | None |
| SRC-FLW-INTAKE | New sourcing event intake | None — needs build | None |
| SRC-MOD-EVIDENCE | Evidence drawer modal | `SourceArtifactDrawer` partial | None |
| SRC-MOD-CONTRADICTION | Contradiction surfacing | None — needs build | None |
| SRC-STA-LINKED-PROG | Linked-program storyline chip | `LinkedProgramBadge` + `source-program-link.ts` | None |
| SRC-EMP-NO-EVENTS | Empty: no sourcing events | None — needs build | None |
| SRC-ERR-EVENT-NOT-FOUND | Error: event not found | `notFound()` in `[eventId]/page.tsx` | None |

**Build-priority distribution:** P0 = 6 (IDX-DEFAULT, IDX-EVENTS, DTL-CANVAS, STA-LINKED-PROG, EMP-NO-EVENTS, ERR-EVENT-NOT-FOUND), P1 = 4, P2 = 2.

**Mockup gap:** 11 of 12 entries lack matched mockups in current paper aesthetic. Mockup production is part of the design phase of each wave (§7).

---

## §5 · Build waves

Seven waves. Each is a single PR. Each has a plan deliverable (markdown), design deliverable (mockup HTML in paper aesthetic), build deliverable (code + tests), exit criteria, and an explicit downstream wave dependency.

| Wave | Title | Catalog entries | Estimated PRs |
|---|---|---|---|
| **S0** | Audit & Plan | — | 1 (docs only) |
| **S1** | Shell convergence + token refresh | All — chrome only | 1 |
| **S2** | Index pages refresh | SRC-IDX-DEFAULT, SRC-IDX-EVENTS, SRC-IDX-VALUE | 1 |
| **S3** | Event canvas refresh | SRC-DTL-CANVAS | 1 |
| **S4** | Sub-routes refresh | SRC-DTL-SCORECARD, SRC-DTL-ARTIFACT | 1 |
| **S5** | Commercial-intel convergence | (internal — reduces 12 panels to 4) | 1 |
| **S6** | Cross-surface storyline + states | SRC-STA-LINKED-PROG, SRC-EMP-NO-EVENTS, SRC-ERR-EVENT-NOT-FOUND, SRC-MOD-EVIDENCE, SRC-MOD-CONTRADICTION, SRC-FLW-INTAKE | 1–2 |

**Wave dependency rule:** Wave N+1 may not begin until Wave N is merged, CI green, and the AMS Vendor Consolidation 2026 storyline still renders correctly end-to-end (smoke test S-SMOKE-AMS, see §9).

---

## §6 · Plan phase spec

Before any code is written for wave N, the agent produces `docs/source-build/WAVE-S{N}-PLAN.md`. The plan is reviewed (auto or human per §10). Build does not start until plan is approved.

### Plan template (mandatory sections)

```markdown
# Source Wave S{N} Plan

## Scope
- Catalog entries addressed: [list]
- Out of scope: [list — be explicit about what is NOT being built]

## File-level diffs (every file the wave will touch)
| File | Action | Lines (est) | Reason |
|---|---|---|---|
| src/components/source/X.tsx | modify | +30 -120 | Replace SourceCanonShell with AppShell |
| src/components/source/Y.tsx | delete | -150 | Superseded by Z |
| src/components/source/Z.tsx | new | +180 | Replaces X+Y consolidation |

## Component dependency graph
[diagram or indented list showing what depends on what after the wave]

## Knowledge fabric contract changes
- New `provenance` props: [list]
- New evidence ledger entries: [list]
- Changes to query surface: [list — should be NONE for waves S1–S4]

## Test plan
- Snapshot tests added/updated: [list]
- Visual regression baseline: [yes/no — if yes, against which mockup file]
- Smoke test S-SMOKE-AMS: [confirmed pass criteria]

## Risk & mitigation
- Highest-risk change: [identify]
- Rollback plan: [git revert specifics]

## Auto-approval claim
- This PR: [meets / does not meet] auto-approval criteria per §10
- If does not meet: [reason — which criterion fails]
```

### Plan acceptance criteria
- All file-level diffs sum to ≤ 1000 lines net change (else split into sub-waves)
- No file in `src/lib/architecture/*` modified (else escalate per §13)
- No file in `src/lib/shell/shell-tokens.ts` modified (else escalate)
- No new top-level routes (else escalate)
- Smoke test plan explicitly covers AMS storyline
- Test plan covers every modified component

If any criterion fails, the plan is rejected with the failing criterion named. Agent revises and re-submits.

---

## §7 · Design phase spec

After plan approval and before code, the agent produces or verifies a mockup HTML file for every catalog entry the wave touches.

### Mockup file convention
- Path: `/mnt/user-data/outputs/abarva-mockups/source/<id>.html` (e.g., `src-idx-default.html`)
- Aesthetic: paper/navy per shell tokens — never dark/teal. Reuse the CSS variable scaffold from `00-architecture-4-surfaces.html` or any `*-matched.html` mockup.
- Self-contained HTML. No build step. Opens in any browser.
- Must include in DOM order: rail · top bar · middle strip · agent column · working pane.
- Working pane content must mirror the catalog entry's `working_pane.sections` and `working_pane.components`.

### Sentinel voice spec (agent column quote)

Sentinel speaks in 1–3 sentences. Voice register:

- **Cite, don't claim.** "Three RFP responses received; one incomplete on staffing" — not "Vendor B is unreliable."
- **Verified vs asserted vs inferred.** "Verified: pricing within 14% of benchmark. Asserted by Vendor B: 90-day implementation. Inferred: Vendor B's staffing is short."
- **Lead with the gap.** When something is blocking, name it first. "BAFO is one input away — Vendor B staffing data, due Friday."
- **No moves.** Sentinel does not say "do this." That is Nexus's job. Sentinel says "here is the state." The Suggested Actions A/B/C below the quote may be moves; the quote itself is descriptive.

Compare on the same data:

> **Sentinel:** *"BAFO is one input away — Vendor B staffing data, due Friday. Pricing comparison locked at variance 14% to benchmark; scorecard approved by Procurement Tuesday."*
>
> **Nexus (would say, on Programs):** *"Push Vendor B for staffing today; if no response by Friday, eliminate them and proceed with A and C only. Time to BAFO: 2 weeks."*

### Suggested actions (3 per page)
Each action: short title (3–5 words) + one-line detail. Actions navigate; they do not mutate. Mutating actions go in the working pane (forms, modals, drawers) per the design canon.

### Middle strip content (per surface)
Source middle strip slots: `[stage filter] [status filter] [linked-to filter] [sort] | [search]`. The same strip renders on IDX-DEFAULT, IDX-EVENTS, IDX-VALUE; specific filter chips light up per page.

### Mockup acceptance criteria
- Renders in Chromium without errors.
- Uses only paper aesthetic CSS variables.
- Contains all sections from catalog entry's `working_pane.sections`.
- Sentinel quote follows voice spec above.
- Includes provenance markers as `data-provenance` attributes (invisible by default; visible only when `body.show-provenance`).

---

## §8 · Build phase spec

### File conventions
- Page files (`src/app/(maestro)/source/.../page.tsx`): server components, mark `dynamic = 'force-dynamic'`, fetch via `getX()` from `queries.ts`, pass `data` as a single prop to a client component.
- Working-pane client components (`src/components/source/*.tsx`): named export, prop type colocated, `'use client'` only when needed, no direct DB access.
- New components must export from `src/components/source/index.ts` if they are public; private composition components can stay file-local.

### Component pattern (canonical)

```tsx
// src/components/source/SourceEventCanvas.tsx
'use client';

import type { SourcingEventDetail } from '@/lib/source/types';
import type { SourceProvenance } from '@/lib/source/provenance';
import { SourceJourneyTracker } from './SourceJourneyTracker';
// … other imports

interface SourceEventCanvasProps {
  event: SourcingEventDetail;
  provenance: Record<string, SourceProvenance>;
}

export function SourceEventCanvas({ event, provenance }: SourceEventCanvasProps) {
  // working pane content — never includes shell chrome
  return (
    <section data-surface="source" data-page="dtl-canvas">
      <SourceJourneyTracker stages={event.stages} active={event.currentStageKey} />
      {/* … */}
    </section>
  );
}
```

### Knowledge-fabric contract (build-time invariant)
Every component that renders Source data must accept a `provenance` prop. The component is permitted to ignore it visually; what it must NOT do is render data without it being plumbed through. Lint rule (`@abarva/no-orphan-data`) enforces this — added to `eslint-plugin-abarva` if not yet present (see Wave-S0 plan).

### Forbidden patterns
- Inline `style={{ background: '#fdfbf6' }}`. Always use `SHELL.CARD_WHITE` (or token).
- `useState` for data fetching. Use server components or React Query (already wired).
- Direct fetch to `/api/v1/source/*` from client components. Use the server query function via prop drilling or React Query bound to a query key from `src/lib/source/query-keys.ts`.
- `console.log` in committed code. CI fails this.
- New top-level CSS files. All styling via `shell-tokens.ts` + colocated style objects.

### Component-removal rule (waves S1, S5)
When deleting a component, the agent must:
1. Confirm zero imports remain (`grep -r "from '@/components/source/X'" src/`).
2. Update `src/components/source/index.ts`.
3. Add to the wave plan's "Removed" section with reason.

---

## §9 · Test phase spec

### Smoke tests (must pass before merge of every wave)

**S-SMOKE-AMS** — AMS Vendor Consolidation 2026 storyline renders end-to-end:
1. Navigate to `/source/events`. AMS event card visible with stage = `orals_bafo`, status = `active`, linked-program = APX-CDP-2026.
2. Click into `/source/events/ams-vendor-consolidation-2026`. Detail canvas renders. Stage tracker shows stage 7 active. BAFO panel renders with vendor pricing comparison. Linked Program chip resolves to APX-CDP-2026 card with correct hover preview.
3. Click into `/source/events/ams-vendor-consolidation-2026/scorecard`. Scorecard governance renders.
4. Sentinel voice on each page references the AMS state correctly (verified by snapshot diff).

This test is the single non-negotiable gate. If it fails, no merge — no exception.

### Snapshot tests
- Every new or modified working-pane component gets a snapshot.
- Stored in `src/components/source/__tests__/<Component>.test.tsx`.
- Run via `pnpm test:source` (configured in repo).

### Visual regression (Playwright)
- Baseline images stored in `tests/visual/source/` per page.
- Every wave that changes rendering produces a new baseline; the PR includes both old and new images for review.
- Pass threshold: ≤ 1.0% pixel diff per page on Chromium 1280×900.

### CI requirements (must pass for auto-approval)
- `pnpm typecheck` — zero errors
- `pnpm lint` — zero errors, zero warnings on changed files
- `pnpm test` — all unit + snapshot tests green
- `pnpm test:source` — all source-specific tests green
- `pnpm test:visual` — visual regression within threshold
- `pnpm test:smoke -- --grep AMS` — smoke green

### Validation infrastructure (already in place)
- `agent-validation-runner.ts` — agent voice contract checks
- `workflow-validation-runner.ts` — stage transition contract checks
- Both run in CI; both gate the merge.

---

## §10 · Auto-approval policy

A PR is auto-approved and auto-merged iff **all** of the following are true:

| # | Criterion | Verification |
|---|---|---|
| 1 | Plan was previously approved per §6 | PR description links to approved plan PR |
| 2 | Net change ≤ 1000 lines | `git diff --shortstat` |
| 3 | No files in §13 escalation list modified | grep against escalation list |
| 4 | All §9 CI requirements pass | CI status |
| 5 | S-SMOKE-AMS passes | Test output |
| 6 | All visual regression diffs ≤ 1% | Visual report |
| 7 | At least one snapshot test added/updated per modified component | Test count check |
| 8 | PR description follows template (§11) | Template lint |
| 9 | No `TODO`, `FIXME`, `XXX`, `console.log` in committed code | grep |
| 10 | No new dependencies in `package.json` | dep diff |

If any criterion fails, the PR is held for human review. The PR description displays which criterion failed and how to remediate.

**Override:** A human reviewer can apply the label `auto-approved-override` to merge despite a failing criterion. This is logged to `docs/source-build/OVERRIDES.md` with timestamp, reviewer, and reason.

---

## §11 · PR & merge conventions

### Branch naming
`source/wave-S{N}/{slug}` — e.g. `source/wave-S2/index-refresh`

### Commit message format (Conventional Commits)
```
{type}({scope}): {summary}

{body}

Refs: WAVE-S{N}, {catalog-ids}
```
Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`. Scope: always `source`.

### PR title
`[Source Wave S{N}] {wave title}`

### PR description template
```markdown
## Wave
S{N} · {title}

## Linked plan
docs/source-build/WAVE-S{N}-PLAN.md (approved {date})

## Catalog entries shipped
- {ID} — {name}

## Files changed
- {file} ({+/-} lines) — {one-line reason}

## Components retired
- {component} — {reason}

## Smoke test result
S-SMOKE-AMS: ✅ pass / ❌ fail
{details if not pass}

## Visual regression
{summary table per page · pixel diff %}

## Auto-approval
☑ All §10 criteria met
☐ Held for review — failing criterion: {name}

## Rollback
{specific commit to revert if needed}
```

### Merge strategy
- Squash and merge.
- Branch deleted on merge.
- Tag every wave merge: `source-wave-S{N}-shipped-{YYYY-MM-DD}`.

---

## §12 · The build loop

After Wave N merges, the agent triggers Wave N+1. Specifically:

```
loop:
  1. Read docs/source-build/WAVE_ROADMAP.md
  2. Find next un-shipped wave N+1
  3. If none → loop ends; post completion summary to docs/source-build/COMPLETE.md
  4. Read this spec § "Per-wave detailed spec" (§14) for wave N+1
  5. PLAN: write WAVE-S{N+1}-PLAN.md (per §6)
  6. Submit plan PR; wait for approval (auto if §6 criteria met, else human)
  7. Once plan approved, branch source/wave-S{N+1}/{slug}
  8. DESIGN: produce/verify mockups (per §7)
  9. BUILD: implement (per §8)
  10. TEST: run full §9 suite locally; fix until green
  11. Push branch; open PR (per §11)
  12. CI runs; if all §10 criteria pass, auto-merge
  13. If not auto-merged, post status; wait for human reviewer
  14. On merge, update WAVE_ROADMAP.md (mark N+1 shipped)
  15. Tag release
  16. Goto 1
```

### State persistence
- `docs/source-build/WAVE_ROADMAP.md` — table of waves with status (planned · in-progress · shipped)
- `docs/source-build/JOURNAL.md` — append-only log: every plan, every PR, every merge, every override
- `docs/source-build/COMPLETE.md` — written when all waves ship; summarizes what was built

### Concurrency rule
Only one wave is in-flight at a time. The agent must not open Wave N+2's plan PR until Wave N+1 is merged. This is to keep history linear and review tractable.

---

## §13 · Escalation rules (agent must stop and ask)

The agent must not proceed without explicit human authorization if any of these apply:

1. **Architecture invariant change.** Any modification to `src/lib/architecture/control-data-plane-boundary.ts`, `data-plane-adapter-contract.ts`, or `private-data-plane-connector-stub.ts`.
2. **Shell token change.** Any modification to `src/lib/shell/shell-tokens.ts`.
3. **Query surface change.** Adding, removing, or changing the signature of any `getX` in `src/lib/source/queries.ts`.
4. **Type change.** Any breaking change to `src/lib/source/types.ts` (adding a new value to a union is OK; removing or renaming is escalation).
5. **New top-level route.** Any new file under `src/app/` outside `(maestro)/source/`.
6. **Schema change.** Any change to seed data files, evidence ledger schema, or knowledge fabric contracts.
7. **New dependency.** Any addition to `package.json` `dependencies` or `peerDependencies`.
8. **Smoke test failure.** S-SMOKE-AMS regression that the agent cannot resolve in the same wave.
9. **Visual regression > 1%.** Any page that exceeds 1% pixel diff requires human visual review.
10. **Net change > 1000 lines.** Wave is too large; must be split.
11. **Catalog entry needs new component family.** If the catalog entry implies a new shape of component (e.g., a workflow step type that doesn't exist), escalate before designing.
12. **Conflicting prior decision.** If the wave plan would conflict with a decision in `docs/architecture/` or this spec, escalate.

Escalation format: open an issue tagged `source-build-escalation` with the rule number triggered, the proposed change, and the reason. Agent does not proceed until issue is closed with explicit approval.

---

## §14 · Per-wave detailed spec

### Wave S0 · Audit & Plan

**Purpose:** Establish baseline. Produce all WAVE-S{N}-PLAN.md files in skeleton form with file-level diffs estimated. Set up `docs/source-build/` directory structure.

**Deliverables:**
- `docs/source-build/WAVE_ROADMAP.md` — table of S0–S6 with status
- `docs/source-build/JOURNAL.md` — initial entry
- `docs/source-build/WAVE-S1-PLAN.md` through `WAVE-S6-PLAN.md` — skeleton plans
- `docs/source-build/AUDIT.md` — confirmed list of 47 components, 6 routes, 5 query functions, 3 shells; identifies any drift since this spec was authored
- ESLint plugin: `@abarva/no-orphan-data` rule (enforce `provenance` prop on data-rendering components) — added to `eslint-plugin-abarva` if not present

**Build:** Docs only. No code.
**Test:** Linting passes; markdown table renders.
**Exit:** All deliverables in place; WAVE_ROADMAP.md shows S1 in-progress.

---

### Wave S1 · Shell convergence + token refresh

**Purpose:** Replace 3-layer shell stack with `AppShell`. Migrate every Source page chrome to paper aesthetic. Inner panels retained but re-rooted.

**Catalog entries addressed:** All (chrome only — no working-pane content changes)

**File-level diff (estimated):**
| File | Action | Reason |
|---|---|---|
| `src/components/source/SourceCanonShell.tsx` | delete | Replaced by AppShell |
| `src/components/source/SourceFoundationShell.tsx` | delete | Replaced by AppShell |
| `src/components/source/SourceRouteShell.tsx` | delete | Replaced by AppShell |
| `src/components/source/foundationStyles.ts` | delete | Old palette |
| `src/components/source/index.ts` | modify | Drop shell exports |
| `src/components/source/SourceWorkingPane.tsx` | new | Thin wrapper for working-pane padding/spacing |
| `src/components/source/SourceMiddleStrip.tsx` | new | Filter slot bar (stage, status, linked-to, sort, search) |
| `src/components/source/SentinelAgentColumn.tsx` | new | Pre-bound AgentColumn variant |
| `src/app/(maestro)/source/page.tsx` | modify | Wrap in AppShell |
| `src/app/(maestro)/source/events/page.tsx` | modify | Wrap in AppShell |
| `src/app/(maestro)/source/events/[eventId]/page.tsx` | modify | Wrap in AppShell |
| `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx` | modify | Wrap in AppShell |
| `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx` | modify | Wrap in AppShell |
| `src/app/(maestro)/source/value/page.tsx` | modify | Wrap in AppShell |

**Sentinel voice for S1 default state** (placeholder until S3 customizes per page):
> *"Source workspace ready. Six surfaces · 47 components · paper aesthetic active. Sentinel listening."*

**Test:** S-SMOKE-AMS passes (every page in the AMS storyline renders in new shell). Visual regression baseline captured.
**Exit:** All 6 routes render in AppShell with paper aesthetic. Old shells deleted. CI green. Auto-approved per §10.

---

### Wave S2 · Index pages refresh

**Purpose:** Refresh dashboard, events portfolio, value ledger pages with paper aesthetic and Sentinel voice.

**Catalog entries:** SRC-IDX-DEFAULT, SRC-IDX-EVENTS, SRC-IDX-VALUE

**Mockups required (paper aesthetic):**
- `src-idx-default.html` — dashboard with KPI cards, attention strip, active events list, value snapshot
- `src-idx-events.html` — events portfolio with filter chips active, table view, stage-bucket counts
- `src-idx-value.html` — value ledger snapshot with source-attributed value

**Components touched:**
- `AbarVaSourceDashboard` — refresh layout, replace inline-styled cards with shell-token-styled
- `SourceEventsPortfolio` — refresh card grid, filter integration
- `SourceValueLedger` — refresh table layout
- `SourcingEventCard`, `SourcingEventTable` — re-style with shell tokens
- `EventLifecycleStatusBadge`, `LinkedProgramBadge` — verify paper-aesthetic rendering

**Sentinel voice spec** (per page):
- IDX-DEFAULT: state of the portfolio in one sentence + the most-blocked event
- IDX-EVENTS: filter context summary ("12 events · 3 active · 1 blocked on AMS BAFO")
- IDX-VALUE: source-attributed value summary

**Test:** S-SMOKE-AMS passes. Visual regression < 1%.
**Exit:** All 3 index pages render correctly in paper aesthetic with Sentinel voice. Auto-approved per §10.

---

### Wave S3 · Event canvas refresh (DTL-CANVAS)

**Purpose:** The detail canvas is the densest Source surface. Refresh layout, integrate the 10-stage tracker, wire BAFO/RFP/scorecard panels into the working pane.

**Catalog entry:** SRC-DTL-CANVAS

**Mockup required:** `src-dtl-canvas.html` — full canvas with stage tracker top, working sub-tabs, Sentinel voice variant per stage

**Components touched:**
- `SourceActiveStageWorkspace` — primary workspace per active stage
- `SourceJourneyTracker` — visual 10-stage progression
- `SourceStagePanel`, `SourceStageGatePanel` — stage detail + gate readiness
- `AmsBafoPanel`, `AmsVendorStorylinePanel`, `AmsIntelligenceSignalsPanel` — AMS-specific
- `SourceBafoNegotiationPanel`, `SourceBafoNegotiationModelPanel` — BAFO mechanics
- `SourceRfpReadinessPanel`, `SourcePricingComparisonPanel`, `VendorPricingComparison` — RFP & pricing
- `SourceVendorResponseCompletenessPanel`, `SourceVendorSelectionReadinessPanel` — vendor evaluation
- `EvaluationCriteriaEditor` — scorecard criteria editing

**Stage-conditional rendering:** The canvas shows different panel sets based on `event.currentStageKey`. Build the dispatcher in `SourceEventCanvas` (new component) that maps stage key → panel set.

**Sentinel voice spec** (per stage — 10 variants required):
For the AMS event at `orals_bafo`:
> *"Stage 7: Orals & BAFO active. Three vendors invited; Vendor B pending staffing data. Pricing comparison locked at 14% variance to benchmark; scorecard approved by Procurement Tuesday."*

For each of the other 9 stages, a similar voice template, fed by the seeded data for whichever events occupy those stages.

**Test:** S-SMOKE-AMS passes (this is the most stringent wave for the smoke). Visual regression < 1%.
**Exit:** Detail canvas renders for AMS at stage 7 + all 9 other stages render correctly for at least one seeded event each. Auto-approved per §10.

---

### Wave S4 · Sub-routes refresh

**Purpose:** Scorecard editor and artifact detail pages.

**Catalog entries:** SRC-DTL-SCORECARD, SRC-DTL-ARTIFACT

**Mockups required:**
- `src-dtl-scorecard.html` — scorecard governance with criteria editor, lifecycle states, vendor scoring matrix
- `src-dtl-artifact.html` — artifact detail with tier indicator (rich/outline/stub), content, provenance, evidence chain

**Components touched:**
- `ScorecardGovernancePanel`
- `EvaluationCriteriaEditor`
- `SourceArtifactDrawer` (used both as drawer and as full page on this route)
- `SourceArtifactStatusStrip`

**Sentinel voice for scorecard:**
> *"Scorecard at `{lifecycleState}`. {N} criteria approved · {M} pending review. Locked when all criteria reach `approved`."*

**Sentinel voice for artifact:**
> *"Artifact tier: `{tier}`. Status: `{status}`. Provenance: `{createdFrom}`. Evidence chain: {N} entries."*

**Test:** S-SMOKE-AMS extended to traverse to scorecard and at least one artifact. Visual regression < 1%.
**Exit:** Both sub-routes render correctly. Auto-approved per §10.

---

### Wave S5 · Commercial-intel convergence

**Purpose:** The 12 `SourceCommercial*` components were authored in Wave-14 and overlap heavily with each other and with `SourceExecutiveDecisionSummaryPanel`. This wave consolidates them.

**Convergence target (per pending action item from prior session):** "Converge Wave-14 commercial intelligence outputs into existing executive decision and mission contracts."

**Files to delete (after confirming no external imports):**
- `SourceCommercialActionQueue` → merged into existing `SourceExecutiveDecisionSummaryPanel`
- `SourceCommercialEventSection` → folded into `SourceEventCanvas`
- `SourceCommercialExecutiveBrief` → merged into `SourceExecutiveDecisionSummaryPanel`
- `SourceCommercialHub` → deleted (was a host component; functions absorbed by canvas)
- `SourceCommercialMissionsPanel` → merged into a single `SourceMissionPanel` aligned with `agent-mission-types.ts`
- `SourceCommercialReadinessView` → merged into `SourceDataReadinessPanel`
- `SourceCommercialRiskPanel` → kept; renamed `SourceRiskPanel`
- `SourceCommercialSignalsPreview` → merged with `AmsIntelligenceSignalsPanel` → renamed `SourceSignalsPanel` (generic, not AMS-specific)
- `SourceCommercialSummaryPanel`, `SourceCommercialSummarySurface` → both deleted (redundant with executive decision summary)
- `SourceCommercialWorkflowCanvas` → deleted (redundant with `SourceEventCanvas` from S3)

**Net result:** 12 `Commercial*` components → 4 retained-and-renamed components, ~8 deleted. Substantial cleanup.

**Risk:** This wave has the highest deletion count. Mandatory: full grep audit to confirm no external imports. Agent must include grep output in plan.

**Test:** S-SMOKE-AMS passes (this confirms no functionality lost). Visual regression < 1%.
**Exit:** All 12 `Commercial*` files either renamed or deleted; `index.ts` updated; CI green. Possibly held for human review per §10 if net change > 1000 lines.

---

### Wave S6 · Cross-surface storyline + states

**Purpose:** Linked-program storyline polish, empty/error states, evidence drawer, contradiction surfacing, intake flow.

**Catalog entries:** SRC-STA-LINKED-PROG, SRC-EMP-NO-EVENTS, SRC-ERR-EVENT-NOT-FOUND, SRC-MOD-EVIDENCE, SRC-MOD-CONTRADICTION, SRC-FLW-INTAKE

**Components touched:**
- `LinkedProgramBadge` — refresh hover preview, ensure bidirectional with Programs
- New: `SourceEmptyState` for SRC-EMP-NO-EVENTS
- Update: `notFound()` page for SRC-ERR-EVENT-NOT-FOUND with paper aesthetic + Sentinel voice
- Update: `SourceArtifactDrawer` for SRC-MOD-EVIDENCE (this is the place where provenance becomes visible per §3)
- New: `SourceContradictionCard` for SRC-MOD-CONTRADICTION
- New: `SourceIntakeForm` for SRC-FLW-INTAKE — multi-step intake wizard

**Mockups required (6):**
- `src-sta-linked-prog.html`
- `src-emp-no-events.html`
- `src-err-event-not-found.html`
- `src-mod-evidence.html`
- `src-mod-contradiction.html`
- `src-flw-intake.html`

**This wave is large.** It may be split into S6a (states + storyline) and S6b (intake flow).

**Test:** S-SMOKE-AMS passes; new tests cover empty state, error state, contradiction surfacing, intake flow happy path. Visual regression < 1%.
**Exit:** All 12 catalog entries shipped. Source module complete. `docs/source-build/COMPLETE.md` written.

---

## §15 · Glossary

| Term | Meaning |
|---|---|
| AppShell | The single shell component all surfaces wrap in (rail, top bar, middle strip, agent column, working pane) |
| BAFO | Best And Final Offer — stage 7 in the procurement lifecycle |
| Catalog entry | A page-level spec in the 78-entry catalog |
| Iceberg principle | Knowledge layer invisible by default; visible only on Evidence Drawer + Missing-Input chip |
| Knowledge fabric | The 5-store data layer (relational, vector, graph, object, evidence ledger) |
| Mission | A typed unit of agent work (per `agent-mission-types.ts`) |
| Provenance | The `createdFrom` marker + store + ledger entry that grounds a piece of rendered data |
| Scorecard | Vendor evaluation rubric with 7-state lifecycle |
| Sentinel | The Source surface lead agent — validator |
| Smoke test (S-SMOKE-AMS) | The non-negotiable AMS storyline test |
| Storyline | A cross-surface link rendered as a chip with hover preview |
| Wave | A single PR-sized increment of build work |
| Working pane | The right-side content area inside AppShell, where surface-specific content renders |

---

## §16 · Document control

- **Authoritative location:** `docs/source-build/SOURCE_BUILD_SPEC.md`
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder (Anand)
- **Update protocol:** Any change to this document requires founder approval. Agents may not edit. If a wave reveals a needed change to the spec, agent escalates per §13 with proposed redline.

**End of spec.**
