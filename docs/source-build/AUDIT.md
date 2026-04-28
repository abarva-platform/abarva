# Source Module Audit
**Wave S0 · April 27 2026 · Verified from live repo**

---

## Components (src/components/source/)

**Total files: 50** (spec said 47 — drift of +3, see note)

### Shells to retire (4 files)
- `SourceCanonShell.tsx` — thin wrapper providing `activeRoute` + summary strip
- `SourceFoundationShell.tsx` — chrome (sidebar, tenant mark, route labels) — old dark/teal palette
- `SourceRouteShell.tsx` — adds Nexus engagement panel on detail pages
- `foundationStyles.ts` — old palette constants; all replaced by `SHELL` tokens

### Index / portfolio components (4)
- `AbarVaSourceDashboard.tsx`
- `SourceEventsPortfolio.tsx`
- `SourcingEventCard.tsx`
- `SourcingEventTable.tsx`

### Detail / canvas components (10)
- `SourceActiveStageWorkspace.tsx`
- `SourceScopeStageWorkspace.tsx`
- `SourceJourneyTracker.tsx`
- `SourceStagePanel.tsx`
- `SourceStageGatePanel.tsx`
- `SourceArtifactStatusStrip.tsx`
- `SourceIndexPage.tsx` ← page-level component (unusual — S1 moves logic to page.tsx)
- `SourceEventDetailPage.tsx` ← page-level component (unusual — S1 moves logic to page.tsx)
- `SourceOriginatePage.tsx` ← page-level component
- `SourceAlertPanel.tsx`

### Stage-specific panels (11)
- `AmsBafoPanel.tsx`
- `AmsIntelligenceSignalsPanel.tsx`
- `AmsVendorStorylinePanel.tsx`
- `SourceBafoNegotiationPanel.tsx`
- `SourceBafoNegotiationModelPanel.tsx`
- `SourceRfpReadinessPanel.tsx`
- `SourcePricingComparisonPanel.tsx`
- `VendorPricingComparison.tsx`
- `SourceVendorResponseCompletenessPanel.tsx`
- `SourceVendorSelectionReadinessPanel.tsx`
- `EvaluationCriteriaEditor.tsx`

### Commercial intelligence subsystem (12 — Wave-14, S5 converges)
- `SourceCommercialActionQueue.tsx`
- `SourceCommercialEventSection.tsx`
- `SourceCommercialExecutiveBrief.tsx`
- `SourceCommercialHub.tsx`
- `SourceCommercialMissionsPanel.tsx`
- `SourceCommercialReadinessView.tsx`
- `SourceCommercialRiskPanel.tsx`
- `SourceCommercialSignalsPreview.tsx`
- `SourceCommercialSummaryPanel.tsx`
- `SourceCommercialSummarySurface.tsx`
- `SourceCommercialWorkflowCanvas.tsx`
- `SourceDataReadinessPanel.tsx`

### Governance / scorecard (2)
- `ScorecardGovernancePanel.tsx`
- `SourceExecutiveDecisionSummaryPanel.tsx`

### Cross-surface / linkage (3)
- `LinkedProgramBadge.tsx`
- `EventLifecycleStatusBadge.tsx`
- `SourceArtifactDrawer.tsx`

### Agent integration (2)
- `NexusEngagementCanvas.tsx`
- `PersistentNexusPanel.tsx`

### Value (1)
- `SourceValueLedger.tsx`

### Infrastructure (2)
- `index.ts` — barrel export
- `foundationStyles.ts` — retiring in S1

**Drift note:** Spec said 47 components; repo has 48 TSX files + foundationStyles.ts + index.ts = 50 files. Extra TSX files vs spec: `SourceIndexPage.tsx`, `SourceEventDetailPage.tsx`, `SourceOriginatePage.tsx` (page-level components that should be inline in their page.tsx files). Net component count excluding page-level wrappers and infra = 45. Spec count of 47 is close; minor discrepancy from naming conventions.

---

## Routes (src/app/(maestro)/source/)

**Spec listed 6 routes. Repo has 8 route files:**

| Route | File | In spec? |
|---|---|---|
| `/source` | `page.tsx` | ✅ |
| `/source/events` | `events/page.tsx` | ✅ |
| `/source/events/[eventId]` | `events/[eventId]/page.tsx` | ✅ |
| `/source/events/[eventId]/scorecard` | `events/[eventId]/scorecard/page.tsx` | ✅ |
| `/source/events/[eventId]/artifacts/[artifactId]` | `events/[eventId]/artifacts/[artifactId]/page.tsx` | ✅ |
| `/source/value` | `value/page.tsx` | ✅ |
| `/source/new` | `new/page.tsx` | ⚠️ Not in spec |
| `/source/[eventId]` | `[eventId]/page.tsx` | ⚠️ Not in spec — appears to be an old duplicate |

**Drift:** 2 extra routes. `/source/new` may be the originate flow (SRC-FLW-ORIGINATE, a Wave-S6 item). `/source/[eventId]` appears to be an old route that pre-dates the `/events/[eventId]` structure. Both should be audited in S1 and the stale `[eventId]` route removed if it is indeed unreachable.

---

## Query surface (src/lib/source/queries.ts)

**5 entry points — confirmed:**
- `getSourceDashboardData(): AbarvaSourceDashboardData`
- `listSourcingEvents(): SourcingEventSummary[]`
- `getSourcingEvent(eventId): SourcingEventDetail | null`
- `getSourcingEventArtifact(eventId, artifactId): SourceArtifactDetail | null`
- `getSourceValueLedger(): SourceValueLedgerSnapshot`

No query surface changes are planned for S1–S4. Locked per §13.3.

---

## Shell infrastructure (src/components/shell/)

**AppShell:** exists — `surface`, `topBarProps`, `middleStrip`, `children` props. No `agentColumn` slot; agent column is composed as a child inside the body flex row. **S1 approach:** pages compose `<AgentColumn /> + <div working-pane>` as `children`.

**StageTrackerStrip:** exists — accepts `stages[]`, `activeStage`, `onStageSelect`. Ready for Source middle strip.

**LinkedProgramChip:** exists in `src/components/shell/LinkedProgramChip.tsx`. **Design catalog says this is "pending" — that is stale.** It is already built. S6 uses the existing component.

**AgentColumn:** exists with full streaming support — `agent`, `quote`, `agentContext`, `actions`, `surface`, `programId` props.

---

## Shell tokens (src/lib/shell/shell-tokens.ts)

Confirmed byte-identical to spec: `PAPER: '#faf7f1'`, `INK: '#0c1a3a'`, `SERIF: '"Fraunces"'`, `SANS: '"Inter"'`, `MONO: '"JetBrains Mono"'`. **DO NOT MODIFY — §13.2 escalation trigger.**

---

## Design catalog alignment

**Lead agent discrepancy flagged (not a blocker):**
- `pages.yaml` (April 27) lists `lead_agent: nexus` for `SRC-IDX-EVENTS` and `SRC-DTL-EVENT`
- `abarva-source-build-spec.md` (April 28, more specific) specifies `leadAgent="sentinel"` for all Source pages
- **Resolution:** Build spec is authoritative for this module. Sentinel is the Source lead agent. The YAML will be updated when S0 lands in docs.

**LinkedProgramChip catalog status:** Catalog says `pending`; component is built. Will mark `in-shell` in the catalog update committed with this wave.

---

## Validation infrastructure

Confirmed present:
- `src/lib/source/agent-validation-runner.ts`
- `src/lib/source/workflow-validation-runner.ts`
- `src/lib/source/__tests__/` directory

---

## Total line count

`src/components/source/*.tsx`: 12,553 lines across 48 files.

---

## Summary table

| Dimension | Spec | Actual | Drift |
|---|---|---|---|
| Component files | 47 | 48 TSX + 2 infra = 50 | +3 (page-level wrappers) |
| Routes | 6 | 8 | +2 (new, old [eventId]) |
| Query functions | 5 | 5 | ✅ |
| Shell files to retire | 4 | 4 | ✅ |
| Validation runners | 2 | 2 | ✅ |
| Shell tokens | locked | locked | ✅ |
