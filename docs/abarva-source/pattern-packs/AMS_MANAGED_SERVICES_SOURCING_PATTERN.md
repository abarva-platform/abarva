# AMS Managed Services Sourcing Pattern

## 1. Pattern Identity

| Field | Value |
| --- | --- |
| Pattern id | `source.ams-managed-services-sourcing.v1` |
| Name | AMS Managed Services Sourcing |
| Type | Structural Pattern, Guidance Pattern, Artifact Pattern, Validation Pattern, Negotiation Pattern, Failure Mode Pattern |
| Domain | Source |
| Sourcing archetype | Application Managed Services |
| Default rigor | Enhanced; Strategic when value, criticality, security, or transition risk is high |
| Applicable deal sizes | Typically mid-market through enterprise; especially useful when annual run spend, critical applications, or vendor transition risk is material |
| Applicable stages | Strategy, Scope, RFP, Vendor Responses, Evaluation, Negotiation, Transition, Verify / Value Realization |
| Owner | AbarVa Source pattern steward |
| Version | 0.1 |
| Status | Authored draft for review |

## 2. Executive Thesis

Application Managed Services sourcing is complex because the buyer is not just buying labor. The buyer is transferring accountability for operational continuity, issue resolution, release support, minor enhancements, knowledge retention, application stability, service governance, and continuous productivity improvement across a living application estate.

Generic RFPs fail in AMS because they ask vendors to price "application support" without a defensible baseline for portfolio scope, ticket volumes, support levels, service hours, criticality, minor enhancement boundaries, retained responsibilities, tooling, transition assumptions, and service outcomes. When those inputs are weak, vendors either price conservatively, hide exclusions, push risk into change orders, or submit proposals that cannot be normalized.

This pattern helps clients:

- Define AMS scope clearly enough for comparable vendor pricing.
- Establish a minimum baseline of demand, cost, ownership, criticality, and service expectations.
- Separate retained responsibilities from vendor responsibilities.
- Generate AMS-specific RFP sections, pricing templates, scorecards, and vendor Q&A.
- Detect commercial traps before BAFO and contracting.
- Manage transition risk and knowledge transfer.
- Track projected and realized value through vendor consolidation, productivity, SLA improvement, and reduced leakage.

## 3. Applicability

### Use This Pattern When

- The scope is application managed services.
- The client is transforming the run/support operating model.
- The client wants vendor consolidation across application support vendors.
- The client is outsourcing application support.
- The model is hybrid retained/vendor support.
- The client is running an AMS transition or vendor takeover.
- The objective is application portfolio run-cost optimization.
- The sourcing event includes L2/L3 support, minor enhancements, release support, batch/job monitoring, or application operations.

### Do Not Use This Pattern When

- The work is a pure digital product build.
- The work is pure infrastructure managed services.
- The work is short-term staff augmentation.
- The work is a pure ERP implementation with no steady-state support scope.
- The work is a one-time modernization project with no run/support scope.
- The application portfolio is too small for managed services economics.
- The client lacks enough baseline data to issue a credible RFP and is not willing to run a baseline discovery step first.

## 4. Detection Signals

| Signal | Confidence | What It Implies | What Nexus Should Ask Next |
| --- | --- | --- | --- |
| Large application portfolio with unclear support ownership | strong | Scope and retained/vendor boundaries are likely ambiguous. | "Which applications are in scope, and who owns business and IT accountability for each?" |
| High run cost with fragmented vendors | strong | Vendor consolidation and pricing normalization may be major value levers. | "Can we see current vendor spend by application, tower, and service type?" |
| Incident backlog or recurring production instability | strong | Service quality and root-cause governance must be explicit. | "Do you have incident/problem volumes by severity and recurring root cause themes?" |
| Inconsistent support SLAs | strong | Vendors cannot price service outcomes consistently. | "Which SLA model should be standard across criticality tiers?" |
| Unclear minor enhancement boundaries | strong | Commercial leakage risk is high. | "What counts as run support versus minor enhancement versus project work?" |
| Retained organization unclear | strong | Transition and governance risk are high. | "Which roles remain retained after transition?" |
| Application criticality not classified | moderate | SLA, transition priority, staffing, and pricing will be hard to normalize. | "Can we classify applications by business criticality before RFP release?" |
| Vendor rates not tied to service outcomes | moderate | Current spend may not reveal productivity or service quality. | "Do current contracts include SLA credits, productivity commitments, or outcome measures?" |
| Multiple tools for tickets, monitoring, and release management | moderate | Tooling ownership and integration must be clarified. | "Which tools must the vendor use, and who pays for licenses/integration?" |
| Heavy shadow support by internal SMEs | moderate | Vendor proposals may understate retained team burden. | "How much support is currently performed informally by internal SMEs?" |
| Release support and batch monitoring are handled ad hoc | moderate | Scope exclusions may create operational gaps. | "Are release support, hypercare, and batch/job monitoring in scope?" |
| Offshore delivery is expected but knowledge is tribal | weak | Transition risk may offset labor arbitrage. | "How documented are the applications and support procedures?" |

## 5. Anti-Signals

| Anti-Signal | Better Pattern | Why |
| --- | --- | --- |
| Work is mostly cloud infrastructure | IMS or Cloud Operations Pattern Pack | Asset, monitoring, and operations models differ from application support. |
| Work is a new product build | Digital Build Pattern Pack | Delivery, product ownership, and scope economics are different. |
| Work is short-term staff augmentation | Staff Augmentation Pattern Pack | Managed outcome/service governance is not the core transaction. |
| Scope is only project delivery, not run/support | Digital Build or Modernization Pattern Pack | AMS assumes steady-state operational accountability. |
| Application portfolio is very small | Lightweight support sourcing guidance | Managed services overhead may outweigh value. |
| Client lacks baseline data and cannot run discovery | Baseline Discovery Pattern | RFP should defer or become a data request, not a vendor pricing event. |
| ERP implementation is the main scope | ERP Implementation Pattern | Implementation risk and SI methodology dominate. |
| The buyer only needs tool licensing | Software Procurement Pattern | No managed service operating model is being sourced. |

## 6. Required Data Baseline

### Required Data

| Data Category | Why It Matters | Usual Owner | If Missing | RFP Tier Effect |
| --- | --- | --- | --- | --- |
| Application inventory | Defines scope and pricing denominator. | Enterprise architecture, app owners, IT operations | Vendors price assumptions differently or exclude apps. | Rich requires it; Outline if partial; Stub if absent. |
| Application criticality | Drives SLA, transition priority, staffing, and risk. | Business owners, IT service management | Critical apps may be under-supported. | Rich requires at least tiering; Outline if inferred; Stub if absent. |
| Business owner / IT owner | Establishes accountability and review path. | PMO, IT operations, business relationship managers | Retained governance is unclear. | Rich requires owners; Outline can request missing owners. |
| Current support model | Shows retained/vendor split and baseline operations. | IT operations, vendor management | Scope transfer is unclear. | Rich requires it; Outline if described narratively. |
| Ticket volumes by severity | Supports pricing, staffing, SLA, and vendor comparisons. | ServiceNow/Jira/ITSM owner | Vendors inflate risk or price on assumptions. | Rich requires volumes; Outline if aggregate; Stub if absent. |
| Incident/problem/service request/enhancement volumes | Separates run workload from change workload. | ITSM owner, application support leads | Change-order exposure increases. | Rich requires category split; Outline if ticket total only. |
| Current internal/vendor cost | Establishes baseline value case. | Finance, procurement, vendor management | Savings claims are not defensible. | Rich requires cost baseline; Outline can show value hypothesis only. |
| Support hours | Defines coverage and staffing model. | IT operations, service owners | Out-of-hours support may be excluded. | Rich requires hours; Outline can request coverage definition. |
| SLA expectations | Defines service outcomes and credits. | ITSM, business owners, service management | Vendor proposals are not comparable. | Rich requires target SLAs; Outline can include draft SLA model. |
| Retained roles | Prevents hidden retained burden. | CIO org, application leadership, procurement | Internal shadow support persists. | Rich requires role model; Outline can include decision matrix. |
| Vendor contracts if available | Reveals rates, obligations, exclusions, and renewal constraints. | Procurement, legal, vendor management | Transition and commercial baseline are weaker. | Rich improves; Outline can proceed with spend extracts. |

### Recommended Data

| Data Category | Why It Matters | Usual Owner | If Missing | RFP Tier Effect |
| --- | --- | --- | --- | --- |
| Release calendar/history | Shows release support demand and hypercare. | Release management, DevOps | Release support may be underpriced. | Rich improves; Outline can include assumptions. |
| Backlog | Shows demand for enhancements and technical debt. | Product owners, app owners | Minor enhancement scope becomes vague. | Rich improves; Outline can request backlog snapshot. |
| Architecture diagrams | Helps vendors understand complexity. | Architecture, app teams | Vendors overprice unknowns. | Rich improves; Outline can request diagrams. |
| Integration map | Reveals dependency and incident complexity. | Architecture, integration teams | Root-cause and ownership disputes increase. | Rich improves; Stub if integrations are unknown. |
| Technical debt | Indicates stability and productivity risk. | App owners, engineering leads | Proposals ignore remediation workload. | Rich improves; Outline can include risk note. |
| Incident root causes | Helps distinguish volume from preventable instability. | ITSM/problem management | Automation and improvement levers are weak. | Rich improves; Outline can request top drivers. |
| Tooling | Defines required vendor operating environment. | IT operations, tooling owners | Tooling costs and access delays appear later. | Rich improves; Outline can include tool assumptions. |
| Batch/job schedule | Defines monitoring and runbook obligations. | App support, operations | Batch support may be excluded. | Rich improves for batch-heavy estates. |
| Service satisfaction | Shows perceived service gaps. | Business relationship management | Vendor evaluation may miss stakeholder pain. | Rich improves; Outline can include interview request. |
| App lifecycle status | Avoids over-investing in retiring apps. | Portfolio management, enterprise architecture | Pricing may include apps soon to retire. | Rich improves value case. |

### Optional Data

| Data Category | Why It Matters | Usual Owner | If Missing | RFP Tier Effect |
| --- | --- | --- | --- | --- |
| Code quality | Indicates maintainability and defect risk. | Engineering leads | Vendor productivity assumptions are weaker. | Rich improves but not required. |
| App usage | Helps prioritize criticality and rationalization. | Product owners, analytics | Value levers are less precise. | Optional value refinement. |
| Automation maturity | Supports productivity roadmap. | DevOps, operations | Automation commitments are harder to baseline. | Optional negotiation support. |
| Business satisfaction | Reveals pain not visible in tickets. | Business stakeholders | Cultural fit and service model may be underweighted. | Optional scorecard evidence. |
| Historical transformation plans | Reveals known constraints and failed attempts. | CIO/PMO, architecture | Future roadmap may repeat old mistakes. | Optional strategy context. |

## 7. Diagnostic Questions

| Question | Why It Matters | Expected Answer Types | Red Flags | Follow-Up Action |
| --- | --- | --- | --- | --- |
| Which applications are in scope and out of scope? | Defines the transaction boundary. | Inventory, app groups, exclusions | "All apps" with no inventory | Generate minimum app inventory request. |
| What support levels are expected? | Drives staffing, SLA, and pricing. | L1/L2/L3 split, hours, severity | Support levels undefined | Draft support-level definition. |
| Are minor enhancements included? | Prevents change-order leakage. | Included threshold, excluded project work | "Small changes as needed" | Define minor enhancement boundary. |
| Are release support and hypercare included? | Prevents operational gaps. | Release calendar, support windows | Releases handled informally | Add release support RFP section. |
| Is batch/job monitoring included? | Batch work is often excluded. | Job schedule, monitoring tools | No owner for batch failures | Request batch inventory. |
| Which roles remain retained? | Prevents hidden internal burden. | Governance, product, architecture, SME roles | "Vendor owns everything" | Build retained/vendor responsibility matrix. |
| What are current incident volumes by severity? | Supports pricing normalization. | ITSM extracts by severity and app | No severity history | Defer Rich RFP tier. |
| Which apps are business critical? | Drives SLA and transition priority. | Criticality tiers | No criticality model | Add app criticality classification task. |
| Are vendors expected to transform or just run? | Affects scorecard and commercial model. | Run-only, run-and-improve, transform-run | Transformation expected but no roadmap | Add automation/productivity section. |
| What tooling must the vendor use? | Affects access, cost, governance. | ITSM, monitoring, DevOps, reporting tools | Tooling licenses excluded | Add tooling responsibility question. |
| How is current spend split across vendors/internal teams? | Establishes value baseline. | Vendor spend, internal cost, tower cost | Finance cannot isolate run cost | Create finance baseline request. |
| What is the expected transition timeline? | Affects KT, shadow support, risk. | 30/60/90 plan, phased takeover | Compressed timeline with weak docs | Add transition readiness gate. |
| What SLA credits or service remedies matter? | Aligns service outcomes with commercial accountability. | Credit schedule, remedies, governance | SLA reporting only, no remedies | Add SLA credit negotiation lever. |
| What work should remain out of scope? | Prevents assumption creep. | Exclusion list | Exclusions not documented | Add out-of-scope RFP section. |
| Who approves scope, scorecard, release, and selection? | Prevents gate ambiguity. | Named approvers | Approval owner missing | Steward requires approval owner. |

## 8. Scope Model

| Dimension | Include / Exclude Considerations | Pricing Ambiguity Risk | Required Data | RFP Section Implication |
| --- | --- | --- | --- | --- |
| Application support | Include named applications and support levels; exclude retired or project-only apps. | High if inventory is weak. | App inventory, support model. | Application portfolio scope. |
| Incident/problem management | Include severity model, root cause, escalation, major incident role. | High if volumes are missing. | Incident/problem volumes. | Incident/problem responsibilities. |
| Service requests | Include standard request types and fulfillment expectations. | Medium if request types are broad. | Service request catalog and volumes. | Service request scope. |
| Minor enhancements | Include threshold, size, hours, release path; exclude project work. | Very high if boundary is vague. | Enhancement backlog and historical volume. | Minor enhancement boundaries. |
| Release support | Include planning, deployment, hypercare, rollback support. | High if releases are irregular. | Release calendar/history. | Release support requirements. |
| Batch/job monitoring | Include schedule, alerts, ownership, remediation. | High for batch-heavy estates. | Batch/job inventory. | Batch/job monitoring requirements. |
| Application monitoring | Include tool usage, alert triage, proactive monitoring. | Medium. | Monitoring tools, alert volumes. | Monitoring and observability section. |
| Testing support | Include regression, release, smoke testing support if needed. | Medium if testing overlaps projects. | Test scope/history. | Testing support section. |
| DevOps/release coordination | Include CI/CD support, deployment windows, environment coordination. | Medium to high. | DevOps toolchain and release process. | DevOps/release coordination section. |
| Application platform admin | Include only if vendor owns platform admin tasks. | High if mixed with infrastructure. | Platform inventory, admin task list. | Platform admin section or exclusion. |
| Reporting/metrics | Include operational, SLA, backlog, productivity, and governance reports. | Low if definitions exist. | Current reports and KPI definitions. | Reporting requirements. |
| Knowledge management | Include runbooks, KT, documentation updates. | High during transition. | Current documentation inventory. | Knowledge management and KT section. |
| Transition/KT | Include phased takeover, shadow period, exit criteria, SME access. | Very high if excluded. | App docs, SME availability, transition timeline. | Transition and knowledge transfer section. |
| Automation/productivity roadmap | Include automation commitments, baselines, roadmap, measurement. | High if savings are vague. | Current automation maturity, ticket drivers. | Automation and productivity roadmap. |

## 9. Retained vs Vendor Responsibility Model

| Responsibility | Usually Retained | Can Move to Vendor | Guidance |
| --- | --- | --- | --- |
| Business relationship | Business/IT relationship owner | Reporting support | Retain accountability for business priorities. |
| Product ownership | Product owners/business owners | Backlog analysis support | Vendor can inform but should not own business priority. |
| Architecture | Enterprise/domain architecture | Solution recommendations, technical analysis | Retain architecture authority; vendor can propose improvements. |
| Application SMEs | Key SMEs during transition and escalations | Documentation, L3 support after KT | Avoid total SME withdrawal before KT exit criteria. |
| Incident triage | Major incident command often retained/shared | L2/L3 triage and resolution | Define escalation model by severity. |
| L2/L3 support | Retained only for strategic apps or early transition | Core AMS responsibility | Require app-specific support levels. |
| Change/release management | Release governance retained | Execution support, deployment coordination | Clarify CAB/release authority. |
| Security/compliance | Security policy and approval retained | Evidence collection and remediation support | Vendor follows controls; client owns policy. |
| Vendor governance | Client retained | Vendor provides reporting and improvement plans | Governance cannot be outsourced fully. |
| Service reporting | Client consumes and challenges | Vendor produces operational reports | Define metrics and cadence. |
| Innovation/automation | Client sets priorities | Vendor proposes and delivers productivity roadmap | Tie commitments to measurable outcomes. |
| Financial management | Client retained | Vendor provides billing transparency and volume data | Retain budget ownership and change control. |

## 10. RFP Section Library

| Section | Purpose | Required Inputs | Output Tier Behavior | Common Pitfalls |
| --- | --- | --- | --- | --- |
| Application portfolio scope | Define included/excluded applications. | App inventory, criticality, owners. | Rich with inventory; Outline with partial list; Stub requests inventory. | Undefined apps, hidden exclusions. |
| Criticality tiers | Map service expectations to business impact. | Criticality model. | Rich with tiers; Outline proposes draft tiers. | One SLA for all apps. |
| Support model | Define L1/L2/L3 and handoffs. | Current/future support model. | Rich if roles defined; Outline if target model incomplete. | Vendor and retained roles overlap. |
| Severity and SLA model | Define severity, response, resolution, credits. | SLA expectations, ticket history. | Rich with SLA targets; Outline with draft SLA table. | SLA definitions ambiguous. |
| Incident/problem/change responsibilities | Clarify operational process roles. | ITSM process, role split. | Rich with RACI; Outline with draft RACI. | Problem management omitted. |
| Service request scope | Define request catalog and fulfillment. | Request types and volumes. | Rich with catalog; Outline with categories. | Unlimited request assumption. |
| Minor enhancement boundaries | Define threshold and commercial treatment. | Historical enhancement volume, size thresholds. | Rich with boundary; Outline with proposed thresholds. | Change-order leakage. |
| Release support | Define release planning, deployment, hypercare. | Release calendar/history. | Rich with calendar; Outline with assumptions. | Release support excluded. |
| Batch/job monitoring | Define monitoring, alerting, remediation. | Job schedule and tool data. | Rich with job inventory; Outline with request. | Batch failures fall between teams. |
| Support hours | Define coverage and out-of-hours model. | Support hours, timezone needs. | Rich with coverage model; Outline with options. | Out-of-hours excluded. |
| Retained organization responsibilities | Define what client keeps. | Retained roles, governance model. | Rich with RACI; Outline with placeholder decisions. | Hidden client workload. |
| Transition and knowledge transfer | Define takeover plan and exit criteria. | Docs, SMEs, timeline. | Rich with transition plan; Outline with KT framework. | KT not priced. |
| Automation and productivity roadmap | Define continuous improvement. | Ticket drivers, automation baseline. | Rich with commitments; Outline with roadmap request. | Savings not committed. |
| Governance model | Define cadence, escalation, reporting. | Governance roles and metrics. | Rich with cadence; Outline with recommended model. | Governance too generic. |
| Reporting requirements | Define operational and executive reporting. | KPI definitions. | Rich with report specs; Outline with sample metrics. | Metrics not actionable. |
| Pricing instructions | Force comparable commercial response. | Pricing model choice, volumes. | Rich with workbook; Outline with pricing schedule. | Non-comparable proposals. |
| Volume bands | Define scaling assumptions. | Ticket/app/FTE volumes. | Rich with baselines; Outline with requested bands. | Vendors assume low volumes. |
| Out-of-scope work | Make exclusions explicit. | Exclusion list. | Rich with exclusions; Outline with vendor assumption section. | Unclear project/run boundary. |
| Assumptions/exceptions | Capture vendor deviations. | RFP instructions. | Always required. | Exceptions buried in narrative. |

## 11. Artifact Templates

| Artifact | Stage | Required Inputs | Rich / Outline / Stub Rules | Reviewer / Approver | Evidence Needed |
| --- | --- | --- | --- | --- | --- |
| Minimum data request | Strategy/Scope | Known missing baseline areas. | Rich lists specific datasets; Outline lists categories; Stub asks for discovery. | Sourcing lead, app owner. | Pattern required-data baseline. |
| AMS scope document | Scope | App inventory, scope dimensions, retained/vendor split. | Rich with app-level scope; Outline with dimensions; Stub with scope questions. | Sourcing lead, business/IT owner. | Inventory, support model. |
| Sourcing strategy memo | Strategy | Objectives, spend, vendor landscape, risk. | Rich with value case; Outline with strategy options; Stub with decision prompts. | Procurement, sponsor. | Spend, objectives, risk. |
| Retained/vendor responsibility matrix | Scope/RFP | Role model, governance, support levels. | Rich with RACI; Outline with draft RACI; Stub with role questions. | IT ops, architecture, procurement. | Current/future operating model. |
| RFP/RFI package | RFP | Approved scope, pricing template, scorecard, vendor list. | Rich only with core baseline; Outline if baseline partial; Stub if discovery first. | Procurement, legal/security as needed. | Approved scope and evidence. |
| Pricing template | RFP | Volumes, pricing model, service categories. | Rich with baseline volumes; Outline with vendor-supplied assumptions; Stub with pricing request. | Finance/procurement. | Cost and volume baseline. |
| Vendor Q&A tracker | Vendor Responses | RFP sections and vendor questions. | Rich once RFP issued; Outline before issue. | Sourcing lead. | Vendor questions and responses. |
| Vendor response completeness checklist | Vendor Responses | RFP required response fields. | Rich with RFP matrix; Outline with minimum completeness rules. | Sourcing lead, Sentinel. | Submitted response docs. |
| Evaluation scorecard | Evaluation | Locked criteria and weights. | Rich with evidence criteria; Outline with default weights; Stub if scorecard not approved. | Sourcing lead, stakeholders. | Scorecard rationale. |
| Orals/BAFO guide | Negotiation | Evaluation gaps, pricing deltas, vendor risks. | Rich with vendor-specific gaps; Outline with standard prompts. | Sourcing lead, procurement. | Vendor responses and scorecard. |
| Vendor selection memo | Selection | Evaluation results, risks, commercial analysis. | Rich with complete scoring; Outline with pending issues; Stub not selection-ready. | Steering committee/sponsor. | Scoring, pricing, evidence. |
| Transition readiness checklist | Transition | Selected vendor, transition plan, KT artifacts. | Rich with app-specific KT; Outline with standard checklist. | Transition owner, vendor manager. | KT plan, access plan, runbooks. |
| Value ledger assumptions | Verify | Baseline, savings levers, measurement owner. | Rich with baseline and evidence; Outline with projected assumptions; Stub if baseline absent. | Finance/value owner. | Baseline and measurement evidence. |

## 12. Scorecard Defaults

| Criterion | Default Weight | Rationale | Increase Weight When | Decrease Weight When | Evidence Required | Scoring Red Flags |
| --- | --- | --- | --- | --- | --- | --- |
| Commercial competitiveness | 20% | AMS value depends on comparable run cost, transition cost, and change-order exposure. | Savings is primary objective or current spend is high. | Service risk dominates or strategic transformation matters more. | Pricing workbook, assumptions, inclusions/exclusions. | Low base fee with exclusions, high change rates, unclear volumes. |
| Transition capability | 20% | Poor KT/takeover can destabilize critical apps. | Incumbent is changing, documentation is weak, apps are critical. | Low-risk incumbent renewal with strong service history. | Transition plan, KT approach, staffing ramp, references. | Transition not priced, generic KT plan, no exit criteria. |
| Service delivery operating model | 15% | Day-to-day operating model determines service stability. | Service instability is current pain. | Pure cost takeout with stable environment. | Governance, SLA model, staffing, process integration. | Vague escalation, unclear L2/L3, no problem management. |
| Technical/application portfolio fit | 15% | Vendor must understand the stack, integrations, and application complexity. | Estate is heterogeneous or highly integrated. | Portfolio is simple and well documented. | Relevant experience, technology coverage, SME plan. | Generic capability claims, no app-specific approach. |
| Automation / AI productivity roadmap | 10% | AMS value should improve over time, not just replace labor. | Productivity improvement is a stated goal. | Client only needs short-term stabilization. | Automation roadmap, baseline, commitments. | "AI" claims with no measurable commitment. |
| Risk, security, compliance | 10% | Support vendors may touch sensitive systems and production processes. | Regulated, critical, or sensitive apps are included. | Low-risk internal apps only. | Security controls, compliance evidence, access model. | Security excluded or delegated vaguely. |
| Cultural / stakeholder fit | 5% | AMS depends on daily collaboration with retained teams and business owners. | Stakeholder satisfaction is a pain point. | Work is highly transactional and low touch. | Orals, references, governance model. | Weak communication model, poor escalation behavior. |
| Innovation / continuous improvement | 5% | Prevents static run contract from becoming stale. | Client expects transformation partnership. | Contract is short or run-only. | Improvement backlog, governance, gainshare. | Innovation rhetoric without roadmap. |

Material override rule: increasing Commercial competitiveness above 25% or reducing Transition capability below 15% should require written rationale because it can bias the decision toward low-price/high-risk proposals.

## 13. Pricing Model Library

| Model | When Appropriate | Strengths | Risks | Required Baseline Data | Negotiation Considerations |
| --- | --- | --- | --- | --- | --- |
| Fixed fee | Stable scope and volumes. | Budget predictability. | Exclusions and change orders. | App inventory, volumes, scope. | Lock inclusions, volume bands, productivity. |
| T&M | Uncertain scope or discovery phase. | Flexibility. | Weak cost accountability. | Rate card, effort estimate. | Rate caps, approval controls, transition to fixed fee. |
| Per application | Portfolio is well categorized. | Simple scaling. | Ignores app complexity. | App inventory, criticality. | Tier by criticality/complexity. |
| Per ticket | Ticket data is reliable. | Demand-linked pricing. | Ticket suppression or classification gaming. | Ticket history by type/severity. | Audit definitions, volume bands. |
| Per severity band | Severity drives effort. | Aligns cost with impact. | Severity disputes. | Severity history and definitions. | Define severity governance. |
| Per FTE / capacity | Workload maps to teams. | Staffing transparency. | Labor arbitrage without productivity. | Staffing baseline, rate cards. | Productivity commitments, flex rules. |
| Tower-based | Multiple service towers. | Clear tower economics. | Siloed accountability. | Tower scope and costs. | Cross-tower governance. |
| Hybrid | Mixed stable/variable scope. | Balances predictability and flexibility. | Complexity. | Baselines by scope segment. | Clear triggers and reconciliation. |
| Outcome/gainshare | Client can measure outcomes. | Aligns incentives. | Measurement disputes. | Baseline and measurement method. | Cap/floor, audit, owner. |

## 14. Pricing Normalization Rules

Normalize proposals across:

- Annual run cost.
- Transition cost.
- One-time cost.
- Optional services.
- Volume assumptions.
- Cost per app.
- Cost per ticket.
- Cost per severity.
- Cost per FTE equivalent.
- Onshore/offshore mix.
- Year 1 / year 2 / year 3 price path.
- Excluded services.
- Change-order exposure.

Normalization guidance:

- Separate transition from steady-state run.
- Separate included services from optional services.
- Normalize all proposals to a common annual run-rate view.
- Recalculate vendor pricing against the same volume assumptions.
- Identify retained team burden as a cost line, even if not vendor-priced.
- Flag any proposal that cannot be normalized without new assumptions.

## 15. Commercial Traps

| Trap | Detection Signal | Impact | Negotiation Question | Mitigation |
| --- | --- | --- | --- | --- |
| Low base fee but high change-order rates | Low run price, high rate card | Savings erode quickly. | "Which activities trigger change orders?" | Cap rates and define included scope. |
| Transition excluded | Separate or missing transition line | Year 1 cost surprise and delivery risk. | "Is KT and shadow support included?" | Include transition in evaluated TCO. |
| Release support excluded | RFP response excludes release windows | Business disruption during releases. | "How is release/hypercare priced?" | Add release support service line. |
| Minor enhancements excluded | "Project work excluded" without threshold | Change leakage. | "What enhancement size is included?" | Define thresholds and included capacity. |
| Tooling excluded | Tool licenses listed as client responsibility | Hidden cost. | "Which tools are included or reimbursable?" | Assign tooling responsibility. |
| Security/compliance excluded | Security tasks listed as assumptions | Compliance gap. | "Which controls are included in run support?" | Add security responsibility matrix. |
| Volume assumptions too low | Proposal uses low ticket/app counts | Underpriced proposal. | "What volumes are assumed?" | Normalize to common volume bands. |
| Weak SLA credits | Credits are symbolic or capped too low | Low accountability. | "What remedies apply to chronic miss?" | Negotiate meaningful credits/remedies. |
| Automation savings not committed | Roadmap without numeric commitment | Value not realized. | "What productivity improvement is committed?" | Add measured productivity schedule. |
| Unrealistic offshore mix | High offshore ratio for tribal apps | Transition and service risk. | "What work remains onshore and why?" | Tie mix to KT readiness. |
| Rate escalation too high | Annual escalation above market posture | TCO drift. | "Can escalation be capped?" | Cap escalation or tie to benchmark. |
| KT not priced | KT shown as client obligation | Hidden retained burden. | "How many KT hours are assumed?" | Add KT obligations and exit criteria. |
| Retained team burden hidden | Vendor assumes client triage/SMEs | Savings overstated. | "Which client roles are assumed?" | Price retained burden in TCO. |
| Out-of-hours support excluded | Support hours limited to business hours | Critical coverage gap. | "How is after-hours support handled?" | Define coverage and pricing. |
| Service credits offset only invoices | Credits not linked to impact | Weak business protection. | "Are credits tied to criticality?" | Tier credits by app criticality. |

## 16. Negotiation Levers

| Lever | When to Use | Evidence Needed | Expected Value Impact | Risks |
| --- | --- | --- | --- | --- |
| Volume band lock | Ticket/app volumes are reliable. | Historical volumes. | Prevents repricing. | Bad baseline can lock wrong band. |
| Price-down schedule | Productivity should improve over time. | Automation roadmap, baseline cost. | Year 2/3 savings. | Vendor may underinvest if unrealistic. |
| Automation commitment | Ticket drivers are automatable. | Incident/root-cause data. | Run cost reduction. | Hard to enforce without metrics. |
| Gainshare | Outcomes are measurable. | Baseline, measurement method. | Aligns incentives. | Disputes over attribution. |
| SLA credits | Service stability matters. | SLA history, criticality. | Better accountability. | Credits too small to matter. |
| Transition cost inclusion | Vendor change or weak docs. | Transition plan, KT effort. | Avoids surprise costs. | Vendor may inflate base price. |
| KT obligations | Tribal knowledge is high. | Documentation inventory, SME availability. | Reduces takeover risk. | Client SMEs may not be available. |
| Tooling responsibility | Tool costs are unclear. | Tool inventory, license owner. | Reduces hidden cost. | Vendor tool preferences conflict. |
| Release support inclusion | Release calendar is material. | Release history. | Avoids change leakage. | Scope can grow without cap. |
| Rate card cap | T&M/change work remains. | Current rates, expected change demand. | Controls leakage. | Cap may reduce flexibility. |
| Productivity roadmap | Client wants transformation, not just run. | Baseline, automation maturity. | Sustained improvement. | Roadmap may stay aspirational. |
| Benchmarking/reopener clause | Multi-year term or uncertain demand. | Baseline and benchmark source. | Mid-term price correction. | Benchmark disputes. |

## 17. Transition Risks

| Risk | Detection Signal | Mitigation | Artifact / Gate |
| --- | --- | --- | --- |
| Incomplete KT | Few runbooks, tribal knowledge | KT plan with exit criteria | Transition readiness checklist |
| Undocumented applications | No app docs or SMEs | Documentation remediation plan | Scope/RFP gate |
| Missing SMEs | App owners unavailable | Named SME plan and calendar | Transition gate |
| Unclear retained roles | RACI missing | Retained/vendor responsibility matrix | RFP release gate |
| Ticket history gaps | ITSM data incomplete | Discovery period or assumptions | Scope gate |
| Critical apps not prioritized | No criticality tiers | Criticality classification | RFP gate |
| Poor onboarding | No access/tool plan | Access and onboarding plan | Transition gate |
| Tool access delays | Security/tooling approvals unclear | Pre-transition access checklist | Mobilization gate |
| Shadow support by internal teams | Vendor assumes internal triage | Explicit responsibility and retained cost | Evaluation gate |
| Service disruption | Aggressive cutover | Phased transition and hypercare | Transition gate |

## 18. Stage Gates / Validation Rules

| Gate | Required Artifacts | Required Data | Approval Requirement | Block / Defer / Waiver Behavior | Nexus Explanation | Steward Enforcement |
| --- | --- | --- | --- | --- | --- | --- |
| Scope ready for sourcing strategy | Scope outline, data request | App inventory draft, objectives, current support model | Sourcing lead | BLOCK if no app inventory; DEFER if cost baseline missing | "Strategy can proceed only as Outline until app inventory is usable." | Prevent strategy approval without scope minimums or waiver. |
| RFP ready for release | RFP, pricing template, scorecard, vendor list | App inventory, volumes, support hours, SLA model, retained roles | Procurement plus legal/security if needed | BLOCK if RFP/pricing/scorecard not approved; WAIVER_REQUIRED for partial baseline | "RFP release is unsafe because vendors cannot price comparable scope." | Require release approval and locked package. |
| Vendor responses ready for evaluation | Response tracker, completeness checklist | Vendor submissions, pricing, exceptions | Sourcing lead | BLOCK if pricing missing; DEFER if documents unparsed | "Evaluation should wait until response completeness is verified." | Block evaluation until completeness rules pass. |
| Scorecard ready for use | Scorecard and rationale | Criteria, weights, evidence requirements | Stakeholder group | BLOCK if not locked; WAIVER_REQUIRED for material override | "Scorecard must be locked before evaluation to avoid scoring drift." | Enforce scorecard lock. |
| Vendor selection ready for approval | Selection memo, evaluation results, pricing normalization | Final scores, BAFO pricing, risks | Sponsor/steering committee | BLOCK if scoring incomplete; DEFER if unresolved critical exceptions | "Selection needs a decision package with evidence and commercial normalization." | Require approval owner and package. |
| Transition ready for mobilization | Transition plan, KT checklist, access plan | SME list, runbooks, tool access, cutover plan | Transition owner | BLOCK if KT/access plan missing; WAIVER_REQUIRED for undocumented critical apps | "Transition risk is high because KT exit criteria are incomplete." | Require transition readiness gate. |
| Value ready for measurement | Value ledger assumptions, baseline, owner | Baseline, actuals plan, evidence | Finance/value owner | BLOCK if no measurement owner; DEFER if evidence not available | "Value can be projected, but not realized until measured." | Prevent realized value status without evidence. |

## 19. Failure Modes

| Failure Mode | Detection Signal | Downstream Impact | Capability That Mitigates It | Validation Rule | Agent Behavior |
| --- | --- | --- | --- | --- | --- |
| Generic AMS RFP | RFP lacks app inventory/support model | Non-comparable proposals | AMS RFP section library | RFP Rich tier requires baseline scope | Nexus recommends Outline/Stub only. |
| Undefined minor enhancement scope | No threshold for small changes | Change-order leakage | Scope model and pricing template | RFP release blocked or waiver required | Nexus asks boundary questions. |
| Missing ticket baseline | No volumes by severity/type | Pricing assumptions diverge | Minimum data request | Rich RFP blocked | Steward blocks Rich tier. |
| No criticality tiers | Apps all treated equally | SLA/pricing mismatch | Criticality section | Release requires criticality or waiver | Nexus requests classification. |
| Retained roles unclear | RACI missing | Hidden client burden | Responsibility matrix | Release requires retained/vendor matrix | Steward blocks or requires waiver. |
| Transition excluded | Vendor separates KT | Year 1 cost/risk surprise | Transition checklist | Evaluation flags exclusion | Nexus surfaces trap. |
| Scorecard not locked | Criteria still changing | Scoring drift | Scorecard governance | Evaluation blocked | Steward enforces lock. |
| Automation not committed | Roadmap without metrics | Savings not realized | Negotiation levers | Value confidence low | Atlas caveats value. |
| Tooling responsibility unclear | Tools listed as assumption | Hidden cost/access delays | RFP tooling section | Response completeness flags gap | Sentinel flags unsupported claim. |
| Vendor response incomplete | Pricing or exceptions missing | Cannot evaluate fairly | Completeness checklist | Evaluation blocked | Nexus drafts vendor reminder. |
| Out-of-hours support excluded | Coverage limited | Service disruption | Support hours section | Proposal risk flagged | Nexus asks coverage question. |
| Security obligations vague | Compliance tasks excluded | Audit/security risk | Security responsibility matrix | Release/evaluation requires security review | Steward requires approval. |
| KT exit criteria missing | Transition plan generic | Failed takeover | Transition readiness gate | Mobilization blocked | Nexus requests KT criteria. |
| Value baseline absent | No current cost/volume baseline | Savings claim not defensible | Value ledger assumptions | Realized value blocked | Atlas labels value as projected only. |
| Proposal not normalizable | Vendor uses unique assumptions | Bad selection decision | Pricing normalization rules | Selection package blocked | Nexus requests normalized response. |
| Incumbent knowledge underestimated | Tribal knowledge high | Transition disruption | SME/KT plan | Transition gate requires SME plan | Steward flags risk. |

## 20. Value Levers

| Value Lever | Value Mechanism | Required Evidence | Confidence Level | Measurement Method | Value Ledger Field |
| --- | --- | --- | --- | --- | --- |
| Vendor consolidation | Reduces duplicated overhead and management cost. | Current vendor count and spend. | moderate to high | Before/after vendor spend. | `vendor_consolidation_savings` |
| Offshore leverage | Lowers labor cost when work is transferable. | Work type, KT readiness, location mix. | moderate | Rate/mix comparison. | `delivery_mix_savings` |
| Automation/productivity | Reduces recurring tickets and manual effort. | Ticket drivers, automation baseline. | moderate | Ticket/FTE trend and committed productivity. | `automation_productivity_savings` |
| Incident reduction | Lowers disruption and support effort. | Incident history and root causes. | moderate | Incident volume/severity trend. | `incident_reduction_value` |
| SLA improvement | Reduces service failure and business impact. | SLA baseline and business impact. | low to moderate | SLA performance trend. | `sla_improvement_value` |
| App rationalization | Removes support cost for retired apps. | App lifecycle and retirement plan. | moderate | Apps retired and run cost removed. | `app_rationalization_savings` |
| Retained team redeployment | Frees internal capacity. | Retained role baseline. | low to moderate | Roles redeployed or cost avoided. | `retained_team_capacity_value` |
| Tooling consolidation | Reduces duplicated tool/license cost. | Tool inventory and cost. | low to moderate | Tool cost before/after. | `tooling_consolidation_savings` |
| Reduced change-order leakage | Controls unplanned spend. | Historical change spend and rate card. | moderate | Change-order spend trend. | `change_order_leakage_reduction` |
| Transition stabilization | Avoids disruption and shadow cost. | Transition risk and shadow support baseline. | low | Avoided incidents/shadow support. | `transition_stabilization_value` |

## 21. Benchmark Categories

Pattern guidance is not market benchmark data. Market benchmarks require sourced data. Client baseline is usually the most defensible benchmark because it reflects the actual portfolio, support model, service expectations, and current spend.

Benchmark categories:

- Internal cost per app.
- Cost per ticket.
- Incidents per app.
- Support FTE per app group.
- SLA performance.
- Backlog age.
- Run/change mix.
- Vendor rate bands if client-provided.
- Offshore/onshore mix.
- Automation maturity.

Nexus and Atlas should label these as baseline categories unless sourced external benchmark data is present.

## 22. Nexus Guidance Examples

### Intake Classification

"This appears to be an AMS sourcing event, not a digital build. The strongest signals are application support scope, run-cost optimization, fragmented vendor support, and unclear retained/vendor responsibilities."

### Missing Data Warning

"I can draft the AMS data request now, but I cannot support a Rich RFP until the application inventory, ticket volumes, support hours, SLA expectations, and retained role model are usable."

### Scope Readiness

"Scope is not ready for RFP release. The app list exists, but severity volumes and minor enhancement boundaries are missing. Recommended next action: lock the minimum AMS baseline before vendors price the work."

### RFP Tiering

"Current tier: Outline. The RFP structure can be drafted from the AMS pattern, but client-specific service levels and pricing instructions should remain incomplete until baseline volumes are confirmed."

### Scorecard Override Guidance

"Commercial competitiveness is already 20% by default. Raising it above 25% is a material override because AMS transition and service stability risk can outweigh lowest price."

### Pricing Trap Detection

"Vendor A's base fee is low, but transition, release support, and minor enhancements appear excluded. Normalize the proposal by adding those services before BAFO comparison."

### BAFO Question Generation

"Ask each vendor to confirm included transition hours, release support coverage, minor enhancement threshold, SLA credit structure, and year 2 productivity commitment."

### Transition Readiness

"Mobilization should defer until KT exit criteria, SME availability, tool access, and critical-app transition sequence are confirmed."

### Value Ledger Confidence

"Value can be projected from vendor consolidation and delivery mix, but realized savings should stay low confidence until current run cost, transition cost, and change-order exposure are measured."

## 23. Sentinel Validation Examples

- Evidence missing: "The AMS pattern requires ticket volume by severity before pricing can be treated as comparable. That evidence is not present."
- Vendor claim unsupported: "The vendor claims automation savings, but no baseline, metric, or commitment is attached."
- RFP section lacks required data: "The SLA section references critical apps, but no criticality tiering evidence is available."
- Scorecard rationale missing: "Commercial weight override is present without rationale or stakeholder approval."
- Uploaded document not parsed: "The vendor response cannot be cited until the uploaded document is parsed and quality checked."

## 24. Atlas Executive Summary Examples

### CIO Sourcing Brief

"The AMS event is strategically important because the buyer is transferring operational accountability across a live application estate. Current risk is transition readiness: app criticality, KT, and retained role clarity must be resolved before vendor release."

### CFO Value / Risk Brief

"Projected value is plausible through vendor consolidation, delivery mix, and reduced change-order leakage, but savings confidence remains medium until current run cost and transition cost are baselined."

### Steering Committee Decision Memo Language

"Decision needed: approve RFP release only if the application inventory, support baseline, pricing template, scorecard, and retained/vendor responsibility matrix are complete or explicitly waived."

## 25. Steward Enforcement Examples

- Block RFP release: "RFP package cannot be released because pricing template and application criticality tiers are not approved."
- Block evaluation: "Evaluation cannot begin because vendor pricing is incomplete and scorecard is not locked."
- Require waiver: "Proceeding without ticket volumes requires a waiver because pricing comparability will be limited."
- Require approval owner: "Selection memo cannot move to approval without named business sponsor and procurement owner."
- Require artifact versioning: "Uploaded redlines must create a new artifact version before approval review."

## 26. Pattern Learning Loop

Capture observations after every AMS event:

- Which data was missing most often.
- Which RFP sections caused vendor questions.
- Which pricing assumptions changed in BAFO.
- Which scorecard weights were overridden.
- Which transition risks materialized.
- Projected vs realized savings variance.
- Which vendor traps appeared repeatedly.
- Which validation rules were too strict or too weak.
- Which retained roles were underestimated.
- Which value levers proved measurable.

Observation fields:

- observation id
- pattern id
- event id
- what happened
- evidence
- implication
- recommended pattern update
- confidence

## 27. Related Patterns

- IMS Pattern Pack.
- Data Platform Managed Services Pattern Pack.
- Cloud Operations Pattern Pack.
- Vendor Evaluation Pattern.
- Pricing Negotiation Pattern.
- Artifact Review and Approval Pattern.
- Value Ledger Pattern.
- Staff Augmentation Pattern Pack.
- Digital Build Pattern Pack.

## 28. Implementation Notes

This pattern can later become:

- Structured sections: applicability, signals, anti-signals, required inputs, diagnostic questions, scope model, RFP sections, scorecard defaults, pricing models, traps, levers, validation rules, agent examples.
- Pattern manifest entry: id, name, version, domain, archetype, stages, tags, section ids, owner, status.
- SourceAgentContextBundle pattern context: selected sections loaded by event archetype, stage, prompt intent, missing inputs, artifact request, scorecard state, and validation state.
- RFP section library: AMS-specific sections with Rich / Outline / Stub behavior.
- Scorecard defaults: criteria, weights, rationale, evidence, override guidance.
- Validation fixtures: readiness gates, evidence requirements, pricing completeness, scorecard lock, transition readiness, value measurement.
- Workflow gates: RFP release, evaluation start, selection approval, transition mobilization, value realization.
- Negotiation guidance: BAFO questions, commercial traps, pricing normalization, service credit and productivity commitments.

This pattern should not become runtime code until it has been reviewed, sectioned, and connected to deterministic validation expectations.

