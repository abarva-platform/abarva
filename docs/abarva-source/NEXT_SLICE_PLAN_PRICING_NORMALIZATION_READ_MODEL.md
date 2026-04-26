# Next Slice: Pricing Normalization Read Model

Date: 2026-04-26
Scope: deterministic source pricing comparison and commercial trap foundation
Status: planned

## 1. Purpose

This slice defines how Source will compute a deterministic pricing comparison of vendor responses without making calls to external price tools or models.

The output is a read model and decision support layer that:

- normalizes annualized economics across vendors,
- keeps assumptions and exclusions visible,
- flags commercial risk signals, and
- supports next-stage BAFO and negotiation planning.

## 2. Relationship to RFP and Vendor Completeness

- RFP readiness defines whether the sourcing packet is complete enough to collect comparable responses.
- Vendor response completeness defines whether each vendor has enough commercial artifacts to score and compare.
- Pricing normalization consumes both outputs and only promotes confidence when critical sections and assumptions are coherent.

This means:
- RFP readiness is a precondition gate.
- Vendor completeness is a comparability gate.
- Pricing normalization is a comparable-cost gate that can still be "blocked" if assumptions are weak.

## 3. Required Inputs for First Deterministic Model

Pricing normalization should require at minimum:

- annual run pricing components,
- transition support cost,
- one-time setup cost,
- supported service hours,
- baseline volumes,
- retained effort assumptions.

Optional but useful:

- offshore/onshore split,
- risk adjustment for change orders,
- exclusion statements,
- automation savings assumptions.

All inputs are seeded for deterministic behavior.

## 4. Model Inputs and Outputs

Seeded pricing input per vendor should include:

- `vendorId`, `vendorName`
- `eventId`, `eventName`
- `isComparable`, `comparabilityNotes`
- `baseAnnualRunCost`
- `transitionCost`
- `setupCost`
- `optionalServices` list
- `excludedServices` list
- `ticketVolumeAssumption`
- `applicationCountAssumption`
- `supportHoursAssumption`
- `rateEscalationPercent`
- `automationSavingsPercent`
- `offshoreOnshoreMix`
- `securityComplianceCostCoverage`
- `changeOrderExposure`
- `commercialTraps` seeded flags or signals

Normalization output should include:

- `vendorCommercialTotals` (vendor, fixed price total, year1/year2/year3 perspective),
- `normalizedComparability` status,
- `criticalAssumptionCoverage`,
- `missingInputs`,
- `commercialTraps`,
- `recommendedNextAction`,
- `nexusGuidance`,
- `sentinelEvidenceNotes`,
- `stewardGateNotes`,
- `atlasExecutiveImplication`.

## 5. Core Normalization Calculations

The model should compute:

1. `annualRunCost` from seeded vendor recurring cost inputs.
2. `transitionInclusiveCost` by adding one-time transition and onboarding components.
3. `oneTimeTotal` using one-time setup plus optional transition carry and known exclusions.
4. Yearly projections for year 1, year 2, and year 3 using escalation and transition effects.
5. `adjustedCost` as a comparability-safe cost view after applying known excluded services and commercial risk penalties.

These values must stay deterministic and explicit in test outputs.

## 6. Comparison and Recommendation Behavior

Vendor ranking is deterministic and does not imply winner selection.
Rules:

- if required pricing artifacts are missing, vendor comparability is blocked;
- if volumes are below seeded baseline assumptions, trap severity increases;
- if critical exclusions are present, normalized view marks high risk;
- if escalation or rate behavior exceeds thresholds, flags must be surfaced.

Output should include:

- cheapest and likely safest summary,
- trap reasons per vendor,
- normalized ranking only by deterministic input compatibility,
- clear caution when data is deterministic but not production data.

## 7. Commercial Traps to Detect

Each model run should surface these traps:

- transition excluded,
- release support excluded,
- minor enhancements excluded,
- tooling excluded,
- security/compliance excluded,
- volume assumptions too low,
- automation savings not committed,
- rate escalation high,
- KT not priced.

Each trap should include:

- `vendorId`
- `severity` (low / medium / high)
- `impact`
- `evidenceNeed`
- `negotiationHint`.

## 8. Commercial Assumptions and Traps

- Pricing must stay scoped to seeded inputs only in V1.
- Automation productivity assumptions must not be treated as fully validated evidence.
- Change-order exposure should reduce risk-adjusted confidence.
- Excluded services must remain explicit and reduce comparability confidence unless re-scoped.

## 9. Nexus / Sentinel / Steward / Atlas Roles

- Nexus proposes normalization framing and next action.
- Sentinel checks for weak evidence and unsupported commercial claims.
- Steward blocks progress if normalization is blocked by missing comparability prerequisites.
- Atlas keeps the executive tradeoff summary focused on risk-adjusted cost.

## 10. Future UI Placement

Pricing normalization should be consumed by the Source event canvas where vendor comparison stage is shown.

The UI plan is not in this slice. No scorecard behavior is introduced yet.

## 11. What Not to Build Here

In this slice we explicitly defer:

- live spreadsheet ingestion,
- vendor document parser calls,
- model scoring or recommendation engines,
- value ledger write/update behavior,
- external benchmark connectors,
- negotiation output generation.

## 12. Acceptance Criteria

This plan is done when it defines:

- deterministic pricing inputs and outputs,
- year 1/2/3 comparison behavior,
- transition-inclusive and exclusion-aware cost logic,
- trap detection mapping,
- readiness and risk handling,
- explicit governance roles and what is excluded from scope.
