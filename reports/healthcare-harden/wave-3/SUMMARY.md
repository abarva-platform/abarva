# Wave 3 Healthcare CPO Sourcing Pack Summary

Generated 1420 governed corpus patterns across 10 healthcare CPO sourcing domains.

| Domain | Patterns | File |
|---|---:|---|
| HC-CPO-D01 Healthcare BPO supply chain doctrine | 200 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d01-healthcare-bpo-supply-chain-doctrine.jsonl` |
| HC-CPO-D02 Epic AMS market and leverage | 150 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d02-epic-ams-market-and-leverage.jsonl` |
| HC-CPO-D03 Analytics AMS market | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d03-analytics-ams-market.jsonl` |
| HC-CPO-D04 Cyber and infrastructure managed services | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d04-cyber-and-infrastructure-managed-services.jsonl` |
| HC-CPO-D05 CPO operating doctrine | 200 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d05-cpo-operating-doctrine.jsonl` |
| HC-CPO-D06 Insource versus outsource decision framework | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d06-insource-versus-outsource-decision-framework.jsonl` |
| HC-CPO-D07 Cross-CXO sourcing collaboration | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d07-cross-cxo-sourcing-collaboration.jsonl` |
| HC-CPO-D08 Renegotiation triggers and mid-contract optimization | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d08-renegotiation-triggers-and-mid-contract-optimization.jsonl` |
| HC-CPO-D09 Sourcing event playbooks by category | 150 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d09-sourcing-event-playbooks-by-category.jsonl` |
| HC-CPO-D10 Vendor-specific deep dives | 120 | `scripts/corpus/generated/healthcare-cpo-wave3/hc-cpo-d10-vendor-specific-deep-dives.jsonl` |

## Loader Path

Patterns are authored as JSONL for `/api/admin/context-layer/corpus-import`, the governed admin loader lane. Because the governed loader intentionally caps one upload at 1,000 rows, Wave 3 must be uploaded as the ten per-domain batch files under `scripts/corpus/generated/healthcare-cpo-wave3/`, not as the combined report JSONL.

## Scope

This pack adds healthcare CPO sourcing doctrine for GPO and supply chain, Epic AMS, analytics AMS, cyber and infrastructure managed services, procurement operating model, make-buy, cross-CXO collaboration, renegotiation triggers, category playbooks, and vendor deep dives.

## Known Limits

- This is an authored corpus artifact and local loader validation target; live commit still requires authenticated admin upload of each per-domain batch file.
- Vendor rows avoid invented prices and contract terms; actual tenant contracts must come through the governed data loader.
- Live Source/CPO eval is intentionally deferred until the corpus rows are committed through the governed loader.
