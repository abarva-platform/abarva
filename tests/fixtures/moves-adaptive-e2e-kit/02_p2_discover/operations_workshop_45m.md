# P2 Operations Discovery — 45-minute synthetic session

Evidence ID: SYN-SESSION-OPS-01
Format: Facilitated workshop notes, not a verbatim recording
Participants by role: Member Services Sponsor; Contact Center Operations Lead; Frontline Supervisor; Contact Center Analytics Lead; CRM Product Owner; Enterprise Data Lead; Workforce Planning Lead; Finance Value Owner
Classification: Synthetic demo fixture; no PHI; not client-attested

## 00:00-04:00 | Objective and boundary
Facilitator: We need enough facts to decide route and estimate. We are not designing every future process.
Operations Lead: The pain is fragmented context and repeated searching, not an approved staffing-reduction objective. The agent stays accountable for member-facing decisions.
Decision: Keep phase-one scope read-only and one queue/cohort as a planning assumption.
Evidence: SYN-P1-DECISIONS; SYN-RED-01.

## 04:00-10:00 | Demand and KPI definitions
Analytics Lead: The synthetic monthly extract totals 4.82M offered calls over 12 months. The June 2026 row records average handle time of 638 seconds excluding hold and including after-call work; the monthly rows carry the component fields.
Supervisor: Our planning slide says approximately 703 seconds because it includes hold. It is a different measure, not a replacement value.
Finance Value Owner: No benefit calculation until numerator, denominator, period and capacity treatment are reconciled.
Decision: Preserve both values with different definitions; do not average them. AHT benefits remain unvalidated.
Evidence: SYN-KPI-01; SYN-CONFLICT-01.

## 10:00-18:00 | Routine and exception journeys
Supervisor: Routine status calls involve opening CRM, searching claims status, checking eligibility, then returning to the interaction. The agent often repeats identifiers across systems.
Operations Lead: Exception calls include missing authorization documents or contradictory status. The agent asks a supervisor or transfers to a specialist queue.
CRM Owner: Interaction summary is keyed after the call; a proposed summary can be shown, but the agent must verify before saving.
Decision: Map current steps and the proposed assist point only. Do not specify every future queue rule in P3.
Evidence: SYN-WF-01; SYN-INTENT-01.

## 18:00-25:00 | Systems, data and access
Data Lead: CRM, claims, eligibility, authorization and knowledge have different owners and refresh rates. The synthetic inventory lists candidate read interfaces, not confirmed production APIs.
CRM Owner: A read-only side panel is plausible; writeback remains out of scope until identity, audit and error handling are approved.
Operations Lead: If source timestamp is missing, agent needs visible stale/unknown indicator and human escalation.
Decision: Architecture estimate may assume read-only interfaces, but each is an explicit validation dependency.
Evidence: SYN-SYS-01; SYN-DATA-01.

## 25:00-31:00 | Knowledge, controls and red lines
Knowledge Owner: Some high-use articles have a review date older than the target SLA; conflict examples are synthetic IDs only.
Privacy/Compliance Lead (written follow-up): The six draft red lines are accepted for this synthetic test scenario, subject to human sign-off in the product. No raw member data; no autonomous determination; no unreviewed writeback; no unsupported savings; no vendor reuse; no authoritative answer from stale/conflicting knowledge.
Decision: Red lines become explicit control inputs and negative tests; they are not implied from the assistant archetype.
Evidence: SYN-RED-01; SYN-KNOW-01; SYN-SESSION-SEC-01.

## 31:00-36:00 | Change and adoption
Workforce Lead: Agents receive an assist panel and a short verification step. No job family, decision right or staffing model change is proposed. Training/adoption ownership stays with the business.
Operations Lead: Supervisors need a sampling rubric and exception escalation but not a new organization structure.
Decision: Confirm limited workflow change, no role-accountability change, business-owned adoption. If human reviewer disagrees, correct the P2 route and record why.
Evidence: SYN-CHANGE-01; SYN-WF-01.

## 36:00-41:00 | Options and estimate inputs
Data Lead: Compare an embedded read-only panel, a lightweight context service, and deferring until source APIs are confirmed.
Product Owner: A small product team can use Claude Code/Codex for scaffolding, tests, connectors and documentation; security review, data validation, acceptance and deployment approvals remain human work.
Finance Value Owner: Internal and vendor cases need visible rate/effort assumptions. AI acceleration is a planning sensitivity, not a promised productivity benefit.
Decision: Estimate two delivery cases and show assumptions/uncertainty.
Evidence: SYN-OPTIONS-01; SYN-COST-01.

## 41:00-45:00 | Playback and decisions
Playback: Current evidence supports a bounded human-in-the-loop agent-assist concept. It does not support autonomous decisioning, savings, staffing reduction, production API readiness, or a complete future operating model.
Synthetic decisions for the test: accept red lines for this scenario; keep read-only boundary; assign business training/adoption; defer exact queue/cohort and API approval.
Open items: reconcile AHT definition; verify source interface/freshness; resolve knowledge ownership; obtain Finance approval before any value target.
Next gate: P2 route validation cites approved evidence and an accountable reviewer. Unknowns stay open; prose cannot make them complete.
