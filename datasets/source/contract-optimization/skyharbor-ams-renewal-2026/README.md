# SkyHarbor AMS Contract Optimization Pack

Synthetic demo evidence for Source existing-contract optimization.

This pack is intentionally **tenant/use-case specific** and labelled
`source_type = synthetic_demo`. It is not a real client contract and does not
name real vendors. The pack is designed to prove that Source can ingest a
realistic incumbent outsourcing contract package and extract the minimum viable
sourcing record needed to optimize, renegotiate, renew, or rebid.

## Evidence files

| File | Source role | What Source should extract |
|---|---|---|
| `executed-ams-master-services-agreement-synthetic.md` | master services agreement, SOW, renewal notice, pricing and SLA excerpts | contract baseline, renewal window, key commercial terms, SLA economics, staffing commitments, exclusions, governance rights |
| `invoice-baseline-fy26-synthetic.csv` | invoice history | contracted vs invoiced variance, pass-through exposure, out-of-catalog leakage |
| `service-performance-baseline-fy26-synthetic.csv` | service performance export | incident/change volume, SLA miss patterns, reopen and emergency-change trends |
| `staffing-location-attestation-fy26-synthetic.csv` | staffing roster / attestation | committed vs observed FTE, location mix, coverage gaps |
| `change-order-ledger-fy26-synthetic.csv` | change-order log / amendment ledger | recurring vs one-time change orders, catalog mapping, approval evidence, renewal baseline creep |

## Product boundary

Source should not expose this as arbitrary document browsing. The extracted
output must map to:

1. Contract baseline and renewal rights
2. Pricing and invoice baseline
3. SLA economics
4. Staffing and coverage
5. Operational volume and quality
6. Change orders and amendments
7. Optimization findings
8. Negotiation levers
9. Client-to-complete gaps

Raw files belong in controlled storage and `source_artifacts`. Structured
output belongs in:

- `source_contract_optimization_profiles`
- `source_contract_optimization_findings`
- `source_contract_optimization_levers`
- existing `source_artifact_facts`, `source_pricing_components`,
  `source_vendor_commitments`, and `source_commercial_exceptions` where
  applicable.
