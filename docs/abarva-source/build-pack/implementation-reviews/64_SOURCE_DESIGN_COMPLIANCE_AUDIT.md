# 64 Source Design Compliance Audit

## Scope

This audit reviews the currently mounted Source surfaces on `main`:

- `/source`
- `/source/events`
- `/source/events/[eventId]`

and the active canvas/panel stack:

- `AbarVaSourceDashboard`
- `NexusEngagementCanvas`
- `SourceJourneyTracker`
- `SourceDataReadinessPanel`
- `SourceRfpReadinessPanel`
- `SourceVendorResponseCompletenessPanel`
- `SourcePricingComparisonPanel`
- `SourceBafoNegotiationPanel`
- `SourceExecutiveDecisionSummaryPanel`

## Design Canon References

Reviewed against:

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/04_AbarVaJourneyMap.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/10_AbarVaArtifactStrip.md`
- `docs/platform-design/experience-system/components/11_AbarVaReviewApprovalPanel.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

## Route + Data Baseline

- `/source` is active and mounted through `SourceCanonShell` with `AbarVaSourceDashboard`.
- `/source/events` is active and mounted through `SourceCanonShell` with `SourcingEventTable`.
- `/source/events/[eventId]` is active and mounted through `SourceCanonShell` with:
  - `NexusEngagementCanvas`
  - `SourceCommercialEventSection`
- `evt-source-data-ai-si-selection` exists in `SOURCE_GOLDEN_EVENT_IDS`.
- Apex Retail Source event linkage is not yet present in current `main`; the standalone commercial scenario remains generic (`ams-outsourcing-demo-2026`) and is not tenant-scoped to Apex in this baseline.

## Compliance Assessment

### 1. Dashboard

- Status: `partial`
- What aligns:
  - Warm-light base and readable typography.
  - Mission/pressure signal framing appears above fold.
- Gaps:
  - Hero command card is very dark and visually dominant.
  - Density is high; first-view hierarchy is less calm than canon target.

### 2. Event Canvas

- Status: `partial`
- What aligns:
  - Context strip + journey + stage workspace pattern follows wireframe intent.
  - Workflow cue strip is present in `SourceCanonShell`.
- Gaps:
  - `SourceCommercialEventSection` has a separate visual language and collapsible wrapper that feels detached from canonical shell.
  - Branding consistency (AbarVa lockup treatment) is not explicit within Source shell surfaces.

### 3. Journey Tracker

- Status: `mostly_compliant`
- What aligns:
  - Stage progression is visible and textual.
  - Blocker text appears directly in journey items.
- Gaps:
  - Could tighten scan order for long stage sets on narrow viewports.

### 4. Data Readiness Panel

- Status: `compliant`
- What aligns:
  - Table-forward, text-first statuses.
  - Loaded vs usable evidence distinction is explicit.
  - Workflow impact and next action are visible.
- Gaps:
  - Minor: summary ribbon can become chip-heavy on small widths.

### 5. RFP Readiness Panel

- Status: `mostly_compliant`
- What aligns:
  - Tier, missing inputs, artifacts, and section readiness are explicit.
  - Steward/Sentinel/Atlas notes are present.
- Gaps:
  - "Why this tier applies" currently duplicates guidance text and could be tighter.

### 6. Vendor Response Completeness Panel

- Status: `mostly_compliant`
- What aligns:
  - Table-forward vendor status/comparability view.
  - Deterministic caveat text is present.
- Gaps:
  - Header ribbon + detail density can read busy versus calm executive scan.

### 7. Pricing Normalization Panel

- Status: `partial`
- What aligns:
  - Comparison table integration is present.
- Gaps:
  - Uses separate ad hoc palette/constants instead of shared experience tokens.
  - Typography/style language diverges from the rest of Source canon.

### 8. BAFO Negotiation Panel

- Status: `mostly_compliant`
- What aligns:
  - Structured sections for priorities, assumptions, traps, and vendor asks.
  - Deterministic guidance framing is clear.
- Gaps:
  - Could reduce narrative length in vendor blocks for first-pass scanability.

### 9. Executive Decision Panel

- Status: `mostly_compliant`
- What aligns:
  - Decision posture, blockers, options, and tradeoff table are explicit.
  - Conservative posture and non-automation caveat are clear.
- Gaps:
  - Vendor tradeoff table can be visually dense at default width.

## Canon Gaps to Prioritize

1. Harmonize all Source commercial panels onto shared token usage (remove ad hoc palette islands).
2. Add a deterministic stage-gate read model and compact gate panel so movement criteria are explicit.
3. Add compact artifact metadata strip aligned to artifact lifecycle canon.
4. Reduce dark dominance on dashboard command read section.
5. Ensure Source commercial event block uses the same shell language as the event canvas.

## Risks / Non-Goals in This Audit

- No runtime workflow engine recommendation.
- No approval automation recommendation.
- No model-call recommendation.
- No upload/parsing recommendation.

## Decision

- Decision: **approve with polish**
- Rationale: structure is directionally strong and workflow-driven, but visual consistency and stage-gate/artifact clarity are still below the locked design canon.

## Recommended Next Slice Order

1. Apex Retail Source demo data enrichment (deterministic seed only).
2. Stage gate deterministic read model.
3. Stage gate panel + artifact status strip integration.
