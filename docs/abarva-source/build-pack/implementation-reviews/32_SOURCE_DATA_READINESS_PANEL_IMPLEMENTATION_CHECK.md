# Source Data Readiness Panel Implementation Check

Date: 2026-04-26
Slice: Source data readiness panel implementation check
Status: ready for implementation slice

## 1. Panel Placement

The deterministic Source Data Readiness Panel should live inside the Source event canvas shell, within the current-stage workspace.

Recommended placement:

- Replace the existing compact `Data readiness` placeholder in `SourceActiveStageWorkspace`.
- Keep the panel beside or directly below the agent mission preview depending on responsive width.
- Keep the panel above artifact/review placeholders so readiness gaps explain why downstream artifacts remain limited.

This preserves the Source dashboard as the portfolio operating queue and keeps data readiness as an event-level workbench input.

## 2. Component Ownership

Recommended component:

- `src/components/source/SourceDataReadinessPanel.tsx`

Recommended integration points:

- `SourceActiveStageWorkspace` owns the current-stage placement.
- `NexusEngagementCanvas` continues to own event-level composition.
- `mock-seed.ts` owns deterministic seeded readiness items until Admin/Setup readiness state exists.

## 3. Build New Component Or Extend Placeholder

Build a new `SourceDataReadinessPanel` component.

Reason:

- The placeholder is too small to carry category, state, owner, confidence, source, workflow impact, and agent recommendation.
- A dedicated component keeps the event canvas readable and gives tests a stable surface.
- The component can later consume an Admin/Setup readiness contract without making `SourceActiveStageWorkspace` bulky.

## 4. Required Deterministic Seed Fields

The first deterministic seed should support:

- data category
- requirement level: required, recommended, optional
- readiness state
- owner
- source system or file
- last updated
- confidence
- workflow impact
- agent recommendation
- Steward/Admin handoff label

Initial Data and AI Modernization event categories:

- Application Inventory: Usable Evidence
- Workload Baseline: Missing or Requested
- Ticket History: Missing
- Vendor Spend: Available or Usable Evidence
- SLA Baseline: Missing
- Vendor Contracts: Loaded or Available, but not usable evidence
- Security / Compliance Requirements: Available or Low Confidence
- Retained Roles: Requested

## 5. Relationship To Admin/Setup Readiness

Admin/Setup owns:

- connector setup
- upload intake
- parsing
- dataset readiness
- permissions
- evidence usability
- platform-level readiness state

Source consumes readiness and translates it into sourcing consequences:

- artifact tier impact
- Scope/RFP gate readiness
- evidence confidence
- pricing normalization risk
- value confidence
- Steward/Admin handoff

The Source panel must not create a duplicate setup process.

## 6. Readiness States To Display

Use the locked readiness states from the Experience System:

- Missing
- Requested
- Uploaded
- Connected
- Loaded
- Parsed
- Available
- Usable Evidence
- Low Confidence
- Stale
- Access Restricted
- Not Applicable
- Waived

Rules:

- Loaded does not equal usable evidence.
- Available does not equal validated evidence.
- Uploaded does not mean citeable.
- Waived must remain visible with impact.

## 7. Agent Behavior

Nexus explains workflow impact:

- what the missing or weak data does to current-stage readiness
- whether Rich, Outline, or Stub artifact posture is reasonable
- the next sourcing move

Steward explains setup/admin blocker:

- owner or Admin/Setup handoff
- whether a gate is blocked, deferred, or caveated
- whether a waiver would be required later

Sentinel explains evidence usability:

- whether data can be cited
- whether available/loaded data is still low confidence
- which claims should not be overstated

Atlas explains executive/value impact:

- value confidence effect
- timing or decision impact
- whether the executive brief should caveat projected value

## 8. What Should Remain Placeholder

The first implementation should remain read-only and seeded:

- no Admin/Setup integration
- no upload controls
- no parsing status from real files
- no evidence ledger implementation
- no connector setup
- no workflow mutation
- no approval behavior
- no route/API integration

The panel can show a visual Steward/Admin handoff label, but it must not execute a handoff.

## 9. What Not To Build

Do not build:

- real upload/parsing
- Admin/Setup UI
- connector setup
- API routes
- model calls
- chat UI
- evidence ledger behavior
- scorecard UI
- artifact drawer behavior
- value ledger UI
- vendor response workflow
- workflow engine
- approval engine
- `/programs`, `/preview`, or `/demo` integration

Do not touch `ProgramSurface` or `src/lib/programs/mock.ts`.

## 10. Implementation Acceptance Criteria

The next implementation slice is acceptable if:

- The event canvas includes a compact, deterministic data readiness panel.
- The panel displays the required seed categories and readiness states.
- Required missing data is visible.
- Loaded/Available/Usable Evidence are visibly distinct.
- Workflow impact and agent guidance are present without becoming chat UI.
- The panel preserves Admin/Setup ownership.
- Tests confirm no model, upload/parsing, Admin setup, API, or persistence imports.
- Production readiness is updated only if the deterministic UI/read-model evidence changes a tracked status or gate.

## Validation Results

Passed:

- `git diff --check`
- trailing whitespace check
- non-ASCII punctuation check

## Production Readiness Impact

No `docs/build/production-readiness.json` update is expected. This is a planning/reconciliation slice only and does not change runtime readiness, evidence readiness, testing gates, or production blockers.
