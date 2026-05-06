# Source Audit · M2 · Code-path

| Field | Value |
|---|---|
| Mode | M2 · Code-path |
| Status | Complete (initial pass) |
| Audit date | 2026-05-06 |
| Findings count | 6 compliance · 5 drift · 4 design observations |

---

## Scope

- All routes under `src/app/(maestro)/source/**` and `src/app/api/source/**`, `src/app/api/v1/source/**`
- Library `src/lib/source/**` (60+ files)
- Components `src/components/source/**` (47 files per build spec)
- Agent tools `src/lib/agent/tools/source/**`

---

## 1 · Compliance findings (POSITIVES)

### F-M2-001 · All 6 dossier-canonical routes implemented
- **Source aligned:** Dossier §2.3 + Design template
- **Evidence:**
  - `/source` → [src/app/(maestro)/source/page.tsx](src/app/(maestro)/source/page.tsx)
  - `/source/events` → [src/app/(maestro)/source/events/page.tsx](src/app/(maestro)/source/events/page.tsx)
  - `/source/events/[eventId]` → [src/app/(maestro)/source/events/[eventId]/page.tsx](src/app/(maestro)/source/events/[eventId]/page.tsx)
  - `/source/events/[eventId]/scorecard` → present
  - `/source/events/[eventId]/artifacts/[artifactId]` → present
  - `/source/value` → [src/app/(maestro)/source/value/page.tsx](src/app/(maestro)/source/value/page.tsx)
- **Status:** Strong positive. Six of six.

### F-M2-002 · Forbidden claims discipline holds across the codebase
- **Source aligned:** Dossier §3 (15 prohibitions)
- **Evidence:** Comprehensive grep of source paths. All 15 prohibitions effectively passed:
  - "Live telemetry": no occurrences
  - "Production ready": only in pattern instances as counter-evidence (industry citations), not as Source claims
  - "Market benchmark": references include disclaimers ("No live market benchmarks") at [src/lib/source/source-pricing-comparison-view.ts:88](src/lib/source/source-pricing-comparison-view.ts:88) and [src/components/source/SourceCommercialSummarySurface.tsx:56](src/components/source/SourceCommercialSummarySurface.tsx:56)
  - "Usable evidence" applied to "Loaded": properly distinguished — see F-M2-003
  - "Final selection" / "select vendor" / "auto-award": no occurrences
  - Realized savings without evidence: caveat at [src/components/source/SourceValueLedger.tsx:383](src/components/source/SourceValueLedger.tsx:383) — "not a live realized-savings claim unless downstream evidence and measurement gates are explicitly marked as usable"
- **Status:** Strong positive. Code is more disciplined than the dossier's §6 implementation status credits.

### F-M2-003 · "Usable Evidence" semantically separated from upstream states
- **Source aligned:** Dossier truth #1 (loaded ≠ usable evidence)
- **Evidence:** 
  - [src/components/source/SourceDataReadinessPanel.tsx:94](src/components/source/SourceDataReadinessPanel.tsx:94): "records stay separate from Usable Evidence"
  - [src/components/source/SourceScopeStageWorkspace.tsx:129](src/components/source/SourceScopeStageWorkspace.tsx:129): "Loaded and Available remain distinct from Usable Evidence"
  - [src/lib/source/types.ts](src/lib/source/types.ts): `SourceEvidenceUsability` type
- **Status:** Compliance with the most-violated dossier truth. Explicit code-level enforcement.

### F-M2-004 · Award decision is recommendation, not automation
- **Source aligned:** Dossier truth #5 (executive decision is posture, not selection)
- **Evidence:** [src/lib/source/award-decision-view.ts](src/lib/source/award-decision-view.ts) returns deterministic ranked scoring with `'recommended' | 'conditional' | 'not_recommended'` status. No auto-award. No "select vendor" button found in any Source UI component.
- **Status:** Strong positive.

### F-M2-005 · Real approval API exists
- **Source aligned:** Dossier §6 (which lists "Approval/workflow engine: Not started")
- **Evidence:** [src/app/api/v1/source/events/[eventId]/approve/route.ts](src/app/api/v1/source/events/[eventId]/approve/route.ts) is a real POST endpoint. [src/components/source/AdminSourceEventApprovalQueue.tsx:28](src/components/source/AdminSourceEventApprovalQueue.tsx:28) calls it. Backed by `source_event_approvals` table from migration `20260430151000_source_event_approvals.sql`.
- **Status:** Compliance — but **contradicts dossier**. Dossier §6 implementation status is stale; approval has been built.

### F-M2-006 · 11-stage canonical lifecycle codified
- **Source aligned:** Dossier §2.2 + Design template B step rail
- **Evidence:** `SOURCE_STAGE_ORDER` in [src/lib/source/constants.ts:21-33](src/lib/source/constants.ts:21) lists the modern 11 stages. `SOURCE_STAGE_LABELS` provides UI labels.
- **Status:** Compliance. Modern set is canonical in code; legacy set still permitted in substrate constraint for backward compatibility.

---

## 2 · Drift findings

### F-M2-101 · Code's agent model is "all four, every stage" — not single-lead
- **Sources violated:** Dossier §2.1 (Nexus on 7, Steward on 2, Atlas on 2). Design B (single lead per stage with category co-leads). Build spec (Sentinel-led).
- **Evidence:** [src/lib/source/multi-agent-briefing.ts:25-30](src/lib/source/multi-agent-briefing.ts:25) — `buildSourceMultiAgentBriefing` ALWAYS builds Nexus + Sentinel + Atlas + Steward briefings simultaneously, regardless of stage. [src/lib/source/multi-agent-types.ts:82-96](src/lib/source/multi-agent-types.ts:82) — `SourceMultiAgentBriefing` has all four agents as equal fields.
- **Bucket:** Drift (architectural)
- **Severity:** P0 (load-bearing for the redesign)
- **Treatment:** This is the single most consequential finding of the audit. The code architecture is committed to parallel-all. Aligning to a single-lead model requires substantial refactor. Aligning the dossier and design to parallel-all requires rethinking the agent model. Either way, this is an architectural decision, not a fix.

### F-M2-102 · Build spec asserts "Sentinel-led surface" but code disagrees
- **Sources violated:** Internal consistency between code and build spec
- **Evidence:** [docs/source-material/build-specs/abarva-source-build-spec.md:17](docs/source-material/build-specs/abarva-source-build-spec.md:17) — "Source is the **Sentinel-led surface**." But [src/lib/source/constants.ts:13](src/lib/source/constants.ts:13) declares `SOURCE_LEAD_AGENT = 'Nexus'` and the Nexus API endpoint exists at `/api/v1/source/[eventId]/nexus/ask`.
- **Bucket:** Drift
- **Severity:** P1
- **Treatment:** Reconcile build spec to match code. Or re-litigate the Nexus vs Sentinel question.

### F-M2-103 · Nexus API is named "stub"
- **Sources violated:** Production-readiness hygiene (production paths shouldn't expose "stub")
- **Evidence:** [src/lib/agent/tools/source/nexus-api.ts:30,151,377](src/lib/agent/tools/source/nexus-api.ts:30) — `SOURCE_NEXUS_API_STUB_VERSION = 'source-nexus-api-stub/v1'`. Error message: "eventId is required for the Source Nexus API stub". This naming is exposed in production request/response surfaces.
- **Bucket:** Drift
- **Severity:** P2
- **Treatment:** Rename to `SOURCE_NEXUS_API_VERSION` or `SOURCE_NEXUS_API_SEEDED_VERSION`. Document the seeded/no-model-calls posture in UI disclaimers explicitly rather than via "stub" leakage.

### F-M2-104 · Substrate carries legacy stage_keys; code uses modern
- **Sources violated:** Internal substrate-vs-code consistency
- **Evidence:** Substrate CHECK constraint at [supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11-31](supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11) accepts BOTH modern (`strategy, scope, rfp, ...`) and legacy (`intake, sourcing_strategy, rfp_rfi_package, ...`) keys. Live data may have either.
- **Bucket:** Drift
- **Severity:** P1
- **Treatment:** Audit live tenant data — which stage_keys are actually in use? Plan a migration to retire legacy keys once seeded data is moved.

### F-M2-105 · Vendor detail route (`/source/events/[id]/vendors/[vendorId]`) not implemented
- **Sources violated:** Design template B T10
- **Evidence:** No route at this path. Vendor detail is rendered inline in pricing comparison and BAFO panels.
- **Bucket:** Drift
- **Severity:** P2
- **Treatment:** Decide whether vendor detail deserves its own route. T10 in design template suggests yes, but inline rendering may be sufficient.

---

## 3 · Design observations

### F-M2-201 · Component duplication in commercial-intel subsystem
- **Where:** `src/components/source/` has 12+ files prefixed `SourceCommercial*`: SourceCommercialActionQueue, SourceCommercialEventSection, SourceCommercialExecutiveBrief, SourceCommercialHub, SourceCommercialMissionsPanel, SourceCommercialReadinessView, SourceCommercialRiskPanel, SourceCommercialSignalsPreview, SourceCommercialSummaryPanel, SourceCommercialSummarySurface, SourceCommercialWorkflowCanvas, SourceDataReadinessPanel.
- **Observation:** Build spec acknowledges Wave-S5 should converge these to 4 panels. As of audit, the convergence work has not happened — too many overlapping responsibilities. This makes M3 Chrome audit harder (which panel renders where?) and is a code-health debt the redesign should address.
- **Bucket:** Design observation
- **Treatment:** Run the Wave-S5 convergence as part of the redesign.

### F-M2-202 · Three-shell stack still active
- **Where:** `SourceRouteShell` → `SourceCanonShell` → `SourceFoundationShell`
- **Observation:** Build spec target was to replace all three with `AppShell` from `src/components/shell/`. As of audit, the three shells still exist. Shell convergence is a Wave-S1 deliverable that may or may not have shipped. Worth confirming.
- **Bucket:** Design observation
- **Treatment:** Verify shell state. If three shells still active, prioritize convergence in the redesign.

### F-M2-203 · 12 code-only routes beyond dossier+design
- **Where:** `/source/compare`, `/source/new` (page-route, not modal as design proposes), `/source/events/[id]/report`, `/source/patterns`, `/source/patterns/[patternId]`, plus 7 API routes.
- **Observation:** Some are legitimate scaffolding (intake form, report). Some are surprises (patterns subsystem). The dossier and design don't acknowledge these. The redesign should decide which to keep, fold, or remove.
- **Bucket:** Design observation
- **Treatment:** Code-only routes need explicit yea/nay in the redesign.

### F-M2-204 · Patterns subsystem invisible to dossier
- **Where:** `src/app/(maestro)/source/patterns/**` + pattern packs in [src/lib/source/constants.ts:136-139](src/lib/source/constants.ts:136). Pattern types include `'data-ai-modernization-sourcing'`, `'ams-managed-services-sourcing'`.
- **Observation:** This is a substantial code feature (full route + pattern packs in stage-packs subdirectory) that doesn't appear in dossier or design. It's either a hidden feature or one the redesign should bring forward.
- **Bucket:** Design observation
- **Treatment:** Add to redesign scope decision.

---

## 4 · What this mode did NOT cover

- **Component-by-component review.** 47 components × N props each is too granular for an audit. Code-health debt is captured at the system level (F-M2-201).
- **Test coverage.** Tests exist; their assertions weren't audited.
- **API contract drift.** API request/response shapes vs UI consumption wasn't verified.
- **Performance.** Not in audit scope.
- **Live agent voice samples.** Captured in M4.

---

End of M2.
