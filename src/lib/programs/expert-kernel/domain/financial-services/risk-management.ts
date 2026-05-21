// Domain Function Pack — Financial services · Enterprise risk management.
//
// Function key: `risk_management`.
//
// Enterprise risk management is the second-line control function that
// identifies, measures, monitors, and constrains the risks a financial
// institution takes — and ensures the institution stays inside the risk
// appetite its board has set and the capital and liquidity its regulators
// require. It owns the full risk taxonomy: credit risk (the risk a borrower
// or counterparty defaults), market risk (the risk of loss from moves in
// rates, spreads, equity, and FX), liquidity and funding risk (the risk the
// institution cannot meet obligations as they fall due), interest-rate risk
// in the banking book, and operational risk (the risk of loss from failed
// processes, people, systems, and external events). It owns model risk — the
// risk that the very models used to measure all of the above are wrong — and
// the validation discipline that governs them. It owns the risk-appetite
// framework that translates the board's tolerance into limits, the
// stress-testing and capital-planning machinery (CCAR / DFAST and the
// internal ICAAP), and the aggregated risk reporting that tells the board and
// the regulator, honestly, how much risk the institution is actually running.
// It is judged on a hard quadruple bind: risk must be measured accurately and
// early enough to act on, the institution must stay inside appetite and above
// its regulatory capital and liquidity minimums, the cost and friction of the
// control function must stay proportionate to the risk it removes, and every
// number reported to the board and the supervisor must be defensible,
// reconciled, and free of the optimism that turns a control function into a
// rubber stamp.
//
// The operating reality the pack encodes: risk management fails in four
// coupled ways. It is slow and backward-looking — risk is measured monthly or
// quarterly from stale, manually reconciled data, so a deteriorating credit
// book or a breached limit is seen long after the exposure was taken. It is
// fragmented — credit, market, liquidity, and operational risk each sit in
// their own system and model, so the institution cannot see its aggregate
// exposure to a single name, sector, or shock, and concentration builds
// invisibly. Its models are unvalidated or stale — models drift, are used
// outside the conditions they were built for, and carry validation findings
// that are never closed, so the numbers the board acts on are quietly wrong.
// And it is heavy and slow to answer — a regulatory stress test or a board
// question consumes months of manual data assembly, and the second line
// spends its scarce judgement on reconciliation rather than risk. The AI
// archetypes are the recurring bets against that reality: early-warning credit
// deterioration detection, risk-data aggregation and exposure intelligence,
// stress-testing and scenario acceleration, model-risk and validation
// assistance, operational-risk and control-monitoring intelligence, and the
// risk-reporting and regulatory-narrative copilot.
//
// The companion financial-services packs — lending-credit-underwriting owns
// origination and the underwriting decision at the front line;
// fraud-financial-crime owns transaction fraud and financial-crime
// detection; regulatory-compliance owns the conduct and compliance rule set;
// finance-treasury-alm owns the balance-sheet, funding, and capital actions.
// Enterprise risk management is the second-line function that measures,
// aggregates, stress-tests, and constrains the risk those functions generate,
// and owns the appetite and model-governance framework over all of them.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const riskManagementPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'risk_management',
  functionLabel: 'Enterprise risk management',
  summary:
    'Enterprise risk management is the second-line control function that ' +
    'identifies, measures, monitors, and constrains the risks a financial ' +
    'institution takes — and keeps it inside the risk appetite its board ' +
    'has set and the capital and liquidity its regulators require. It owns ' +
    'the full risk taxonomy — credit, market, liquidity and funding, ' +
    'interest-rate, and operational risk — plus model risk and the ' +
    'validation discipline that governs every measurement model. It owns ' +
    'the risk-appetite framework and its limits, the stress-testing and ' +
    'capital-planning machinery (CCAR / DFAST and the internal ICAAP), and ' +
    'the aggregated risk reporting that tells the board and the supervisor ' +
    'how much risk the institution is actually running. The function is ' +
    'judged on a quadruple bind: risk must be measured accurately and early ' +
    'enough to act on, the institution must stay inside appetite and above ' +
    'its regulatory minimums, the control function must stay proportionate ' +
    'to the risk it removes, and every number reported must be defensible, ' +
    'reconciled, and free of optimism. It fails when risk is measured slow ' +
    'and backward-looking, exposure is fragmented across siloed systems so ' +
    'concentration builds invisibly, measurement models are stale or ' +
    'unvalidated, and a stress test or a board question consumes months of ' +
    'manual data assembly.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'risk_appetite_limit_utilization',
      name: 'Risk-appetite limit utilization',
      definition:
        'The degree to which exposures consume the limits the board-' +
        'approved risk appetite sets — credit concentration, market VaR, ' +
        'liquidity, and operational-risk limits — expressed as utilization ' +
        'against the limit, with breaches and amber-zone positions counted.',
      unit: '% of limit consumed (with breach count)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 60,
        high: 90,
        basis:
          'Healthy limit utilization sits in a managed band — too low ' +
          'wastes risk capacity, too close to the limit leaves no buffer ' +
          'for a shock. The band is a planning range; the institution’s ' +
          'appetite calibration sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The risk-appetite framework and limit-monitoring system, ' +
        'aggregating exposures against board-approved limits.',
      whyItMatters:
        'Limit utilization is the headline measure of whether the ' +
        'institution is operating inside the risk appetite its board set — ' +
        'a breach, or a cluster of amber positions, is the earliest ' +
        'governance signal that risk-taking has run ahead of tolerance.',
    },
    {
      key: 'risk_data_aggregation_timeliness',
      name: 'Risk-data aggregation timeliness',
      definition:
        'The elapsed time from period close to a complete, reconciled, ' +
        'board-ready aggregate risk position across all risk types and ' +
        'legal entities — the lag between the risk existing and the ' +
        'institution being able to see it whole.',
      unit: 'business days from period close to reconciled aggregate',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 15,
        basis:
          'Aggregation timeliness depends on data architecture and ' +
          'reconciliation automation; the band spans an institution with ' +
          'a governed risk-data layer to one assembling reports manually. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The risk-data aggregation and reporting platform, timestamping ' +
        'period close against the sign-off of the reconciled aggregate.',
      whyItMatters:
        'Risk seen late is risk that cannot be acted on — a slow ' +
        'aggregation cycle means the board governs a position that is ' +
        'weeks stale, and BCBS 239 makes timely, accurate aggregation a ' +
        'direct supervisory expectation.',
    },
    {
      key: 'early_warning_lead_time',
      name: 'Credit early-warning lead time',
      definition:
        'The average lead time between an early-warning indicator firing ' +
        'on a borrower or portfolio and the credit actually migrating to a ' +
        'watch list, downgrade, or default — the warning the function gets ' +
        'before the loss.',
      unit: 'days of lead time before credit migration',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 180,
        basis:
          'Early-warning lead time depends on the breadth and freshness ' +
          'of the signals monitored; the band spans a function reliant on ' +
          'annual reviews to one with continuous behavioural and external ' +
          'signal. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The credit-risk and early-warning system, comparing indicator ' +
        'fire dates against subsequent watch-list, downgrade, and default ' +
        'events.',
      whyItMatters:
        'A credit loss is far cheaper to manage before it crystallises — ' +
        'lead time is the difference between a restructuring that protects ' +
        'value and a write-off, and it is the core measure of whether ' +
        'credit risk is being managed forward or counted after the fact.',
    },
    {
      key: 'var_backtesting_exceptions',
      name: 'VaR backtesting exceptions',
      definition:
        'The count of days in a rolling window on which the actual ' +
        'trading or portfolio loss exceeded the value-at-risk the model ' +
        'predicted at its confidence level — the empirical test of whether ' +
        'the market-risk model is calibrated.',
      unit: 'exceptions per rolling 250 trading days',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0,
        high: 4,
        basis:
          'At a 99% one-day VaR, the regulatory traffic-light band keeps ' +
          'a well-calibrated model in a low-exception zone; too many ' +
          'exceptions signal an understated model, near-zero may signal ' +
          'an overstated one. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The market-risk system, comparing daily clean P&L against the ' +
        'VaR forecast over the rolling backtesting window.',
      whyItMatters:
        'Backtesting exceptions are the regulator’s evidence that the ' +
        'market-risk model can be trusted — too many push the institution ' +
        'into a higher capital multiplier and signal that the risk it ' +
        'reports is understated.',
    },
    {
      key: 'model_validation_findings_open',
      name: 'Open model-validation findings',
      definition:
        'The count of validation findings on risk and capital models — ' +
        'calibration, conceptual-soundness, data, or use issues — that ' +
        'remain open and unremediated past their committed due date, ' +
        'weighted by severity.',
      unit: 'count of overdue validation findings (severity-weighted)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0,
        high: 15,
        basis:
          'Open-finding inventory depends on validation throughput and ' +
          'remediation discipline; the band spans a tightly governed ' +
          'model inventory to a backlogged one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The model-risk-management inventory and validation tracking ' +
        'system, against committed remediation dates.',
      whyItMatters:
        'An open validation finding means a model the board acts on has a ' +
        'known, unremediated defect — under SR 11-7 an inventory of ' +
        'overdue findings is both a measurement-quality failure and a ' +
        'direct supervisory criticism.',
    },
    {
      key: 'stress_test_cycle_time',
      name: 'Stress-test cycle time',
      definition:
        'The elapsed time to run a full enterprise stress test or ' +
        'capital-plan submission — from scenario receipt to a reconciled, ' +
        'reviewed, board-approved result — across all portfolios and risk ' +
        'types.',
      unit: 'weeks from scenario to board-approved result',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 20,
        basis:
          'Cycle time depends on how much of data assembly, model runs, ' +
          'and review is automated; the band spans an industrialised ' +
          'stress engine to a manual, spreadsheet-heavy process. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The stress-testing and capital-planning platform, timestamping ' +
        'scenario receipt against board approval of the result.',
      whyItMatters:
        'A long stress-test cycle means the institution can run only the ' +
        'mandated scenarios, slowly — it cannot ask "what if" of its own ' +
        'balance sheet fast enough to inform a real decision, so stress ' +
        'testing becomes a compliance chore rather than a risk tool.',
    },
    {
      key: 'concentration_exposure_visibility',
      name: 'Aggregate concentration visibility',
      definition:
        'The share of material risk concentrations — single name, sector, ' +
        'geography, collateral type, counterparty — that are identified ' +
        'and quantified on a current, enterprise-aggregated basis rather ' +
        'than only within a single portfolio or system.',
      unit: '% of material concentrations visible on an aggregate basis',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 95,
        basis:
          'Concentration visibility depends on whether exposure data is ' +
          'aggregated across systems and legal entities; the band spans a ' +
          'siloed institution to one with a unified exposure view. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The risk-data aggregation platform and the credit and ' +
        'counterparty-exposure systems, joined across portfolios and ' +
        'entities.',
      whyItMatters:
        'The losses that break institutions are concentrations no single ' +
        'desk could see — this metric tests whether the function can ' +
        'assemble the aggregate picture before a correlated shock turns a ' +
        'hidden concentration into a capital event.',
    },
    {
      key: 'operational_loss_event_rate',
      name: 'Operational-risk loss-event rate and severity',
      definition:
        'The frequency and aggregate severity of operational-risk loss ' +
        'events — process failures, control breakdowns, fraud, systems, ' +
        'and external events — captured in the operational-risk loss ' +
        'database over the period.',
      unit: 'loss events per period and aggregate loss as % of net revenue',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 4,
        basis:
          'Operational-loss severity as a share of revenue varies ' +
          'structurally by business mix and control maturity; the band is ' +
          'a planning range across the institution’s risk profile.',
        label: 'planning-range',
      },
      dataSource:
        'The operational-risk loss database, the risk-and-control self-' +
        'assessment, and the incident-management system.',
      whyItMatters:
        'Operational risk is the loss category least covered by a model ' +
        'and most driven by control quality — the loss-event rate and ' +
        'severity are the empirical read on whether the control ' +
        'environment is actually holding.',
    },
    {
      key: 'capital_buffer_above_minimum',
      name: 'Capital buffer above regulatory minimum',
      definition:
        'The institution’s common-equity-tier-1 and total capital ratios ' +
        'expressed as the buffer held above the binding regulatory ' +
        'minimum plus required buffers — the headroom that absorbs a ' +
        'stress before a capital action is forced.',
      unit: 'percentage points of CET1 above the binding minimum + buffers',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 1,
        high: 5,
        basis:
          'The management buffer above the regulatory minimum is a board ' +
          'choice traded against return on equity; the band is a planning ' +
          'range, not a target — too thin risks a breach under stress, ' +
          'too thick wastes capital.',
        label: 'planning-range',
      },
      dataSource:
        'The regulatory-capital and finance systems, against the binding ' +
        'Basel / regulatory minimum and buffer requirements.',
      whyItMatters:
        'The capital buffer is the institution’s capacity to absorb loss ' +
        'and stay solvent through a stress — it is the number the board, ' +
        'the regulator, and the rating agencies all watch, and the ' +
        'ultimate constraint on how much risk can be run.',
    },
    {
      key: 'liquidity_coverage_ratio',
      name: 'Liquidity coverage and funding headroom',
      definition:
        'The institution’s liquidity coverage ratio — high-quality ' +
        'liquid assets against projected 30-day stressed net outflows — ' +
        'and the headroom held above the regulatory and internal ' +
        'liquidity minimums.',
      unit: 'LCR % and headroom above the binding minimum',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 110,
        high: 150,
        basis:
          'The LCR must clear 100% by rule; institutions hold a managed ' +
          'buffer above it traded against the carry cost of liquid ' +
          'assets. The band is a planning range for the buffer, not a ' +
          'target.',
        label: 'planning-range',
      },
      dataSource:
        'The liquidity-risk and treasury systems, computing HQLA against ' +
        'stressed outflows under the regulatory and internal scenarios.',
      whyItMatters:
        'Liquidity failures kill institutions faster than capital ones — ' +
        'the LCR and its headroom measure whether the institution can ' +
        'fund itself through a 30-day stress without a fire sale or a ' +
        'central-bank call.',
    },
    {
      key: 'risk_finding_remediation_timeliness',
      name: 'Risk-finding remediation timeliness',
      definition:
        'The share of risk issues, limit breaches, and supervisory ' +
        'findings closed on or before their committed remediation date ' +
        'with evidence of a durable fix, rather than left overdue or ' +
        'closed without verification.',
      unit: '% of risk findings closed on time with verified remediation',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 92,
        basis:
          'Remediation timeliness depends on issue-management discipline ' +
          'and accountable ownership; the band spans a backlogged issue ' +
          'inventory to a well-governed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The governance-risk-and-compliance (GRC) issue-management ' +
        'system, against committed remediation dates and verification ' +
        'evidence.',
      whyItMatters:
        'An open risk finding is a known weakness the institution has ' +
        'chosen not to fix yet — remediation timeliness is the read on ' +
        'whether the second line closes the loop, and a poor record is a ' +
        'reliable precursor to a supervisory escalation.',
    },
    {
      key: 'second_line_cost_ratio',
      name: 'Second-line risk-function cost ratio',
      definition:
        'The total cost of the enterprise risk-management function — ' +
        'risk, validation, and stress-testing staff, models, and ' +
        'technology — expressed as a ratio to operating cost or revenue, ' +
        'a read on whether the control function is proportionate.',
      unit: 'risk-function cost as % of operating expense',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 3,
        high: 10,
        basis:
          'The second-line cost ratio is structural by institution size, ' +
          'complexity, and regulatory intensity; the band is a planning ' +
          'range, not a target — too lean leaves risk uncovered, too ' +
          'heavy is a drag the risk it removes cannot justify.',
        label: 'planning-range',
      },
      dataSource:
        'The finance system and the risk-function cost centres, set ' +
        'against total operating expense.',
      whyItMatters:
        'A risk function can grow into a cost and friction centre out of ' +
        'proportion to the risk it removes — the cost ratio is the ' +
        'discipline that keeps the second line effective without becoming ' +
        'a tax on the business it is meant to protect.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'backward_looking_risk_measurement',
      name: 'Slow, backward-looking risk measurement',
      description:
        'Risk is measured monthly or quarterly from stale, manually ' +
        'reconciled data, so a deteriorating credit book, a building ' +
        'concentration, or a breached limit is seen weeks after the ' +
        'exposure was taken — the function reports history rather than ' +
        'managing risk forward.',
      detectionSignal:
        'Risk-data aggregation timeliness is long; risk committees ' +
        'review positions weeks stale; early-warning lead time is short ' +
        'or unmeasured; the function spends its time reconciling rather ' +
        'than analysing.',
      diagnosticQuestion:
        'How current is the risk position the board and risk committees ' +
        'actually govern, and how much warning does the function get ' +
        'before a credit or limit event crystallises?',
    },
    {
      key: 'fragmented_exposure_no_aggregate',
      name: 'Fragmented exposure with no aggregate view',
      description:
        'Credit, market, liquidity, and operational risk each sit in ' +
        'their own system and model, so the institution cannot see its ' +
        'total exposure to a single name, sector, or shock — concentration ' +
        'builds across silos invisibly, and BCBS 239 aggregation ' +
        'expectations are not met.',
      detectionSignal:
        'Aggregate concentration visibility is low; the same counterparty ' +
        'appears differently across systems; producing a firm-wide ' +
        'exposure to a name or sector takes a manual data-call.',
      diagnosticQuestion:
        'Can the institution produce a current, reconciled aggregate ' +
        'exposure to any single name, sector, or risk factor across all ' +
        'portfolios and legal entities — and how long does it take?',
    },
    {
      key: 'stale_unvalidated_models',
      name: 'Stale or unvalidated measurement models',
      description:
        'Risk and capital models drift, are used outside the conditions ' +
        'they were built for, and carry validation findings that are ' +
        'never closed — so the numbers the board and the regulator act on ' +
        'are quietly wrong, and model risk is itself unmanaged.',
      detectionSignal:
        'Open validation findings accumulate past due dates; models run ' +
        'past their revalidation date; backtesting exceptions are high or ' +
        'unmonitored; the model inventory is incomplete.',
      diagnosticQuestion:
        'Is every model the institution relies on inventoried, validated, ' +
        'within its revalidation cycle, and free of overdue findings — and ' +
        'how is model performance monitored between validations?',
    },
    {
      key: 'stress_testing_compliance_chore',
      name: 'Stress testing as a slow compliance chore',
      description:
        'A regulatory stress test or capital submission consumes months ' +
        'of manual data assembly and model runs, so the institution can ' +
        'run only the mandated scenarios, slowly — it cannot stress its ' +
        'own balance sheet fast enough to inform a real risk or capital ' +
        'decision.',
      detectionSignal:
        'Stress-test cycle time is long; scenarios beyond the regulatory ' +
        'minimum are rarely run; the stress process is spreadsheet-heavy ' +
        'and re-built each cycle; results land too late to steer action.',
      diagnosticQuestion:
        'How long does a full stress test take, and can the institution ' +
        'run an ad-hoc scenario against its balance sheet fast enough for ' +
        'the answer to inform a decision?',
    },
    {
      key: 'optimistic_risk_reporting',
      name: 'Optimistic, under-challenged risk reporting',
      description:
        'Risk reports to the board soften the picture — amber positions ' +
        'are presented as managed, model limitations are buried, and the ' +
        'second line does not challenge the first hard enough — so ' +
        'governance acts on an account that is reconciled but not honest.',
      detectionSignal:
        'Risk reports rarely carry a genuine red; findings surface first ' +
        'in supervisory exams rather than internal reporting; the second ' +
        'line’s effective challenge is not evidenced; loss events ' +
        'surprise the board.',
      diagnosticQuestion:
        'Does risk reporting give the board the honest, challenged ' +
        'picture — limitations, dissent, and bad news included — or a ' +
        'reconciled but optimistic account?',
    },
    {
      key: 'reactive_operational_risk',
      name: 'Reactive operational-risk and control monitoring',
      description:
        'Operational risk is managed by periodic self-assessment and ' +
        'after-the-fact loss capture rather than continuous control ' +
        'monitoring, so control failures are discovered through the loss ' +
        'they cause, and the risk-and-control self-assessment drifts away ' +
        'from the real control environment.',
      detectionSignal:
        'Operational losses are recognised late; the RCSA is updated on a ' +
        'calendar not on evidence; key control indicators are sparse; the ' +
        'same control failure recurs across the loss database.',
      diagnosticQuestion:
        'How are operational-risk controls monitored between self-' +
        'assessments, and is the institution detecting control failures ' +
        'before, or only through, the loss they cause?',
    },
    {
      key: 'risk_appetite_disconnected',
      name: 'Risk appetite disconnected from frontline limits',
      description:
        'The board-approved risk appetite is a statement that never ' +
        'cascades into the live limits, pricing, and decisions at the ' +
        'desk and the branch — so the institution can be inside its ' +
        'appetite statement on paper while running risk the board never ' +
        'intended.',
      detectionSignal:
        'Appetite statements do not map cleanly to operational limits; ' +
        'limit utilization is not reported against appetite; frontline ' +
        'staff cannot say what the appetite means for their decisions.',
      diagnosticQuestion:
        'How does the board’s risk appetite cascade into the concrete ' +
        'limits and decision rules the front line actually operates ' +
        'under, and is utilization monitored against it?',
    },
    {
      key: 'siloed_issue_and_finding_management',
      name: 'Siloed, slow issue and finding management',
      description:
        'Risk issues, limit breaches, audit findings, and supervisory ' +
        'matters are tracked in disconnected systems with weak accountable ' +
        'ownership, so remediation slips, the same weakness recurs, and a ' +
        'pattern of overdue findings escalates into a supervisory action.',
      detectionSignal:
        'Risk-finding remediation timeliness is poor; findings are ' +
        'tracked in multiple registers; the same root cause recurs; ' +
        'overdue items are not visible to the board.',
      diagnosticQuestion:
        'Are risk issues, breaches, and supervisory findings tracked in ' +
        'one accountable system, closed on time with verified remediation, ' +
        'and analysed for recurring root cause?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'credit_early_warning_detection',
      name: 'Credit early-warning deterioration detection',
      valueMechanism:
        'A model continuously scores borrowers and portfolios on ' +
        'behavioural, transactional, financial-statement, and external ' +
        'signals — covenant trends, utilisation, payment behaviour, ' +
        'sector and macro data — to detect credit deterioration early and ' +
        'raise a prioritised, evidence-backed watch-list candidate before ' +
        'the credit migrates. Value comes from lengthening credit ' +
        'early-warning lead time so the function can restructure or ' +
        'de-risk while the exposure still has value, cutting realised ' +
        'credit loss.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Borrower financials, covenants, ratings, and limit-utilisation ' +
          'history',
        'Transaction and account-behaviour data for monitored borrowers',
        'External sector, macro, market, and news signals',
        'Historical watch-list, downgrade, and default outcomes for ' +
          'training',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model raises a candidate; a credit officer owns the ' +
          'watch-list, downgrade, and restructuring decision — a score is ' +
          'a signal to review, never a credit action.',
        'Early-warning models must be validated under SR 11-7 and ' +
          'monitored for drift; a stale model produces false comfort.',
        'Borrower-level signals must be governed for fair-lending and ' +
          'data-privacy compliance and tested for disparate impact.',
      ],
      metricsMoved: [
        'early_warning_lead_time',
        'risk_appetite_limit_utilization',
        'concentration_exposure_visibility',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'risk_data_aggregation_intelligence',
      name: 'Risk-data aggregation and exposure intelligence',
      valueMechanism:
        'A model and data layer reconcile credit, market, liquidity, and ' +
        'operational exposure across systems and legal entities — ' +
        'resolving counterparty identity, mapping to a common hierarchy, ' +
        'and flagging reconciliation breaks — to produce a current, ' +
        'queryable aggregate exposure view. Value comes from cutting ' +
        'risk-data aggregation timeliness and raising aggregate ' +
        'concentration visibility, so the institution sees its whole ' +
        'position before a correlated shock does.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Exposure data from the credit, market, counterparty, and ' +
          'liquidity systems across legal entities',
        'Counterparty and legal-entity reference and hierarchy data',
        'Reconciliation and data-quality rules and break history',
        'The risk-appetite limit framework for utilisation joins',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The layer aggregates and flags breaks; risk and finance owners ' +
          'sign off the reconciled position — an automated aggregate is ' +
          'still subject to BCBS 239 accuracy and reconciliation ' +
          'controls.',
        'Counterparty identity resolution must be auditable; a wrong ' +
          'merge or split misstates concentration.',
        'Data lineage must be preserved end to end so any aggregate ' +
          'figure can be traced to source for a supervisor.',
      ],
      metricsMoved: [
        'risk_data_aggregation_timeliness',
        'concentration_exposure_visibility',
        'risk_appetite_limit_utilization',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'stress_testing_scenario_acceleration',
      name: 'Stress-testing and scenario acceleration',
      valueMechanism:
        'A capability industrialises the stress-test pipeline — ' +
        'automating data assembly, orchestrating model runs, and ' +
        'generating and translating scenarios into model-ready ' +
        'parameters — so a full stress test runs in a fraction of the ' +
        'time and ad-hoc scenarios become cheap. Value comes from cutting ' +
        'stress-test cycle time, turning stress testing from a slow ' +
        'compliance chore into a fast risk and capital-planning tool.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Portfolio, balance-sheet, and exposure data feeding the stress ' +
          'models',
        'The suite of credit-loss, market, and capital projection models',
        'Regulatory and internal scenario definitions and macro paths',
        'Prior stress-test results for benchmarking and reconciliation',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The capability accelerates the pipeline; risk and capital ' +
          'leadership own every scenario assumption and the submitted ' +
          'result — automation never sets the conservatism.',
        'Every projection model in the pipeline remains subject to SR ' +
          '11-7 validation; speed must not bypass model governance.',
        'A regulatory submission (CCAR / DFAST) carries attestation ' +
          'liability — the result must be fully reconciled, reviewed, and ' +
          'auditable before sign-off.',
      ],
      metricsMoved: [
        'stress_test_cycle_time',
        'capital_buffer_above_minimum',
        'liquidity_coverage_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'model_risk_validation_assistance',
      name: 'Model-risk and validation assistance',
      valueMechanism:
        'A capability accelerates model risk management — assembling the ' +
        'validation evidence pack, running benchmark and stability tests, ' +
        'monitoring deployed models for drift and backtesting breaches, ' +
        'and drafting validation and monitoring documentation against the ' +
        'SR 11-7 framework. Value comes from raising validation ' +
        'throughput so the open-finding inventory falls and models stay ' +
        'within their revalidation cycle.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The model inventory, model documentation, and validation history',
        'Model inputs, outputs, and backtesting / performance data',
        'Benchmark datasets and challenger-model results',
        'The model-risk policy and the SR 11-7 validation standards',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The capability assists validation; an independent model ' +
          'validator owns every validation conclusion and rating — ' +
          'assistance must never compromise validation independence.',
        'A validation tool is itself a model under SR 11-7 and must be ' +
          'governed, validated, and inventoried like any other.',
        'Drafted validation documentation must be grounded only in the ' +
          'actual test evidence — an overstated validation finding or ' +
          'clean opinion is a serious governance failure.',
      ],
      metricsMoved: [
        'model_validation_findings_open',
        'var_backtesting_exceptions',
        'risk_finding_remediation_timeliness',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'operational_risk_control_monitoring',
      name: 'Operational-risk and control-monitoring intelligence',
      valueMechanism:
        'A model continuously monitors control and process signals — key ' +
        'control indicators, incident and near-miss data, transaction ' +
        'exceptions, and self-assessment evidence — to detect control ' +
        'weakness and emerging operational risk before it produces a ' +
        'loss, and keeps the risk-and-control self-assessment anchored to ' +
        'real evidence. Value comes from cutting the operational-risk ' +
        'loss-event rate and severity by making control monitoring ' +
        'continuous rather than periodic.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Operational-risk loss-event and near-miss data',
        'Key control indicators and risk-and-control self-assessment data',
        'Incident, change, and transaction-exception data across ' +
          'business lines',
        'Process and control reference data mapping controls to risks',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces control weakness and emerging risk; ' +
          'operational-risk officers and control owners own the ' +
          'assessment and the remediation — a signal is a prompt to ' +
          'investigate.',
        'Control-monitoring signals touching staff conduct must respect ' +
          'employment law, privacy, and due process.',
        'The model must not give false assurance — an unmonitored gap in ' +
          'its coverage is itself an operational risk.',
      ],
      metricsMoved: [
        'operational_loss_event_rate',
        'risk_finding_remediation_timeliness',
        'second_line_cost_ratio',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'risk_reporting_narrative_copilot',
      name: 'Risk-reporting and regulatory-narrative copilot',
      valueMechanism:
        'A copilot assembles risk and capital reporting — drawing the ' +
        'reconciled aggregate position, drafting board-pack and ' +
        'supervisory narrative, surfacing limit utilisation and emerging ' +
        'themes, and assembling responses to supervisory information ' +
        'requests — grounded only in the governed risk data. Value comes ' +
        'from cutting risk-data aggregation timeliness and freeing the ' +
        'second line from manual report assembly so its scarce judgement ' +
        'goes to analysis and challenge.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The reconciled aggregate risk position and limit-utilisation ' +
          'data',
        'Risk-appetite, limit-breach, and risk-finding registers',
        'Prior board packs, supervisory submissions, and report ' +
          'templates',
        'The reporting taxonomy and regulatory-disclosure requirements',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot drafts; the chief risk officer and risk committee ' +
          'own every figure and characterisation reported to the board ' +
          'and the supervisor — a draft is never a report.',
        'Drafted narrative must be grounded only in the governed risk ' +
          'data — a fabricated or smoothed figure in a board pack or a ' +
          'supervisory filing is a serious governance and legal ' +
          'exposure.',
        'The copilot must preserve, not soften, bad news, model ' +
          'limitations, and effective challenge — optimistic drafting ' +
          'defeats the purpose of the report.',
      ],
      metricsMoved: [
        'risk_data_aggregation_timeliness',
        'risk_appetite_limit_utilization',
        'second_line_cost_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'continuous_risk_intelligence_layer',
      name: 'Continuous risk-intelligence layer',
      description:
        'A pattern that monitors credit, market, liquidity, and ' +
        'operational risk signals continuously, detects deterioration and ' +
        'limit pressure early, and feeds a single prioritised, evidence-' +
        'backed review queue to the risk function — replacing the ' +
        'monthly, backward-looking cycle with a forward-looking one.',
      boundary:
        'It detects, scores, and prioritises; a risk officer owns every ' +
        'watch-list, downgrade, limit, and de-risking decision. A signal ' +
        'is a prompt to review, never a risk action.',
      humanAccountabilityPoint:
        'The Chief Risk Officer, accountable for the risk profile staying ' +
        'inside the board-approved appetite.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'governed_risk_data_aggregation_pattern',
      name: 'Governed risk-data aggregation pattern',
      description:
        'A pattern that reconciles exposure across all risk systems and ' +
        'legal entities into one governed aggregate layer with resolved ' +
        'counterparty identity, full data lineage, and break management — ' +
        'the BCBS 239-grade foundation every aggregate risk number rests ' +
        'on.',
      boundary:
        'It aggregates, reconciles, and lineages; risk and finance data ' +
        'owners sign off the position. It enforces reconciliation ' +
        'controls and flags a break rather than papering over it.',
      humanAccountabilityPoint:
        'The Chief Risk Officer and Chief Data Officer, jointly ' +
        'accountable for the accuracy and timeliness of aggregated risk ' +
        'data.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'industrialised_stress_testing_pattern',
      name: 'Industrialised stress-testing pattern',
      description:
        'A pattern that turns stress testing into a repeatable, ' +
        'orchestrated pipeline — automated data assembly, governed model ' +
        'runs, scenario translation, and reconciliation — so the mandated ' +
        'cycle is fast and ad-hoc scenarios are cheap enough to inform ' +
        'real risk and capital decisions.',
      boundary:
        'It runs the pipeline; risk and capital leadership own every ' +
        'scenario assumption, the conservatism, and the submitted result. ' +
        'It does not set assumptions or bypass model governance.',
      humanAccountabilityPoint:
        'The head of capital and stress testing, accountable for the ' +
        'integrity of every stress result and regulatory submission.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'model_risk_governance_pattern',
      name: 'Model-risk governance pattern',
      description:
        'A pattern that wraps every risk and capital model in a governed ' +
        'lifecycle — a complete inventory, independent validation, ' +
        'ongoing performance and drift monitoring, and finding ' +
        'remediation tracking — so the institution manages the risk that ' +
        'its measurement models are wrong.',
      boundary:
        'It governs the model lifecycle; independent validation owns ' +
        'every validation conclusion and the model-risk function owns the ' +
        'inventory. It cannot itself approve a model for use.',
      humanAccountabilityPoint:
        'The head of model risk management, accountable to the board for ' +
        'the soundness of the model inventory under SR 11-7.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'risk_appetite_to_limit_cascade_pattern',
      name: 'Risk-appetite-to-limit cascade pattern',
      description:
        'A pattern that translates the board-approved risk appetite into ' +
        'concrete, monitored limits and decision rules at the desk, ' +
        'portfolio, and entity level, and reports utilisation back up ' +
        'against appetite — closing the gap between the appetite ' +
        'statement and frontline risk-taking.',
      boundary:
        'It cascades appetite and monitors utilisation; the board owns ' +
        'the appetite and risk committees own the limits. It surfaces a ' +
        'breach, it does not authorise an exception.',
      humanAccountabilityPoint:
        'The board risk committee, accountable for the risk appetite, ' +
        'with the CRO accountable for its cascade and monitoring.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Enterprise-risk-management value is realised in three connected ' +
      'ways and a forecast must keep them distinct — and it carries a ' +
      'fourth, non-negotiable dimension that is a constraint, not a value ' +
      'lever. First, loss avoided: earlier credit early-warning, ' +
      'continuous control monitoring, and visible concentration let the ' +
      'institution de-risk before a loss crystallises, cutting realised ' +
      'credit and operational loss — a recurring P&L gain, though one ' +
      'measured against an avoided counterfactual and therefore harder to ' +
      'attribute cleanly. Second, capital and liquidity efficiency: a ' +
      'more accurate, better-aggregated, better-validated risk ' +
      'measurement reduces the conservatism and add-ons the institution ' +
      'must hold for measurement uncertainty, and lets it run closer to ' +
      'its true appetite — freeing capital and liquidity to be deployed. ' +
      'Third, control-function efficiency: aggregation, stress-test, ' +
      'validation, and reporting automation let the same second-line ' +
      'spend cover more risk, holding the second-line cost ratio in its ' +
      'band and redirecting scarce judgement from reconciliation to ' +
      'analysis and challenge. The fourth dimension — supervisory and ' +
      'governance integrity — is a hard constraint on all three: a ' +
      'forecast must never trade a lower cost or a thinner buffer for a ' +
      'weaker model, a less honest report, or a position outside ' +
      'appetite, because a supervisory finding, a capital breach, or a ' +
      'model failure is a loss far larger than any efficiency gain. The ' +
      'dominant constraint on value is risk-data and model quality — ' +
      'every gain rests on the accuracy, lineage, and validation of the ' +
      'data and models beneath it — so a forecast must be read against ' +
      'the institution’s data architecture and model-governance maturity, ' +
      'and against the reality that capital and liquidity relief depends ' +
      'on supervisory acceptance the institution does not control. The ' +
      'first three levers are recurring once realised; the governance-' +
      'integrity constraint binds every period.',
    dominantHaircutFactors: [
      {
        factor: 'Risk-data and model-quality readiness',
        rationale:
          'Every risk-management gain rests on accurate, reconciled, ' +
          'lineaged exposure data and validated models. Fragmented data, ' +
          'unresolved counterparty identity, and an immature model ' +
          'inventory cap how much of the modelled aggregation, ' +
          'early-warning, and efficiency gain can actually be realised.',
        typicalHaircut: {
          low: 0.25,
          high: 0.5,
          basis:
            'The share of a modelled risk-management gain not realised ' +
            'because risk-data architecture and model governance fall ' +
            'short; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Supervisory acceptance and regulatory constraint',
        rationale:
          'Capital and liquidity relief, model changes, and reliance on ' +
          'a new measurement approach all depend on supervisory ' +
          'acceptance the institution does not control. A regulator can ' +
          'require add-ons, reject a model, or impose conservatism that ' +
          'bounds how much measurement-efficiency value converts to real ' +
          'capital relief.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled capital- and measurement-efficiency ' +
            'gain bounded by supervisory acceptance and regulatory ' +
            'conservatism; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Model-validation and governance throughput',
        rationale:
          'A new risk model or AI capability only creates value once it ' +
          'is validated, approved, and in governed production. Limited ' +
          'independent-validation capacity and the SR 11-7 governance ' +
          'cycle delay and cap how fast the gain is realised.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Value erosion and delay from limited model-validation and ' +
            'governance throughput before a capability is in approved ' +
            'production; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Loss-attribution and counterfactual uncertainty',
        rationale:
          'Loss avoided is measured against a counterfactual — the loss ' +
          'that would have occurred without earlier detection — which ' +
          'cannot be observed directly. Macro and credit-cycle ' +
          'volatility move the loss baseline independently, capping how ' +
          'cleanly an avoided-loss gain can be isolated and claimed.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from the counterfactual nature of avoided ' +
            'loss and credit-cycle volatility in the baseline; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Realised credit-loss reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in realised credit loss from longer ' +
            'early-warning lead time and earlier de-risking; a planning ' +
            'range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in realised credit-loss provisions ' +
          'and charge-offs against the cycle-adjusted baseline.',
      },
      {
        lever: 'Operational-loss reduction',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative reduction in operational-risk loss from continuous ' +
            'control monitoring and earlier control-weakness detection; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in aggregate operational-risk loss ' +
          'as a share of net revenue.',
      },
      {
        lever: 'Stress-test and reporting cycle-time reduction',
        range: {
          low: 30,
          high: 65,
          basis:
            'Relative reduction in stress-test and risk-reporting cycle ' +
            'time from pipeline industrialisation and aggregation ' +
            'automation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in elapsed time to a board-ready ' +
          'stress result and aggregate risk report.',
      },
      {
        lever: 'Second-line productivity improvement',
        range: {
          low: 15,
          high: 45,
          basis:
            'Relative improvement in second-line analytical capacity ' +
            'from automating aggregation, validation, and report ' +
            'assembly; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in risk-analysis output per ' +
          'second-line FTE at constant cost.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first operational signal in a pilot risk domain ' +
      '(early-warning or aggregation live, cycle time falling, the ' +
      'function working from fresher data); 12–30 months to a settled, ' +
      'governance-accepted result, because risk and capital models must ' +
      'pass independent validation and supervisory review before the ' +
      'institution can rely on them — and longer still where risk-data ' +
      'architecture must be rebuilt before aggregation can be trusted.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Credit-risk and exposure-management system',
        role:
          'Holds borrower and counterparty exposure, ratings, limits, ' +
          'collateral, and watch-list status — the system of record for ' +
          'credit risk and the early-warning and concentration metrics.',
        examples: [
          'Moody’s / Numerix and similar credit-risk platforms',
          'SAS Credit Risk Management',
          'in-house credit-exposure and limit systems',
        ],
      },
      {
        name: 'Market-risk and VaR system',
        role:
          'Computes value-at-risk, sensitivities, and backtesting across ' +
          'trading and banking-book positions — the source of the ' +
          'market-risk and backtesting-exception metrics.',
        examples: [
          'Murex market-risk modules',
          'MSCI RiskMetrics',
          'in-house market-risk and VaR engines',
        ],
      },
      {
        name: 'Risk-data aggregation and reporting platform',
        role:
          'Reconciles and aggregates exposure across risk types and ' +
          'legal entities into the governed firm-wide risk position — the ' +
          'BCBS 239 backbone of aggregate reporting.',
        examples: [
          'SAS Risk Management for Banking',
          'Moody’s RiskAuthority / regulatory-reporting platforms',
          'in-house risk-data warehouses and aggregation layers',
        ],
      },
      {
        name: 'Stress-testing and capital-planning system',
        role:
          'Runs enterprise stress tests, loss projections, and capital ' +
          'plans (CCAR / DFAST and ICAAP) — the engine behind the ' +
          'stress-test cycle-time and capital-buffer metrics.',
        examples: [
          'Moody’s stress-testing suite',
          'SAS Stress Testing',
          'in-house capital-planning and projection platforms',
        ],
      },
      {
        name: 'Model-risk-management and validation system',
        role:
          'Holds the model inventory, validation history, performance ' +
          'monitoring, and findings — the system of record for model ' +
          'risk and the validation-finding metrics.',
        examples: [
          'Model-risk-management governance platforms',
          'GRC-integrated model inventories',
          'in-house model-inventory and validation trackers',
        ],
      },
      {
        name: 'Governance, risk & compliance (GRC) platform',
        role:
          'Holds the risk-appetite framework, operational-risk loss ' +
          'database, RCSA, key control indicators, and the issue and ' +
          'finding registers — the source for the operational-risk and ' +
          'remediation metrics.',
        examples: [
          'Archer GRC',
          'IBM OpenPages',
          'ServiceNow Integrated Risk Management',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Risk Officer (CRO)',
        accountability:
          'Owns the enterprise risk-management framework, the risk ' +
          'profile staying inside board-approved appetite, and the ' +
          'integrity of risk reporting to the board and the supervisor.',
      },
      {
        title: 'Head of credit risk',
        accountability:
          'Owns the measurement, monitoring, and management of credit ' +
          'risk — early warning, watch-list, ratings, limits, and ' +
          'portfolio concentration.',
      },
      {
        title: 'Head of market and liquidity risk',
        accountability:
          'Owns the measurement and monitoring of market, interest-rate, ' +
          'and liquidity risk — VaR, limits, backtesting, and the ' +
          'liquidity-coverage position.',
      },
      {
        title: 'Head of operational risk',
        accountability:
          'Owns the operational-risk framework — the loss database, ' +
          'RCSA, key control indicators, and operational-risk capital.',
      },
      {
        title: 'Head of model risk management',
        accountability:
          'Owns the model inventory, independent validation, and the SR ' +
          '11-7 model-governance lifecycle across all risk and capital ' +
          'models.',
      },
      {
        title: 'Head of capital and stress testing',
        accountability:
          'Owns the enterprise stress-testing programme, the capital ' +
          'plan, and the CCAR / DFAST and ICAAP submissions.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Basel capital and liquidity framework',
        relevance:
          'Sets the regulatory capital, leverage, and liquidity (LCR / ' +
          'NSFR) requirements that bound how much risk the institution ' +
          'can run — the constraint behind the capital-buffer and ' +
          'liquidity metrics.',
      },
      {
        name: 'SR 11-7 model risk management guidance',
        relevance:
          'Sets the supervisory expectation for model development, ' +
          'independent validation, and governance — the frame around ' +
          'every risk and capital model and the validation-finding ' +
          'metric.',
      },
      {
        name: 'CCAR / DFAST supervisory stress testing',
        relevance:
          'Mandates enterprise stress testing and capital planning for ' +
          'larger institutions — the frame behind the stress-test ' +
          'cycle-time and capital-adequacy metrics.',
      },
      {
        name: 'BCBS 239 risk-data aggregation principles',
        relevance:
          'Sets supervisory expectations for the accuracy, ' +
          'completeness, and timeliness of risk-data aggregation and ' +
          'reporting — the frame around the aggregation-timeliness ' +
          'metric.',
      },
      {
        name: 'Board risk-appetite and enterprise-risk-governance ' +
          'expectations',
        relevance:
          'Supervisory expectations (e.g. heightened-standards / ' +
          'enhanced prudential frameworks) require a board-approved risk ' +
          'appetite cascaded into limits and an independent second line ' +
          '— the governance frame over the whole function.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Risk appetite',
        definition:
          'The aggregate level and types of risk the board is willing ' +
          'to accept in pursuit of strategy, expressed in a statement ' +
          'and cascaded into measurable limits.',
      },
      {
        term: 'Value-at-risk (VaR)',
        definition:
          'The loss on a portfolio not expected to be exceeded over a ' +
          'given horizon at a given confidence level — the standard ' +
          'market-risk measure, tested by backtesting.',
      },
      {
        term: 'Loss given default (LGD)',
        definition:
          'The share of an exposure expected to be lost if the borrower ' +
          'defaults, after recovery and collateral — a core input to ' +
          'expected and unexpected credit loss.',
      },
      {
        term: 'Expected credit loss (ECL)',
        definition:
          'The probability-weighted estimate of credit loss over the ' +
          'relevant horizon — probability of default times LGD times ' +
          'exposure — and the basis of impairment provisioning.',
      },
      {
        term: 'Stress testing',
        definition:
          'Projecting losses, earnings, and capital under severe but ' +
          'plausible adverse scenarios to test whether the institution ' +
          'stays solvent and inside its minimums.',
      },
      {
        term: 'Model risk',
        definition:
          'The risk of adverse consequences from decisions based on ' +
          'models that are incorrect or misused — governed under the SR ' +
          '11-7 framework.',
      },
      {
        term: 'Risk-weighted assets (RWA)',
        definition:
          'Assets weighted by their risk to form the denominator of ' +
          'regulatory capital ratios — the link between risk taken and ' +
          'capital required.',
      },
      {
        term: 'Three lines of defence',
        definition:
          'The governance model in which the business owns its risk ' +
          '(first line), an independent risk and compliance function ' +
          'oversees it (second line), and internal audit assures it ' +
          '(third line).',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Enterprise Risk-Management Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose how current, aggregated, and well-modelled the ' +
        'institution’s risk measurement is, where exposure is invisible ' +
        'or concentrated, and where the control function is slow or ' +
        'heavy — with baseline evidence — before a solution is shaped.',
      sections: [
        {
          heading: 'Risk-management operating context',
          guidance:
            'Name the risk types, portfolios, legal entities, and ' +
            'regulatory regime in scope, the second-line operating model ' +
            'and committee structure, and the risk appetite framework. ' +
            'State which credit, market, aggregation, stress-testing, ' +
            'model-risk, and GRC systems run the function.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — limit utilization, aggregation ' +
            'timeliness, early-warning lead time, VaR backtesting ' +
            'exceptions, open validation findings, stress-test cycle ' +
            'time, concentration visibility, operational-loss rate, ' +
            'capital buffer, liquidity coverage, remediation timeliness, ' +
            'second-line cost ratio. For any metric not recorded, name ' +
            'it as a precise seed gap with its expected data source.',
        },
        {
          heading: 'Risk-data and aggregation diagnostic',
          guidance:
            'Analyse how exposure data is sourced, reconciled, and ' +
            'aggregated across systems and legal entities, how long a ' +
            'firm-wide position takes to produce, and whether the ' +
            'institution can see its aggregate exposure to a single ' +
            'name, sector, or risk factor — against BCBS 239 ' +
            'expectations.',
        },
        {
          heading: 'Model-risk and measurement-quality diagnostic',
          guidance:
            'Analyse the completeness of the model inventory, the ' +
            'validation cycle and open-finding inventory, VaR ' +
            'backtesting performance, and how models are monitored for ' +
            'drift between validations — against the SR 11-7 framework.',
        },
        {
          heading: 'Appetite, stress-testing, and capital diagnostic',
          guidance:
            'Analyse how the board’s risk appetite cascades into ' +
            'frontline limits, how limit utilization is monitored, the ' +
            'stress-test cycle time and scenario range, and the capital ' +
            'and liquidity buffers held above the regulatory minimums.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — backward-looking ' +
            'measurement, fragmented exposure, stale or unvalidated ' +
            'models, stress testing as a chore, optimistic reporting, ' +
            'reactive operational risk, disconnected appetite, siloed ' +
            'issue management — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — credit-loss reduction, operational-loss ' +
            'reduction, cycle-time reduction, second-line productivity — ' +
            'explicitly haircut by risk-data and model-quality readiness, ' +
            'supervisory acceptance, validation throughput, and ' +
            'loss-attribution uncertainty. Every figure a labelled ' +
            'planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'early-warning lead time, a model-inventory completeness ' +
            'figure — is a named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt — ' +
            'with the governance-integrity and model-validation ' +
            'constraints stated up front.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Enterprise Risk-Management Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO- and CRO-readable case for funding a ' +
        'risk-management AI Move — baseline, forecast, cost, the honest ' +
        'downside, and the governance-integrity constraint that bounds ' +
        'it.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'loss avoided, capital and liquidity efficiency, and ' +
            'control-function efficiency, the time-to-value band, the ' +
            'explicit governance-integrity constraint, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — early-warning lead time, aggregation timeliness, ' +
            'open validation findings, stress-test cycle time, ' +
            'operational-loss rate, second-line cost ratio. Where a ' +
            'baseline is a seed gap (early-warning lead time and ' +
            'model-inventory completeness are common ones), say so and ' +
            'state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — risk-data and ' +
            'model-quality readiness, supervisory acceptance, ' +
            'validation throughput, loss-attribution uncertainty — ' +
            'explicitly and show the haircut math. Keep loss-avoided, ' +
            'capital-efficiency, and control-efficiency gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the credit, market, ' +
            'aggregation, stress-testing, model-risk, and GRC systems, ' +
            'the model-development and independent-validation effort, ' +
            'and the operating-model change across the second line.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker risk-data quality, a ' +
            'tighter supervisory stance, slower model validation, and a ' +
            'more volatile credit cycle. State the downside the CFO and ' +
            'CRO are underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example risk data too fragmented to aggregate ' +
            'reliably, or a model-governance framework not yet able to ' +
            'validate the new capability — and the evidence required ' +
            'before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the measurement cadence, including ' +
            'the model-validation, backtesting-exception, and capital ' +
            'and liquidity buffer constraint metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Enterprise Risk-Management Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for ' +
        'the risk-management AI capability, grounded in the function ' +
        'reference patterns, the model-governance controls, and the ' +
        'supervisory frames.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — continuous risk-intelligence layer, governed ' +
            'risk-data aggregation, industrialised stress testing, ' +
            'model-risk governance, risk-appetite-to-limit cascade — and ' +
            'state which apply and how they connect.',
        },
        {
          heading: 'Risk-data and aggregation architecture',
          guidance:
            'Specify the integrations to the credit, market, liquidity, ' +
            'operational-risk, and reference-data systems, the ' +
            'counterparty-identity resolution, the data lineage, and the ' +
            'reconciliation controls the aggregation and early-warning ' +
            'use cases depend on — to a BCBS 239 standard.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the human-in-the-loop or human-on-the-loop control posture, ' +
            'the human accountability point, and how a risk officer owns ' +
            'every risk decision. State that a model signal is never a ' +
            'risk action and define the validation status required ' +
            'before reliance.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the credit, market, operational-risk, ' +
            'validation, and stress-testing workflows change, how the ' +
            'second line moves from reconciliation to analysis and ' +
            'challenge, how exposure is aggregated, and who owns each ' +
            'change.',
        },
        {
          heading: 'Model governance, validation, and supervisory ' +
            'controls',
          guidance:
            'State how every model — including any AI capability — is ' +
            'inventoried, independently validated, monitored for drift, ' +
            'and finding-tracked under SR 11-7, how aggregation meets ' +
            'BCBS 239, how risk reporting preserves effective challenge, ' +
            'and the authority to suspend a model that fails validation ' +
            'or monitoring.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the risk systems stack, and the phased rollout by risk ' +
            'type, portfolio, and use case, sequenced behind model ' +
            'validation and supervisory engagement.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Enterprise Risk-Management Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the risk-management AI ' +
        'capability so value reaches loss avoided, capital efficiency, ' +
        'and a faster second line — within model governance and ' +
        'supervisory expectations — not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, ' +
            'model development and independent validation, a pilot risk ' +
            'domain, scale across risk types — with milestones tied to ' +
            'the operating metrics and the validation and supervisory ' +
            'calendar.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, risk-data quality and aggregation, model ' +
            'development and validation, second-line process adoption, ' +
            'supervisory engagement, Tower measurement.',
        },
        {
          heading: 'Second-line adoption approach',
          guidance:
            'Define the change runway for risk officers, analysts, and ' +
            'validators — training, the shift from reconciliation to ' +
            'analysis and challenge, and the new aggregation, ' +
            'early-warning, and stress workflows — and how adoption is ' +
            'measured, not assumed.',
        },
        {
          heading: 'Model governance and supervisory engagement plan',
          guidance:
            'Define how independent validation, drift monitoring, ' +
            'finding tracking, and BCBS 239 aggregation controls are ' +
            'stood up before the institution relies on the capability, ' +
            'how the supervisor is engaged, and who can suspend a model.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the validation-finding, ' +
            'backtesting-exception, and capital and liquidity buffer ' +
            'constraint metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — fragmented risk data, a model ' +
            'failing validation, a supervisory objection, credit-cycle ' +
            'volatility — with the escalation owner and the trigger for ' +
            'each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it, including the model-validation ' +
            'and supervisory conditions that must hold.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'The institution’s aggregate risk position and concentrations',
      authoritativeSource:
        'The governed risk-data aggregation platform, reconciled across ' +
        'the credit, market, liquidity, and operational-risk systems and ' +
        'all legal entities.',
      whatGoodEvidenceLooksLike:
        'A current, reconciled firm-wide exposure with resolved ' +
        'counterparty identity, full data lineage to source, and ' +
        'material concentrations quantified by name, sector, and risk ' +
        'factor.',
      weakEvidenceToReject:
        'A position assembled from disconnected system extracts with no ' +
        'reconciliation, no lineage, and no statement of how complete or ' +
        'current it is.',
    },
    {
      claim: 'The reliability of a risk or capital model',
      authoritativeSource:
        'The model-risk-management inventory and an independent ' +
        'validation performed under the SR 11-7 framework, with ongoing ' +
        'performance monitoring.',
      whatGoodEvidenceLooksLike:
        'A current independent validation with a documented conclusion, ' +
        'backtesting and benchmark evidence, a clear use boundary, and an ' +
        'open-finding inventory with remediation dates.',
      weakEvidenceToReject:
        'A model relied on with no independent validation, an expired ' +
        'revalidation date, or unremediated findings presented as ' +
        'immaterial without evidence.',
    },
    {
      claim: 'Credit deterioration and early-warning lead time',
      authoritativeSource:
        'The credit-risk and early-warning system, comparing indicator ' +
        'fire dates against subsequent watch-list, downgrade, and ' +
        'default events.',
      whatGoodEvidenceLooksLike:
        'A measured early-warning lead time built from the actual ' +
        'history of indicator fires preceding credit migration, with ' +
        'false-positive and false-negative rates quantified.',
      weakEvidenceToReject:
        'A claimed early-warning capability with no measured lead time, ' +
        'or reliance on annual reviews presented as continuous ' +
        'monitoring.',
    },
    {
      claim: 'Capital and liquidity adequacy under stress',
      authoritativeSource:
        'The stress-testing and capital-planning platform, running ' +
        'reconciled portfolio data through validated projection models ' +
        'under the regulatory and internal scenarios.',
      whatGoodEvidenceLooksLike:
        'A reconciled stress result showing post-stress capital and ' +
        'liquidity ratios against the binding minimums, built from ' +
        'validated models with auditable assumptions.',
      weakEvidenceToReject:
        'A capital or liquidity headroom figure with no stress scenario ' +
        'behind it, or a stress result from unvalidated models or ' +
        'undocumented assumptions.',
    },
    {
      claim: 'The forecast value of a risk-management AI Move',
      authoritativeSource:
        'The value model — loss-avoided, capital-and-liquidity-' +
        'efficiency, and control-efficiency components, each haircut by ' +
        'its dominant factors — read against the institution’s ' +
        'risk-data and model-governance maturity and supervisory ' +
        'acceptance.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, loss-avoided, capital-efficiency, ' +
        'and control-efficiency gains kept distinct, the governance-' +
        'integrity constraint stated, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings or capital-relief number, a vendor ROI ' +
        'claim taken at face value, or a forecast that ignores the ' +
        'risk-data, model-governance, and supervisory-acceptance ' +
        'haircuts.',
    },
  ],
};
