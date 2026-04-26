# Next Slice Plan: Scope to RFP Readiness Link

Date: 2026-04-26

Status: implemented (planning spec complete; deterministic shell added in PR #319)

Scope: documentation and planning only. No UI, runtime, API routes, model calls, upload/parsing, evidence processing, workflow engine, approval engine, or persistence changes in this slice.

Implementation note:
- PR #319 (`feat(source): add RFP readiness panel`) now provides the first bounded Scope → RFP readiness UI surface and deterministic tier visibility in the event canvas. This plan remains the authoritative source for how those outputs should behave and what remains out-of-scope.

## 1. Purpose

Define how Scope outputs drive the next RFP-readiness state while staying faithful to the deterministic Source event model.

The plan will answer:
- what input gaps block RFP drafting work,
- which artifact shape is safe next (stub, outline, rich),
- and what approvals or waivers are required before moving from Scope to RFP preparation.

## 2. How Scope Output Determines RFP Tier

Use the existing scope workspace output as the primary decision signal:

- `pricingReadinessState`
- `requiredBaselineRows` with usability state and impact
- `missingInputCategories`
- `scopeGateState` (advance / hold / defer / waiver-required)
- active `scopeAssumptions` and `scopeAmbiguities`
- Nexus explanation rationale.

## 3. RFP Tiering Logic

### Rich

Safe when the scope can support decision-grade commercial preparation:

- required baseline categories are usable evidence or explicitly waived,
- scope and exclusions are explicit,
- assumptions are owner-approved or clearly marked for approval,
- gate state is clear and no hard blockers remain,
- evidence evidence usability is visible and confidence is not low-context.

### Outline

Allowed when Scope is mostly usable but still incomplete:

- gate is not blocked,
- major baseline categories are loading or requested with clear owners,
- evidence has usable signal but some required inputs remain missing or deferred,
- assumptions exist but are not fully approved.

### Stub

Required when Scope is not safe for RFP framing:

- any hard blocked baseline category is missing,
- scope is not explicit enough to compare pricing,
- assumptions/ambiguities materially alter the commercial comparison,
- evidence includes many low-context rows or only partial readiness.

### Tie-breaker

Any "stub-safe" output must remain at or below outline for downstream planning and must not pretend to be an RFP package.

## 4. Required Data Dependencies

The scope-to-RFP link consumes:

- event metadata (id, name, owner, archetype, rigor),
- scope definition fields (in-scope, out-of-scope, assumptions, ambiguities),
- baseline requirements and readiness status per baseline category,
- baseline usability state (`usable`, `missing`, `low_context`, `stale`, `access_restricted`, `waived`),
- gate and blocker payload (`ready_to_advance`, `defer`, `blocked`, `waiver_required`),
- evidence category impact tags and missing input impact tags,
- artifact placeholder states.

Required external dependencies are read-only:
- deterministic Source mock-seed when real data is not available,
- Admin/Setup readiness contract when available and integrated.

## 5. Required Artifact Placeholders

Keep placeholder-only states until generation is intentionally added in a future slice:
- Scope Document
- Minimum Data Request
- RFP Outline
- Retained / Vendor Responsibility Matrix
- Assumption Register
- Steering Decisions Log

Each placeholder keeps status only: `not_started`, `draft`, `needs_inputs`, `blocked`, `needs_review`, `ready`, or `waived`.

## 6. Approval and Gate Dependencies

Before any RFP-focused behavior can move to outline/rich:

- Scope gate must pass or include an explicit waiver path,
- owner and sponsor alignment must be present on out-of-scope risk decisions,
- finance/procurement/security/legal constraints that affect scope boundaries must be explicit,
- evidence owner gaps that affect pricing comparability must remain visible.

Waived fields in scope remain visible in scope-to-RFP outputs with impact labels and required follow-up actions.

## 7. Nexus / Sentinel / Steward Roles

### Nexus

- expose current tier and rationale in one concise block,
- call out what is safe to do next (e.g., baseline fill, ambiguity resolve, waiver request),
- maintain separation between planning and release behavior.

### Sentinel

- flag low-context, stale, restricted, and uncited readiness evidence,
- downgrade tier recommendation when these conditions weaken pricing comparability.

### Steward

- enforce gate behavior (`blocked`/`defer`/`waiver_required`),
- require explicit owner and rationale for each required blocker before advancing,
- preserve review/audit trail signals for defer and waiver states.

## 8. Atlas and Governance Context

- Atlas keeps executive consequence framing: projected value, risk envelope, and confidence level.
- Governance artifacts continue to be represented as placeholder status values.
- No artifact export, generation, or workflow state mutation in this slice.

## 9. What Not To Build

Do not add in this slice:
- RFP generation,
- artifact export/versioning,
- upload/parsing or citation extraction,
- workflow engine or approval engine behavior,
- real persistence or model calls.

## 10. Acceptance Criteria

- Scope-to-RFP mapping is documented and deterministic.
- Tiering rules are deterministic and do not claim release readiness.
- Dependencies are explicit and read-only.
- Placeholder artifact states are clearly defined and status-bound.
- Gate, blocker, waiver, and missing-input impact are represented.
- Nexus/Sentinel/Steward behavior is described at the planning layer only.
- No runtime/API behavior is introduced.
