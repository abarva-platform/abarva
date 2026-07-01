# Source Existing Contract Optimization MVE Standard

## Purpose

Source must support two related but distinct sourcing use cases:

1. run a new complex outsourcing event; and
2. analyze and optimize an existing large contract before renewal, extension,
   renegotiation, or rebid.

This standard covers the second path. The product should not become a general
contract browser. It should extract the minimum sourcing-critical information
needed to decide whether to optimize, renegotiate, renew, or rebid.

## Minimum viable extraction areas

| Area | Source should extract | Decision supported |
|---|---|---|
| Contract baseline | party, term, service scope, renewal notice, benchmark rights | preserve renewal/rebid leverage |
| Pricing baseline | contracted run-rate, pass-throughs, rate card, change orders | normalize current commercial baseline |
| Invoice history | contracted vs invoiced variance by month/category | recover leakage and reset renewal pricing |
| SLA economics | target, actual, credit cap, chronic-miss language, earn-back | strengthen service accountability |
| Staffing coverage | committed FTE, observed FTE, shift/location coverage | validate what is being paid for |
| Operational baseline | ticket, incident, change, reopen, knowledge freshness trends | separate demand growth from vendor performance |
| Exceptions and exclusions | out-of-scope work, buyer dependencies, change-order rights | identify buyer-risk transfer |
| Optimization findings | evidence-backed findings with severity and implication | focus the workshop and negotiation |
| Negotiation levers | buyer ask, BAFO/renewal language, value basis, owner | turn evidence into action |

## Structured persistence

Raw files stay in controlled object storage and `source_artifacts`. Source writes
the structured optimization record into:

- `source_contract_optimization_profiles`
- `source_contract_optimization_findings`
- `source_contract_optimization_levers`

Existing tables continue to hold first-mile parsed evidence:

- `source_artifact_chunks`
- `source_artifact_facts`
- `source_pricing_components`
- `source_vendor_commitments`
- `source_commercial_exceptions`
- `source_graph_edges`

## Runtime rule

All aVa and Source outputs for this use case should read from the structured
profile/findings/levers first, using raw chunks only for citations or excerpt
support. If the structured profile is missing, the answer should ask for the
minimum evidence pack instead of browsing the contract.

## Evidence readiness

Draft optimization can proceed with:

- executed agreement or contract extract;
- pricing schedule or rate card;
- invoice history;
- SLA exhibit;
- service performance baseline;
- staffing attestation.

Executive-ready optimization requires:

- change-order log;
- amendment and renewal proposal history where available;
- benchmark rights and benchmark pack;
- renewal notice confirmation;
- governance minutes or supplier QBRs;
- client-approved finance validation of any recovery estimate.

## Recommended path standard

Every existing-contract optimization profile must state the path in business
language:

- immediate action: cure / reservation-of-rights / evidence request;
- primary path: renegotiate with evidence-backed cure conditions;
- fallback path: prepare competitive RFP if cure conditions remain unresolved;
- do-not-do: do not renew as-is when leakage, SLA, staffing, or recurring
  change-order issues remain open.

This path is what aVa and the Source UI should use first. Raw contract browsing
or clause-level Q&A should not be the primary experience.

## Guardrails

- Do not invent savings.
- Quantify only when invoice, staffing, or rate-card evidence supports it.
- Label unquantified levers as `opportunity_to_test`.
- Do not show raw legal-contract browsing as the primary Source experience.
- Do not use real vendor names in synthetic demos.
- Keep synthetic evidence labeled as `synthetic_demo`.
