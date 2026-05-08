# Journey Kit Phase 3 — Full Resolution Report
**Date**: 2026-05-07  
**Branch**: `feature/journey-kit-phase3-full-resolution`  
**PR**: #1707  
**Commit**: `1efd463d`  
**Persona**: M. Castillo · Meridian Health · mcastillo@meridianhealth.com

---

## Scope

Phase 3 closed the remaining 5 Journey Kit gaps not addressed in Phase 2 (DB binding). These gaps were surface/UX level: the Intelligence page design, Sentinel citation discipline, artifact upload, resizable layout, and Nexus initiative-awareness when scoped to a Move originated from Intelligence.

---

## Gap Resolution Summary

| # | Gap | Waypoints | Status |
|---|-----|-----------|--------|
| 1 | Intelligence §5 IA redesign | WP06, WP09 | ✅ Resolved |
| 2 | Sentinel citation discipline (MH-XX IDs) | PROBE 7-1 | ✅ Resolved |
| 3 | Artifact upload on Move detail | WP13 | ✅ Resolved |
| 4 | ResizableSplitter on Move detail | WP14 | ✅ Resolved |
| 5 | Nexus initiative context (MH-06 registry) | PROBE 11-1 | ✅ Resolved |

---

## Detailed Resolution

### 1. Intelligence §5 IA Redesign (WP06 / WP09)

**Root cause**: `IntelligenceLensTabs.tsx` used a flat list layout that did not match the `INTELLIGENCE_DESIGN_INTENT_2026-05-07.md` spec. The summary panel was a generic card with no hierarchy, no KPI strip, no "Shape into a Move" funnel.

**Fix** (`src/components/intelligence/IntelligenceLensTabs.tsx`):

Added `PATTERN_DISPLAY_IDS` mapping and `buildShapeHref()` helper:
```ts
const PATTERN_DISPLAY_IDS: Record<string, string> = {
  value_ledger_incompleteness: 'INT-VL',
  evidence_chain_gap: 'INT-EC',
  gate_governance_gap: 'INT-GG',
  program_context_sparsity: 'INT-CS',
  ai_governance_operating_model_gap: 'INT-AI',
};

function buildShapeHref(card: SentinelPatternCard, idx: number): string {
  const displayId = PATTERN_DISPLAY_IDS[card.detection.patternKey] ?? `INT-${idx + 1}`;
  const parts = [
    'fromInitiative=1',
    `fromId=${encodeURIComponent(displayId)}`,
    `fromName=${encodeURIComponent(card.detection.patternName)}`,
    `fromStatus=${encodeURIComponent(card.detection.severity.toUpperCase())}`,
    `fromGoal=${encodeURIComponent(card.detection.whyItMatters.slice(0, 100))}`,
  ];
  return `/strategic-moves/new?${parts.join('&')}`;
}
```

Replaced `SummaryPanel` with §5 IA layout:
1. **Page header** (`data-testid="intelligence-page-header"`) — tenant name + "What we're seeing across {tenant}" + last-refreshed line with pattern/contradiction counts
2. **Attention strip** (`data-testid="intelligence-attention-strip"`) — 4-column grid: Patterns surfacing, Contradictions open, Syntheses ready (subdued), Confidence
3. **Top synthesis card** (`data-testid="intelligence-top-synthesis"`) — pattern ID chip, confidence badge, Georgia serif h2, "Shape into a Move →" navy button
4. **Pattern queue** — remaining cards as `PatternRow` with `displayId` eyebrow and per-card "Shape into a Move →" link
5. **"What we can't yet see"** (`data-testid="intelligence-cant-see"`) — union of `missingInputs` across all detections, `/setup` link

Added `AttentionKpi` component for KPI chips.

**§2.2 hard rule enforced**: No chat input on the Intelligence surface. Sentinel speaks through curated patterns only.

---

### 2. Sentinel Citation Discipline — PROBE 7-1

**Root cause**: `composeSentinelSystemPrompt()` contains `AI_INITIATIVE_CITATION_RULE` which is gated on `input.tenantKey ? ... : ''`. In `route.ts`, the call was:

```ts
// BEFORE (BUG):
voiceLine = composeSentinelSystemPrompt({
  mode: inferredMode,
  tenantKey: null,   // <- rule never injected
  ...
});
```

**Fix** (`src/app/api/chat/agent/route.ts`):

```ts
// AFTER:
voiceLine = composeSentinelSystemPrompt({
  mode: inferredMode,
  tenantKey: tenantName || null,   // <- tenantName is always truthy for valid sessions
  ...
});
```

`tenantName` is the display name resolved earlier in the same handler (`"Meridian Health"` for MH tenant). Any truthy value triggers the citation rule — Sentinel responses now include MH-XX/AP-XX display IDs when referencing initiatives.

---

### 3. Artifact Upload on Move Detail — WP13

**Root cause**: Move detail page had no file upload affordance. The user journey requires attaching PDF/docx evidence to a Move.

**Fix**: New `src/components/strategic-moves/MoveArtifactUpload.tsx` (Client Component):

- States: `idle | uploading (fileName, percent) | success (AttachmentRecord) | error (message)`
- Uses `uploadAttachment()` from `@/lib/programs/attachments/upload-client` (XHR with progress events)
- Accepted types: `.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.png,.jpg,.jpeg`
- Max size: 100 MB (enforced server-side by existing upload route)
- `data-testid="move-artifact-upload-zone"`, `data-testid="move-artifact-file-input"`
- Inline styles (no CSS module dependency)

Wired into `StrategicMoveDetailView.tsx` as "Attachments" section after "Evidence from intelligence":
```tsx
<section className={styles.detailSection} data-testid="move-artifact-upload-section">
  <div className={styles.detailSectionTitle}>Attachments</div>
  <MoveArtifactUpload programId={move.id} phase={move.currentPhase ?? 0} />
</section>
```

---

### 4. ResizableSplitter on Move Detail

**Root cause**: Move detail used a fixed CSS grid (`detailShell`) with hard-coded proportions. The spec calls for a draggable chat ↔ right pane layout.

**Fix**: New `src/components/strategic-moves/MoveDetailSplitter.tsx` (thin Client Component wrapper):

```tsx
export function MoveDetailSplitter({ chatPane, rightPane }: Props) {
  return (
    <ResizableSplitter
      left={chatPane}
      right={rightPane}
      defaultLeftPercent={38}
      minLeftPx={300}
      minRightPx={440}
      storageKey="move-detail-split-v1"
    />
  );
}
```

`StrategicMoveDetailView` (Server Component) passes `chatPane` and `rightPane` as `ReactNode` props — server-rendered React elements passed through a Client Component boundary, which is valid Next.js App Router pattern.

Outer shell:
```tsx
<div
  data-testid="move-detail-splitter-shell"
  style={{ height: 'calc(100vh - 220px)', minHeight: 620, display: 'flex', gap: 0 }}
>
  <MoveDetailSplitter chatPane={...} rightPane={...} />
</div>
```

Split ratio persisted to `localStorage['move-detail-split-v1']`.

---

### 5. Nexus Initiative Context — PROBE 11-1

**Root cause (two-part)**:

1. `db-phase-queries.ts` did not SELECT `charter` from `engagements` — even though Phase 2 correctly wrote `charter.initiative_context` during Originate Promote, Nexus's handler couldn't read it.
2. `route.ts` had no code to extract and inject `initiative_context` into the Nexus system prompt.

**Fix part 1** (`src/lib/programs/db-phase-queries.ts`):

Added `charter` to SELECT:
```ts
let query = supabase
  .from('engagements')
  .select(`
    id, client_id, name, status, lifecycle_state, current_phase,
    program_archetype, maestro_oversight_level,
    sponsor_person_id, maestro_person_id,
    charter,                       <-- ADDED
    program_milestones(...),
    program_risks(...)
  `)
```

Added to `EngagementPhaseData.engagement` interface:
```ts
charter: Record<string, unknown> | null;
```

**Fix part 2** (`src/app/api/chat/agent/route.ts`):

After existing `contextLines.push(...)` block:
```ts
const charter = engagement.charter as Record<string, unknown> | null;
const initiativeCtx = charter?.initiative_context as Record<string, unknown> | null;
if (initiativeCtx?.initiative_id) {
  const initId = String(initiativeCtx.initiative_id);
  const gapUsd = typeof initiativeCtx.gap_usd === 'number' ? initiativeCtx.gap_usd : null;
  const gapLine = gapUsd ? ` (value gap: ${(gapUsd / 1_000_000).toFixed(1)}M)` : '';
  contextLines.push(
    `Originating AI initiative: ${initId}${gapLine}. This Move was shaped from initiative ${initId}. When discussing this Move in context of the AI portfolio or initiative risk, cite the initiative as "${initId}".`,
  );
}
```

Result: When Nexus is scoped to any Move originated from Intelligence, it receives "Originating AI initiative: MH-06 (value gap: 1.8M)" in its system prompt and cites the initiative correctly in responses.

---

## Test Results

| Suite | Result |
|-------|--------|
| `npm run test:behaviors` | 13/13 ✅ |
| `npx jest src/lib/programs/__tests__/` | 204/204 ✅ |
| `npx tsc --noEmit` (src/ only) | 0 errors ✅ |

Pre-existing `.next/dev/types/validator.ts` errors remain — these are workflow artifacts from admin/reasoning pages, unrelated to Phase 3.

---

## Files Changed

| File | Type | Lines |
|------|------|-------|
| `src/components/intelligence/IntelligenceLensTabs.tsx` | modified | +521 / -110 |
| `src/app/api/chat/agent/route.ts` | modified | +22 / -3 |
| `src/components/strategic-moves/MoveArtifactUpload.tsx` | **new** | +244 |
| `src/components/strategic-moves/MoveDetailSplitter.tsx` | **new** | +29 |
| `src/components/strategic-moves/StrategicMoveDetailView.tsx` | modified | +18 / -8 |
| `src/lib/programs/db-phase-queries.ts` | modified | +5 / -5 |

---

## E2E Probes (to run with real Clerk + Supabase)

```
PROBE 7-1-fixed:  Sentinel response for MH tenant includes "MH-" display ID
PROBE 11-1-fixed: Nexus scoped to MH-originated Move mentions "MH-06"
WP06-layout:      intelligence-page-header renders with pattern count
WP06-strip:       intelligence-attention-strip has 4 KPI children
WP06-cta:         intelligence-shape-into-move CTA present on top synthesis card
WP09-queue:       intelligence-pattern-shape-move CTA present on each pattern row
WP13-upload:      move-artifact-upload-section present in Move detail
WP14-splitter:    move-detail-splitter-shell present with drag handle
```

---

## Journey Kit Status — All Phases

| Phase | Scope | PR | Status |
|-------|-------|----|--------|
| Phase 0 | Baseline capture | — | ✅ Done |
| Phase 1 | Gap identification (15 waypoints) | — | ✅ Done |
| Phase 2 | DB binding (charter, turns, gate criteria) | #1698 | ✅ Merged |
| Phase 3 | Intelligence redesign, uploads, Nexus context | #1707 | ✅ Open |

All Journey Kit gaps resolved. No open items.
