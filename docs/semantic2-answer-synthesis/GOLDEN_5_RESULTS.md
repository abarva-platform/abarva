# Golden-5 Results — SkyHarbor, live opus-4-8

_Semantic2 answer-quality spike. Retrieval from the local v4 dataset (deterministic, no DB); synthesis by `claude-opus-4-8` via the injectable composer; answers below are verbatim live output (run ~63s for all five). Raw packets: `out/golden/results.json`._

**Architecture proven:** deterministic adapter produces facts/metrics/gaps/citations → bound prompt → Claude phrases ONLY the prose fields → code merges into the canonical `Semantic2AnswerPacket`. Claude invents no fact, number, citation, or gap.

**Safety (all five):** `noRowCountLead ✓ · noRawIdsInProse ✓ · noDebugLanguage ✓ · tenantFencePassed ✓`.

---

## S2-HOME-ITORG-001 · "What do we know about SkyHarbor's IT organization and ownership model?"
> SkyHarbor Air runs a portfolio-based technology organization under the Office of the Chief Digital & Technology Officer, with eighteen distinct portfolios spanning enterprise platforms, cloud, data, operations, cybersecurity, and digital commerce. Total technology spend across these portfolios reaches $4.87B, concentrated in the largest enterprise-technology and operations portfolios. Accountability is structured around executive owner roles rather than named individuals.

**Missing evidence:** Named individuals behind each executive owner role are not recorded. Application ownership is captured as a domain label, not a team identifier that joins to the IT org, so per-team system attribution is unavailable.
**Exhibit:** table — IT portfolios by budget (loaded).

## S2-HOME-APP-001 · "Which business capabilities are most dependent on mission-critical systems?"
> Eight capabilities carry critical status, and they cluster in the airline-operations value streams — IROPS recovery decisioning and MRO predictive maintenance under Operate airline, crew recovery and legality and revenue management under Serve customer, flight planning and dispatch and NDC offer/order retailing under Grow revenue. Airport turn management and baggage tracking and recovery round out the critical set under Run enterprise and Protect and govern respectively. These are the capabilities most exposed to mission-critical and high-criticality systems, though the dependency is read at the domain and criticality level rather than from explicit system links.

**Missing evidence:** Explicit capability-to-system links are not resolvable: the relationship graph's 5,200 edges use node identifiers that do not map to the loaded application, capability, or team records. Per-team ownership is also absent, with attribution reliable only at the domain level.
**Exhibit:** table — Business-critical capabilities (loaded). _(The honesty test: it described dependency at the domain level and named the exact edge-resolution gap, instead of fabricating links from an unresolvable graph.)_

## S2-HOME-DATA-001 · "What does the loaded data and analytics estate tell us, and what is still missing?"
> The data and analytics estate is well described on technical dimensions: every product carries a platform, a lifecycle status, and a trust score. Databricks leads on product count and shows a healthy average trust score of 78.5. The one thing the estate cannot tell us is who is accountable for any of it — there is no owner.

**Missing evidence:** An accountable owner for each data product. Platform, status, and trust are present; the ownership field is not.
**Exhibit:** table — Data & analytics estate by platform. _(Computed SkyHarbor's actual gap — ownership — and explicitly contradicted the assumed "platform missing" gap.)_

## S2-HOME-VENDOR-001 · "Which vendors create the largest operational dependency footprint?"
> Teradata carries the heaviest operational dependency footprint, supplying 29 critical applications — the most of any vendor — alongside more than 5,300 integrations and a $39M annual run-rate. Jeppesen and TCS follow closely, each supplying 26 critical applications, with TCS running far higher integration cost at $104M. ServiceNow and Workday round out the concentration, with ServiceNow the most expensive at $131M annually despite a slightly lower critical-app count.

**Business implication:** Dependency and cost do not track together: the vendor with the most critical apps (Teradata) is among the lower-cost, while the highest-cost vendors (ServiceNow, TCS) supply fewer critical apps but carry large run-rates — operational risk and financial exposure point at different vendors.
**Missing evidence:** Application ownership is a domain label, not a team id; the relationship graph's endpoints don't map to loaded IDs (edge-level dependency inferred from criticality); Jeppesen's run-rate is not recorded.
**Exhibit:** table — Vendor operational dependency footprint (derived from the application inventory, not the graph).

## S2-INTEL-AI-001 · "Where should SkyHarbor place the next $30M in AI?" (ANALYZE)
> Anchor the next $30M on the IROPS / disruption-recovery estate — IROPS recovery decisioning first, with MRO predictive maintenance and crew recovery and legality as the connected second wave. These are the critical, low-maturity capabilities where SkyHarbor's own operational dependency is concentrated, and they reinforce each other inside disruption events.

**Tenant fact vs corpus:** _"The airline corpus suggests disruption-recovery and crew-legality automation are where carriers see the steepest gains — useful as directional confirmation, but the decision here rests on SkyHarbor's own concentration of critical, low-maturity capabilities."_
**Missing evidence (gates scaling):** no named accountable owner for the portfolios; data products feeding the models have no owner field; no quantified value/baseline per capability to size the split.
**Recommended next path:** phase the $30M — assign owners → fund a contained IROPS anchor with a baseline → gate crew/MRO tranches on proven lift + closed data ownership.

---

## Acceptance check (GPT's criteria)
| Criterion | Result |
|---|---|
| All 5 executive-readable | ✅ |
| All 5 use semantic facts/relationships/metrics/gaps | ✅ |
| No answer starts with row counts | ✅ (`noRowCountLead` true ×5) |
| Each factual claim has citations / source proof | ✅ (deterministic tables + F03/F05/F09/F11 citations) |
| Missing evidence is specific | ✅ (named-owner / unmapped-label / unresolvable-graph / no-owner-field) |
| No UI/debug labels leak | ✅ (`noRawIdsInProse`, `noDebugLanguage` true ×5) |
| Deterministic tables from semantic facts/metrics | ✅ |
| No deployment | ✅ (local spike only) |

**Status: the 5 golden questions pass.** Retrieval is local-dataset (the same composer wired to live Azure via the audited client is the follow-on / substrate-proof).
