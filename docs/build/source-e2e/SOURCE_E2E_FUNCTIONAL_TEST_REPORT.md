# Source E2E Functional Test Report

Date: 2026-05-02  
Target: https://app.abarva.ai  
Crawler lane: codex-source-e2e-crawler  
Production deployments verified: `dpl_Fo4vbVZzhdXm44AC7k4aD5o7X1w2`, `dpl_3qMV6vThtzi1hRNTGjxttCzfF1qN`, `dpl_A9NZ7FJmdSU31j9yXp4Dc7uRgPKf`

## Executive Verdict

Functional Source lifecycle testing now passes for all three demo clients at the control-plane level: client admin login, Home landing, Source access, Source event creation, admin approval, 11-stage advancement, DB persistence, and Tower handoff visibility.

This report does not claim every practitioner workflow is fully Tier A. It separately marks what passed, what works with current limitations, and what remains a gap.

## Accounts Tested

| Client | Admin account | Source visible | Create allowed | Approve allowed | Tenant isolation |
| --- | --- | ---: | ---: | ---: | ---: |
| Apex Retail | `maya.desai@apex-retail.example.com` | Pass | Pass | Pass | Pass |
| Meridian Health | `nina.patel@meridian-health.example.com` | Pass | Pass | Pass | Pass |
| First Capital | `ethan.brooks@firstcapital.example.com` | Pass | Pass | Pass | Pass |

## Lifecycle Tested

Locked Source stages tested:

1. Strategy
2. Scope
3. RFP
4. Responses
5. Evaluation
6. Pricing
7. BAFO
8. Executive Decision
9. Selection
10. Transition
11. Value

API transition sequence tested for each client:

`strategy -> scope -> rfp -> responses -> evaluation -> pricing -> bafo -> executive_decision -> selection -> transition -> value`

## Events Created And Completed

| Client | Event ID | Event name | Final DB stage | Final lifecycle state | Approval row |
| --- | --- | --- | --- | --- | --- |
| Apex Retail | `8f65a595-de2e-4d33-9f9a-9c1b6db67e51` | `E2E-CRAWL-2026-05-02-apex-SRC-11-STAGE-20260502T174837Z` | `value` | `completed` | `waiting_on_client -> active` |
| Meridian Health | `578391fd-e6ba-4c24-bcd0-4a4da48d9738` | `E2E-CRAWL-2026-05-02-meridian-SRC-11-STAGE-20260502T175105Z` | `value` | `completed` | `waiting_on_client -> active` |
| First Capital | `bdef723e-968a-4510-acb4-78a8256cb183` | `E2E-CRAWL-2026-05-02-firstcapital-SRC-11-STAGE-20260502T175236Z` | `value` | `completed` | `waiting_on_client -> active` |

DB verification artifact: `/tmp/source-e2e-db-verification.json`

## Stage Results

| Stage | Apex | Meridian | First Capital | What was verified |
| --- | ---: | ---: | ---: | --- |
| Strategy | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Scope | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| RFP | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Responses | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Evaluation | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Pricing | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| BAFO | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Executive Decision | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Selection | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Transition | Pass | Pass | Pass | Stage key accepted and persisted through API transition path. |
| Value | Pass | Pass | Pass | Final stage persisted; lifecycle set to `completed`. |

## Tower Handoff

Initial result: Source completed events did not appear in Tower because Tower filtered only legacy stages `contract_mobilization` and `value_realization`.

Fix: PR #1437 added canonical `transition` and `value` to the Tower Source handoff query while preserving legacy aliases.

Post-fix result:

| Client | Tower Source handoff visible | E2E event visible | Tenant leakage |
| --- | ---: | ---: | ---: |
| Apex Retail | Pass | Pass | None detected |
| Meridian Health | Pass | Pass | None detected |
| First Capital | Pass | Pass | None detected |

Evidence: `/tmp/source-tower-postfix-check/result.json` and screenshots in `/tmp/source-tower-postfix-check/`.

## Artifact And Deliverable Capability

Apex event tested: `8f65a595-de2e-4d33-9f9a-9c1b6db67e51`

Generated artifact route tested: `/api/v1/source/:eventId/artifacts/generate`

| Stage | Artifact family | Result | Parser | Vector | Graph |
| --- | --- | ---: | --- | --- | --- |
| Strategy | `sourcing_strategy` | Pass | `pending` | `pending` | `pending` |
| Scope | `scope_document` | Pass | `pending` | `pending` | `pending` |
| RFP | `rfp` | Pass | `pending` | `pending` | `pending` |
| Pricing | `pricing_workbook` | Pass | `pending` | `pending` | `pending` |
| Executive Decision | `decision_brief` | Pass | `pending` | `pending` | `pending` |
| Transition | `transition_risk_register` | Pass | `pending` | `pending` | `pending` |
| Value | `value_ledger` | Pass | `pending` | `pending` | `pending` |

Interpretation: generated artifacts are persisted and downloadable as markdown-backed registry rows, but they do not enter parser/vector/graph immediately. That is honest current behavior, not full knowledge-layer completion.

Upload route tested: `/api/v1/source/:eventId/artifacts/upload`

| Upload | Artifact family | Result | Parser | Structured extraction |
| --- | --- | ---: | --- | --- |
| Scope workshop notes markdown | `workshop_output` | Pass | `parsed` | 1 chunk; facts for decision, action item, requirement, risk/gap, metric/baseline, artifact summary |
| Pricing workbook markdown | `pricing_workbook` | Pass after PR #1439 | `parsed` | 6 pricing components extracted; false positives removed |

Evidence:

- `/tmp/source-artifact-capability-live-check/result.json`
- `/tmp/source-artifacts-db-verification.json`
- `/tmp/source-pricing-upload-live-check/result.json`
- `/tmp/source-pricing-db-verification.json`

## Pricing Analysis Support

Current working capability:

- Markdown pricing uploads parse into `source_pricing_components`.
- The parser extracts explicit commercial terms such as fixed monthly fee, variable ticket fee, transition credit, productivity glidepath, offshore hourly rate, and onshore hourly rate.
- After PR #1439, the parser no longer treats headings or year indexes as pricing amounts.

Current limitation:

- This is structured extraction, not a complete pricing optimization engine.
- No full TCO workbook calculation, benchmark labor-rate database, onshore/offshore rate model, or negotiation-strategy scoring engine was proven in this crawl.

## Known Gaps

| Gap | Severity | Impact |
| --- | --- | --- |
| Stage advancement API allows admin progression by stage key; evidence-based gate enforcement was not proven. | Major | A real pilot still needs gate criteria enforcement before stages can be called Tier A. |
| Generated artifacts persist but stay parser/vector/graph `pending`. | Major | Agent-generated deliverables are stored, but not yet automatically available as parsed retrieval evidence. |
| Source artifact upload parses text/markdown/csv synchronously; binary PDF/DOCX parsing was not proven here. | Major | Real RFP/vendor-response PDFs may land as registry rows but require async parser pipeline verification. |
| First Capital Source events persist under legacy `client_key=arcturus`. | Major | Functional isolation held, but naming/data-plane cleanup is still needed for a clean First Capital tenant story. |
| Demo sign-in occasionally remains on `/sign-in` after ticket submission; rerun succeeds. | Major UX/Auth | Not Source-specific, but crawl stability and tester confidence suffer. |

## Current Usability Tier

| Capability | Tier | Reason |
| --- | --- | --- |
| Client admin Source access and tenant-scoped event browsing | A | Verified for all three clients. |
| Source event creation and admin approval | A- | Verified for all three clients; self-approval test pattern works. |
| 11-stage state progression | A- for state machine, B for governance | State persistence works; evidence gates need stronger proof/enforcement. |
| Tower handoff after Value | A- | Fixed and verified for all three clients. |
| Generated artifacts | B | Persisted, but downstream parsing/vector/graph remains pending. |
| Markdown workshop/meeting notes ingestion | A- | Parsed into chunks and facts; vector/graph pending. |
| Pricing upload extraction | B+ | Structured components work after PR #1439; full TCO/benchmark optimization not proven. |
