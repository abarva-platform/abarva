// Domain Function Pack — Financial services · Finance, treasury & ALM.
//
// Function key: `finance_treasury_alm`.
//
// This pack covers the corporate financial spine of a regulated depository or
// diversified financial institution: the function that owns the economics of
// the balance sheet itself. It runs five tightly-coupled disciplines usually
// managed under one CFO/Treasurer organisation: corporate finance and FP&A
// (the financial plan, the forecast, profitability and management reporting),
// treasury (cash and collateral management, the investment portfolio, funds-
// transfer pricing), balance-sheet and interest-rate-risk management (the ALM
// discipline — managing net interest income and economic value of equity
// against rate moves), funding and liquidity (the deposit and wholesale
// funding mix, the liquidity buffer, the LCR and NSFR regime), and capital
// planning (the capital position, capital allocation, and the stress-testing
// and CCAR/DFAST process).
//
// The operating reality the pack encodes: a bank does not earn its margin in
// one place — it earns it across the spread between what assets yield and
// what funding costs, net of the interest-rate, liquidity, and capital risk
// it carries to do so. Value and risk leak through a forecast that misses, a
// rate position that is mismodelled, a funding base that proves less stable
// than assumed, or capital that is trapped where it earns least. The AI
// archetypes are the recurring bets against exactly that reality.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const financeTreasuryAlmPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'finance_treasury_alm',
  functionLabel: 'Finance, treasury & ALM',
  summary:
    'Finance, treasury & ALM is the corporate financial spine of the ' +
    'institution — the function that owns the economics of the balance ' +
    'sheet itself. It runs corporate finance and FP&A (the plan, the ' +
    'forecast, profitability and management reporting), treasury (cash, ' +
    'collateral, the investment portfolio, and funds-transfer pricing), ' +
    'balance-sheet and interest-rate-risk management (the ALM discipline of ' +
    'managing net interest income and economic value of equity against rate ' +
    'moves), funding and liquidity (the deposit and wholesale funding mix, ' +
    'the liquidity buffer, and the LCR/NSFR regime), and capital planning ' +
    '(the capital position, capital allocation, and stress testing). Its ' +
    'economics are net interest margin, the cost of funds, the return on ' +
    'capital deployed, and the cost of the rate, liquidity, and capital risk ' +
    'carried to earn them. A bank does not earn its margin in one place — it ' +
    'earns it across the spread, net of the risk it runs — so the function ' +
    'is judged on how well the whole balance sheet is optimised against ' +
    'risk, not on any single position.',
  version: '1.1.0',
  lastReviewed: '2026-06-06',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'net_interest_margin',
      name: 'Net interest margin (NIM)',
      definition:
        'Net interest income — interest earned on assets minus interest ' +
        'paid on funding — expressed as a percentage of average ' +
        'interest-earning assets.',
      unit: '% of average earning assets',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2.5,
        high: 4,
        basis:
          'Net interest margin varies with asset mix, funding mix, and the ' +
          'rate environment; the band spans a thin-margin balance sheet to a ' +
          'rich one. A planning range — read against the specific business ' +
          'mix and rate cycle.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger and the ALM system, reconciling interest income ' +
        'and expense against average earning-asset balances.',
      whyItMatters:
        'Net interest margin is the headline measure of how profitably the ' +
        'balance sheet is structured; for a depository it is the largest ' +
        'single driver of earnings.',
    },
    {
      key: 'cost_of_funds',
      name: 'Cost of funds',
      definition:
        'The blended interest rate the institution pays across all its ' +
        'funding — deposits and wholesale borrowings — expressed as an ' +
        'annualised percentage of average funding balances.',
      unit: '% annualised on average funding',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 3.5,
        basis:
          'Cost of funds depends heavily on the rate environment and the ' +
          'deposit-versus-wholesale mix; the band spans a low-cost core-' +
          'deposit base to a wholesale-reliant one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger and treasury systems, aggregating interest ' +
        'expense across deposit and wholesale funding.',
      whyItMatters:
        'Cost of funds is one of the two levers of net interest margin; a ' +
        'low, stable cost of funds from core deposits is a durable ' +
        'competitive advantage, and a rising one compresses the whole ' +
        'spread.',
    },
    {
      key: 'liquidity_coverage_ratio',
      name: 'Liquidity coverage ratio (LCR)',
      definition:
        'The stock of high-quality liquid assets divided by total net cash ' +
        'outflows projected over a 30-day stress scenario — the regulatory ' +
        'measure of short-term liquidity resilience.',
      unit: '% (HQLA over 30-day stressed net outflows)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 110,
        high: 150,
        basis:
          'The regulatory minimum is 100%; institutions hold a management ' +
          'buffer above it, and the band reflects a prudent operating range ' +
          'rather than the minimum or an inefficiently large buffer. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The liquidity-risk and regulatory-reporting systems, computing ' +
        'HQLA and stressed outflows under the LCR rule.',
      whyItMatters:
        'The LCR is a binding regulatory constraint and a direct measure of ' +
        'survival under a short-term liquidity stress; running it too low ' +
        'is a breach, too high is a drag on margin.',
    },
    {
      key: 'net_stable_funding_ratio',
      name: 'Net stable funding ratio (NSFR)',
      definition:
        'Available stable funding divided by required stable funding — the ' +
        'regulatory measure of whether long-term assets are supported by ' +
        'sufficiently stable funding over a one-year horizon.',
      unit: '% (available over required stable funding)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 105,
        high: 130,
        basis:
          'The regulatory minimum is 100%; the band reflects a prudent ' +
          'operating range above it that balances structural-funding ' +
          'resilience against the cost of holding stable funding. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The liquidity-risk and regulatory-reporting systems, computing ' +
        'available and required stable funding under the NSFR rule.',
      whyItMatters:
        'The NSFR governs structural funding resilience over a year; it ' +
        'constrains how far the institution can fund long-dated assets with ' +
        'short or unstable funding.',
    },
    {
      key: 'eve_rate_sensitivity',
      name: 'Economic-value-of-equity rate sensitivity',
      definition:
        'The modelled change in the economic value of equity — the present ' +
        'value of assets minus liabilities — for a defined parallel shift ' +
        'in interest rates, the long-horizon measure of interest-rate risk ' +
        'in the banking book.',
      unit: '% change in EVE per defined rate shock',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: -15,
        high: 15,
        basis:
          'EVE sensitivity is managed within a board-set tolerance band ' +
          'around zero; the range reflects a typical tolerance corridor for ' +
          'a defined rate shock rather than a target. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The ALM system, running the EVE measurement under the institution’s ' +
        'rate-shock scenario set.',
      whyItMatters:
        'EVE sensitivity captures the long-horizon interest-rate risk a ' +
        'short-term earnings view misses; a position outside the tolerance ' +
        'band signals the balance sheet is over-exposed to a rate move.',
    },
    {
      key: 'nii_rate_sensitivity',
      name: 'Net-interest-income rate sensitivity',
      definition:
        'The modelled change in projected net interest income over a 12-' +
        'month horizon for a defined change in interest rates — the short-' +
        'horizon earnings-at-risk measure of interest-rate risk.',
      unit: '% change in 12-month NII per defined rate shift',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: -10,
        high: 10,
        basis:
          'NII sensitivity is managed within a board-set earnings-at-risk ' +
          'tolerance; the band reflects a typical tolerance corridor for a ' +
          'defined rate shift rather than a target. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The ALM system, running the net-interest-income simulation under ' +
        'the institution’s rate scenarios.',
      whyItMatters:
        'NII sensitivity is the near-term earnings exposure the board and ' +
        'ALCO watch most closely; it shows how much of next year’s ' +
        'earnings is at risk to a rate move.',
    },
    {
      key: 'loan_to_deposit_ratio',
      name: 'Loan-to-deposit ratio',
      definition:
        'Total loans divided by total deposits — a structural measure of ' +
        'how much of the lending book is funded by the deposit base versus ' +
        'by wholesale or other funding.',
      unit: '% (loans over deposits)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'The loan-to-deposit ratio is managed within a band that balances ' +
          'earning-asset deployment against funding stability; the range is ' +
          'a prudent operating corridor, not a target. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger and treasury systems, aggregating loan and ' +
        'deposit balances.',
      whyItMatters:
        'A ratio too low leaves earning capacity unused; too high means the ' +
        'book is leaning on less stable wholesale funding — it is a core ' +
        'read on balance-sheet structure.',
    },
    {
      key: 'deposit_beta',
      name: 'Deposit beta',
      definition:
        'The share of a market-rate change that passes through into the ' +
        'rate paid on deposits — how sensitively deposit cost reprices when ' +
        'benchmark rates move.',
      unit: 'ratio of deposit-rate change to market-rate change',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0.2,
        high: 0.7,
        basis:
          'Deposit beta varies by deposit type, competition, and rate-cycle ' +
          'stage; the band spans a sticky core-deposit base to a rate-' +
          'sensitive one. A planning range — central to NIM forecasting.',
        label: 'planning-range',
      },
      dataSource:
        'The ALM system and deposit-analytics models, comparing historical ' +
        'deposit-rate moves against benchmark-rate moves.',
      whyItMatters:
        'Deposit beta is the single most important — and most uncertain — ' +
        'assumption in a net-interest-margin forecast; a beta assumed too ' +
        'low badly overstates projected margin in a rising-rate environment.',
    },
    {
      key: 'cet1_capital_ratio',
      name: 'Common equity tier 1 (CET1) capital ratio',
      definition:
        'Common equity tier 1 capital divided by risk-weighted assets — the ' +
        'primary regulatory measure of capital strength and loss-absorbing ' +
        'capacity.',
      unit: '% (CET1 capital over risk-weighted assets)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 9,
        high: 14,
        basis:
          'The regulatory minimum plus buffers sets a floor well below this ' +
          'band; institutions hold a management buffer above it, and the ' +
          'range reflects a prudent operating corridor, not a target. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The capital and regulatory-reporting systems, computing CET1 ' +
        'capital and risk-weighted assets under the regulatory capital ' +
        'framework.',
      whyItMatters:
        'The CET1 ratio is the binding measure of capital adequacy; too ' +
        'thin a buffer constrains growth and distributions and risks ' +
        'supervisory action, too thick is capital earning a sub-optimal ' +
        'return.',
    },
    {
      key: 'return_on_equity',
      name: 'Return on equity (ROE)',
      definition:
        'Net income expressed as a percentage of average common ' +
        'shareholders’ equity — the headline measure of how much profit the ' +
        'institution earns on the capital deployed.',
      unit: '% return on average equity',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 8,
        high: 15,
        basis:
          'Return on equity varies with business mix, leverage, and the ' +
          'rate cycle; the band spans an under-earning institution to a ' +
          'strong one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger and management-reporting systems, reconciling ' +
        'net income against average common equity.',
      whyItMatters:
        'Return on equity is the ultimate read on whether the institution ' +
        'is earning an adequate return on the capital its owners and ' +
        'regulators require it to hold.',
    },
    {
      key: 'forecast_accuracy',
      name: 'Financial-forecast accuracy',
      definition:
        'The absolute variance between the forecast of key financial ' +
        'measures — net interest income, fee income, expense, and earnings ' +
        '— and the actual outcome, measured over the forecast horizon.',
      unit: '% mean absolute forecast variance',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 10,
        basis:
          'Forecast accuracy depends on modelling rigour, data quality, and ' +
          'the volatility of the environment; the band spans a tight ' +
          'forecasting process to a loose one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The FP&A and planning systems, comparing forecast figures against ' +
        'actual general-ledger results.',
      whyItMatters:
        'A forecast that misses widely degrades every capital, funding, and ' +
        'investment decision built on it; forecast accuracy is the integrity ' +
        'measure of the planning function.',
    },
    {
      key: 'planning_cycle_time',
      name: 'Planning and close cycle time',
      definition:
        'The elapsed time to complete a core finance cycle — the monthly ' +
        'financial close, or the production of a full forecast or annual ' +
        'plan iteration — from period end to a reviewed, reportable result.',
      unit: 'business days per cycle',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 12,
        basis:
          'Cycle time depends on the degree of automation, data ' +
          'integration, and manual reconciliation; the band spans a fast, ' +
          'automated finance function to a spreadsheet-bound one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The financial-close and planning workflow, time-stamped from ' +
        'period end to a reviewed result.',
      whyItMatters:
        'A long cycle delays the information the institution steers by and ' +
        'consumes finance capacity in mechanics rather than analysis; cycle ' +
        'time is the efficiency read on the finance operation.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'spreadsheet_bound_planning',
      name: 'Spreadsheet-bound planning and close',
      description:
        'The financial plan, the forecast, and the close run on a sprawl of ' +
        'linked spreadsheets and manual extracts, so finance capacity is ' +
        'consumed assembling and reconciling numbers rather than analysing ' +
        'them, and the cycle is slow and error-prone.',
      detectionSignal:
        'Planning and close cycle time is long, finance staff spend most of ' +
        'a cycle on mechanics, and version-control and reconciliation errors ' +
        'recur.',
      diagnosticQuestion:
        'How much of the finance team’s cycle is spent assembling and ' +
        'reconciling numbers versus analysing them, and where does the ' +
        'spreadsheet sprawl sit?',
    },
    {
      key: 'deposit_behaviour_misjudged',
      name: 'Deposit behaviour misjudged',
      description:
        'Deposit beta, balance migration between deposit types, and the ' +
        'stickiness of non-maturity deposits are assumed from rules of ' +
        'thumb or stale history, so the net-interest-margin forecast and ' +
        'the ALM model rest on a deposit picture that does not hold when ' +
        'rates move.',
      detectionSignal:
        'NIM forecasts miss in a rate-move environment, deposit-beta ' +
        'assumptions are static, and there is no behavioural model for ' +
        'non-maturity deposit decay.',
      diagnosticQuestion:
        'How are deposit beta and non-maturity-deposit behaviour modelled, ' +
        'and how well did those assumptions hold through the last rate ' +
        'cycle?',
    },
    {
      key: 'slow_alm_what_if',
      name: 'Slow ALM scenario and what-if analysis',
      description:
        'Running an ALM scenario — a new rate path, a balance-sheet ' +
        'strategy, a hedge — is a slow, batch, specialist process, so ALCO ' +
        'decisions are made on a narrow set of pre-run scenarios rather ' +
        'than on the question actually being asked.',
      detectionSignal:
        'ALM scenarios take days to produce, ALCO works from a fixed ' +
        'scenario pack, and ad hoc what-if questions cannot be answered in ' +
        'the meeting.',
      diagnosticQuestion:
        'When ALCO wants to test a balance-sheet or hedge decision, can the ' +
        'scenario be run inside the decision window, or only in the next ' +
        'cycle?',
    },
    {
      key: 'funding_concentration_blind_spot',
      name: 'Funding-concentration and stability blind spot',
      description:
        'The funding base is treated as more stable and more diversified ' +
        'than it is — concentrations in large depositors, rate-sensitive or ' +
        'uninsured balances, and brokered or wholesale reliance are not ' +
        'continuously monitored — until a stress reveals the funding was ' +
        'not what the liquidity model assumed.',
      detectionSignal:
        'Funding concentration and uninsured-deposit share are not tracked ' +
        'in near real time; liquidity-stress assumptions are not back-' +
        'tested against actual deposit behaviour.',
      diagnosticQuestion:
        'How concentrated and how rate-sensitive is the funding base ' +
        'really, and how continuously is that monitored against the ' +
        'liquidity-model assumptions?',
    },
    {
      key: 'ftp_misallocation',
      name: 'Funds-transfer-pricing misallocation',
      description:
        'Funds-transfer pricing — the internal rate that charges ' +
        'businesses for funding and credits them for deposits — is crude or ' +
        'stale, so product and business profitability is mismeasured and ' +
        'capital and incentives flow to activity that looks profitable but ' +
        'is not, once funding and liquidity cost is properly attributed.',
      detectionSignal:
        'FTP rates are updated infrequently, do not reflect the true ' +
        'funding curve or liquidity cost, and business profitability ' +
        'disagrees with enterprise economics.',
      diagnosticQuestion:
        'Does funds-transfer pricing reflect the true marginal cost of ' +
        'funding and liquidity, and are product and business profitability ' +
        'measured on that basis?',
    },
    {
      key: 'trapped_capital',
      name: 'Trapped or sub-optimally allocated capital',
      description:
        'Capital sits where it earns least — in low-return books, in ' +
        'excess buffers held for lack of a precise view, or in legal ' +
        'entities and geographies where it cannot be efficiently deployed — ' +
        'so the institution under-earns on the capital it is required to ' +
        'hold.',
      detectionSignal:
        'Return on capital varies widely across books with no deliberate ' +
        'strategy; capital buffers are set conservatively because the ' +
        'precise need is unclear; return on equity trails peers.',
      diagnosticQuestion:
        'Is capital allocated deliberately to its highest risk-adjusted ' +
        'return, or held in excess and trapped where the institution ' +
        'under-earns on it?',
    },
    {
      key: 'stress_testing_disconnect',
      name: 'Stress testing disconnected from steering',
      description:
        'Capital stress testing and the CCAR/DFAST process are run as a ' +
        'compliance exercise that produces a regulatory submission but does ' +
        'not feed the capital, funding, and balance-sheet decisions the ' +
        'institution actually makes between cycles.',
      detectionSignal:
        'Stress results arrive too late and too aggregated to inform ' +
        'decisions; the same scenarios are not used in management steering, ' +
        'and stress and plan are reconciled only at submission.',
      diagnosticQuestion:
        'Does the stress-testing apparatus inform live capital and balance-' +
        'sheet decisions, or only produce the regulatory submission?',
    },
    {
      key: 'data_lineage_gap_finance',
      name: 'Finance data-lineage and reconciliation gap',
      description:
        'The numbers in management reporting, the ALM model, and regulatory ' +
        'filings are assembled through manual mappings and adjustments with ' +
        'no clear lineage to the source ledgers, so the institution cannot ' +
        'reconcile its own views or quickly explain a figure.',
      detectionSignal:
        'Management, ALM, and regulatory views of the same number ' +
        'disagree; reconciliations are manual and slow; the source of a ' +
        'reported figure cannot be traced.',
      diagnosticQuestion:
        'Can a key figure be traced from management reporting through the ' +
        'ALM model to the source ledger with a documented, repeatable ' +
        'lineage?',
    },
    {
      key: 'rented_treasury_intelligence',
      name: 'Rented treasury intelligence',
      description:
        'The forecasting, anomaly, and covenant-headroom models — the ' +
        'analytical intelligence the function steers by — live inside a ' +
        'treasury management system or treasury-analytics SaaS that holds ' +
        'the models on the vendor side, scored by the vendor’s black-box ' +
        'logic and returned as a dashboard the institution cannot tune, ' +
        'audit, or recalibrate on its own balance sheet. The institution ' +
        'rents access to insight derived from its own cash, ledger, and ' +
        'market data: it cannot inspect why a forecast is off, extend a ' +
        'model to its actual debt stack or entity structure, or improve it ' +
        'with its own behaviour signal, and it pays in perpetuity for the ' +
        'privilege. The own-it thesis is the opposite — rent the rails (the ' +
        'TMS, the SWIFT bureau, the payment factory) but own the ' +
        'intelligence (the forecasting, anomaly, and covenant models built ' +
        'on the institution’s own lakehouse, trained on its own history).',
      detectionSignal:
        'The forecasting and anomaly logic is a vendor module that cannot ' +
        'be queried at the model level; forecast and covenant projections ' +
        'cannot be inspected, recalibrated, or exported; the only bank, ' +
        'cash, and ledger history is the vendor’s, accumulated from its own ' +
        'go-live, and exit would mean rebuilding the analytics layer from ' +
        'zero.',
      diagnosticQuestion:
        'Does the institution own its treasury intelligence — the ' +
        'forecasting, anomaly, and covenant models, trainable and auditable ' +
        'on its own governed lakehouse — or does that intelligence live ' +
        'inside a TMS or treasury-analytics platform it rents and cannot ' +
        'inspect?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'driver_based_forecasting',
      name: 'Driver-based financial forecasting and planning',
      valueMechanism:
        'A model builds the financial forecast from the underlying drivers ' +
        '— balance growth, rate paths, deposit behaviour, fee volumes, and ' +
        'expense drivers — rather than from extrapolated spreadsheets, and ' +
        'continuously re-forecasts as actuals land. Value comes from ' +
        'lifting forecast accuracy, compressing the planning cycle, and ' +
        'freeing finance capacity from mechanics to analysis.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'General-ledger actuals and historical financial results',
        'Balance, rate, and volume driver data from the core and product ' +
          'systems',
        'Macroeconomic and rate-path inputs and management assumptions',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model produces a driver-based forecast; the CFO and FP&A own ' +
          'the assumptions, the management overlay, and the forecast that is ' +
          'communicated — the model does not set the plan.',
        'The driver model must be back-tested and its assumptions made ' +
          'explicit, so a forecast miss can be traced to a driver rather ' +
          'than an opaque model.',
        'Management overlays must be transparent and governed — an ' +
          'unexplained overlay that overrides the model defeats the ' +
          'discipline.',
      ],
      metricsMoved: [
        'forecast_accuracy',
        'planning_cycle_time',
        'return_on_equity',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'deposit_behaviour_modelling',
      name: 'Deposit-behaviour and beta modelling',
      valueMechanism:
        'A model estimates deposit beta, non-maturity-deposit decay, and ' +
        'balance migration between deposit types from account-level ' +
        'behavioural data, conditioned on the rate environment and customer ' +
        'segment. Value comes from replacing rule-of-thumb deposit ' +
        'assumptions with a behavioural model — sharpening the NIM forecast ' +
        'and the interest-rate-risk view that depend on them.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Account-level deposit balance and rate history by product and ' +
          'segment',
        'Historical benchmark-rate moves to calibrate beta and migration',
        'Customer-segment and relationship data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model estimates deposit behaviour; the Treasurer and ALM own ' +
          'the assumptions adopted into the ALM model and the NIM forecast ' +
          '— the model informs, it does not set the assumption set.',
        'Behavioural models calibrated on one rate cycle can mislead in a ' +
          'different one; the model must be stress-tested across regimes ' +
          'and its extrapolation limits stated.',
        'Account-level deposit data is sensitive customer data — access and ' +
          'use must respect privacy obligations.',
      ],
      metricsMoved: [
        'deposit_beta',
        'net_interest_margin',
        'nii_rate_sensitivity',
        'forecast_accuracy',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'alm_scenario_acceleration',
      name: 'ALM scenario and balance-sheet what-if acceleration',
      valueMechanism:
        'An agent runs ALM simulations — rate scenarios, balance-sheet ' +
        'strategies, hedge structures — on demand and at speed, and ' +
        'explains the drivers of each result, so ALCO can test the question ' +
        'actually in front of it rather than a fixed scenario pack. Value ' +
        'comes from better-informed balance-sheet and hedging decisions ' +
        'that keep NII and EVE sensitivity inside tolerance at lower cost.',
      adoptionProfile: 'early',
      dataDependencies: [
        'The full ALM position data — assets, liabilities, and off-balance-' +
          'sheet instruments',
        'The behavioural-assumption set (deposit beta, prepayment, decay)',
        'Rate-scenario definitions and hedge-instrument data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent runs scenarios and explains drivers; ALCO and the ' +
          'Treasurer own every balance-sheet and hedging decision — the ' +
          'agent does not execute a position.',
        'Scenario speed must not erode rigour — the underlying ALM model and ' +
          'its assumptions remain governed and validated, and a fast wrong ' +
          'answer is worse than a slow right one.',
        'The agent must surface the assumption sensitivity of each result so ' +
          'ALCO sees how much a conclusion depends on a contested ' +
          'assumption.',
      ],
      metricsMoved: [
        'eve_rate_sensitivity',
        'nii_rate_sensitivity',
        'net_interest_margin',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'liquidity_funding_monitoring',
      name: 'Liquidity and funding-concentration monitoring',
      valueMechanism:
        'An agent monitors the funding base continuously — deposit ' +
        'concentration, uninsured and rate-sensitive balances, wholesale ' +
        'and brokered reliance, and the LCR/NSFR position — and flags ' +
        'developing concentration or stability risk early. Value comes from ' +
        'detecting a funding vulnerability while it can still be managed, ' +
        'and from running the liquidity buffer at a precise rather than ' +
        'over-conservative level.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Account-level deposit data with insured/uninsured and concentration ' +
          'attributes',
        'Wholesale and brokered funding positions and maturities',
        'HQLA holdings and the LCR/NSFR computation inputs',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent monitors and flags; the Treasurer and the liquidity-risk ' +
          'function own the funding strategy and any buffer or contingency ' +
          'action — the agent does not move funding.',
        'Liquidity-stress assumptions must be back-tested against actual ' +
          'deposit behaviour; a monitor that runs on optimistic assumptions ' +
          'gives false comfort.',
        'Early-warning thresholds need governance so genuine signals are ' +
          'acted on and noise does not desensitise the function.',
      ],
      metricsMoved: [
        'liquidity_coverage_ratio',
        'net_stable_funding_ratio',
        'cost_of_funds',
        'loan_to_deposit_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'capital_allocation_optimization',
      name: 'Capital allocation and stress-integration optimisation',
      valueMechanism:
        'A model measures risk-adjusted return on capital across books and ' +
        'business lines, integrates stress-test outcomes into the live ' +
        'capital view, and identifies where capital is trapped or under-' +
        'earning. Value comes from steering capital toward its highest ' +
        'risk-adjusted return and running buffers at a precise level — ' +
        'lifting return on equity without breaching the capital frame.',
      adoptionProfile: 'early',
      dataDependencies: [
        'Risk-weighted-asset and capital data by book and business line',
        'Profitability and risk-adjusted-return data with FTP applied',
        'Stress-test scenario results and the capital-plan baseline',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model informs capital allocation; the CFO, Treasurer, and the ' +
          'board own capital decisions, distributions, and the capital plan ' +
          '— the model does not allocate capital itself.',
        'Optimising return must never push the capital position toward the ' +
          'regulatory floor — buffers exist to absorb stress and the ' +
          'optimisation is bounded by the capital framework and risk ' +
          'appetite.',
        'Stress and capital models are model-risk-managed assets; their ' +
          'integration must be validated and explainable to the board and ' +
          'examiners.',
      ],
      metricsMoved: [
        'cet1_capital_ratio',
        'return_on_equity',
        'net_interest_margin',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'finance_close_automation',
      name: 'Financial-close and reconciliation automation',
      valueMechanism:
        'An agent automates the mechanics of the financial close — data ' +
        'aggregation, intercompany and account reconciliation, variance ' +
        'identification, and management-reporting assembly with documented ' +
        'lineage. Value comes from compressing the close cycle, removing ' +
        'reconciliation rework, and giving every finance view a traceable ' +
        'source.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'General-ledger and sub-ledger data with account mappings',
        'Reconciliation rules and intercompany relationships',
        'Management-reporting templates and prior-period results',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent automates close mechanics and reconciliation; the ' +
          'controller reviews exceptions and attests the close — the ' +
          'financial result remains a human-attested act.',
        'Automated reconciliation must surface, not suppress, genuine ' +
          'breaks; a reconciliation forced to tie hides the very error it ' +
          'should catch.',
        'Data lineage must be auditable end-to-end so any reported figure ' +
          'can be traced from management reporting to the source ledger.',
      ],
      metricsMoved: [
        'planning_cycle_time',
        'forecast_accuracy',
        'return_on_equity',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'continuous_driver_based_planning',
      name: 'Continuous driver-based planning layer',
      description:
        'A pattern that runs financial planning as a continuous, driver-' +
        'based process — the forecast assembled from balance, rate, ' +
        'volume, and expense drivers and re-run as actuals land — rather ' +
        'than as a periodic spreadsheet exercise, so the institution always ' +
        'has a current, explainable forward view.',
      boundary:
        'It builds and re-runs the driver-based forecast; the CFO and FP&A ' +
        'own the assumptions, the management overlay, and the communicated ' +
        'plan. It does not set the plan or replace management judgement.',
      humanAccountabilityPoint:
        'The Chief Financial Officer accountable for the financial plan, ' +
        'the forecast, and management reporting.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'behavioural_assumption_engine',
      name: 'Behavioural-assumption engine',
      description:
        'A pattern that maintains the institution’s behavioural ' +
        'assumptions — deposit beta, non-maturity-deposit decay, prepayment ' +
        '— as modelled, back-tested, regime-aware estimates feeding the ALM ' +
        'model and the NIM forecast, rather than as static rule-of-thumb ' +
        'inputs.',
      boundary:
        'It estimates and back-tests behavioural assumptions; the Treasurer ' +
        'and ALM own the assumption set adopted into the models. It informs ' +
        'the assumptions, it does not own them.',
      humanAccountabilityPoint:
        'The Treasurer accountable for the behavioural-assumption set ' +
        'feeding the ALM model and the interest-rate-risk view.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'on_demand_alm_scenario',
      name: 'On-demand ALM scenario pattern',
      description:
        'A pattern that makes ALM scenario and balance-sheet what-if ' +
        'analysis an on-demand, interactive capability — rate paths, ' +
        'balance-sheet strategies, and hedge structures run and explained ' +
        'inside the decision window — feeding ALCO with the analysis of the ' +
        'question actually being asked.',
      boundary:
        'It runs scenarios and explains drivers; ALCO and the Treasurer own ' +
        'every balance-sheet and hedging decision and its execution. It ' +
        'does not execute a position.',
      humanAccountabilityPoint:
        'The Asset-Liability Committee (ALCO), chaired by the Treasurer, ' +
        'accountable for balance-sheet and interest-rate-risk decisions.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'continuous_liquidity_surveillance',
      name: 'Continuous liquidity-surveillance pattern',
      description:
        'A pattern that monitors funding and liquidity continuously — ' +
        'deposit concentration, uninsured and rate-sensitive balances, ' +
        'wholesale reliance, and the LCR/NSFR position — with early-warning ' +
        'signals and back-tested stress assumptions, so funding ' +
        'vulnerabilities are managed before they become a stress event.',
      boundary:
        'It surveils and flags; the Treasurer and liquidity-risk function ' +
        'own the funding strategy and any contingency action. It does not ' +
        'move or raise funding.',
      humanAccountabilityPoint:
        'The Treasurer accountable for funding strategy, the liquidity ' +
        'buffer, and the contingency-funding plan.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'integrated_capital_steering',
      name: 'Integrated capital-steering pattern',
      description:
        'A pattern that fuses risk-adjusted return on capital, stress-test ' +
        'outcomes, and the capital plan into a single steering view — so ' +
        'capital allocation, buffer sizing, and distribution decisions are ' +
        'made on integrated economics rather than on a stress process run ' +
        'separately from management steering.',
      boundary:
        'It measures and integrates; the CFO, Treasurer, and board own ' +
        'capital allocation, buffer, and distribution decisions within the ' +
        'capital framework and risk appetite. It does not allocate capital.',
      humanAccountabilityPoint:
        'The Chief Financial Officer accountable for the capital plan, ' +
        'capital allocation, and the stress-testing process.',
      controlPosture: 'human-approval-required',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Finance, treasury & ALM value is realised in three distinct ways and ' +
      'a forecast must keep them separate. First, margin and return: ' +
      'sharper deposit-behaviour modelling, faster ALM scenario analysis, ' +
      'and better-informed balance-sheet and hedging decisions protect or ' +
      'lift net interest margin and keep rate risk inside tolerance — a ' +
      'recurring earnings gain, but one bounded by the rate environment the ' +
      'institution does not control. Second, capital and funding ' +
      'efficiency: precise liquidity and capital views let the institution ' +
      'run buffers at the right level rather than over-conservatively, ' +
      'releasing trapped capital and funding cost into return on equity — a ' +
      'one-time release plus a recurring efficiency. Third, finance ' +
      'productivity: automating the close, reconciliation, and planning ' +
      'mechanics compresses cycle time and redeploys finance capacity from ' +
      'assembly to analysis — a recurring cost-and-capability gain. The ' +
      'dominant constraint is that the largest levers are contingent on the ' +
      'rate cycle and bounded by regulatory minimums — buffers cannot be ' +
      'optimised toward the floor — so a forecast must be expressed as ' +
      'ranges, read against the specific balance sheet and rate cycle, and ' +
      'never present a rate-dependent gain as certain.',
    dominantHaircutFactors: [
      {
        factor: 'Rate-environment and macro contingency',
        rationale:
          'Margin, deposit-beta, and balance-sheet value gains depend on ' +
          'the rate path and the macro environment, which the institution ' +
          'does not control. A large share of modelled value is contingent ' +
          'on a rate scenario and must be presented as scenario-conditional, ' +
          'not certain.',
        typicalHaircut: {
          low: 0.25,
          high: 0.55,
          basis:
            'Value erosion from the rate-environment and macro contingency ' +
            'of margin and balance-sheet gains; a planning range driven by ' +
            'the rate-cycle stage.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Regulatory floors and risk-appetite ceilings',
        rationale:
          'Liquidity and capital buffers cannot be optimised below ' +
          'regulatory minimums or board risk appetite. The releasable ' +
          'efficiency is the gap between an over-conservative buffer and a ' +
          'precise prudent one — a bounded amount, not the whole buffer.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Forecast erosion from regulatory floors and risk-appetite ' +
            'ceilings bounding buffer and capital optimisation; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data lineage and model-readiness',
        rationale:
          'Driver-based forecasting, behavioural modelling, and integrated ' +
          'capital steering only work to the extent finance and risk data ' +
          'has clean lineage and the underlying models are validated. ' +
          'Fragmented data and model debt cap the reachable value.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from weak finance data lineage and model ' +
            'readiness; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Model governance and adoption',
        rationale:
          'ALM, capital, and forecasting models are model-risk-managed ' +
          'assets and must be validated and explainable to the board and ' +
          'examiners. If automation is run alongside the old process rather ' +
          'than adopted, only a fraction of the modelled efficiency lands.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from model-governance overhead and partial ' +
            'adoption; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Net-interest-margin protection and uplift',
        range: {
          low: 3,
          high: 15,
          basis:
            'Basis-point protection or uplift in net interest margin from ' +
            'sharper deposit modelling and better-informed balance-sheet ' +
            'decisions; a planning range, scenario-conditional on the rate ' +
            'cycle.',
          label: 'planning-range',
        },
        measuredAs:
          'Basis-point change in net interest margin against the ' +
          'counterfactual.',
      },
      {
        lever: 'Planning-and-close cycle-time compression',
        range: {
          low: 25,
          high: 55,
          basis:
            'Relative reduction in planning and close cycle time from ' +
            'automating close, reconciliation, and planning mechanics; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in business days per finance cycle.',
      },
      {
        lever: 'Forecast-accuracy improvement',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in mean absolute forecast variance from ' +
            'driver-based forecasting and behavioural modelling; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in mean absolute forecast variance.',
      },
      {
        lever: 'Capital and liquidity-buffer efficiency',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in excess capital and liquidity buffer held ' +
            'above a precise prudent level, released into return on equity; ' +
            'a planning range bounded by regulatory floors.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in buffer held above a precise ' +
          'prudent operating level.',
      },
    ],
    timeToValueBand:
      '3–6 months to first operational signal (close cycle time, forecast ' +
      'variance, scenario turnaround); 12–24 months to a settled result, ' +
      'because the margin, capital, and buffer-efficiency components only ' +
      'prove out across a full rate and planning cycle.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Asset-liability management (ALM) system',
        role:
          'The system of record for balance-sheet and interest-rate-risk ' +
          'measurement — net-interest-income simulation, economic-value-of-' +
          'equity analysis, behavioural assumptions, and ALM scenarios.',
        examples: ['QRM', 'Empyrean', 'ZM Financial Systems', 'Moody’s ALM'],
      },
      {
        name: 'General ledger and financial-consolidation system',
        role:
          'The financial system of record — the ledger, the close, ' +
          'consolidation, and the actuals that every finance and ALM view ' +
          'reconciles to.',
        examples: [
          'Oracle Financials',
          'SAP S/4HANA',
          'Workday Financial Management',
        ],
      },
      {
        name: 'FP&A and planning platform',
        role:
          'Supports the financial plan, the forecast, profitability and ' +
          'management reporting, and driver-based planning.',
        examples: ['Anaplan', 'Oracle EPM', 'Workday Adaptive Planning'],
      },
      {
        name: 'Treasury management system',
        role:
          'The system of record for treasury operations — cash and ' +
          'collateral management, the investment portfolio, wholesale ' +
          'funding, and funds-transfer pricing.',
        examples: [
          'Kyriba',
          'FIS Quantum / Integrity',
          'ION Treasury',
        ],
      },
      {
        name: 'Liquidity-risk and regulatory-capital reporting system',
        role:
          'Computes the LCR, NSFR, regulatory capital ratios, and the ' +
          'stress-testing and CCAR/DFAST submissions.',
        examples: [
          'Moody’s regulatory reporting',
          'Wolters Kluwer OneSumX',
          'AxiomSL / Adenza',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Financial Officer (CFO)',
        accountability:
          'Owns the financial plan, the forecast, management and external ' +
          'reporting, the capital plan, and the overall financial steering ' +
          'of the institution.',
      },
      {
        title: 'Treasurer',
        accountability:
          'Owns treasury, the investment portfolio, funding and liquidity, ' +
          'funds-transfer pricing, and chairs the asset-liability ' +
          'management process.',
      },
      {
        title: 'Head of Asset-Liability Management / Balance-Sheet Risk',
        accountability:
          'Owns the measurement and management of interest-rate risk in the ' +
          'banking book — net interest income and economic-value-of-equity ' +
          'sensitivity against rate moves.',
      },
      {
        title: 'Head of FP&A',
        accountability:
          'Owns the planning and forecasting process, profitability ' +
          'analysis, and management reporting.',
      },
      {
        title: 'Head of Liquidity Risk',
        accountability:
          'Owns liquidity-risk measurement and monitoring — the LCR/NSFR ' +
          'position, funding concentration, liquidity stress testing, and ' +
          'the contingency-funding plan.',
      },
      {
        title: 'Head of Capital Management',
        accountability:
          'Owns the capital position, capital allocation, the stress-' +
          'testing and CCAR/DFAST process, and capital-distribution ' +
          'planning.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Interest-rate risk in the banking book (IRRBB)',
        relevance:
          'The supervisory framework for managing and measuring interest-' +
          'rate risk in the banking book; it sets the expectation that the ' +
          'institution measures NII and EVE sensitivity and manages them ' +
          'within board-set tolerances.',
      },
      {
        name: 'The LCR and NSFR liquidity rules',
        relevance:
          'The Basel liquidity regime — the liquidity coverage ratio for ' +
          'short-term resilience and the net stable funding ratio for ' +
          'structural funding — sets binding minimums the funding and ' +
          'liquidity function must hold above.',
      },
      {
        name: 'The regulatory capital framework (Basel III / capital rules)',
        relevance:
          'Defines regulatory capital, risk-weighted assets, and the CET1 ' +
          'minimum plus buffers — the binding constraint on capital ' +
          'planning, allocation, and distributions.',
      },
      {
        name: 'CCAR / DFAST supervisory stress testing',
        relevance:
          'The supervisory stress-testing regime requires the institution ' +
          'to project capital under stress scenarios; it shapes the capital ' +
          'plan, buffer sizing, and distribution capacity.',
      },
      {
        name: 'CECL — current expected credit loss accounting',
        relevance:
          'The expected-credit-loss accounting standard drives the loan-' +
          'loss reserve, which flows directly into earnings, capital, and ' +
          'the financial forecast the function owns.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Net interest margin (NIM)',
        definition:
          'Net interest income as a percentage of average interest-earning ' +
          'assets — the core profitability measure of a depository balance ' +
          'sheet.',
      },
      {
        term: 'Economic value of equity (EVE)',
        definition:
          'The present value of assets minus the present value of ' +
          'liabilities — the long-horizon measure of interest-rate risk in ' +
          'the banking book.',
      },
      {
        term: 'Deposit beta',
        definition:
          'The share of a market-rate change that passes through into the ' +
          'rate paid on deposits — a key, uncertain assumption in any ' +
          'NIM forecast.',
      },
      {
        term: 'Funds-transfer pricing (FTP)',
        definition:
          'The internal rate mechanism that charges businesses for the ' +
          'funding they use and credits them for the deposits they raise — ' +
          'the basis for measuring true product and business profitability.',
      },
      {
        term: 'High-quality liquid assets (HQLA)',
        definition:
          'The pool of assets — cash and high-grade securities — that can ' +
          'be readily monetised in a stress, the numerator of the liquidity ' +
          'coverage ratio.',
      },
      {
        term: 'Asset-liability committee (ALCO)',
        definition:
          'The senior management committee that governs balance-sheet ' +
          'structure, interest-rate and liquidity risk, and funding ' +
          'strategy.',
      },
      {
        term: 'Non-maturity deposits',
        definition:
          'Deposits with no contractual maturity — checking and savings ' +
          'balances — whose behavioural decay and rate sensitivity must be ' +
          'modelled for ALM and NIM forecasting.',
      },
      {
        term: 'Risk-weighted assets (RWA)',
        definition:
          'The institution’s assets weighted by their regulatory risk — the ' +
          'denominator of the regulatory capital ratios.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Finance, Treasury & ALM Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the finance and balance-sheet function is leaking ' +
        'value or carrying mismodelled risk — planning, deposit behaviour, ' +
        'ALM analysis, funding, capital, or close mechanics — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Balance-sheet and operating context',
          guidance:
            'Name the institution and the balance sheet in scope — the ' +
            'asset and funding mix, the rate-cycle stage, and the business ' +
            'mix. State which ALM, general-ledger, FP&A, treasury, and ' +
            'liquidity systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — net interest margin, cost of funds, LCR, ' +
            'NSFR, EVE and NII sensitivity, loan-to-deposit, deposit beta, ' +
            'CET1 ratio, return on equity, forecast accuracy, and planning ' +
            'cycle time. For any metric not recorded, name it as a precise ' +
            'seed gap with its data source.',
        },
        {
          heading: 'Margin, risk, and balance-sheet analysis',
          guidance:
            'Analyse where net interest margin is being earned and ' +
            'pressured, how interest-rate risk sits against the board ' +
            'tolerance for NII and EVE, and how the funding base and ' +
            'capital position stand against the regulatory frame.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — spreadsheet-bound planning, ' +
            'misjudged deposit behaviour, slow ALM what-if, funding-' +
            'concentration blind spots, FTP misallocation, trapped capital, ' +
            'stress-testing disconnect, data-lineage gaps — and state which ' +
            'are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity using the value-model benchmark ranges — ' +
            'margin protection, cycle-time compression, forecast accuracy, ' +
            'buffer efficiency — explicitly haircut for rate-environment ' +
            'contingency, regulatory floors, and data readiness. Every ' +
            'figure a labelled planning range.',
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
            'and why, and what the Move would and would not attempt, ' +
            'including the model-governance posture it must hold.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Finance, Treasury & ALM Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-and-board-readable case for funding a ' +
        'finance/treasury/ALM AI Move — baseline, scenario-conditional ' +
        'forecast, cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'margin and return, capital and funding efficiency, and finance ' +
            'productivity, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — NIM, cost of funds, forecast accuracy, cycle time, ' +
            'buffer levels, return on equity. Where a baseline is a seed ' +
            'gap, say so and state what closing it requires before funding.',
        },
        {
          heading: 'Scenario-conditional value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, then ' +
            'apply each dominant haircut factor — rate-environment ' +
            'contingency, regulatory floors and risk-appetite ceilings, ' +
            'data and model readiness, governance and adoption — explicitly ' +
            'and show the haircut math. Present rate-dependent gains as ' +
            'scenario-conditional, never certain.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the ALM, general-ledger, ' +
            'FP&A, treasury, and liquidity systems, the model risk-' +
            'management and validation overhead, and the operating-model ' +
            'change in the finance and treasury organisation.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under an adverse rate scenario, ' +
            'tighter regulatory constraints, and partial adoption. State the ' +
            'downside the CFO and board are underwriting.',
        },
        {
          heading: 'Model governance posture',
          guidance:
            'State how any ALM, capital, forecasting, or behavioural model ' +
            'is governed under the model risk-management framework, ' +
            'validated, and made explainable to the board and examiners.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence — data lineage, model validation, governance ' +
            'sign-off — that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the measurement cadence, including the ' +
            'rate-cycle-dependent margin and buffer measures.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Finance, Treasury & ALM Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'finance/treasury/ALM AI capability, grounded in the function ' +
        'reference patterns and the model-governance frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — continuous driver-based planning, the behavioural-' +
            'assumption engine, on-demand ALM scenarios, continuous ' +
            'liquidity surveillance, integrated capital steering — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Platform landing zone & private data plane',
          guidance:
            'Specify the cloud landing zone and private data plane the ' +
            'capability runs on — multi-account governance, private ' +
            'networking with no public-IP compute and an egress allowlist, ' +
            'PrivateLink to the lakehouse, a regional Unity Catalog ' +
            'metastore, and identity federation. State the platform-' +
            'readiness gate that must be green before regulated financial ' +
            'and customer data lands. Do not present an architecture with no ' +
            'landing zone (cross-cutting pattern ' +
            'cc_cloud_landing_zone_private_data_plane).',
        },
        {
          heading: 'Ingestion & data-integration framework (own-it)',
          guidance:
            'Specify the metadata-driven ingestion framework that onboards ' +
            'the treasury feeds by configuration rather than per-pipeline ' +
            'code — bank statements (BAI2 / MT940 / camt), the ERP/GL, the ' +
            'TMS (Kyriba and peers), and market-data feeds. Name the own-it ' +
            'choice (e.g. DLT-META / the Databricks four-config framework, ' +
            'Lakeflow Connect landing in the institution’s own Unity ' +
            'Catalog) and reject reinventing a bespoke ingestion framework ' +
            'or renting an outsourced destination SaaS that holds the bank, ' +
            'cash, and ledger data on the vendor side — the own-it lakehouse ' +
            'ingests the raw feeds in parallel with the TMS so the ' +
            'institution owns an independent, complete history ' +
            '(cross-cutting pattern cc_metadata_driven_ingestion_framework).',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the ALM, general-ledger, FP&A, treasury, and ' +
            'liquidity-reporting integrations, the data lineage from source ' +
            'ledger to management, ALM, and regulatory views, and the ' +
            'driver and behavioural data the use cases depend on — as an ' +
            'own-it, lakehouse-native layer where the institution owns the ' +
            'reconciled bank, cash, ledger, and market history and the ' +
            'models trained on it, not a rented treasury-analytics SaaS that ' +
            'holds the data and models on the vendor side.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define where ALCO, the Treasurer, and the CFO ' +
            'retain the decision and where no position is executed ' +
            'autonomously.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how FP&A, ALM, treasury, liquidity-risk, and capital ' +
            'workflows change, how finance staff are redeployed from ' +
            'assembly and reconciliation to analysis, and who owns each ' +
            'change.',
        },
        {
          heading: 'Model governance and responsible-AI controls',
          guidance:
            'State the model risk-management treatment, validation, and ' +
            'explainability for any ALM, capital, forecasting, or ' +
            'behavioural model, and the regulatory frames (IRRBB, LCR/NSFR, ' +
            'the capital rules, CCAR/DFAST, CECL) that bound the design. ' +
            'Make the governance spine explicit: Unity Catalog access and ' +
            'lineage controls over the cloud + lakehouse services, SOX-' +
            'auditable evidence for every reported figure and model output, ' +
            'and preserved segregation of duties between initiation, ' +
            'approval, and release wherever a model touches payment or ' +
            'capital action — AI surfaces and scores, a human with the right ' +
            'authority decides, and every action is logged ' +
            '(cross-cutting pattern cc_unity_catalog_hitrust_governance).',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and the ' +
            'phased rollout across the finance, treasury, and ALM domains.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Finance, Treasury & ALM Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the finance/treasury/ALM AI ' +
        'capability so value reaches net interest margin, return on equity, ' +
        'and the cycle, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data-lineage validation, ' +
            'a pilot process (close, a forecast cut, or an ALM domain), ' +
            'finance and treasury onboarding, scale across the function — ' +
            'with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, data lineage, model governance, planning and ' +
            'close adoption, ALM and liquidity adoption, capital steering, ' +
            'and Tower measurement.',
        },
        {
          heading: 'Finance and treasury adoption approach',
          guidance:
            'Define the change runway for FP&A, ALM, treasury, and capital ' +
            'staff — training, workflow change, and the redeployment of ' +
            'capacity the automation frees toward analysis and judgement — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'ALCO and board-engagement plan',
          guidance:
            'Plan how ALCO and the board are walked through the AI-assisted ' +
            'capability and its governance, so balance-sheet and capital ' +
            'governance bodies trust and use the new analysis.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the rate-cycle-dependent margin and ' +
            'buffer measures.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — model-governance gaps, data-lineage ' +
            'fragility, adverse rate moves, partial adoption — with the ' +
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
      claim: 'Net interest margin and the spread it is earned on',
      authoritativeSource:
        'The general ledger and the ALM system, reconciling interest income ' +
        'and expense against average earning-asset and funding balances.',
      whatGoodEvidenceLooksLike:
        'Net interest margin decomposed into asset yield and funding cost, ' +
        'with the deposit and wholesale funding mix and the rate-cycle ' +
        'context made explicit.',
      weakEvidenceToReject:
        'A headline NIM figure with no decomposition into yield and funding ' +
        'cost, or a margin claim with no link to the rate environment it ' +
        'was earned in.',
    },
    {
      claim: 'Interest-rate risk — NII and EVE sensitivity',
      authoritativeSource:
        'The ALM system, running the NII simulation and EVE measurement ' +
        'under the institution’s governed rate-scenario set.',
      whatGoodEvidenceLooksLike:
        'NII and EVE sensitivity measured against board tolerance, with the ' +
        'behavioural assumptions — deposit beta, decay, prepayment — stated ' +
        'and back-tested.',
      weakEvidenceToReject:
        'A single rate-sensitivity number with no scenario set, or a ' +
        'measure resting on undocumented or unvalidated behavioural ' +
        'assumptions.',
    },
    {
      claim: 'Funding stability and the liquidity position',
      authoritativeSource:
        'The liquidity-risk and regulatory-reporting systems, with account-' +
        'level deposit concentration and uninsured-balance data.',
      whatGoodEvidenceLooksLike:
        'The LCR and NSFR computed under the rule, alongside funding-' +
        'concentration and uninsured-deposit analysis and back-tested ' +
        'stress assumptions.',
      weakEvidenceToReject:
        'An LCR or NSFR figure with no view of funding concentration, or a ' +
        'stability claim resting on stress assumptions never back-tested ' +
        'against actual deposit behaviour.',
    },
    {
      claim: 'Financial-forecast accuracy and data lineage',
      authoritativeSource:
        'The FP&A and planning systems, comparing forecast figures against ' +
        'actual general-ledger results, with documented source-to-report ' +
        'lineage.',
      whatGoodEvidenceLooksLike:
        'A measured forecast-versus-actual variance over the horizon, with ' +
        'misses traceable to a specific driver and every figure traceable ' +
        'to a source ledger.',
      weakEvidenceToReject:
        'A forecast-accuracy assertion with no variance history, or a ' +
        'reported figure that cannot be traced through the model to a ' +
        'source ledger.',
    },
    {
      claim: 'The forecast value of a finance/treasury/ALM AI Move',
      authoritativeSource:
        'The value model — margin-and-return, capital-and-funding-' +
        'efficiency, and finance-productivity components, each haircut by ' +
        'its dominant factors — read against the specific balance sheet and ' +
        'rate cycle.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with rate-dependent ' +
        'gains presented as scenario-conditional, each haircut applied ' +
        'explicitly, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a rate-dependent margin gain ' +
        'presented as certain, or a buffer-release figure that ignores the ' +
        'regulatory floor it is bounded by.',
    },
    {
      claim:
        'That the treasury intelligence layer is OWNED by the institution, ' +
        'not rented from a vendor platform',
      authoritativeSource:
        'The architecture decision record and the treasury-platform ' +
        'contract terms — where the reconciled bank, cash, ledger, and ' +
        'market history, the forecasting and anomaly models, and the ' +
        'covenant logic physically reside, and who can audit, extend, and ' +
        'move them.',
      whatGoodEvidenceLooksLike:
        'The reconciled treasury data, the forecasting and anomaly models, ' +
        'and the covenant-headroom logic run in the institution’s own ' +
        'governed lakehouse (its own cloud account, under Unity Catalog), ' +
        'are auditable and extensible, trained on the institution’s own ' +
        'history, and the IP is owned by the institution. Renting the rails ' +
        '— the TMS, the SWIFT bureau, the payment factory — is acceptable ' +
        'where the analytical destination is the institution’s own.',
      weakEvidenceToReject:
        'A claim of having a treasury-analytics platform where the data, ' +
        'forecasting and anomaly models, and covenant logic are held by the ' +
        'vendor and cannot be audited, recalibrated, or moved — that is ' +
        'rented intelligence, not an owned asset, and must not be presented ' +
        'as the institution owning its treasury strategy.',
    },
  ],
};
