# Next Slice: BAFO Negotiation Questions

Date: 2026-04-26
Scope: deterministic BAFO preparation plan after pricing normalization
Status: planned

## 1. Purpose

Define how Source will stage vendor-specific BAFO negotiation questions without writing scorecards or selection engines.

BAFO planning should:

- close assumption ambiguity before award,
- force commercial consistency before approval,
- preserve evidence discipline,
- remain fully deterministic in V1.

## 2. Relationship to Pricing Normalization

Pricing normalization provides the baseline financial normalization and trap detections.
BAFO questions should follow that signal structure and should not introduce new commercial logic.

Rules:

- BAFO questions are not a scoring model.
- BAFO questions are not a contract template generator.
- BAFO questions should be deterministic and based on seeded/computed normalization outputs.

## 3. Vendor-Specific Negotiation Questions

For each vendor, BAFO should ask for:

- scope and assumption confirmation,
- transition and takeover obligations,
- commercial exception handling,
- evidence for quantitative claims,
- risk mitigation language.

Examples:

- "Confirm the fixed price covers the baseline ticket volume and criticality mix in this packet."
- "List all commercial items currently treated as out-of-scope and confirm re-pricing if any are required."
- "Which automation or productivity claims are contractually committed and what is the fallback if delivery falls short?"

## 4. Assumption Lock List

BAFO should require explicit locking of:

- volume assumptions,
- escalation terms,
- included/excluded support hours,
- security/compliance obligations,
- transition ownership,
- tooling responsibility.

No final comparison should proceed while these assumptions remain unconfirmed.

## 5. Excluded Scope List

BAFO should confirm:

- all required services that were previously treated as optional,
- release support and hypercare handling,
- change-order boundaries,
- retained team obligations,
- post-stabilization support scope.

## 6. Commercial Risk Summary

BAFO output should include a clear risk summary with:

- trap remediations completed,
- trap remediations still open,
- evidence strength and confidence risk,
- estimated adjustment if assumptions are fixed.

## 7. BAFO Priorities

Priorities should be deterministic and fixed:

1. Close missing assumptions,
2. Resolve comparability blockers,
3. Clarify transition and tooling scope,
4. Confirm security/compliance obligations,
5. Validate pricing with committed volume and escalation terms.

## 8. Recommended Asks

Default asks for BAFO:

- clarify exclusions,
- provide transition cost confirmation,
- confirm year-2 and year-3 price behavior,
- provide measurable automation and productivity commitments,
- confirm governance and stewardship handoff model.

## 9. Executive Tradeoff View

BAFO should preserve an executive view of:

- cheapest comparable vendor,
- safest comparable vendor,
- highest-confidence commercial commitment,
- risks that remain unmitigated.

BAFO does not decide the winner. It prepares decision-grade questions and assumption locks.

## 10. Nexus / Sentinel / Steward / Atlas Behavior

- Nexus: presents deterministic BAFO package and required follow-up queue.
- Sentinel: flags unsupported claims and weak evidence before approval.
- Steward: blocks downstream selection progression if assumption lock is incomplete.
- Atlas: summarizes tradeoff impact and risk posture for executives.

## 11. What Not to Build Here

This plan does not include:

- live document generation,
- BAFO scoring,
- signature workflow,
- contract drafting,
- model routing.

## 12. Acceptance Criteria

This plan is complete when it defines:

- BAFO scope and ordering,
- the assumption lock and exclusion model,
- vendor-specific question structure,
- risk and tradeoff summary behavior,
- governance guardrails,
- explicit deferrals for unscoped implementation.
