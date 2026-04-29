import type { PatternSeed } from './seed-types';

export const SOURCING_CONTRACT_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-CON-001',
    slug: 'liability-cap-architecture',
    title: 'Liability Cap Architecture',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Contract intelligence improves sourcing outcomes when liability is modeled as a structured risk allocation architecture instead of a single headline cap number.',
    applicability:
      'Apply during RFP, BAFO, contracting, and renewal events where technology, managed services, implementation, data, security, or business-continuity obligations create materially different loss categories.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: ['Legal-review-required', 'Privacy-review-if-personal-data', 'Security-review-if-confidential-data'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-003', 'PAT-SRC-CON-002', 'PAT-SRC-CON-003'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'contract_intelligence',
    vendorClass: 'direct-tech',
    standardClauses: [
      {
        clauseArea: 'General liability cap',
        buyerPosition:
          'Define the general cap as a negotiated commercial risk boundary tied to the contract value, term, and scope actually awarded, with no hidden dilution through exclusions, remedy limits, or order-form overrides.',
        fallbackPosition:
          'Accept a narrower general cap only if high-impact obligations are carved into separate caps or uncapped categories and the buyer has a documented operational mitigation path.',
        vendorPosition:
          'Vendor may seek one aggregate cap across all claims, limit remedies to fees paid, and keep the cap independent from future expansion or renewal volume.',
        walkawayTriggers: [
          'Single low aggregate cap applies to confidentiality, data, security, IP, payment, and transition obligations without exception.',
          'Order form, service description, or support terms can reduce the negotiated cap without buyer approval.',
          'Exclusive-remedy language removes meaningful recovery for core obligations the buyer relied on during award.',
        ],
      },
      {
        clauseArea: 'Super-cap and carve-out taxonomy',
        buyerPosition:
          'Separate ordinary service failure, confidentiality, data protection, security incident, IP infringement, gross misconduct, payment, and transition obligations into an explicit cap table before signature.',
        fallbackPosition:
          'If the vendor rejects uncapped categories, require named super-caps, insurance alignment, operational controls, and executive acceptance of residual risk.',
        vendorPosition:
          'Vendor may accept a super-cap for limited categories while resisting open-ended exclusions or broad consequential-loss language.',
        walkawayTriggers: [
          'The contract uses broad exclusions but does not state whether they override indemnity, confidentiality, data, or security obligations.',
          'Security or data obligations are material to the deal but remain inside a standard low general cap.',
        ],
      },
      {
        clauseArea: 'Claims process and remedy preservation',
        buyerPosition:
          'Preserve notice, defense, cooperation, mitigation, and settlement controls without allowing process defects to erase material remedies for known high-severity obligations.',
        fallbackPosition:
          'Accept more prescriptive claim procedures only when cure periods, cooperation duties, and documentation standards are reciprocal and operationally feasible.',
        vendorPosition:
          'Vendor may require prompt notice, control of defense, mitigation duties, and settlement consent to prevent unmanaged exposure.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Cap table before price close',
        whenToUse:
          'Use before BAFO close when commercial pricing is still live and the vendor has not yet converted legal exceptions into final-order economics.',
        buyerAsk:
          'Require a one-page cap table listing each obligation, proposed cap, exclusions, remedies, insurance support, and any order-form override path.',
        vendorGive:
          'Vendor can protect the headline general cap while granting targeted super-caps for obligations that carry higher buyer impact.',
        tradeoffs: [
          'Targeted super-caps can be more achievable than a broad uncapped demand but require clear obligation taxonomy.',
          'Higher caps may be exchanged for narrower scope, stronger buyer controls, or documented mitigation duties.',
        ],
      },
      {
        lever: 'Insurance-to-obligation alignment',
        whenToUse:
          'Use when the vendor points to insurance coverage as the reason the buyer should accept the proposed liability position.',
        buyerAsk:
          'Map insurance lines, limits, exclusions, deductibles, and notice obligations to the cap categories that matter for the sourcing event.',
        vendorGive:
          'Vendor can provide certificates, minimum coverage covenants, and renewal notice duties without conceding that insurance defines liability.',
        tradeoffs: [
          'Insurance evidence can support risk review but should not substitute for the contract remedy architecture.',
        ],
      },
      {
        lever: 'Residual-risk executive signoff',
        whenToUse:
          'Use when the selected vendor will not move on a material cap and business stakeholders still want to proceed.',
        buyerAsk:
          'Convert the unresolved cap issue into a named award risk with owner, mitigation plan, and approval threshold rather than burying it in legal redlines.',
        tradeoffs: [
          'This does not improve the clause, but it prevents silent acceptance of a risk that should affect award confidence.',
        ],
      },
    ],
    riskFactors: [
      {
        id: 'liability-single-cap-compression',
        label: 'Single-cap compression of unlike risks',
        severity: 'high',
        detectionSignals: [
          'One cap is applied to all claims without a clause-area table.',
          'The business case depends on data, uptime, transition, or IP commitments that have no separate remedy treatment.',
          'Vendor redlines add exclusive-remedy language after BAFO pricing is accepted.',
        ],
        mitigations: [
          'Build an obligation-by-obligation cap table.',
          'Route unresolved high-impact categories to executive award risk review.',
          'Tie any cap concession to operational controls, insurance evidence, or scope reduction.',
        ],
        contractualRemedies: ['Named super-caps', 'Carve-out schedule', 'Insurance covenant', 'Remedy-preservation language'],
      },
    ],
    body: `## Summary
Liability cap architecture is the contract-intelligence pattern for turning a vague liability debate into a comparable sourcing artifact. The useful question is not whether the vendor accepts the buyer's preferred cap. The useful question is which obligations are inside the general cap, which obligations receive higher protection, which remedies are excluded, and which residual risks must be accepted by the award authority.

## When to apply
Apply this pattern whenever the vendor's obligations are not economically interchangeable. A late support response, a failed implementation milestone, a confidentiality breach, a data-protection failure, an IP claim, and a stranded transition are different risk shapes. They should not be collapsed into one cap without an explicit decision. The pattern is especially useful in SaaS, managed services, outsourcing, integration, data-platform, AI-enabled workflow, and security tool sourcing where service promises, customer data, and continuity obligations sit in the same agreement.

## How it works
Create a liability cap table before final commercial close. Rows should include the obligation area, buyer position, vendor position, proposed cap, exclusions, indemnity treatment, insurance support, remedy limits, and unresolved decision owner. The artifact allows sourcing, legal, security, privacy, finance, and the business sponsor to discuss the same structure. It also prevents a late legal redline from quietly changing the economics that the scorecard assumed.

## Evaluation signals
Healthy events can explain why a cap level matches the awarded scope and why any super-cap or carve-out is tied to a specific obligation. Weak events rely on a single phrase such as standard liability language, market position, or vendor paper without showing the obligation taxonomy. A strong BAFO record captures what changed between proposal, negotiation, and final contract so award approvers can see whether price improved by moving risk back to the buyer.

## Negotiation posture
Start with obligation separation rather than an abstract uncapped demand. Vendors are more likely to engage when the buyer can show which obligations require different treatment and why those obligations mattered in the sourcing decision. If the vendor will not move, preserve the issue as an explicit residual risk instead of treating contract signature as proof that the risk disappeared.

## Pitfalls
The pattern fails when legal review happens after award, when the order form can override master terms, when indemnities are drafted separately from liability caps, or when insurance certificates are mistaken for contract remedies. It also fails when the buyer accepts a low cap because operational teams assume the vendor would never allow the triggering event to happen.

## Contract-intelligence output
The durable output is a contract risk map: obligation categories, cap levels, carve-outs, insurance support, open redlines, risk owner, and approval status. That map should travel with the sourcing event, renewal decision, and transition plan so future teams understand which protections were bought, traded, or consciously left exposed.`,
  },
  {
    id: 'PAT-SRC-CON-002',
    slug: 'auto-renewal-notice-window-governance',
    title: 'Auto-Renewal Notice Window Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Renewal risk drops when notice windows, price-uplift mechanics, usage baselines, and decision owners are managed as sourcing controls instead of calendar reminders.',
    applicability:
      'Apply to SaaS, subscription, support, managed service, data, and platform agreements with auto-renewal, evergreen terms, minimum commitments, renewal-price changes, or notice windows that can remove buyer leverage.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: ['Legal-review-required', 'Finance-review', 'Vendor-management-review'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-008', 'PAT-SRC-PROC-007', 'PAT-SRC-CON-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'contract_intelligence',
    vendorClass: 'direct-tech',
    standardClauses: [
      {
        clauseArea: 'Renewal term and notice mechanics',
        buyerPosition:
          'Require explicit renewal term length, non-renewal notice method, notice recipient, deadline calculation, confirmation process, and no automatic expansion of scope or committed spend without written buyer approval.',
        fallbackPosition:
          'Accept auto-renewal only when the notice window is operationally manageable, the buyer has a termination-for-convenience or downsizing path, and renewal pricing is controlled.',
        vendorPosition:
          'Vendor may seek automatic renewal for continuity, earlier notice deadlines, and default renewal of the full subscription or service scope.',
        walkawayTriggers: [
          'Notice deadline occurs before the buyer can complete usage, security, stakeholder, or competitive review.',
          'Renewal scope includes unused licenses, retired services, or optional modules by default.',
          'The contract does not identify how notice must be delivered and acknowledged.',
        ],
      },
      {
        clauseArea: 'Renewal pricing and uplift control',
        buyerPosition:
          'Cap renewal uplift, define the base used for any increase, prohibit repricing through renamed SKUs without equivalency review, and preserve buyer rights to reduce unused quantities before renewal.',
        fallbackPosition:
          'If a fixed cap is unavailable, require advance price notice, benchmark rights, competitive event rights, or renewal opt-out rights before the uplift becomes binding.',
        vendorPosition:
          'Vendor may reserve annual uplift, list-price migration, package changes, minimum growth, or support-index adjustments.',
        walkawayTriggers: [
          'Vendor can increase price without advance notice before the non-renewal deadline.',
          'SKU migration or package retirement can force higher spend without a comparable replacement path.',
        ],
      },
      {
        clauseArea: 'Renewal governance evidence',
        buyerPosition:
          'Attach renewal governance outputs to the contract record: owner, renewal date, notice deadline, price-control terms, quantity-reduction rights, usage baseline, and decision timeline.',
        fallbackPosition:
          'If the contract repository cannot carry every field, require a renewal-control exhibit or sourcing-system task model that preserves the same facts.',
        vendorPosition:
          'Vendor may prefer renewal administration to remain in account-management cadence rather than contract terms.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Renewal calendar as commercial leverage',
        whenToUse:
          'Use before signing a new agreement or amendment when the vendor wants a longer term, ramp schedule, or broader committed spend.',
        buyerAsk:
          'Trade term length only for renewal cap, notice-window clarity, downgrade rights, and advance price-change notice that preserves time for competition.',
        vendorGive:
          'Vendor can preserve account continuity while giving the buyer predictable decision gates and controlled renewal economics.',
        tradeoffs: [
          'Longer term may improve price but increases lock-in if downsizing, exit, and renewal controls are weak.',
        ],
      },
      {
        lever: 'Usage baseline reset',
        whenToUse:
          'Use when licenses, modules, consumption, support bands, or service volumes have drifted from actual use before renewal.',
        buyerAsk:
          'Require renewal quote to show active use, inactive use, shelfware, growth assumptions, and optional modules separately before the notice deadline.',
        vendorGive:
          'Vendor may keep committed baseline in exchange for price protection, flexible substitutions, or a phased true-down plan.',
        tradeoffs: [
          'True-down rights can reduce waste but may reduce discount depth if not balanced against term or growth commitments.',
        ],
      },
      {
        lever: 'Notice acknowledgement discipline',
        whenToUse:
          'Use where past vendor communications, portal terms, or invoice language have created ambiguity about whether notice was effective.',
        buyerAsk:
          'Name notice recipients, permitted delivery methods, acknowledgement obligation, backup recipient, and escalation path in the contract record.',
        tradeoffs: [
          'More procedural detail adds administration but lowers the chance of an accidental renewal dispute.',
        ],
      },
    ],
    riskFactors: [
      {
        id: 'renewal-window-leverage-loss',
        label: 'Missed notice window removes buyer leverage',
        severity: 'high',
        detectionSignals: [
          'Notice deadline is not recorded in the sourcing or contract system.',
          'Renewal price notice arrives after or close to the non-renewal deadline.',
          'Business owner assumes procurement or legal owns renewal action, while procurement assumes the business owner owns it.',
        ],
        mitigations: [
          'Record notice window, owner, and decision timeline at contract signature.',
          'Start renewal review before vendor price notice becomes the only fact pattern.',
          'Preserve competitive event rights and quantity-reset rights in the renewal clause.',
        ],
        contractualRemedies: ['Renewal uplift cap', 'Advance price notice', 'Non-renewal acknowledgement', 'Quantity reduction right'],
      },
    ],
    body: `## Summary
Auto-renewal governance is the contract-intelligence pattern for keeping renewal control visible before the buyer loses leverage. Renewal risk is rarely created by one bad date alone. It usually comes from a chain of facts: unclear notice mechanics, late price visibility, unused quantities, owner ambiguity, SKU changes, and a decision cycle that starts after the vendor already has default renewal leverage.

## When to apply
Apply this pattern to subscription, support, SaaS, managed service, data, platform, and recurring professional-service arrangements. It is relevant for new sourcing events, amendments, and renewals. It is especially important when the agreement contains a non-renewal notice deadline, an evergreen term, minimum commitments, annual uplift language, consumption growth, shelfware risk, or modules that can be bundled into the renewal baseline.

## How it works
Convert renewal language into a governance record at signature. The record should state the current term end, renewal term, non-renewal deadline, notice method, notice recipient, acknowledgement process, price-change notice deadline, renewal uplift cap, quantity-reduction rights, module-substitution rules, business owner, procurement owner, legal owner, finance owner, and target date for a compete-or-renew decision. This record turns the clause into an operating control.

## Evaluation signals
A strong sourcing event can answer four questions before award: when must the buyer decide, what happens if no one acts, what economic change is allowed at renewal, and who owns the decision? A weak event stores the signed contract but does not expose the notice window to the people who must act on it. Another weak signal is a renewal quote that blends active users, inactive users, optional modules, price uplift, and SKU migration into one number after the notice deadline has passed.

## Negotiation posture
Use renewal governance before the vendor knows it is the incumbent with a trapped buyer. During BAFO, trade term length, committed volume, suite expansion, or payment timing only for renewal protections that will matter later. The buyer should not accept a discount today that creates an uncontrolled repricing event tomorrow. If the vendor insists on auto-renewal, the buyer should require a notice window that is long enough for usage analysis, stakeholder review, security review where needed, finance approval, and competitive fallback.

## Pitfalls
The pattern fails when the clause is negotiated but not operationalized, when the notice window is stored only as text, when account teams treat renewal as a sales cadence rather than a contract deadline, or when the buyer lacks a right to reduce unused quantities. It also fails when price-uplift caps are drafted but can be bypassed by renamed SKUs, package retirement, support-tier migration, or mandatory add-ons.

## Contract-intelligence output
The durable output is a renewal control sheet attached to the sourcing event and contract record. It should include dates, owners, economic controls, notice proof requirements, quantity rights, unresolved exceptions, and the next decision checkpoint. That sheet allows future teams to compare renewal events and identify where leverage was created, preserved, or lost.`,
  },
  {
    id: 'PAT-SRC-CON-003',
    slug: 'exit-assistance-data-return-obligations',
    title: 'Exit Assistance and Data Return Obligations',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Exit provisions become decision-grade when data return, transition assistance, continuity support, deletion evidence, and termination economics are specified before the buyer needs to leave.',
    applicability:
      'Apply when sourcing, renewing, replacing, or terminating vendors that hold buyer data, operate business processes, integrate into critical workflows, provide managed services, or support regulated or customer-facing operations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: ['Legal-review-required', 'Privacy-review-if-personal-data', 'Security-review-if-confidential-data', 'Records-retention-review'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-010', 'PAT-SRC-CON-005', 'PAT-SRC-CON-001', 'PAT-SRC-CON-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'contract_intelligence',
    vendorClass: 'service',
    standardClauses: [
      {
        clauseArea: 'Exit assistance period and scope',
        buyerPosition:
          'Define exit assistance as a mandatory obligation covering transition planning, knowledge transfer, data export, cooperation with successor providers, continued service performance, and named deliverables for a specified period.',
        fallbackPosition:
          'If the vendor will not accept broad transition duties, require a minimum assistance package, rate card, response SLA, and obligation to support a documented migration plan.',
        vendorPosition:
          'Vendor may limit assistance to then-current services, standard exports, capped hours, professional-service rates, and reasonable cooperation.',
        walkawayTriggers: [
          'Vendor can refuse transition assistance after termination notice or after a dispute begins.',
          'Exit support is available only at undefined rates or subject to vendor discretion.',
          'The contract does not require cooperation with a successor provider or internal replacement team.',
        ],
      },
      {
        clauseArea: 'Data return, format, and deletion evidence',
        buyerPosition:
          'Require complete buyer-data return in usable, documented, non-proprietary or mutually agreed formats, with export timing, metadata, attachments, audit logs where applicable, deletion certification, and backup-retention treatment.',
        fallbackPosition:
          'Accept vendor-standard exports only after sample export validation confirms completeness, readability, referential integrity, and migration feasibility.',
        vendorPosition:
          'Vendor may provide standard export tools, limit custom transformation, preserve backup retention cycles, and require fees for non-standard migration work.',
        walkawayTriggers: [
          'Buyer data can be returned only as screenshots, reports, incomplete tables, or undocumented proprietary objects.',
          'Deletion certification excludes material environments without describing retention boundaries.',
          'Export rights expire before the buyer can validate completeness.',
        ],
      },
      {
        clauseArea: 'Termination economics and continuity',
        buyerPosition:
          'State whether fees continue during exit, whether prepaid amounts are credited, whether disputed invoices can suspend support, and whether service levels continue until transition completion.',
        fallbackPosition:
          'If fee relief is limited, require predictable transition rates, no punitive unlock charges, and continued access long enough to complete validated export.',
        vendorPosition:
          'Vendor may require payment of undisputed fees, transition-service fees, and limits on post-termination access.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Sample export before award',
        whenToUse:
          'Use during RFP, proof, or BAFO when the vendor claims data portability but the buyer has not validated actual export completeness.',
        buyerAsk:
          'Require a sample export using representative records, attachments, relationships, audit fields, and configuration data before final award.',
        vendorGive:
          'Vendor can use standard export tooling while demonstrating practical migration readiness.',
        tradeoffs: [
          'Sample export takes time during sourcing but prevents discovering lock-in after termination.',
          'A standard export may be acceptable if the buyer validates that it supports the migration plan.',
        ],
      },
      {
        lever: 'Exit assistance rate-card lock',
        whenToUse:
          'Use when the vendor resists fixed exit deliverables but is willing to provide assistance as professional services.',
        buyerAsk:
          'Attach named roles, hourly or fixed rates, response times, minimum availability, and escalation paths for exit support.',
        vendorGive:
          'Vendor can preserve paid-service treatment while removing ambiguity about availability and pricing during exit.',
        tradeoffs: [
          'Paid exit support may be acceptable when rates and deliverables are predictable, but it should not excuse core data-return duties.',
        ],
      },
      {
        lever: 'Successor cooperation covenant',
        whenToUse:
          'Use where replacement will require parallel run, integration handoff, or managed-service knowledge transfer.',
        buyerAsk:
          'Require reasonable cooperation with buyer-designated successor providers, including meetings, runbooks, transition artifacts, and no obstruction of migration.',
        vendorGive:
          'Vendor can protect confidentiality and limit direct competitor access while still supporting buyer continuity.',
        tradeoffs: [
          'Successor cooperation requires confidentiality boundaries and clear control of shared materials.',
        ],
      },
    ],
    riskFactors: [
      {
        id: 'exit-data-stranding',
        label: 'Buyer data stranded at termination',
        severity: 'critical',
        detectionSignals: [
          'Contract says data will be returned but does not define format, timing, metadata, or attachments.',
          'Vendor demonstration shows reporting exports but not migration-grade exports.',
          'Transition plan depends on vendor cooperation that is not contractually required.',
        ],
        mitigations: [
          'Validate sample exports before award or renewal.',
          'Define transition deliverables, rates, and assistance period.',
          'Require deletion certification and backup-retention disclosure after verified return.',
        ],
        contractualRemedies: ['Data return covenant', 'Transition assistance schedule', 'Successor cooperation covenant', 'Deletion certification'],
      },
    ],
    body: `## Summary
Exit assistance and data return obligations are the contract-intelligence pattern for making the end of a vendor relationship operational before the buyer needs it. A contract that gives the buyer a theoretical termination right but no usable export, no transition support, no successor cooperation, and no continuity protection can turn a sourcing win into long-term lock-in.

## When to apply
Apply this pattern to vendors that store buyer data, administer workflows, operate managed services, maintain integrations, support customer-facing processes, or hold records the buyer must preserve. It matters in new sourcing, renewal, replacement, decommissioning, and disputed-performance situations. It is most important when switching cost is high, the vendor is embedded in business operations, or the buyer would need historical data to keep operating after termination.

## How it works
Design the exit model during sourcing, not after notice. The contract record should identify data categories, export format, export timing, metadata, attachments, audit logs where relevant, configuration objects, access duration, transition assistance period, named vendor roles, service levels during exit, transition-service rates, successor cooperation duties, deletion certification, backup-retention boundaries, and escalation paths. The sourcing event should test these obligations with evidence, not rely on broad portability language.

## Evaluation signals
Strong vendor responses can show a sample export, explain how relationships between records are preserved, describe standard and non-standard export work, identify what support is included, and state how deletion evidence is produced after return. Weak responses say the buyer owns its data but cannot show how the buyer receives it, how long access continues, or what happens if a successor provider needs cooperation. Another weak signal is an exit clause that gives the vendor discretion over assistance availability or pricing.

## Negotiation posture
Use the threat of future exit while the buyer still has current sourcing leverage. During BAFO, request a sample export and a transition-assistance schedule alongside pricing, service levels, and implementation commitments. If the vendor resists custom obligations, ask for standard export validation, fixed rate cards, named support roles, and a minimum cooperation covenant. The goal is not to design every future migration detail. The goal is to ensure the buyer can leave without losing data, continuity, or commercial predictability.

## Pitfalls
The pattern fails when buyers assume ownership language equals portability, when data-return language excludes metadata or attachments, when backups and deletion evidence are ignored, or when transition assistance is priced only after termination. It also fails when service levels stop immediately upon termination notice even though the buyer needs a parallel-run period to move safely.

## Contract-intelligence output
The durable output is an exit readiness schedule attached to the contract and sourcing record. It should include export evidence, assistance period, rate card, deliverables, successor cooperation rules, access duration, deletion proof, unresolved exceptions, and owner signoff. That schedule helps future renewal, decommissioning, and replacement teams understand whether the buyer can leave cleanly or must first negotiate its way out of avoidable lock-in.`,
  },
];
