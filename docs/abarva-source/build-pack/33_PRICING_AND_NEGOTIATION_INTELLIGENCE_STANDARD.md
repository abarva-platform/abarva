# 33 Pricing and Negotiation Intelligence Standard

## 1. Product Principle

Related operational slice: `../NEXT_SLICE_PLAN_SOURCE_ARTIFACT_INGESTION_AND_PRICING_INTELLIGENCE.md` defines how AMS proposal/pricing files become parsed pricing components, commercial exceptions, graph edges, context-broker inputs, generated workbooks, BAFO packs, and approval-ready decision artifacts.

AbarVa Source should not depend on paid third-party benchmarks for MVP.

Core pricing and negotiation intelligence should come from:

- client baseline data
- AbarVa-authored sourcing patterns
- vendor proposal data
- pricing normalization logic
- commercial trap detection
- negotiation strategy
- scorecard governance
- value ledger linkage

External benchmarks are optional enrichment, not required. If external benchmark data is unavailable, Source should still help users normalize proposals, expose assumptions, identify traps, draft negotiation questions, and explain value risk using the client baseline and AbarVa pattern intelligence.

## 2. Pricing Intelligence Goals

Source pricing intelligence should help users understand:

- what vendors are pricing
- what is excluded
- what assumptions are driving price
- what price is comparable versus not comparable
- what risks sit behind lower pricing
- what negotiation levers exist
- how pricing affects projected value

The goal is not to declare a market price. The goal is to make the commercial decision evidence-backed, comparable, and governable.

## 3. Pricing Data Model

Every vendor commercial response should be normalized against these fields where applicable:

| Field | Definition | Evidence source |
| --- | --- | --- |
| Base annual run cost | Recurring steady-state annual service fee. | Vendor proposal, pricing workbook. |
| Transition cost | Knowledge transfer, mobilization, onboarding, shadow support, and cutover cost. | Vendor proposal, transition plan. |
| One-time setup cost | Non-recurring setup cost that is not transition run takeover. | Vendor proposal, implementation schedule. |
| Optional services | Services priced separately from the base scope. | Vendor proposal, exceptions, commercial appendix. |
| Excluded services | Required or expected services not included in price. | Vendor exceptions, scope response. |
| Volume assumptions | Demand volumes assumed in the price. | Pricing workbook, vendor assumptions. |
| Application count assumption | Number of applications included in the commercial model. | Vendor proposal, client application inventory. |
| Ticket volume assumption | Incident, problem, request, and enhancement volume assumed. | Vendor pricing workbook, ITSM baseline. |
| Severity mix assumption | Distribution of tickets by severity or priority. | Vendor assumptions, ITSM history. |
| Support hours | Coverage window, time zones, and out-of-hours assumptions. | RFP scope, vendor proposal. |
| SLA assumptions | Response, resolution, availability, and credit assumptions. | SLA schedule, vendor response. |
| Rate escalation | Annual rate increase or indexation rule. | Commercial terms. |
| Offshore/onshore mix | Delivery location and role mix assumed in price. | Staffing plan, transition plan. |
| Automation/productivity assumption | Productivity improvement or automation savings assumed. | Automation roadmap, pricing narrative. |
| Change-order exposure | Work likely to fall outside included price and trigger additional fees. | Exceptions, rate cards, scope gaps. |
| Price-down commitments | Contracted reductions in future-period run cost. | Commercial terms, BAFO response. |
| Gainshare/outcome-based terms | Shared value or outcome-linked economics. | Commercial terms, measurement plan. |
| Contract term length | Initial term used to price the deal. | Commercial schedule. |
| Renewal/reopener provisions | Pricing reset, benchmark, renewal, or renegotiation rights. | Contract terms, pricing appendix. |

## 4. Pricing Normalization

Source should produce normalized views that separate price, assumptions, exclusions, and risk.

| Normalized view | Purpose |
| --- | --- |
| Annual run cost | Compare recurring steady-state run fees across vendors. |
| Year 1 / year 2 / year 3 cost | Expose transition, ramp, price-down, and escalation effects. |
| Transition-inclusive cost | Prevent transition exclusions from hiding true year-one economics. |
| Cost per application | Normalize portfolio-based AMS or platform managed services pricing. |
| Cost per ticket | Normalize demand-linked support economics. |
| Cost per severity band | Show whether critical incidents or low-priority work drive pricing. |
| Cost per FTE equivalent | Compare capacity-based proposals without treating staffing as the only value measure. |
| Cost by tower/service category | Compare application, infrastructure, data platform, service desk, security, tooling, and governance scope. |
| Included versus excluded services | Make required scope gaps explicit. |
| Comparable scope adjustment | Adjust proposals to a common scope before scorecard use. |
| Risk-adjusted commercial view | Show how exclusions, weak commitments, or assumption risk change the decision. |

Pricing is not comparable until scope, volumes, service levels, transition cost, exclusions, and retained team burden are visible.

## 5. Commercial Trap Detection

Commercial trap detection should produce a clear signal, explanation, impact, Nexus guidance, negotiation question, and mitigation.

| Trap | Detection signal | Why it matters | Impact | Nexus guidance | Negotiation question | Mitigation |
| --- | --- | --- | --- | --- | --- | --- |
| Low base fee but high change-order rates | Base run cost is low while rate card or out-of-scope fees are high. | Apparent savings may move into change orders. | Savings erode after award. | Normalize base plus likely change exposure before BAFO. | "Which activities trigger change orders, and what annual change volume is assumed?" | Cap rates, define included services, and include expected change volume in evaluated cost. |
| Transition excluded | Transition, KT, onboarding, or shadow support is missing or separately priced. | Vendor change cost is hidden. | Year-one cost surprise and takeover risk. | Treat transition as evaluated cost and selection risk. | "Is KT, mobilization, shadow support, and cutover included in the fixed price?" | Require transition-inclusive pricing and KT exit criteria. |
| Release support excluded | Proposal excludes release windows, hypercare, deployment support, or CAB participation. | Operational support may fail during change windows. | Service gaps and later change orders. | Flag release support as required scope before BAFO. | "Please confirm whether release support and hypercare are included in AMS scope or priced separately." | Add release support line item and included-hours rule. |
| Minor enhancements excluded | Proposal excludes project work without defining minor enhancement thresholds. | Run support and small change boundaries become commercial leakage. | High change-order exposure. | Ask for threshold, capacity, and examples. | "What minor enhancement size, hours, and monthly capacity are included in the base fee?" | Define threshold, capacity bank, and approval rules. |
| Tooling excluded | Vendor assumes client pays licenses, integrations, reporting, or tool administration. | Hidden cost or access delays can undermine savings. | Total cost is understated. | Add tooling responsibility and cost to normalized view. | "Which tools, licenses, integrations, and reporting responsibilities are included?" | Assign tooling responsibility and price required tools. |
| Security/compliance excluded | Security tasks, audits, evidence collection, or remediation support are exceptions. | Compliance obligations may remain unfunded. | Audit, access, and remediation risk. | Route to Sentinel and Steward before selection. | "Which security, compliance, audit, and access-control obligations are included in run support?" | Add security responsibility matrix and approval gate. |
| Volume assumptions too low | Vendor assumes lower app count, ticket volume, severity mix, or service hours than baseline. | Price cannot support actual demand. | Underpriced proposal and later repricing. | Normalize against client baseline volumes. | "Your assumed volumes are below the client baseline. Does the fixed fee cover baseline demand?" | Lock volume bands and repricing rules. |
| Weak SLA credits | Credits are symbolic, capped too low, or disconnected from criticality. | Service accountability may not match business risk. | Vendor has weak financial consequence for misses. | Compare SLA credit strength as scorecard evidence. | "What remedies apply for repeated misses on critical applications?" | Tie credits to criticality, chronic miss rules, and service remedies. |
| Automation savings not committed | Proposal describes automation but lacks numeric commitments or contract language. | Future productivity may be aspirational. | Value confidence is overstated. | Keep automation value low confidence until committed. | "What productivity improvement is committed, by when, and how will it reduce price or improve service?" | Add price-down schedule, gainshare, or measurable productivity KPI. |
| Rate escalation high | Annual escalation exceeds the client's expected posture or lacks a cap. | Multi-year TCO drifts upward. | Savings decay over term. | Model year 1 / year 2 / year 3 cost before ranking. | "Can annual escalation be capped or tied to a transparent reopener mechanism?" | Cap escalation or add benchmark/reopener clause. |
| Offshore mix unrealistic | Delivery mix assumes heavy offshore work despite tribal knowledge, criticality, or transition risk. | Labor arbitrage may create service instability. | Transition and service risk offset savings. | Link delivery mix to KT readiness and app criticality. | "Which roles remain onshore during transition and for critical application support?" | Phase offshore mix, require KT gates, and preserve critical role coverage. |
| KT not priced | Proposal assumes client-provided KT without priced vendor responsibility or exit criteria. | Client retains hidden workload and transition risk. | Year-one burden and failed takeover risk. | Treat KT as both cost and readiness risk. | "How many KT hours are included, who provides them, and what exit criteria prove readiness?" | Add KT plan, priced effort, SME calendar, and acceptance criteria. |
| Retained team burden hidden | Proposal assumes internal triage, SME support, governance, or shadow delivery without pricing it. | Savings can be overstated. | Client pays twice through vendor fee and retained effort. | Add retained team burden to risk-adjusted economics. | "Which client roles and hours does the proposal assume after transition?" | Build retained/vendor RACI and include retained cost in evaluation. |
| Out-of-hours support excluded | Coverage is business-hours only or after-hours support is optional. | Critical systems may lack required support. | Service gap or premium add-on. | Compare against support-hours baseline. | "Is out-of-hours, weekend, holiday, and major incident support included?" | Define coverage tiers and include required hours in base comparison. |
| Optional services hiding required scope | Required items appear as options rather than base scope. | Vendor can appear cheaper while omitting needed work. | Non-comparable proposal. | Move required options into normalized base cost. | "Which optional services are necessary to meet the RFP scope and SLA expectations?" | Reclassify required options as included scope before scoring. |

## 6. Negotiation Strategy Model

Negotiation levers should be selected based on evidence, value impact, and risk rather than applied mechanically.

| Lever | When to use | Evidence needed | Expected value impact | Risk | Responsible owner | Value ledger impact |
| --- | --- | --- | --- | --- | --- | --- |
| Volume band lock | Baseline volumes are reliable and vendors use lower assumptions. | App count, ticket volume, severity mix, service hours. | Prevents repricing and protects run-rate savings. | Bad baseline can lock wrong demand band. | Procurement with service owner. | Improves savings confidence if bands match evidence. |
| Price-down schedule | Productivity should improve after transition. | Baseline cost, automation roadmap, productivity measure. | Creates year-two and year-three savings. | Vendor may underinvest if target is unrealistic. | Procurement and finance. | Raises projected savings when contractually committed. |
| Automation commitment | Ticket drivers or manual tasks are automatable. | Root-cause data, automation baseline, improvement roadmap. | Reduces run cost or improves service capacity. | Claims may stay aspirational. | Technology owner and vendor manager. | Improves value confidence only with measurable commitment. |
| Gainshare | Outcomes are measurable and value attribution is clear. | Baseline, measurement owner, attribution method. | Aligns vendor incentives to value creation. | Disputes over causality. | Finance and sponsor. | Adds value source with attribution caveat. |
| SLA credits | Service reliability or criticality risk matters. | SLA baseline, app criticality, service history. | Improves accountability and remediation leverage. | Credits may be too small or capped. | Service owner and legal. | Improves risk posture more than savings. |
| Transition cost inclusion | Vendor change, weak documentation, or compressed timeline creates transition risk. | KT plan, app docs, SME availability, transition schedule. | Prevents year-one cost leakage. | Vendor may shift cost into base fee. | Procurement and transition owner. | Improves year-one savings confidence. |
| KT obligations | Knowledge is tribal or incumbent support is weak. | Runbooks, SME calendar, application criticality. | Reduces takeover failure risk. | Client SMEs may not be available. | Transition owner and app owners. | Reduces variance risk. |
| Tooling responsibility | Tool cost, licenses, integrations, or reporting ownership are unclear. | Tool inventory, license owner, integration needs. | Reduces hidden cost and access delay. | Vendor tooling preference may conflict with client stack. | IT operations and procurement. | Improves normalized cost completeness. |
| Release support inclusion | Release calendar, hypercare, or deployment support is material. | Release history, deployment calendar, support-hours baseline. | Avoids recurring change-order leakage. | Scope can grow without capacity cap. | Release manager and service owner. | Reduces variance risk. |
| Minor enhancement inclusion | Small change demand is recurring. | Enhancement volume, backlog, threshold definition. | Reduces change-order leakage. | Boundary disputes can persist. | Product owner and procurement. | Improves projected savings and scope confidence. |
| Rate escalation cap | Multi-year term includes annual escalation. | Proposed escalation, term length, client finance posture. | Protects multi-year TCO. | Cap may trade off against base price. | Finance and legal. | Improves year-two and year-three savings confidence. |
| Productivity roadmap | Buyer wants run-and-improve, not just steady-state support. | Ticket drivers, automation maturity, service baseline. | Creates sustained improvement path. | Roadmap may remain vague. | Technology owner and vendor manager. | Adds future value source with confidence tied to evidence. |
| Benchmarking/reopener clause | Term is long or demand is uncertain. | Baseline, benchmark source, review cadence. | Allows mid-term price correction. | Benchmark disputes or weak source quality. | Procurement and legal. | Reduces long-term variance risk. |
| Scope exception closure | Vendor exceptions undermine comparability. | Exceptions log, RFP scope, required service list. | Converts hidden risk into priced and governed scope. | May raise vendor price. | Sourcing lead and legal. | Improves evidence confidence and risk-adjusted value. |
| BAFO clarification | Pricing ambiguity remains after proposal review. | Proposal gaps, normalized comparison, scorecard risk. | Improves comparability before award. | Vendors may respond incompletely. | Sourcing lead and procurement. | Improves selection confidence. |

## 7. Vendor Comparison and Scoring

Pricing intelligence connects to scorecards through:

- commercial competitiveness
- scope completeness
- pricing transparency
- transition cost clarity
- assumption risk
- automation commitment quality
- change-order exposure
- evidence confidence

Lowest price is not always best. Pricing must be normalized before scoring, and excluded scope should reduce the risk-adjusted commercial score even when the base run cost is attractive.

Commercial score should not overpower transition risk, security risk, service stability, or evidence confidence without written rationale. If a low-price proposal depends on weak KT, excluded release support, unsupported automation, or low demand assumptions, Nexus should explain the risk and Sentinel should label unsupported claims before Steward allows a selection package to move forward.

## 8. BAFO / Negotiation Pack

Source should support a BAFO / negotiation pack as a structured output, not as an ungrounded generated document.

The pack should include:

- vendor-specific negotiation questions
- assumption lock list
- excluded scope list
- pricing normalization summary
- commercial risk summary
- BAFO priorities
- recommended asks
- executive tradeoff view

Example questions:

- "Your pricing assumes 1,200 incidents/month, but the client baseline shows 1,850. Please clarify whether the fixed fee covers current volume or only the lower assumed volume."
- "Your proposal excludes release support. Please confirm whether release support is included in AMS scope or priced separately."
- "Your automation roadmap includes 18 percent productivity improvement, but the commercial model does not share savings. Please provide a gainshare or year-two price-down mechanism."

BAFO guidance should identify what must be locked before award, what can be handled in contracting, and what should block selection.

## 9. Value Ledger Linkage

Pricing negotiation updates the Value Ledger through:

- projected savings
- confidence level
- value source
- assumptions
- timing
- measurement owner
- variance risk

Value changes should only improve confidence when the commercial commitment is supported by evidence and contract language.

Example:

If Vendor A accepts a year-two automation price-down, projected savings increases and confidence improves only if contract language supports the commitment.

If a vendor lowers price by excluding transition or required support scope, projected savings should not increase without a corresponding risk adjustment.

## 10. Agent Behavior

### Nexus

- identifies pricing ambiguity
- explains normalized comparison
- recommends negotiation questions
- links to next action
- separates lowest price from best risk-adjusted commercial outcome
- should not cite or use pricing evidence that is not available as usable evidence

### Sentinel

- checks whether pricing claims are supported by proposal evidence
- flags exclusions and unsupported automation claims
- labels low-confidence, stale, restricted, or uncited pricing data
- verifies that normalized comparisons use the same baseline assumptions

### Atlas

- summarizes executive tradeoffs: price versus transition risk versus value confidence
- explains where commercial savings are credible, uncertain, or dependent on negotiation
- highlights when price savings shift risk to transition, retained teams, security, or service quality

### Steward

- enforces approval/gate requirements before vendor selection or BAFO release
- requires scorecard lock, pricing completeness, and approval owner before selection
- routes unresolved commercial exceptions to the right owner
- blocks realized-value claims without measurement evidence and owner

## 11. Benchmark Policy

Benchmark policy:

- client baseline is primary evidence
- AbarVa pattern intelligence is guidance
- third-party benchmarks are optional enrichment
- public data is low-confidence unless cited
- paid benchmark data should never be required for MVP
- when benchmarks are missing, Nexus should say so clearly

Example Nexus response:

"I do not have licensed market benchmark data for this event. I can still normalize vendor proposals against your client baseline, identify excluded scope, compare assumptions, flag commercial traps, and recommend negotiation levers."

Benchmark use must preserve source labeling:

- client baseline: highest relevance when current and usable
- vendor proposal: evidence for vendor-specific assumptions and commitments
- AbarVa pattern: guidance and expected risk pattern, not market fact
- public source: cited and low confidence unless verified
- licensed benchmark: optional enrichment with source and permission constraints

## 12. Acceptance Criteria

This spec is complete when it defines:

- pricing data model
- normalization logic
- trap catalog
- negotiation levers
- BAFO pack
- scorecard linkage
- value ledger linkage
- benchmark policy
- agent responsibilities

This spec does not implement a pricing engine, benchmark database, UI, model call, API route, upload/parsing behavior, RFP generation, or value ledger runtime. It defines the product and governance standard for later scoped implementation.
