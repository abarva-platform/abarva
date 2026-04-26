# Next Slice Plan: Vendor Response Completeness

Date: 2026-04-26

Status: planned only

Scope: documentation and planning only. Do not add runtime code, APIs, model calls, upload/parsing, artifact drawer behavior, workflow engine, approval engine behavior, scorecard UI, value ledger UI, artifact versioning, or document export/import in this slice.

## 1. Purpose

Define the next Source stage after RFP readiness: determining whether vendor responses are complete and comparable enough to move toward negotiation preparation.

The plan should answer:

- Are vendor responses complete for a fair apples-to-apples comparison?
- Which vendors can be evaluated now and which cannot?
- What assumptions and exclusions weaken comparability?
- What commercial traps are visible before BAFO or evaluation planning?
- What follows next for the sourcing workspace.

## 2. Relationship to RFP Readiness

Vendor response completeness is downstream of Scope and RFP readiness.

- Scope provides comparability boundaries, exclusions, and assumptions.
- RFP readiness provides deterministic evidence state and tier signaling.
- Vendor response completeness uses both to assess whether incoming vendor replies can be compared safely and whether decision-makers can trust any commercial view.

Rules:

- If Scope or RFP readiness is in a hard-block state, all vendors should inherit a `not_comparable` or `blocked` path unless explicit waivers are visible.
- If response completeness is poor, next actions should remain `request_completion` or `request_clarification`, not evaluation or BAFO behavior.
- This stage is comparison-aware: completeness is not binary, it is quality-weighted for downstream negotiation readiness.

## 3. What Makes a Vendor Response Complete

Vendor responses are complete only when they include:

- explicit response to executive brief,
- scope confirmation against in-scope and out-of-scope definitions,
- pricing template in a comparable structure,
- assumptions and exclusions with clear ownership,
- transition plan with migration/support approach,
- delivery model and operating model,
- SLA commitments and confidence in operational posture,
- security/compliance commitments,
- automation and productivity roadmap commitments tied to baseline evidence,
- references or evidence references where claims are made.

Completeness must distinguish:

- substantive response,
- placeholders,
- missing items,
- low-confidence or unverifiable claims.

## 4. Completeness Outcomes

Deterministic completeness outcomes:

- `complete`
- `partially_complete`
- `incomplete`
- `not_comparable`
- `blocked`

Suggested meaning:

- `complete`: all required response sections exist at comparable structure and quality, with clear assumptions.
- `partially_complete`: required sections exist but some are weak, untrusted, or require immediate follow-up.
- `incomplete`: one or more required sections missing.
- `not_comparable`: data and structure mismatch across vendors prevents fair comparison (e.g., mixed pricing units or missing price basis).
- `blocked`: compliance/security/approval or policy issue prevents use of the response for this sourcing lane.

## 5. Required Seeded Data for First Deterministic Model

Seed rows should include at least:

- vendor identity and submission metadata,
- response status and received date,
- required vs submitted sections list and per-section state,
- assumptions text and exclusion list,
- pricing template status and pricing model baseline,
- transition plan status,
- security/compliance response status,
- automation roadmap status,
- evidence status (sourced, cited, weak, stale),
- comparability status.

For each vendor, include explicit blocker reasons and rationale for not-comparable conditions.

## 6. Nexus Behavior

Nexus should:

- summarize vendor comparability across all vendors,
- identify which vendors are currently evaluable and which are not,
- call out the exact section missing for each non-comparable case,
- recommend concrete next steps: request missing pricing template, clarify assumptions, confirm transition ownership,
- preserve the distinction between incomplete and not comparable.

Nexus should not trigger messaging, workflows, reminders, or vendor communications in this slice.

## 7. Sentinel Behavior

Sentinel should:

- flag low-context claims and non-evidence-based pricing statements,
- downgrade comparability when evidence status is weak or missing,
- highlight security/compliance ambiguity as a hard blocker when materially relevant,
- mark transition assumptions without explicit owners as risky,
- surface stale/uncited assertions when they impact score-critical sections.

## 8. Steward Behavior

Steward should:

- enforce blocker visibility and approval implications,
- preserve a deterministic gate note for blocked/not_comparable records,
- require clear ownership for major missing sections before changing status to comparable,
- keep completion status honest: no implied readiness without complete gate signals.

## 9. Atlas Behavior

Atlas should:

- provide deterministic executive context around commercial confidence,
- frame incompleteness as procurement and evaluation risk,
- avoid presenting incomplete responses as near-final recommendations,
- track if incomplete data weakens milestone confidence in next-stage planning.

## 10. Future UI Placement

The vendor response completeness panel should live in the Source event canvas, in the stage workspace for the same journey position where RFP responses are reviewed and readied for negotiation support.

The panel should be table-forward with:

- vendor rows and key status columns,
- completeness/comparability columns,
- blocker/recommendation columns,
- deterministic summary footer.

No chat behavior or scoring dashboard replacement should be introduced in this slice.

## 11. What Not To Build

Do not build:

- full vendor workflow,
- message/reminder engine,
- file upload/parsing,
- vendor scoring UI,
- scorecard integration,
- BAFO workflow behavior,
- approval/policy automation,
- export/report generation,
- document versioning.

## 12. Acceptance Criteria

- Plan clearly defines deterministic response completeness and comparability.
- Plans the required seeded data structure with explicit required vs submitted sections.
- Defines outcomes: `complete`, `partially_complete`, `incomplete`, `not_comparable`, `blocked`.
- Explicitly links completeness and comparability to Scope/RFP readiness.
- Includes Nexus/Sentinel/Steward/Atlas roles for this stage.
- Defines no-runtime, no-API, no-model behavior.
- Keeps implementation boundaries clear for future Slice 2+ work.
