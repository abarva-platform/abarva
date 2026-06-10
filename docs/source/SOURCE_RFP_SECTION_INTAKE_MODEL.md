# RFP Section Completeness & Intake Model — DRAFT for sign-off

The rule: **no section ships silently weak.** Before/while generating, the Nexus
agent resolves every section to one of three modes, and drives an intake loop to
capture what's missing. This turns "EVIDENCE BLOCKED" from a dead end into an
action — either *ask for it* or *hand it to the client to own*.

## The four modes (per section)
1. **AUTO-GOVERNED** — generated from governed `agent_ready` client facts (cited). e.g. current-state cost/SLA/vendor/app exhibits.
2. **AUTO-TEMPLATE** — standard boilerplate Claude generates freely (NOT client data): instructions to bidders, definitions, response format, standard T&Cs scaffolding, form structures. Client reviews; flagged "standard template — review."
3. **ELICIT** — client-specific data we don't have but *can capture*. Nexus **asks targeted intake questions** (scoped to only what's missing); answers flow through the governed loader → become agent_ready evidence → section regenerates as AUTO-GOVERNED.
4. **CLIENT-COMPLETE** — client judgment/policy the system must not invent (final SLA targets, evaluation weights, legal sign-off, budget ceiling, security/compliance specifics). Emitted as a **guided placeholder** with the exact prompt for what the client must decide.

**Governing principle (don't-ask-what-we-know, scoped-not-exhaustive):** the intake
only asks for inputs not already governed; it never re-asks what's in the data
plane; questions are scoped and carry accepted formats so answers commit cleanly.

## AMS RFP — section → minimum-viable inputs → mode

| # | Section | Minimum-viable inputs | Mode | If missing |
|---|---|---|---|---|
| 1 | Instructions to bidders / submission | issue date, Q&A window, response-due, orals, award, contacts, validity period | AUTO-TEMPLATE + **ELICIT** (timeline, contacts) | ask: procurement timeline + contact |
| 2 | Executive overview & objectives | strategic objective, why-now, scope intent | AUTO-GOVERNED + **ELICIT** (objectives if uncaptured) | ask: 3 objectives + drivers |
| 3 | Scope of services by tower | tower list, app/CMDB estate, in/out-of-scope, retain-vs-outsource per tower | AUTO-GOVERNED (towers/apps ✓) + **ELICIT** (scope decisions) | ask: per-tower in-scope + retained |
| 4 | Current-state context (volumes, cost, SLA) | app inventory ✓, run cost ✓, SLA ✓, **ticket/incident/change volumes by tower & priority** | AUTO-GOVERNED (3/4 ✓) + **ELICIT** (volumes ✗) | ask: 12-mo ticket volumes L1/L2/L3, P1–P4 by tower |
| 5 | SLA/KPI schedule & credits | current SLA ✓, **target SLAs**, **credit-at-risk % + earn-back policy** | AUTO-GOVERNED (current ✓) + **CLIENT-COMPLETE** (targets/policy) | placeholder: target SLA + credit policy |
| 6 | Resource-unit & pricing schedule | tower list ✓, **resource-unit volumes**, **staffing baseline**, budget ceiling | AUTO-TEMPLATE (structure) + **ELICIT** (volumes/staffing) + CLIENT-COMPLETE (ceiling) | ask: staffing baseline + RU volumes |
| 7 | Productivity & automation commitments | **glide-path targets Y1–Y3** | **ELICIT** | ask: productivity % targets |
| 8 | Transition & knowledge transfer | **transition constraints, parallel-run, KT, blackout windows** | **ELICIT** (✗ today) | ask: transition constraints set |
| 9 | Retained organization & governance | **retained-org model, governance cadence** | **ELICIT / CLIENT-COMPLETE** (✗ today) | ask: retained functions + headcount |
| 10 | Security & compliance | **required frameworks (SOC2/ISO), data residency, background checks** | **CLIENT-COMPLETE** + AUTO-TEMPLATE scaffold | placeholder: compliance requirements |
| 11 | Commercial terms / Sample Agreement | standard T&Cs, **liquidated damages, audit, exit, data protection** | AUTO-TEMPLATE (scaffold) + **CLIENT-COMPLETE** (legal sign-off) | placeholder: legal/contract review |
| 12 | Response instructions & evaluation criteria | response format, **evaluation weights, disqualifiers, min-qualifications** | AUTO-TEMPLATE (format) + **CLIENT-COMPLETE** (weights) | placeholder: weighted criteria |
| 13 | Mandatory forms/exhibits | references, insurance, disclosures, intent-to-bid, diversity/subcontracting | AUTO-TEMPLATE (forms) + **CLIENT-COMPLETE** (diversity policy) | placeholder + form templates |
| 14 | Current-state exhibits | inventory, software list, **transaction/volume/utilization summaries** | AUTO-GOVERNED (inventory ✓) + **ELICIT** (volumes ✗) | ask: utilization/volume summaries |

## The Nexus intake question pack (the gaps it asks for — scoped to what's NOT governed)
1. **Procurement timeline & contacts** — issue, Q&A close, response-due, orals, award, transition-start; sourcing lead contact.
2. **Ticket/incident/change volumes** — last 12 months by tower and priority (L1/L2/L3; P1–P4); FCR rate.
3. **Scope decisions** — per tower: in-scope / out-of-scope / retained-in-house; single- vs multi-tower award intent.
4. **Transition constraints** — blackout windows, parallel-run requirement, knowledge-transfer expectations, incumbent-cooperation terms, target go-live.
5. **Retained-organization model** — functions kept in-house (governance, architecture, vendor mgmt), target retained headcount.
6. **Productivity/automation targets** — Y1–Y3 glide-path %, gainshare stance.
7. **SLA targets & credit policy** — target availability/resolution per critical service, at-risk %, earn-back, chronic-breach trigger.
8. **Evaluation model** — criteria weights, disqualifiers, minimum qualifications.
9. **Commercial/legal** — budget ceiling/NTE, liquidated-damages stance, exit/termination-assistance, audit rights, data-protection/residency.
10. **Compliance & diversity** — required frameworks (SOC2/ISO/airline-specific), background checks, HUB/MBE/WBE/subcontracting requirements.

Each answer is captured with an accepted format, committed via the governed loader,
promoted, and the dependent section(s) regenerate as AUTO-GOVERNED. What the client
declines to provide stays **CLIENT-COMPLETE** with a guided placeholder — visible,
never silently fabricated.

## Definition of "complete enough to issue"
An RFP is **issue-ready** when: all AUTO-GOVERNED sections are cited; all ELICIT gaps
are either captured or explicitly converted to CLIENT-COMPLETE; every CLIENT-COMPLETE
block carries a guided prompt; and a **completeness scorecard** (sections ready /
elicited / client-to-complete) is attached to the front of the package.

---
**Open decisions:** the 4-mode model; intake delivery (interactive Nexus chat vs an upfront structured intake form vs both); whether to build the completeness engine + intake loop now and regenerate the SkyHarbor RFP through it.
