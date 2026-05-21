// Domain Function Pack — Financial services · Wealth & asset management.
//
// Function key: `wealth_asset_management`.
//
// This pack covers the wealth and asset-management function: the business of
// advising clients, managing portfolios, and growing assets under management
// across the wealth spectrum — from mass-affluent and high-net-worth advisory
// to discretionary portfolio management. It spans client acquisition and
// onboarding, financial planning, portfolio construction and rebalancing,
// the advice and suitability process, fee and revenue economics, and the
// advisor-productivity engine that determines how many clients an advisor can
// serve well.
//
// The operating reality the pack encodes: wealth value is built on net new
// assets and kept on retention, and it is earned through advice that is
// suitable, documented, and fiduciary-grade. The economics turn on fee yield
// against a structural compression trend, on the cost to serve a client, and
// on how much of an advisor's day is spent on the client relationship rather
// than on administration. The AI archetypes are the recurring bets against
// exactly that reality — an advisor productivity copilot, intelligent
// portfolio construction and rebalancing, financial-planning automation,
// next-best-action and client-growth intelligence, meeting and advice
// documentation, and client-servicing automation.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const wealthAssetManagementPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'wealth_asset_management',
  functionLabel: 'Wealth & asset management',
  summary:
    'Wealth and asset management is the function that advises clients, ' +
    'manages portfolios, and grows assets under management — from mass-' +
    'affluent and high-net-worth advisory to discretionary portfolio ' +
    'management. Its economics are net new assets and organic growth, the ' +
    'fee yield captured against a structural compression trend, the cost ' +
    'to serve a client, and the advisor capacity that determines how many ' +
    'relationships an advisor can serve well. A wealth business wins by ' +
    'growing assets through advice that is suitable, documented, and ' +
    'fiduciary-grade, retaining clients and the assets they bring, and ' +
    'freeing advisor time from administration onto the client ' +
    'relationship — so the function is judged on durable asset growth and ' +
    'the quality of advice, not on any single quarter of markets-driven ' +
    'AUM movement.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'net_new_assets_growth',
      name: 'Net new assets / organic growth rate',
      definition:
        'Net new client assets — inflows less outflows, excluding market ' +
        'performance — as a percentage of beginning-of-period assets ' +
        'under management; the true organic-growth read.',
      unit: '% of beginning AUM, annualised',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: -2,
        high: 10,
        basis:
          'Organic growth spans an outflowing book to a strongly growing ' +
          'one; the band excludes market movement and varies with channel ' +
          'and client segment. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The portfolio-accounting / custody system, isolating flows from ' +
        'market performance.',
      whyItMatters:
        'It strips out the markets and shows whether the business is ' +
        'genuinely winning and keeping assets — the truest read on the ' +
        'health of the wealth franchise.',
    },
    {
      key: 'asset_retention_rate',
      name: 'Asset retention rate',
      definition:
        'The share of beginning-of-period client assets retained over the ' +
        'period — the inverse of asset attrition from departing clients ' +
        'and outflows.',
      unit: '% of beginning client assets retained',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 88,
        high: 98,
        basis:
          'Retention varies with client segment, advisor tenure, and ' +
          'service quality; intergenerational wealth transfer pressures ' +
          'the lower end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM and portfolio-accounting systems tracking client and ' +
        'asset attrition.',
      whyItMatters:
        'Retained assets compound; lost assets must be re-won at ' +
        'acquisition cost, so retention is the cheapest and most ' +
        'durable source of AUM growth.',
    },
    {
      key: 'fee_yield_on_aum',
      name: 'Fee yield on AUM',
      definition:
        'Total advisory and management fee revenue as basis points of ' +
        'average assets under management — the realised take rate after ' +
        'fee schedules, breakpoints, and discounts.',
      unit: 'basis points of average AUM',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 35,
        high: 120,
        basis:
          'Realised fee yield spans a fee-compressed, large-account or ' +
          'passive book to a rich advisory or alternatives book; segment ' +
          'and mix set the point. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The billing system reconciled against average AUM in the ' +
        'portfolio-accounting system.',
      whyItMatters:
        'It is the top line of the wealth economic engine, and it sits ' +
        'against a structural compression trend — small shifts in mix and ' +
        'discounting move it across the whole book.',
    },
    {
      key: 'revenue_per_advisor',
      name: 'Revenue per advisor',
      definition:
        'Total fee and advisory revenue divided by the number of ' +
        'producing advisors — the productivity read on the advisor ' +
        'force.',
      unit: 'USD revenue per advisor, annualised',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 300000,
        high: 1500000,
        basis:
          'Revenue per advisor spans an early-tenure or mass-affluent ' +
          'book to a mature high-net-worth one; channel and segment set ' +
          'the point. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The billing and advisor-management systems reconciled against ' +
        'the producing-advisor roster.',
      whyItMatters:
        'It is the headline productivity metric of the advisor force — ' +
        'the figure that shows whether advisors are spending their ' +
        'capacity on the relationships that generate revenue.',
    },
    {
      key: 'advisor_client_capacity',
      name: 'Advisor client capacity / book size',
      definition:
        'The number of client relationships a single advisor serves — ' +
        'the read on whether an advisor is at, below, or beyond the book ' +
        'size they can serve at the expected advice quality.',
      unit: 'client relationships per advisor',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 75,
        high: 250,
        basis:
          'Serveable book size depends on client segment, service model, ' +
          'and how much administration is automated away; mass-affluent ' +
          'books run larger. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM, measuring active client relationships per producing ' +
        'advisor.',
      whyItMatters:
        'Capacity is the constraint on growth — an advisor beyond ' +
        'capacity gives thinner advice and loses clients, so freeing ' +
        'capacity is how the business serves more clients well.',
    },
    {
      key: 'advisor_time_on_client',
      name: 'Advisor time on client-facing activity',
      definition:
        'The share of an advisor’s working time spent on client-facing ' +
        'and advice activity — meetings, planning, relationship work — ' +
        'rather than on administration, compliance paperwork, and ' +
        'operations.',
      unit: '% of advisor time client-facing',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 35,
        high: 70,
        basis:
          'Client-facing time depends on how much administration, ' +
          'paperwork, and compliance work is automated or supported; the ' +
          'band spans an admin-heavy practice to a supported one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Advisor time-allocation studies and CRM / calendar activity ' +
        'analysis.',
      whyItMatters:
        'Client-facing time is what grows and retains assets; every hour ' +
        'an advisor spends on administration is capacity not spent on the ' +
        'relationship, and it is the metric productivity tooling directly ' +
        'attacks.',
    },
    {
      key: 'financial_plan_coverage',
      name: 'Financial-plan coverage',
      definition:
        'The share of client relationships with a current, documented ' +
        'financial plan that drives the advice and the portfolio — rather ' +
        'than a portfolio held with no plan behind it.',
      unit: '% of client relationships with a current plan',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 85,
        basis:
          'Plan coverage depends on the service model and on how costly ' +
          'plan creation is; planning-led practices sit at the higher ' +
          'end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The financial-planning system reconciled against the active ' +
        'client base in the CRM.',
      whyItMatters:
        'A planned client is a retained, deeper, more referable client; ' +
        'plan coverage is the leading indicator of advice depth and of ' +
        'durable retention and growth.',
    },
    {
      key: 'portfolio_drift_rate',
      name: 'Portfolio drift / off-model rate',
      definition:
        'The share of discretionary or model-based portfolios drifted ' +
        'beyond their target allocation tolerance bands and overdue for ' +
        'rebalancing.',
      unit: '% of portfolios outside tolerance bands',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 20,
        basis:
          'Drift depends on rebalancing cadence and automation; manually ' +
          'rebalanced books drift further before being corrected. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The portfolio-management / rebalancing system comparing live ' +
        'allocations against model targets.',
      whyItMatters:
        'A drifted portfolio no longer matches the client’s agreed risk ' +
        'and objective — it is a suitability exposure and a sign the ' +
        'rebalancing discipline is not keeping up.',
    },
    {
      key: 'suitability_documentation_rate',
      name: 'Suitability / advice-documentation completeness',
      definition:
        'The share of advice interactions and recommendations with ' +
        'complete, contemporaneous suitability and rationale ' +
        'documentation on file — the regulatory record of the advice.',
      unit: '% of advice interactions fully documented',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 99,
        basis:
          'Documentation completeness depends on workflow discipline and ' +
          'tooling; manual note-taking after the fact sits at the lower ' +
          'end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM and advice / supervision system tracking documented ' +
        'recommendations against advice interactions.',
      whyItMatters:
        'Undocumented advice is a Reg-BI and fiduciary exposure ' +
        'regardless of how good the advice was; documentation is the ' +
        'defensible record the supervision process depends on.',
    },
    {
      key: 'client_onboarding_cycle_time',
      name: 'Client-onboarding cycle time',
      definition:
        'The elapsed time from a new client agreeing to engage to their ' +
        'accounts fully opened, funded, and invested — the speed of ' +
        'converting a won client into a serviced one.',
      unit: 'days from engagement to funded and invested',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 30,
        basis:
          'Onboarding cycle time depends on account-opening automation, ' +
          'KYC / AML checks, and asset-transfer friction; complex ' +
          'transfers sit at the higher end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The onboarding / account-opening workflow timestamped from ' +
        'engagement to funded.',
      whyItMatters:
        'A slow, friction-heavy onboarding loses momentum, frustrates a ' +
        'new client at the most fragile moment, and delays the day the ' +
        'relationship starts earning.',
    },
    {
      key: 'cost_to_serve',
      name: 'Cost to serve',
      definition:
        'The fully-loaded cost of serving the client base — advisor ' +
        'support, operations, technology, and compliance — as a share of ' +
        'fee revenue or as basis points of AUM.',
      unit: '% of fee revenue',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 35,
        high: 70,
        basis:
          'Cost to serve depends on automation maturity, segment, and ' +
          'service model; admin-heavy, low-automation practices sit ' +
          'higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Wealth-business cost accounting reconciled against fee revenue ' +
        'and AUM.',
      whyItMatters:
        'It is the efficiency ratio of the wealth business, and it is ' +
        'what fee compression squeezes against — controlling cost to ' +
        'serve is how margin survives a falling fee yield.',
    },
    {
      key: 'referral_conversion_rate',
      name: 'Referral / lead conversion rate',
      definition:
        'The share of qualified referrals and leads that convert into ' +
        'funded client relationships — the effectiveness of the client-' +
        'acquisition engine.',
      unit: '% of qualified leads converted to funded clients',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 10,
        high: 45,
        basis:
          'Conversion depends on lead quality, advisor follow-up ' +
          'discipline, and onboarding friction; warm referrals convert ' +
          'far higher than cold leads. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM tracking lead and referral lifecycle through to a ' +
        'funded relationship.',
      whyItMatters:
        'Conversion is the front of the organic-growth engine — leads ' +
        'that are not converted are net-new-asset growth left on the ' +
        'table at the cheapest point in the funnel.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'advisor_admin_overload',
      name: 'Advisor administration overload',
      description:
        'Advisors spend a large share of the working day on ' +
        'administration, paperwork, compliance documentation, and ' +
        'operations rather than with clients. The relationship work that ' +
        'grows and retains assets is squeezed, and book capacity is ' +
        'capped by admin, not by advice ability.',
      detectionSignal:
        'Advisor time-on-client is low, revenue per advisor is flat, and ' +
        'advisors cite paperwork and operations as the constraint on ' +
        'taking more clients.',
      diagnosticQuestion:
        'What share of an advisor’s time is genuinely client-facing, and ' +
        'what administration is capping their capacity to serve more ' +
        'clients?',
    },
    {
      key: 'fee_compression_squeeze',
      name: 'Fee-compression margin squeeze',
      description:
        'Structural fee compression — passive competition, fee ' +
        'transparency, and client price sensitivity — pulls the fee yield ' +
        'down while the cost to serve does not fall with it, squeezing ' +
        'the margin of the wealth business.',
      detectionSignal:
        'Fee yield on AUM trends down period over period while cost to ' +
        'serve is flat or rising; new-client fee schedules are below the ' +
        'book average.',
      diagnosticQuestion:
        'How fast is the realised fee yield compressing, and is the cost ' +
        'to serve falling fast enough to protect the margin?',
    },
    {
      key: 'planless_relationships',
      name: 'Portfolios without a plan',
      description:
        'Clients hold portfolios with no current financial plan behind ' +
        'them. Advice is product-led and reactive rather than goals-led, ' +
        'the relationship is shallow and easily poached, and there is no ' +
        'planning anchor to drive retention or deepen the wallet share.',
      detectionSignal:
        'Financial-plan coverage is low; advice interactions reference ' +
        'products and markets more than client goals and the plan.',
      diagnosticQuestion:
        'What share of clients have a current documented financial plan, ' +
        'and is advice driven by the plan or by product and market ' +
        'events?',
    },
    {
      key: 'rebalancing_drift',
      name: 'Rebalancing lag and portfolio drift',
      description:
        'Portfolios are rebalanced manually and infrequently, so ' +
        'allocations drift well beyond tolerance before being corrected. ' +
        'Clients carry risk they did not agree to, tax-loss-harvesting ' +
        'opportunities are missed, and the drift is a suitability ' +
        'exposure.',
      detectionSignal:
        'The portfolio-drift rate is high, rebalancing is event- or ' +
        'calendar-driven rather than tolerance-driven, and off-model time ' +
        'is long.',
      diagnosticQuestion:
        'How are portfolios kept on model — is rebalancing tolerance-' +
        'driven and timely, or manual and lagging?',
    },
    {
      key: 'advice_documentation_gap',
      name: 'Advice and suitability documentation gap',
      description:
        'Suitability and advice rationale are documented after the fact, ' +
        'inconsistently, or not at all. The advice may be sound, but the ' +
        'regulatory record is thin — a Reg-BI and fiduciary exposure that ' +
        'surfaces in supervision and examination.',
      detectionSignal:
        'Suitability-documentation completeness is below target; ' +
        'supervision and examination findings cite missing or late advice ' +
        'documentation.',
      diagnosticQuestion:
        'Is suitability and advice rationale documented contemporaneously ' +
        'and completely, or reconstructed after the fact?',
    },
    {
      key: 'onboarding_friction',
      name: 'Onboarding friction at the most fragile moment',
      description:
        'New-client onboarding is slow and paperwork-heavy — repeated ' +
        'data entry, manual KYC / AML checks, and asset-transfer friction ' +
        '— at exactly the moment a new relationship is most fragile, ' +
        'losing momentum and sometimes the client.',
      detectionSignal:
        'Client-onboarding cycle time is long and variable; new clients ' +
        'and advisors cite onboarding paperwork and transfer delay as a ' +
        'pain point.',
      diagnosticQuestion:
        'How long does it take to onboard, fund, and invest a new ' +
        'client, and where in that process is the friction?',
    },
    {
      key: 'untapped_growth_signals',
      name: 'Untapped client-growth signals',
      description:
        'Signals of opportunity and risk — a held-away asset, a lapsing ' +
        'client, a life event, an unconverted referral — sit unread in ' +
        'the data. Advisors act on the clients in front of them, not on ' +
        'where the next dollar of growth or the next attrition risk ' +
        'actually is.',
      detectionSignal:
        'Referral conversion is low, at-risk clients leave with no prior ' +
        'intervention, and there is no systematic next-best-action ' +
        'surfaced to advisors.',
      diagnosticQuestion:
        'How are growth and attrition-risk signals across the book ' +
        'surfaced to advisors, or do advisors act only on the clients ' +
        'who happen to be in front of them?',
    },
    {
      key: 'fragmented_wealth_platform',
      name: 'Fragmented wealth-technology platform',
      description:
        'CRM, financial planning, portfolio management, billing, and ' +
        'custody run as disconnected systems. The advisor re-keys data ' +
        'between them, no system holds the whole client picture, and ' +
        'every new capability means another disconnected tool.',
      detectionSignal:
        'Advisors re-key client and account data across systems; there ' +
        'is no single client record spanning plan, portfolio, and ' +
        'relationship.',
      diagnosticQuestion:
        'Is there a unified client record across CRM, planning, ' +
        'portfolio, and billing, or does the advisor stitch it together ' +
        'by hand?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'advisor_productivity_copilot',
      name: 'Advisor productivity copilot',
      valueMechanism:
        'An assistant gives the advisor a copilot that prepares for ' +
        'meetings, drafts client communications, retrieves the full ' +
        'client picture across systems, and handles routine ' +
        'administration. Value comes from shifting advisor time off ' +
        'administration and onto the client relationship — lifting ' +
        'client-facing time, book capacity, and revenue per advisor.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'CRM client, household, and relationship data',
        'Portfolio, plan, and account data across systems',
        'Meeting history, notes, and communication records',
        'Product, market, and research content for context',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot prepares and drafts; the advisor reviews every ' +
          'client-facing output and owns the advice and the ' +
          'relationship.',
        'Any drafted communication touching a recommendation must be ' +
          'reviewed for suitability and supervised before it reaches a ' +
          'client.',
        'Copilot access to client data must be permissioned and logged ' +
          'to the same standard as the systems of record.',
      ],
      metricsMoved: [
        'advisor_time_on_client',
        'advisor_client_capacity',
        'revenue_per_advisor',
        'cost_to_serve',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'intelligent_portfolio_construction',
      name: 'Intelligent portfolio construction and rebalancing',
      valueMechanism:
        'A model constructs portfolios against the client’s plan, risk ' +
        'profile, and constraints, monitors allocations against ' +
        'tolerance bands, and proposes timely, tax-aware rebalancing and ' +
        'harvesting trades. Value comes from keeping portfolios on model ' +
        'and suitable — cutting drift — and from systematically capturing ' +
        'tax-aware trading opportunities.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Client risk profile, plan, and investment constraints',
        'Live portfolio holdings and target model allocations',
        'Tax-lot, cost-basis, and account-type data',
        'Market and security reference and pricing data',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model proposes construction and rebalancing trades; an ' +
          'advisor or portfolio manager approves them and owns the ' +
          'suitability decision — discretion does not remove ' +
          'accountability.',
        'Proposed trades must respect the client’s stated constraints, ' +
          'concentration limits, and tax sensitivity, and stay within the ' +
          'agreed investment policy.',
        'Model and market assumptions drift; allocation models must be ' +
          'governed, validated, and monitored, not set once.',
      ],
      metricsMoved: [
        'portfolio_drift_rate',
        'suitability_documentation_rate',
        'cost_to_serve',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'financial_planning_automation',
      name: 'Financial-planning automation and advice support',
      valueMechanism:
        'A model assembles a draft financial plan from client data — ' +
        'goals, balance sheet, cash flow, held-away assets — runs ' +
        'scenarios, and keeps the plan current as circumstances change. ' +
        'Value comes from making a planned relationship affordable for ' +
        'far more clients — lifting plan coverage, advice depth, and ' +
        'retention.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Client goals, balance sheet, and cash-flow data',
        'Held-away and aggregated external account data',
        'Tax, estate, and benefit assumptions and rules',
        'Market and planning assumption sets',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model drafts the plan and scenarios; the advisor reviews, ' +
          'adjusts, and owns the advice and the planning assumptions.',
        'Planning projections must carry their assumptions and ' +
          'uncertainty explicitly — a plan presented with false ' +
          'precision misleads the client.',
        'A plan that drives a recommendation is advice — it falls under ' +
          'the suitability and fiduciary frame and must be supervised.',
      ],
      metricsMoved: [
        'financial_plan_coverage',
        'asset_retention_rate',
        'advisor_time_on_client',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'next_best_action_growth',
      name: 'Next-best-action and client-growth intelligence',
      valueMechanism:
        'A model reads the book for opportunity and risk — held-away ' +
        'assets to consolidate, life events, wallet-share gaps, lapsing ' +
        'clients, unconverted referrals — and surfaces a prioritised ' +
        'next-best-action to the advisor. Value comes from directing ' +
        'advisor attention to where the next dollar of net new assets and ' +
        'the next attrition risk actually are.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'CRM relationship, household, and interaction data',
        'Portfolio, flow, and held-away asset data',
        'Life-event, referral, and lead-pipeline signals',
        'Client-segment and propensity data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces and prioritises actions; the advisor decides ' +
          'whether and how to act and owns the client conversation.',
        'A surfaced action must never become a sales prompt that ' +
          'overrides suitability — the client’s interest, not the ' +
          'revenue opportunity, governs.',
        'Propensity and outreach models must be tested for fair ' +
          'treatment across client segments and respect consent and ' +
          'privacy.',
      ],
      metricsMoved: [
        'net_new_assets_growth',
        'referral_conversion_rate',
        'asset_retention_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'meeting_advice_documentation',
      name: 'Meeting capture and advice documentation',
      valueMechanism:
        'An agent captures client meetings, drafts the contemporaneous ' +
        'suitability and advice-rationale record, updates the CRM, and ' +
        'flags follow-ups. Value comes from making advice documentation ' +
        'complete and contemporaneous — closing the Reg-BI and fiduciary ' +
        'exposure — while removing the after-the-fact note-taking burden ' +
        'from the advisor.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Client meeting audio or transcripts, with consent',
        'Client profile, plan, and recommendation context',
        'Suitability and advice-documentation standards',
        'CRM and supervision-system write access',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent drafts the documentation; the advisor reviews, ' +
          'corrects, and attests to the record — the advisor remains the ' +
          'author of the advice record.',
        'Documentation must reflect what was actually advised — the ' +
          'agent does not infer a rationale or a suitability basis that ' +
          'was not discussed.',
        'Meeting capture requires client consent and the recordings and ' +
          'transcripts must be retained and protected to the records-' +
          'retention standard.',
      ],
      metricsMoved: [
        'suitability_documentation_rate',
        'advisor_time_on_client',
        'cost_to_serve',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'client_servicing_automation',
      name: 'Client-onboarding and servicing automation',
      valueMechanism:
        'An agent automates onboarding and routine servicing — account ' +
        'opening, KYC / AML data assembly, asset-transfer initiation, ' +
        'money movement, and routine client requests — and routes only ' +
        'the exceptions to a human. Value comes from compressing ' +
        'onboarding cycle time and cutting cost to serve while freeing ' +
        'advisor and support capacity.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Client and account onboarding and KYC / AML data',
        'Asset-transfer and custody workflow access',
        'Service-request and case-history data',
        'Account-opening and servicing rule sets',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent processes routine onboarding and servicing; a ' +
          'support specialist works exceptions and owns any action that ' +
          'moves client funds.',
        'KYC / AML and sanctions checks must be completed and reviewed — ' +
          'onboarding automation does not shortcut the compliance gate.',
        'A wrong action on a client account is a service failure and a ' +
          'trust loss; servicing confidence must be measured and low-' +
          'confidence cases must escalate.',
      ],
      metricsMoved: [
        'client_onboarding_cycle_time',
        'cost_to_serve',
        'asset_retention_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_client_record_layer',
      name: 'Unified client-record layer',
      description:
        'A pattern that brings CRM, financial planning, portfolio ' +
        'management, billing, and custody into one client record, so the ' +
        'advisor and every AI capability work from a single, current ' +
        'picture of the household — plan, portfolio, flows, and ' +
        'relationship — rather than re-keying across disconnected ' +
        'systems.',
      boundary:
        'It holds and serves the unified client record; the advisor owns ' +
        'the client relationship and every advice decision. It is a ' +
        'read-and-write record layer, not an advice engine.',
      humanAccountabilityPoint:
        'The head of wealth platform / operations accountable for the ' +
        'integrity and currency of the client record.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'advisor_copilot_pattern',
      name: 'Advisor-copilot productivity pattern',
      description:
        'A pattern that puts a copilot alongside the advisor for meeting ' +
        'preparation, communication drafting, documentation, and routine ' +
        'administration — embedded in the advisor’s workflow so freed ' +
        'time is redeployed onto the client relationship, not absorbed.',
      boundary:
        'It prepares, drafts, and documents; the advisor reviews every ' +
        'client-facing output and owns the advice. It does not give ' +
        'advice or contact a client unsupervised.',
      humanAccountabilityPoint:
        'The head of advisory / practice management accountable for ' +
        'advisor productivity and client-facing time.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'plan_led_portfolio_pattern',
      name: 'Plan-led portfolio-management pattern',
      description:
        'A pattern that anchors portfolio construction and rebalancing ' +
        'to a current financial plan and risk profile, monitors ' +
        'allocations against tolerance bands, and proposes timely, tax-' +
        'aware trades — so the portfolio is always a documented ' +
        'expression of the plan and the agreed risk.',
      boundary:
        'It constructs, monitors, and proposes trades; an advisor or ' +
        'portfolio manager approves and owns the suitability decision. ' +
        'It does not place a trade without approval.',
      humanAccountabilityPoint:
        'The chief investment officer / head of portfolio management ' +
        'accountable for model integrity and portfolio suitability.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'advice_supervision_pattern',
      name: 'Advice-documentation-and-supervision pattern',
      description:
        'A pattern that captures every advice interaction, drafts the ' +
        'contemporaneous suitability and rationale record, and feeds the ' +
        'supervision and exception process — so the regulatory record of ' +
        'the advice is complete by default rather than reconstructed ' +
        'after the fact.',
      boundary:
        'It captures and drafts the advice record; the advisor attests ' +
        'to it and a supervisor owns the supervision decision. It does ' +
        'not approve advice or close a supervision exception.',
      humanAccountabilityPoint:
        'The chief compliance officer / supervision principal ' +
        'accountable for advice supervision and the suitability record.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'growth_signal_pattern',
      name: 'Client-growth signal-and-prioritisation pattern',
      description:
        'A pattern that reads the book for growth and attrition signals ' +
        '— held-away assets, life events, wallet-share gaps, lapsing ' +
        'clients, unconverted referrals — and serves a prioritised next-' +
        'best-action to the advisor, directing attention to where net ' +
        'new assets and retention risk actually are.',
      boundary:
        'It reads signals and prioritises actions; the advisor decides ' +
        'whether to act and owns the client conversation, governed by ' +
        'the client’s interest. It does not contact clients itself.',
      humanAccountabilityPoint:
        'The head of wealth growth / segment leadership accountable for ' +
        'net new assets and the client-interest-first standard.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Wealth and asset-management value is realised in four distinct ' +
      'ways and a forecast must keep them separate. First, organic ' +
      'growth: freeing advisor capacity and surfacing growth signals wins ' +
      'and consolidates net new assets — a recurring gain that compounds ' +
      'as those assets earn fees year after year. Second, retention: ' +
      'deeper, planned, well-served relationships keep assets that would ' +
      'otherwise attrite — recurring, and the cheapest form of growth. ' +
      'Third, lower cost to serve: copilot, documentation, and servicing ' +
      'automation cut administration and operations cost — recurring, and ' +
      'the direct defence against fee compression. Fourth, capacity ' +
      'unlocked: an advisor freed from administration can serve more ' +
      'relationships, so the same advisor force grows the book. The ' +
      'dominant constraint is that wealth value is bounded by markets and ' +
      'by client and advisor behaviour the business does not control — ' +
      'AUM moves with markets, advisors and clients can leave — so a ' +
      'forecast must isolate the organic, controllable gain from market-' +
      'driven AUM movement. The growth and retention gains compound; the ' +
      'capacity and cost gains are realised once the operating model ' +
      'actually changes.',
    dominantHaircutFactors: [
      {
        factor: 'Markets and fee-compression headwind',
        rationale:
          'AUM and fee revenue move with markets the business does not ' +
          'control, and a structural fee-compression trend erodes the ' +
          'yield on every dollar. A modelled growth gain can be masked or ' +
          'offset by a market drawdown or by compression, so the forecast ' +
          'must isolate the organic, fee-rate-adjusted gain.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from market movement and fee compression ' +
            'outside the business’s control; a planning range driven by ' +
            'segment and market regime.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Advisor adoption and behaviour change',
        rationale:
          'Productivity, copilot, and next-best-action value only lands ' +
          'if advisors adopt the tools and genuinely redeploy freed time ' +
          'onto the client relationship. Advisor autonomy and habit make ' +
          'adoption the hardest-biting factor — partial adoption realises ' +
          'a fraction of the modelled gain.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Forecast erosion from partial advisor adoption and the ' +
            'failure to redeploy freed capacity; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and platform integration readiness',
        rationale:
          'Planning, portfolio, and growth-signal use cases only work to ' +
          'the extent client, plan, portfolio, and held-away data are ' +
          'complete and integrated. Fragmented wealth platforms and poor ' +
          'data cap how much of the modelled value can be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.35,
          basis:
            'Forecast erosion from incomplete data and a fragmented ' +
            'wealth-technology platform; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Suitability, fiduciary, and supervision ceiling',
        rationale:
          'Advice value is bounded by the suitability and fiduciary ' +
          'frame — a recommendation must serve the client’s interest and ' +
          'be supervised, and AI-assisted advice cannot outrun that ' +
          'control. The supervision ceiling haircuts the modelled growth ' +
          'and automation upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled advice or automation gain not ' +
            'reachable within the suitability and supervision frame; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Organic net-new-asset growth uplift',
        range: {
          low: 0.5,
          high: 4,
          basis:
            'Percentage-point uplift in the organic net-new-asset ' +
            'growth rate from freed capacity and growth-signal ' +
            'intelligence; a planning range, isolated from market ' +
            'movement.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the organic (flow-only) net-new-' +
          'asset growth rate.',
      },
      {
        lever: 'Advisor-productivity uplift',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative uplift in revenue per advisor or client-facing ' +
            'capacity from removing administration; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in revenue per advisor or in client-' +
          'facing time.',
      },
      {
        lever: 'Cost-to-serve reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in cost to serve from copilot, ' +
            'documentation, and servicing automation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in cost to serve as a share of ' +
          'fee revenue.',
      },
      {
        lever: 'Asset-retention-rate uplift',
        range: {
          low: 0.5,
          high: 3,
          basis:
            'Percentage-point uplift in the asset-retention rate from ' +
            'deeper, planned, better-served relationships; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the asset-retention rate.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal (advisor ' +
      'time-on-client, plan coverage, onboarding cycle time); 12–24 ' +
      'months to a settled financial result, because net-new-asset ' +
      'growth and retention only prove out once a full cycle of ' +
      'relationships, flows, and a market period have run through the ' +
      'book.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Wealth CRM / client-relationship platform',
        role:
          'The system of record for the client relationship — household ' +
          'and contact data, interactions, pipeline, and the advisor’s ' +
          'view of the book.',
        examples: [
          'Salesforce Financial Services Cloud',
          'Practifi',
          'Microsoft Dynamics for wealth',
        ],
      },
      {
        name: 'Financial-planning system',
        role:
          'Holds the client financial plan — goals, balance sheet, cash ' +
          'flow, scenarios — and drives goals-led advice.',
        examples: ['eMoney', 'MoneyGuidePro', 'RightCapital'],
      },
      {
        name: 'Portfolio-management / rebalancing system',
        role:
          'Holds model portfolios and target allocations, monitors ' +
          'drift, and generates rebalancing and tax-aware trades.',
        examples: [
          'Orion',
          'Black Diamond',
          'Tamarac',
          'in-house portfolio-management platforms',
        ],
      },
      {
        name: 'Portfolio-accounting and custody platform',
        role:
          'The financial system of record for holdings, transactions, ' +
          'flows, performance, and the assets held in custody.',
        examples: [
          'Fidelity / Schwab custody platforms',
          'Pershing',
          'SEI',
        ],
      },
      {
        name: 'Billing and advice / supervision system',
        role:
          'Calculates advisory fees against AUM and fee schedules, and ' +
          'holds the suitability, advice, and supervision record.',
        examples: [
          'Orion / Tamarac billing',
          'advisor-fee-billing platforms',
          'compliance / supervision systems',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of Wealth Management / Wealth Business Lead',
        accountability:
          'Owns the wealth P&L — net new assets, fee yield, cost to ' +
          'serve — and the growth and retention of the franchise.',
      },
      {
        title: 'Financial advisor / relationship manager',
        accountability:
          'Owns the client relationship, the advice, and the suitability ' +
          'of every recommendation.',
      },
      {
        title: 'Head of advisory / practice management',
        accountability:
          'Owns advisor productivity, capacity, and the advisor ' +
          'operating model.',
      },
      {
        title: 'Chief Investment Officer / head of portfolio management',
        accountability:
          'Owns the model portfolios, the investment process, and ' +
          'portfolio suitability and risk.',
      },
      {
        title: 'Chief Compliance Officer / supervision principal',
        accountability:
          'Owns advice supervision, the suitability record, and ' +
          'regulatory compliance of the advice process.',
      },
      {
        title: 'Head of wealth platform / operations',
        accountability:
          'Owns the wealth-technology platform, onboarding, servicing, ' +
          'and the integrity of the client record.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Regulation Best Interest (Reg BI)',
        relevance:
          'Requires broker-dealer recommendations to be in the retail ' +
          'client’s best interest, with disclosure, care, conflict, and ' +
          'compliance obligations — the frame for documented suitability ' +
          'of advice.',
      },
      {
        name: 'The Investment Advisers Act and the fiduciary standard',
        relevance:
          'Imposes a fiduciary duty of care and loyalty on registered ' +
          'investment advisers — advice must serve the client’s interest, ' +
          'the standard AI-assisted advice cannot outrun.',
      },
      {
        name: 'SEC and FINRA rules — suitability, supervision, and records',
        relevance:
          'Govern suitability, the supervision of advice, and books-and-' +
          'records retention — the frame any advice-documentation or ' +
          'meeting-capture use case must satisfy.',
      },
      {
        name: 'KYC / AML and BSA obligations',
        relevance:
          'Govern client identification, due diligence, and ' +
          'monitoring — the compliance gate onboarding and servicing ' +
          'automation must complete, never shortcut.',
      },
      {
        name: 'Data-privacy and Regulation S-P',
        relevance:
          'Govern the protection and permitted use of client financial ' +
          'information — the frame for AI access to client data and for ' +
          'meeting capture and retention.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Assets under management (AUM)',
        definition:
          'The total market value of client assets a firm or advisor ' +
          'manages — the base on which advisory fees are charged.',
      },
      {
        term: 'Net new assets / organic growth',
        definition:
          'Client inflows less outflows, excluding market performance — ' +
          'the true read on whether the business is winning assets.',
      },
      {
        term: 'Fee compression',
        definition:
          'The structural downward trend in advisory and management fees ' +
          'driven by passive competition, transparency, and client price ' +
          'sensitivity.',
      },
      {
        term: 'Suitability',
        definition:
          'The requirement that a recommendation fit the client’s ' +
          'objectives, risk tolerance, and circumstances, documented as ' +
          'a regulatory record.',
      },
      {
        term: 'Rebalancing',
        definition:
          'Trading a portfolio back to its target model allocation when ' +
          'holdings drift beyond agreed tolerance bands.',
      },
      {
        term: 'Tax-loss harvesting',
        definition:
          'Realising investment losses to offset taxable gains while ' +
          'keeping the portfolio’s intended market exposure.',
      },
      {
        term: 'Held-away assets',
        definition:
          'Client assets held at other institutions — a consolidation ' +
          'opportunity and a gap in the advisor’s view of the household.',
      },
      {
        term: 'Discretionary management',
        definition:
          'A mandate under which the advisor or manager may trade the ' +
          'portfolio without per-trade client approval, within the ' +
          'agreed investment policy.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Wealth & Asset-Management Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the wealth business is leaking growth, advisor ' +
        'capacity, and margin — in advisor productivity, planning, ' +
        'portfolio management, or servicing — with baseline evidence, ' +
        'before a solution is shaped.',
      sections: [
        {
          heading: 'Wealth business and operating context',
          guidance:
            'Name the wealth business in scope — client segments, ' +
            'channel and service model, the advisor force and book ' +
            'structure, and the advisory vs. discretionary mix. State ' +
            'which CRM, planning, portfolio-management, custody, and ' +
            'billing systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — net new assets, asset retention, fee ' +
            'yield, revenue per advisor, advisor capacity and time-on-' +
            'client, plan coverage, portfolio drift, suitability ' +
            'documentation, onboarding cycle time, cost to serve, ' +
            'referral conversion. For any metric not recorded, name it as ' +
            'a precise seed gap with its data source.',
        },
        {
          heading: 'Growth, capacity, and margin diagnostic',
          guidance:
            'Isolate organic growth from market-driven AUM movement, ' +
            'analyse where advisor capacity is consumed, and locate where ' +
            'fee compression is squeezing margin against cost to serve.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — advisor admin overload, ' +
            'fee-compression squeeze, planless relationships, rebalancing ' +
            'drift, advice-documentation gap, onboarding friction, ' +
            'untapped growth signals, fragmented platform — and state ' +
            'which are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — organic growth, advisor productivity, ' +
            'cost to serve, retention — explicitly haircut by markets and ' +
            'compression, advisor adoption, data readiness, and the ' +
            'supervision ceiling. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric is a ' +
            'named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Wealth & Asset-Management Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a wealth AI Move ' +
        'on this business — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'organic growth, advisor productivity, cost to serve, and ' +
            'retention, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — organic net new assets, revenue per advisor, cost ' +
            'to serve, retention. Where a baseline is a seed gap — for ' +
            'example no measured advisor time-on-client — say so and ' +
            'state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — markets and fee ' +
            'compression, advisor adoption, data readiness, the ' +
            'supervision ceiling — explicitly and show the haircut math. ' +
            'Isolate the organic, controllable gain from market-driven ' +
            'AUM movement.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the CRM, planning, ' +
            'portfolio-management, custody, and billing systems, and the ' +
            'operating-model change — advisor and support redeployment ' +
            'from the work the automation removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a market drawdown, faster fee ' +
            'compression, weaker advisor adoption, and a fragmented ' +
            'platform. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Suitability and fiduciary posture',
          guidance:
            'For any advice, planning, or portfolio component, state the ' +
            'suitability, Reg-BI, and fiduciary controls and the ' +
            'supervision posture — client-interest-first, not revenue, is ' +
            'the objective, and the AI does not outrun supervision.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged net-new-asset and retention metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Wealth & Asset-Management Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for ' +
        'the wealth AI capability, grounded in the function reference ' +
        'patterns and the suitability and fiduciary frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — unified client-record layer, advisor-copilot ' +
            'pattern, plan-led portfolio management, advice-documentation ' +
            'and supervision, client-growth signal pattern — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the CRM, planning, portfolio-management, custody, ' +
            'and billing integrations, the held-away aggregation feeds, ' +
            'and the client, plan, and portfolio data the use cases ' +
            'depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and ' +
            'how the advisor and supervisor review and own advice. No ' +
            'advice-touching capability ships without a named supervision ' +
            'owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how advisor, planning, portfolio-management, ' +
            'supervision, and servicing workflows change, how advisors ' +
            'and support staff are redeployed, and who owns each change.',
        },
        {
          heading: 'Suitability, fiduciary, and responsible-AI controls',
          guidance:
            'State the suitability and supervision controls, the ' +
            'model-governance discipline for portfolio and planning ' +
            'models, the data-privacy and consent controls, and the ' +
            'regulatory frames (Reg BI, the fiduciary standard, SEC / ' +
            'FINRA rules, Reg S-P) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the wealth-technology stack, and the phased rollout by ' +
            'advisor segment and use case.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Wealth & Asset-Management Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the wealth AI capability so ' +
        'value reaches net new assets, advisor capacity, and cost to ' +
        'serve, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot advisor cohort or segment, advisor onboarding, scale ' +
            'across the advisor force — with milestones tied to the ' +
            'operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, model governance, advice supervision, advisor ' +
            'adoption, support redeployment, Tower measurement.',
        },
        {
          heading: 'Advisor adoption and redeployment approach',
          guidance:
            'Define the change runway for advisors and support staff — ' +
            'training, workflow change, and the redeployment of freed ' +
            'capacity onto the client relationship — and how adoption ' +
            'and the redeployment of time are measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged net-new-asset and ' +
            'retention metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — market and fee-compression headwind, ' +
            'weak advisor adoption, model drift, suitability and ' +
            'supervision exposure, platform fragmentation — with the ' +
            'escalation owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Organic growth — net new assets distinct from market movement',
      authoritativeSource:
        'The portfolio-accounting / custody system, isolating client ' +
        'inflows and outflows from market performance.',
      whatGoodEvidenceLooksLike:
        'A net-new-asset figure built from flows only, with market ' +
        'performance explicitly separated, broken down by channel and ' +
        'client segment.',
      weakEvidenceToReject:
        'A headline AUM-growth number that conflates market appreciation ' +
        'with genuine asset gathering, or a flow figure with no market ' +
        'adjustment.',
    },
    {
      claim: 'Advisor productivity and where advisor capacity goes',
      authoritativeSource:
        'Advisor time-allocation studies and CRM / calendar activity ' +
        'analysis reconciled against revenue per advisor.',
      whatGoodEvidenceLooksLike:
        'A measured split of advisor time between client-facing and ' +
        'administrative work, with the administration that caps capacity ' +
        'identified.',
      weakEvidenceToReject:
        'An assertion that advisors are busy with no measurement of how ' +
        'time splits, or a productivity claim with no link to client-' +
        'facing capacity.',
    },
    {
      claim: 'Fee yield and the pace of fee compression',
      authoritativeSource:
        'The billing system reconciled against average AUM, with ' +
        'realised yield trended over time and by client cohort.',
      whatGoodEvidenceLooksLike:
        'Realised fee yield in basis points trended period over period, ' +
        'with new-client fee schedules compared against the book average ' +
        'to show the compression trajectory.',
      weakEvidenceToReject:
        'A published fee-schedule rate presented as realised yield, or a ' +
        'single-period yield figure that cannot show the compression ' +
        'trend.',
    },
    {
      claim: 'Suitability and advice documentation completeness',
      authoritativeSource:
        'The CRM and advice / supervision system, with documented ' +
        'recommendations reconciled against advice interactions and ' +
        'supervision findings.',
      whatGoodEvidenceLooksLike:
        'A measured documentation-completeness rate from a supervision ' +
        'review, separating contemporaneous complete records from late ' +
        'or missing ones.',
      weakEvidenceToReject:
        'A claim that advice is sound with no documentation evidence, or ' +
        'a completeness assertion with no independent supervision review.',
    },
    {
      claim: 'The forecast value of a wealth AI Move',
      authoritativeSource:
        'The value model — organic growth, advisor productivity, cost to ' +
        'serve, and retention, each haircut by its dominant factors — ' +
        'with the organic gain isolated from market movement.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the organic gain separated from ' +
        'market-driven AUM movement, and every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single-point growth number, a vendor ROI claim taken at face ' +
        'value, or a forecast that credits market-driven AUM movement as ' +
        'AI value or ignores the advisor-adoption haircut.',
    },
  ],
};
