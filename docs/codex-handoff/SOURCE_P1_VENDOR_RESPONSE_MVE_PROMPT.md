# Codex Task: Source P1 Vendor Response Minimum Viable Extraction

## Objective

Begin Source P1 after preserving the Source P0 golden path. Build vendor
response intelligence around minimum viable sourcing extraction, not generic
document Q&A.

## Operating Rule

Source should not browse or summarize vendor responses for arbitrary questions.
It should extract critical sourcing evidence for defined Source decisions,
stages, gates, artifacts, comparisons, pricing normalization, BAFO, and
executive decision support.

## Required Vendor Response Simulation

Use the SkyHarbor AMS event and D09/D11 buyer-side package as the basis. Create
three clearly synthetic vendor response packages. Do not use real company names
or names that could plausibly imply a real legal entity. Use neutral synthetic
labels in public/demo artifacts unless legal review approves names.

Each vendor package must include:

1. Long sectioned narrative response, 50-100 page equivalent in markdown or
   DOCX/PDF style.
2. Structured response exhibits used for analysis:
   - Vendor Claim Register
   - Automation/Productivity Commitment Table
   - Pricing Workbook
   - Staffing and Location Model
   - SLA Commitment Table
   - Assumptions and Exclusions Log
   - Transition Milestone Plan
   - Commercial Exceptions Table
   - Evidence Attachment Index
3. Intentional inconsistencies between narrative and exhibits.
4. Evidence references for extracted claims.
5. Gaps that create real sourcing decisions, not perfect proposals.

## Minimum Viable Extraction Areas

For each response package, extract:

1. Response completeness by RFP section.
2. Major vendor claims.
3. Evidence supporting each claim.
4. Pricing summary: run cost, transition cost, one-time cost, optional cost,
   5-year TCO.
5. Productivity/automation commitments and whether they are priced back.
6. Staffing and location model.
7. SLA targets, credits, caps, exclusions, and reporting.
8. Assumptions and exclusions that create buyer risk.
9. Commercial/legal/RFP exceptions.
10. Transition plan, KT obligations, dependencies, exit criteria, and milestone
    linkage.

## Normalized Vendor Response Profile

Produce a profile per vendor:

- vendor name
- response completeness
- total 5-year TCO
- year 1 run cost
- transition cost
- productivity commitment
- SLA commitment
- staffing model summary
- major assumptions
- major exclusions
- commercial exceptions
- unsupported claims
- clarification questions
- negotiation levers
- ready for evaluation: yes / no / conditional

## Required Cross-Checks

Detect and report:

1. Productivity claimed but not priced back.
2. Transition fees not milestone-based.
3. Weak SLA credit economics.
4. Vague exclusions or change-order exposure.
5. Rate card or staffing mix issue.
6. Outcome claim not contractually committed.
7. 24x7 support not staffed.
8. Pricing not comparable.
9. Proposal claim not supported by evidence.
10. Commercial exception creates buyer risk.

For each issue, output:

Vendor | Lever type | Finding | Evidence | Risk | Recommended ask |
BAFO language | Confidence

## Artifacts to Produce

1. Response completeness review.
2. Vendor challenge / clarification log.
3. Evaluation scorecard.
4. Pricing comparison / normalized cost view.
5. Commercial trap log.
6. BAFO pack.
7. Executive decision brief.

## aVa Question Bank

Run Source advisor proof on:

1. Which vendor response is least complete?
2. Which vendor made unsupported automation claims?
3. Which vendor has the strongest SLA commitment?
4. Which vendor has pricing that is not comparable?
5. What should we ask in BAFO?
6. What should the CIO be worried about?
7. What should the CFO be worried about?
8. Which vendor should not advance without clarification?
9. What evidence is still missing?
10. What is the executive decision tradeoff?

## Acceptance

P1 Slice 1 is complete only when:

1. P0 regression checks pass.
2. Three realistic synthetic vendor response packages are loaded or simulated.
3. Narrative and structured exhibits are both present.
4. Source extracts minimum viable sourcing records.
5. Source identifies at least five meaningful vendor/commercial issues.
6. Source produces BAFO-ready asks.
7. aVa answers with sourcing-specific guidance and no invented facts.
8. No raw CSV IDs, risk IDs, internal record labels, or cross-vendor leakage
   appears.
9. Browser proof and artifacts are saved to Downloads.

