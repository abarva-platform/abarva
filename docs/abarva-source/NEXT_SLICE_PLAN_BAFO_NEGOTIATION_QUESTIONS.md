# Next Slice: BAFO Negotiation Questions

Date: 2026-04-26
Scope: deterministic BAFO and negotiation planning after vendor response completeness and pricing normalization
Status: planned

## 1. Purpose

Source needs deterministic negotiation planning before selection decisions. BAFO questions and commercial guidance in this slice are intended to prepare vendors and internal reviewers for final comparison, not to replace procurement systems.

This slice stays bounded to planning logic only.

## 2. Relationship to Vendor Response Completeness

BAFO planning consumes vendor-response completeness output:

- Vendors with missing sections get targeted follow-up questions.
- Comparability blockers appear in the negotiation plan as high-priority asks.
- Incomplete evidence lowers readiness and changes commercial ask priority.

BAFO does not define a new completeness model; it uses seeded completeness signals.

## 3. Relationship to Pricing Normalization

BAFO must align with normalized pricing outputs:

- year-over-year cost behavior,
- escalation assumptions,
- commercial trap findings,
- transition and excluded-service assumptions.

It asks vendors to confirm and lock these points.

## 4. Relationship to Pricing/Negotiation Intelligence Standard

This slice applies the pricing and negotiation standard as deterministic guidance rules:

- normalized commercial comparison posture,
- trap taxonomy,
- assumption lock behavior,
- transition/compliance guardrails.

BAFO outputs convert those rules into concrete vendor asks.

## 5. Vendor-Specific Negotiation Questions

Each vendor receives a deterministic set of questions based on completeness and pricing outputs.

Required question groups:

- scope and exclusion confirmation,
- transition plan and ownership confirmation,
- commercial term confirmation,
- evidence and proof of claims.

## 6. Assumption Lock List

Assumptions to lock before recommendation:

- ticket and workload baseline,
- pricing curve and escalation rules,
- retained support and staffing,
- transition timeline and ownership,
- security and compliance obligations,
- tooling/infrastructure coverage.

Progress remains blocked until critical locks are complete.

## 7. Excluded Scope List

BAFO records at least:

- optional vs required services,
- release support boundary,
- minor enhancements and change-order controls,
- support-window obligations,
- transition exclusions.

## 8. Commercial Risk Summary

BAFO risk summary should include:

- blocker count and severity,
- transition risk,
- evidence risk,
- commercial trap status,
- what remains to move to evaluation-readiness.

## 9. BAFO Priorities

Priority order:

1. lock assumptions and exclusions,
2. clear missing pricing/completeness blockers,
3. resolve transition ownership gaps,
4. tighten evidence-backed claims,
5. stabilize high-risk commercial traps.

## 10. Recommended Asks

Default asks include:

- request missing pricing template or transition sections,
- confirm excluded-item treatment,
- ask for measurable evidence for automation/value claims,
- request commercial adjustment language,
- confirm remediation timeline for unresolved blockers.

## 11. Executive Tradeoff View

Executive view should show cost, transition, and evidence tradeoffs side by side, plus risk posture. It is advisory only and does not issue final selection decisions.

## 12. Nexus Behavior

Nexus surfaces a structured negotiation readiness summary:

- overall readiness,
- vendor-specific questions,
- blockers and blockers impact,
- top priorities.

## 13. Sentinel Behavior

Sentinel provides evidence caution by surfacing weak proof, unsupported claims, and unresolved risk language.

## 14. Steward Behavior

Steward marks vendors not ready for downstream selection if assumptions and blockers are not addressed.

## 15. Atlas Behavior

Atlas presents executive tradeoffs and readiness posture in a board-level language for decision conferences.

## 16. What Not to Build

- model calls,
- scorecard UI,
- chat/BAFO messaging workflow,
- approval engine,
- final vendor selection automation,
- workflow engine,
- document export/import,
- value ledger UI.

## 17. Acceptance Criteria

The plan is acceptable when it:

- defines the BAFO purpose and scope boundaries,
- ties directly to vendor response completeness and pricing normalization,
- lists deterministic vendor-specific asks,
- lists assumption locks and exclusion boundaries,
- includes executive tradeoff and readiness language,
- specifies Nexus/Sentinel/Steward/Atlas behavior,
- explicitly excludes out-of-scope implementation work.
