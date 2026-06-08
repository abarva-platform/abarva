# Recommended Fixes — Meridian Sentinel evidence QA (2026-06-08)

Overall 2.71/5 across 80 questions. The score is gated by RETRIEVAL COVERAGE,
not by the citation binding, answer contract, clarity, isolation, or safety.

## Systemic gaps (ranked by impact)

1. **Healthcare corpus barely surfaces (corpus usage 0.45/5).** The 9,026
   `corpus_patterns` almost never reach Meridian answers. Highest-leverage fix:
   wire/repair the healthcare corpus retriever so PATTERN-class sources surface for
   clinical/payer/RCM/CDAO questions (vertical_overlays-scoped to healthcare).
2. **Client context coverage low (context usage 1.34/5; citation rate 31%).**
   Meridian's chunks live in ServiceNow/CMDB segment names
   (`cmdb_applications_services`, `data_domains_stewardship`, `ci_relationships_dependencies`,
   `risk_compliance_register`, `vendors_contract_inventory`, ...) that
   `selectTenantEnterpriseSegments` does NOT map to. Add these segment names + their
   routing keywords (same pattern as the data_estate/infrastructure fix) so the
   38,640 facts / 3,506 chunks become reachable. This alone should lift
   context/citation dims from ~1.4 to high for CDAO/CIO/RCM/compliance questions.
3. **1 raw-ID leak** (no_raw_id_leakage 4.94). One answer surfaced an internal id
   pattern in prose — tighten the synthesis ID-scrub or response sanitizer.
4. **Value/clinical rigor mid (value_model_rigor 2.51, clinical_caution 2.48).**
   Improves once corpus patterns + client baselines surface (the model has less to
   reason from when retrieval is empty).

## What is already good (do not regress)
- Cross-tenant isolation 5.0/5; safety refusal verified; executive_clarity 3.84;
  missing_evidence_honesty 3.24 (honest about gaps rather than bluffing).
- Citation binding + EvidenceBasis UI render evidence wherever sources exist.

## Verdict
GO on the citation-hardening / contract / safety changes (correct, safe, raise
honesty + clarity + visible evidence). HOLD on the "decision-grade evidence at
scale" business claim until #1 and #2 (retrieval coverage) land — that is the
single dominant lever and a well-scoped follow-up.
