# Independent Semantic Audit Report

Tenant: `airline-demo-new`  
Package: `airline-demo-new-source-corpus-v1.0.0`  
Audit date: 2026-07-27  
Disposition: **PASS / ELIGIBLE FOR FREEZE REVIEW**

## Executive Decision

The package has been regenerated through the Airline corpus repair script and independently audited against the blockers identified in the prior review. This remains a source-design package only: no Azure apply, database migration, source load, parser job, publication job or product-runtime wiring is claimed.

## Repair Results

| Gate | Result | Evidence |
|---|---:|---|
| Enterprise scale retained | PASS | 1,495 apps; 6,200 integrations; 10,000 infrastructure rows; 60,000 relationships. |
| Domain placement coherence | PASS | Application families now use bounded airline-specific primary functions instead of broad modulo distribution. |
| Relationship endpoint integrity | PASS | 0 broken endpoints. |
| Relationship origin diversity | PASS | 14 origin types; application-origin share 5.0%. |
| Contract commercial/legal depth | PASS | Required commercial, renewal, SLA, invoice, rate-card, transition and Source-event columns are present. |
| Structured procurement evidence | PASS | 10 procurement evidence families populated across 9 lots and 3 bidders. |
| Reconstruction audit set | PASS | 311 hidden truth objects; 338 crosswalk rows; visible support ratio 1.05. |

## Operating-Chain Coverage

The relationship file now includes multi-hop paths across capability, process, application, integration, data product, infrastructure, vendor, contract, SLA/KPI, risk, control, program, procurement lot and proposal nodes. The graph is no longer application-only fanout.

Sample traversal contracts:

- capability -> business_process -> application -> integration -> application
- business_process -> data_product -> bi_report
- procurement_lot -> proposal -> service_tower
- vendor -> contract -> kpi
- risk -> control -> application

## Remaining Blockers

None. This package is eligible for freeze review, subject to human approval and normal PR controls.

## Boundary

This audit did not run Azure, Postgres, parser jobs, publication jobs or live product tests. Hidden evaluator truth remains in `04-restricted-evaluator-design` and must not be landed as parser-visible source.
