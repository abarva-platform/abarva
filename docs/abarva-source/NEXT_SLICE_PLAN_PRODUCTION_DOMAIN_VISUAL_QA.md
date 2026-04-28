# Slice Plan: Production-Domain Visual QA

## Scope
- Wave 21 Slice 6
- Create a deterministic visual QA plan for production-domain route review.
- No runtime code changes.
- No UI implementation changes.
- No screenshot generation pipeline changes.

## Goal
Validate that key production-domain routes maintain the approved AbarVa visual and workflow direction after the brand stabilization and vendor-selection-readiness changes.

## Routes to Inspect
- `/source`
- `/source/events/evt-source-data-ai-si-selection`
- `/platform/admin/experience-gallery`
- `/platform/admin/production-readiness`

## What to Inspect
For each route, capture both static and behavioral observations:

### 1) Brand Wordmark
- Canonical `AbarVa` wordmark rendering.
- Va color treatment and spacing relative to Abar.
- Confirm no prior symbol variants are present.
- Confirm no symbolic/decorative logo mark is introduced on these key routes.

### 2) Off-White Design Baseline
- Primary canvas is off-white / warm ivory where applicable.
- Typography is dark navy / charcoal as primary text tone.
- No full-page dark dashboard styling on default route states.

### 3) Source Event Canvas Density
- Information hierarchy is readable with controlled panel density.
- Journey/stage context is visible.
- No oversized icon-heavy or generic chatbot-like blocks.

4) Stage Gates
- Ensure gate stage/status indicators are present.
- Confirm readable progression labels.
- Confirm blockers / next actions are visible when gates are not advancing.

### 5) Artifact Strip
- Presence and placement of artifact strip/summary if enabled.
- Ownership and approval/evidence metadata visible and legible.

### 6) Data Readiness
- Data-readiness signal states are visible and deterministic.
- Evidence / confidence signal states should avoid ambiguous claims.

### 7) RFP Readiness
- RFP readiness tier and blockers are visible.
- Confirm missing inputs are explicit.

### 8) Commercial Panels
- Vendor response panel.
- Pricing normalization outputs.
- BAFO / negotiation panel.
- Executive decision panel.
- Selection readiness panel.
- Verify none of these duplicate identical claim blocks in conflict patterns.

### 9) Agent-Centric Context Signals
- Context-used strip content appears with concrete event/program references.
- Guidance remains action-oriented and specific (not generic).
- Confirm low-context states surface blockers/missing inputs and do not overstate readiness.

## Screenshot Capture Requirements
- Capture at least one screenshot per route and per section group where visible.
- Include desktop (1440w) and tablet (900w) widths.
- Record environment details:
  - date/time
  - branch/hash tested
  - authenticated user role
  - route URL
  - viewport size
- Include a "baseline before / after" note when visual changes are observed.

## Pass/Fail Rules
- Pass only if the route is deterministic and matches approved visual contract for inspected items.
- Fail if any inspected item is absent, misleading, or inconsistent with current slice goals.
- Do not require perfect completion of all future roadmap items to pass.
- A route can pass with partial readiness if missing-state is explicitly visible and labeled.

## Recording Findings
- Maintain a route-by-route matrix with:
  - observation
  - compliance status (`pass`, `partial`, `fail`, `deferred`)
  - evidence pointer (file path or screenshot name)
  - owner/action needed
  - severity
- Failures are grouped as:
  - `brand`
  - `layout`
  - `agent_context`
  - `workflow_signal`
  - `readiness_misstate`

## What Not to Build
- No code changes in this slice.
- No navigation rewrites.
- No API or persistence changes.
- No demo data creation.
- No workflow engine adjustments.
- No chat UI.

## Deliverables
- Completed QA plan in this document.
- Reusable checklist used by subsequent design/sourcing audit passes.
