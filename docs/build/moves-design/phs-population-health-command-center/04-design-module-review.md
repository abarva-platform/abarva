# PHS Population Health Command Center — Design Module Review

Date: 2026-06-05
Status: Implementation readiness review

## Verdict

Proceed with **PHS-first** as a distinct hero use case from Lakeshore. The
design package is strong enough to drive a P0 audit and governed loader pack.
It is not strong enough to claim a complete demo until the evidence chain is
materialized.

## Decisions Carried Forward

| Decision | Verdict | Rationale |
|---|---|---|
| Separate PHS from Lakeshore | Accepted | PHS is healthcare integrated payer-provider; Lakeshore is finance/treasury. Mixing them weakens both demos. |
| Integrated payer-provider frame | Accepted | The differentiator is the plan-provider data unification problem, not generic AI strategy. |
| Databricks target architecture | Accepted | The existing modernization and healthcare corpus now carries Databricks, Unity Catalog, medallion, Epic, ERP, and metadata-driven ETL doctrine. |
| Moves-led, Source optional | Accepted | Source should fire only if procurement is in scope after strategy, architecture, value, and mobilization evidence exist. |
| No opportunity without evidence | Accepted as hard gate | This is the product trust rule. It prevents template theater and fake maturity. |

## Required Before Runtime Build

| Category | Required evidence |
|---|---|
| Public evidence | PHS public source records loaded with citation keys and date/source metadata |
| Synthetic internal evidence | Workload inventory, data quality baseline, rate card, gate criteria, approval personas |
| Corpus | Databricks modernization and healthcare corpus packs validated through governed loader path |
| Moves | Existing Meridian visible objects audited for show / hide / rebuild |
| Approvals | Named synthetic owners and approval records for every stage gate |
| QA | Browser crawl proving artifact open, download, evidence-link, and gate behavior |

## Open Risks

| Risk | Severity | Handling |
|---|---|---|
| Public PHS facts presented as confidential Meridian facts | High | Label all public facts as public evidence and all internal facts as synthetic demo evidence |
| Current Meridian profile conflict | High | Use the corrected Meridian profile only where the tenant is Meridian; use PHS facts only as public inspiration/evidence |
| Databricks architecture overreach | Medium | Architecture claims require workload inventory support |
| Value-case fake precision | Medium | Use baseline and forecast ranges only; no realized value |
| Source appearing too early | Medium | Source event requires Phase 5 partner-led delivery decision |

## Do Not Build Yet

- BAFO, Selection, Transition, or Value Realization
- realized savings or actual PHS confidential metrics
- autonomous clinical action
- direct database seed side-loads
- Source event without approved delivery-model evidence

## First Implementation Slice

The first PR after this design package should be a **PHS loader evidence pack
contract**, not the full demo. It should define schemas, fixture templates,
validation rules, and crawl expectations for Phase 0 Setup.
