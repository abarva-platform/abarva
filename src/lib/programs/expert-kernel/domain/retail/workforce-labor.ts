// Domain Function Pack — Retail · Workforce & labor management.
//
// Function key: `workforce_labor`.
//
// Workforce and labor management is the function that plans, schedules,
// deploys, and governs the retailer's hourly and salaried workforce across
// stores, distribution centres, and fulfilment operations. It owns the labor
// model — the labor standards and budgets, the demand-driven forecast of how
// many hours a site needs and when, the schedule that places those hours
// against people, the time-and-attendance record of what was actually worked,
// and the wage-and-hour, predictable-scheduling, and safety compliance that
// bounds all of it. Where store operations consumes labor to run the store,
// this function is the discipline that decides how much labor exists, what it
// costs, where it is placed, and whether it is deployed legally and fairly. It
// is judged on a hard triple bind: labor is the largest controllable cost line
// the retailer carries AND coverage gaps directly destroy sales and service
// AND every scheduling decision is governed by a thickening web of labor law
// the retailer cannot afford to breach.
//
// The operating reality the pack encodes: most retail workforce operations sit
// between two failure modes at once. They over-spend — hours allocated on a
// flat template or last year's actuals rather than a true demand forecast, so
// a site is over-staffed in a quiet interval and short at the peak, and
// premium overtime backfills the gap the plan created. AND they under-comply
// and under-engage — schedules published too late to meet predictability law,
// missed meal and rest breaks, unmanaged overtime, and a volatile, unfair
// schedule that itself drives the absenteeism and turnover that make the next
// schedule even harder to staff. The two reinforce each other: a chronically
// short-staffed, badly scheduled site is exactly the site that churns its
// people and breaches the rules. The AI archetypes are the recurring bets
// against that reality: AI labor demand forecasting, optimized schedule
// generation, intraday flexing and reforecasting, labor-compliance and
// wage-and-hour monitoring, attrition and absenteeism prediction, and a
// conversational workforce assistant for managers and associates.
//
// The companion retail packs decide the demand the workforce serves and the
// store and DC operations it runs; this function decides whether the right
// number of the right people are in the right place at the right cost, legally
// and sustainably. Its sister function store-operations consumes the schedule
// this function produces; workforce & labor owns the labor model itself.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const workforceLaborPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'workforce_labor',
  functionLabel: 'Workforce & labor management',
  summary:
    'Workforce and labor management is the function that plans, schedules, ' +
    'deploys, and governs the retailer’s hourly and salaried workforce ' +
    'across stores, distribution centres, and fulfilment operations. It ' +
    'owns the labor model — the labor standards and budgets, the ' +
    'demand-driven forecast of how many hours a site needs, the schedule ' +
    'that places those hours against people, the time-and-attendance ' +
    'record, and the wage-and-hour, predictable-scheduling, and safety ' +
    'compliance that bounds it. It is judged on a triple bind: labor is the ' +
    'largest controllable cost line the retailer carries, coverage gaps ' +
    'directly destroy sales and service, and every scheduling decision is ' +
    'governed by a thickening web of labor law. It fails in two coupled ' +
    'ways at once — it over-spends, allocating hours on a flat template so ' +
    'premium overtime backfills the gaps the plan created, and it ' +
    'under-complies and under-engages, publishing schedules too late, ' +
    'missing breaks, and running a volatile, unfair schedule that itself ' +
    'drives the turnover that makes the next schedule harder to staff.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'labor_cost_pct_of_sales',
      name: 'Labor cost as a percent of sales',
      definition:
        'Total workforce cost — wages, premium pay, and benefits load for ' +
        'store, distribution-centre, and fulfilment roles — expressed as a ' +
        'percentage of net sales over the period.',
      unit: '% of net sales',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 8,
        high: 20,
        basis:
          'Labor intensity is structural by format and channel — ' +
          'service-heavy specialty runs high, low-service discount runs ' +
          'lower. A planning range, not a target — too low starves ' +
          'coverage, too high erodes margin.',
        label: 'planning-range',
      },
      dataSource:
        'The payroll and workforce-management systems for total labor ' +
        'cost, reconciled against net sales from the finance and POS ' +
        'systems.',
      whyItMatters:
        'It is the headline cost-discipline metric of the function — ' +
        'labor is the largest controllable line in the operating P&L, and ' +
        'it must be read as a balance, because cutting it below the band ' +
        'starves the coverage that drives sales and service.',
    },
    {
      key: 'labor_forecast_accuracy',
      name: 'Labor demand-forecast accuracy',
      definition:
        'How closely the forecast labor requirement — driven hours by ' +
        'site and interval — matches the labor demand actually realised, ' +
        'measured as one less the absolute forecast error.',
      unit: '% accuracy (1 − absolute forecast error)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 92,
        basis:
          'Labor-forecast accuracy depends on the demand signal driving ' +
          'it and the interval granularity; the band spans a coarse ' +
          'template to a sharp interval-level forecast. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, comparing forecast driven hours ' +
        'against the realised labor requirement by site and interval.',
      whyItMatters:
        'Every schedule rests on the labor forecast — forecast error caps ' +
        'how well coverage can be matched to demand, so this metric sets ' +
        'the ceiling on the over-spend and under-coverage the function ' +
        'can avoid.',
    },
    {
      key: 'schedule_effectiveness',
      name: 'Schedule effectiveness',
      definition:
        'How well the published schedule places hours against the ' +
        'forecast demand curve — the share of scheduled hours that fall ' +
        'in the intervals demand actually needs them, rather than idle or ' +
        'short.',
      unit: '% of scheduled hours matched to demand intervals',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 90,
        basis:
          'Schedule effectiveness depends on how directly the schedule is ' +
          'built from the forecast and how constrained availability is; ' +
          'the band spans a template schedule to a demand-fitted one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, comparing the shape of the ' +
        'published schedule against the forecast demand curve by interval.',
      whyItMatters:
        'A good forecast is wasted if the schedule does not follow it — ' +
        'schedule effectiveness is the read on whether the planned hours ' +
        'actually land where the demand is, and it is where over-spend ' +
        'and coverage gaps are designed in.',
    },
    {
      key: 'overtime_rate',
      name: 'Overtime rate',
      definition:
        'The share of total worked hours paid at a premium overtime rate ' +
        '— hours beyond the regular-time threshold across store, DC, and ' +
        'fulfilment roles.',
      unit: '% of worked hours paid at overtime premium',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 10,
        basis:
          'Overtime depends on forecast accuracy, absence rates, and how ' +
          'tightly base staffing is set; the band spans a well-planned ' +
          'operation to one backfilling chronic gaps. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The payroll and time-and-attendance systems, identifying hours ' +
        'paid at the overtime premium rate.',
      whyItMatters:
        'Overtime is the most expensive labor a retailer buys and is ' +
        'usually a symptom — a high rate signals the plan is wrong, ' +
        'absence is unmanaged, or base staffing is too thin, and it is ' +
        'pure premium cost the function exists to control.',
    },
    {
      key: 'schedule_adherence',
      name: 'Schedule adherence',
      definition:
        'The share of scheduled hours actually worked as planned — ' +
        'neither lost to no-shows and unplanned absence nor inflated by ' +
        'unscheduled or early and late clock activity.',
      unit: '% of scheduled hours worked as planned',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 96,
        basis:
          'Adherence depends on absence rates, clock-in discipline, and ' +
          'how late the schedule is published; the band spans a volatile ' +
          'operation to a stable one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, comparing actual clocked hours ' +
        'against the published schedule.',
      whyItMatters:
        'A schedule only delivers coverage and cost if it is the schedule ' +
        'that is actually worked — poor adherence means the optimised ' +
        'plan is not the plan the site runs, so both coverage and labor ' +
        'cost drift from intent.',
    },
    {
      key: 'absenteeism_rate',
      name: 'Absenteeism rate',
      definition:
        'The share of scheduled shifts lost to unplanned absence — ' +
        'no-shows, call-outs, and last-minute drops — over the period.',
      unit: '% of scheduled shifts lost to unplanned absence',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 12,
        basis:
          'Absenteeism depends on engagement, schedule fairness, and the ' +
          'work environment; the band spans an engaged, stable workforce ' +
          'to a strained one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, tracking scheduled shifts not ' +
        'worked due to unplanned absence.',
      whyItMatters:
        'Unplanned absence tears holes in coverage at the worst moment ' +
        'and forces expensive overtime backfill — it is both a cost ' +
        'driver and a leading signal of disengagement that precedes ' +
        'turnover.',
    },
    {
      key: 'voluntary_turnover_rate',
      name: 'Voluntary turnover rate',
      definition:
        'The share of the workforce who leave voluntarily over a rolling ' +
        'annualised period — resignations as a share of average ' +
        'headcount, for hourly store, DC, and fulfilment roles.',
      unit: '% annualised voluntary turnover',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 30,
        high: 100,
        basis:
          'Hourly retail turnover runs structurally high and varies ' +
          'sharply by role, market, and schedule quality; the band spans ' +
          'a stable operation to a high-churn one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The HR information system, tracking voluntary departures ' +
        'against average headcount by role and site.',
      whyItMatters:
        'Turnover is a large, often-hidden labor cost — recruiting, ' +
        'onboarding, and ramping a replacement is expensive and a new ' +
        'hire is less productive, so turnover both raises cost and ' +
        'depresses execution and service.',
    },
    {
      key: 'time_to_fill',
      name: 'Time to fill an open role',
      definition:
        'The average elapsed time from a role being approved as open to ' +
        'a hired candidate starting work — the speed at which the ' +
        'function replaces lost capacity.',
      unit: 'days from requisition to start',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 45,
        basis:
          'Time to fill depends on role type, labor-market tightness, and ' +
          'the hiring process; the band spans a fast, streamlined hourly ' +
          'hire to a slow one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The applicant-tracking and HR systems, measuring elapsed time ' +
        'from requisition open to candidate start.',
      whyItMatters:
        'In a high-turnover workforce the operation is only ever as ' +
        'staffed as its hiring speed allows — a slow time to fill leaves ' +
        'sites chronically short, forcing overtime and degrading the ' +
        'coverage every other metric depends on.',
    },
    {
      key: 'labor_compliance_exception_rate',
      name: 'Labor-compliance exception rate',
      definition:
        'The rate of detected wage-and-hour and scheduling-law exceptions ' +
        '— missed or late meal and rest breaks, predictability-pay ' +
        'triggers, minor-hours breaches, off-the-clock work — per worked ' +
        'shifts.',
      unit: 'compliance exceptions per 1,000 worked shifts',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 30,
        basis:
          'The exception rate depends on the strength of compliance ' +
          'controls and the complexity of the jurisdictions operated in; ' +
          'the band spans a tightly governed operation to a loosely ' +
          'controlled one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management and time-and-attendance systems, ' +
        'flagging shifts against the configured wage-and-hour and ' +
        'scheduling rules.',
      whyItMatters:
        'Each exception is a direct legal and financial exposure — ' +
        'penalty pay, litigation, and regulatory risk — and the rate is ' +
        'the read on whether the labor model operates inside the law it ' +
        'is bound by.',
    },
    {
      key: 'schedule_publish_lead_time',
      name: 'Schedule publish lead time',
      definition:
        'The average advance notice with which the final schedule is ' +
        'published to associates before the first shift it covers — the ' +
        'predictability the workforce is given.',
      unit: 'days of advance notice before the schedule starts',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 7,
        high: 21,
        basis:
          'Publish lead time depends on planning maturity and the ' +
          'predictable-scheduling laws in force; the band spans a ' +
          'last-minute operation to one well clear of advance-notice ' +
          'requirements. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, measuring the gap between ' +
        'schedule publication and the schedule’s first shift.',
      whyItMatters:
        'Advance notice is both a legal requirement under ' +
        'predictable-scheduling law and a core driver of workforce ' +
        'stability — a late schedule triggers predictability pay and ' +
        'drives the absence and turnover that destabilise coverage.',
    },
    {
      key: 'units_per_labor_hour',
      name: 'Units per labor hour',
      definition:
        'The operational throughput produced per worked labor hour — ' +
        'units processed, picked, or transacted — the productivity read ' +
        'on how effectively labor hours convert into output.',
      unit: 'units of output per worked labor hour',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 150,
        basis:
          'Units per labor hour is entirely structural by operation type ' +
          '— a DC pick line, a store checkout, a fulfilment pack station ' +
          'differ enormously; the planning value is set within the ' +
          'retailer’s own operation. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The operational systems — warehouse-management, POS, or ' +
        'fulfilment — for output, joined to worked hours from the ' +
        'workforce-management system.',
      whyItMatters:
        'It is the productivity scorecard of the labor model — it joins ' +
        'output to the hours spent producing it, exposing whether labor ' +
        'standards are realistic and where productivity is being lost.',
    },
    {
      key: 'engagement_index',
      name: 'Workforce engagement index',
      definition:
        'A composite index of workforce engagement and sentiment from the ' +
        'employee-listening programme — pulse-survey and feedback signals ' +
        'scored on a normalised scale.',
      unit: 'engagement index (0–100 normalised scale)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 80,
        basis:
          'The engagement index varies by survey instrument, role, and ' +
          'operating environment; the band spans a strained workforce to ' +
          'an engaged one on a normalised scale. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The employee-listening / engagement-survey platform, scored by ' +
        'role, site, and tenure cohort.',
      whyItMatters:
        'Engagement is the leading indicator of absenteeism and turnover ' +
        '— a falling index, especially among newer associates, predicts ' +
        'the attrition and coverage instability that surface later in the ' +
        'cost and execution numbers.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'template_labor_allocation',
      name: 'Template labor allocation against uneven demand',
      description:
        'Labor hours and budgets are allocated to a fixed template or ' +
        'last year’s actuals rather than to a true demand forecast. Sites ' +
        'are over-staffed in quiet intervals and short at the peak, so ' +
        'the operation pays for idle hours and is uncovered exactly when ' +
        'sales and service are at stake.',
      detectionSignal:
        'Labor-forecast accuracy is low or unmeasured; the schedule shape ' +
        'barely changes week to week; labor cost percent and coverage ' +
        'swing widely across sites and intervals.',
      diagnosticQuestion:
        'Is labor allocated from a true demand forecast at interval ' +
        'level, or from a fixed template — and how far does coverage ' +
        'track the actual demand curve?',
    },
    {
      key: 'overtime_backfill_spiral',
      name: 'Premium-overtime backfill spiral',
      description:
        'When the plan is wrong or absence tears a hole, the site ' +
        'backfills with premium overtime. The overtime cost is treated as ' +
        'a fact of life rather than a symptom, so the underlying forecast ' +
        'error and absence go unaddressed and the expensive backfill ' +
        'recurs every week.',
      detectionSignal:
        'Overtime rate is high or rising; overtime concentrates in the ' +
        'same sites and intervals; no one traces overtime back to the ' +
        'forecast or absence cause behind it.',
      diagnosticQuestion:
        'Is premium overtime tracked to its root cause — forecast error, ' +
        'absence, thin base staffing — or absorbed as an unavoidable ' +
        'recurring cost?',
    },
    {
      key: 'late_volatile_schedules',
      name: 'Late, volatile, and unfair schedules',
      description:
        'Schedules are published late, change frequently, and vary ' +
        'unpredictably week to week. Associates cannot plan their lives, ' +
        'predictability-pay penalties trigger, and the schedule volatility ' +
        'itself becomes a leading cause of the absence and turnover that ' +
        'destabilise the next schedule.',
      detectionSignal:
        'Schedule publish lead time is short; schedules change after ' +
        'publication; predictability-pay triggers are frequent; ' +
        'associates cite schedule unpredictability in exit and ' +
        'engagement data.',
      diagnosticQuestion:
        'How much advance notice and week-to-week stability does the ' +
        'schedule give associates, and is its volatility feeding the ' +
        'absence and turnover it then has to staff around?',
    },
    {
      key: 'compliance_blind_spots',
      name: 'Wage-and-hour and scheduling compliance blind spots',
      description:
        'Missed meal and rest breaks, predictability-pay triggers, ' +
        'minor-hours breaches, and off-the-clock work are detected late ' +
        'or only after a claim, not prevented at scheduling and clock ' +
        'time. The patchwork of state and local labor law outpaces the ' +
        'controls configured to enforce it.',
      detectionSignal:
        'The labor-compliance exception rate is high or unmeasured; ' +
        'compliance is checked by audit after the fact; penalty pay and ' +
        'wage-and-hour claims recur.',
      diagnosticQuestion:
        'Are wage-and-hour and scheduling-law rules enforced ' +
        'preventively at scheduling and clock time, or discovered ' +
        'after the breach has already happened?',
    },
    {
      key: 'turnover_treated_as_inevitable',
      name: 'Turnover treated as inevitable, not managed',
      description:
        'High hourly turnover is accepted as an unavoidable feature of ' +
        'retail rather than treated as a managed cost driver. Its causes ' +
        '— schedule quality, early-tenure experience, manager behaviour — ' +
        'go undiagnosed, and the function staffs around the churn instead ' +
        'of reducing it.',
      detectionSignal:
        'Voluntary turnover is high and stable; turnover drivers are not ' +
        'analysed; there is no early flight-risk signal; the hiring ' +
        'engine simply runs to replace constant losses.',
      diagnosticQuestion:
        'Is turnover diagnosed to its drivers and managed as a cost ' +
        'lever, or accepted as inevitable and absorbed through constant ' +
        'rehiring?',
    },
    {
      key: 'reactive_intraday_management',
      name: 'Reactive intraday management',
      description:
        'Once the schedule is published it is treated as fixed. When ' +
        'demand, absence, or a disruption deviates from plan during the ' +
        'day, there is no fast reforecast and no easy way to flex hours, ' +
        'so the site runs over- or under-covered until the shift ends.',
      detectionSignal:
        'There is no intraday reforecast; same-day coverage gaps are ' +
        'common; managers manage deviations by phone and guesswork; ' +
        'voluntary-time-off and call-in offers are manual and slow.',
      diagnosticQuestion:
        'Can the operation reforecast and flex labor intraday when ' +
        'demand or absence deviates from plan, or is the published ' +
        'schedule simply run as-is?',
    },
    {
      key: 'manager_scheduling_drag',
      name: 'Manager scheduling and administrative drag',
      description:
        'Site and department managers spend a large share of their time ' +
        'building, fixing, and reworking schedules by hand and processing ' +
        'time, swap, and absence exceptions. The most experienced people ' +
        'are pulled off the floor and the operation into spreadsheet ' +
        'labor administration.',
      detectionSignal:
        'Managers report many hours a week on scheduling; scheduling is ' +
        'manual and tool-light; swap, availability, and absence handling ' +
        'are slow and exception-heavy.',
      diagnosticQuestion:
        'How much manager time is consumed by manual scheduling and ' +
        'labor administration, and what would moving that time back to ' +
        'the floor be worth?',
    },
    {
      key: 'rigid_inflexible_workforce',
      name: 'Rigid workforce with no flexing capability',
      description:
        'The workforce is locked to single roles and single sites with ' +
        'no cross-training, no shared labor pool, and no associate-facing ' +
        'self-service for swaps and open shifts. The operation cannot ' +
        'move labor to where demand is, so it over-hires to cover every ' +
        'site’s peak independently.',
      detectionSignal:
        'Associates are single-role and single-site; there is no shared ' +
        'or flexible labor pool; open-shift and swap tools are absent; ' +
        'each site staffs its own peak in isolation.',
      diagnosticQuestion:
        'How flexibly can labor move across roles, sites, and shifts to ' +
        'follow demand, and does the workforce have the cross-training ' +
        'and self-service tools to do it?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_labor_demand_forecasting',
      name: 'AI labor demand forecasting',
      valueMechanism:
        'A model forecasts the labor requirement — driven hours by site, ' +
        'role, and interval — from the underlying demand signal: sales ' +
        'and traffic, order and unit volume, the promotion calendar, ' +
        'weather, and seasonality, translated through the labor ' +
        'standards. Value comes from replacing the flat template with a ' +
        'true interval-level demand forecast, so the schedule that is ' +
        'built on it places hours where they are actually needed rather ' +
        'than where last year happened to put them.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical sales, traffic, order, and unit-volume data by ' +
          'interval',
        'Promotion, marketing, and event calendars',
        'Labor standards translating demand drivers into hours',
        'Weather, seasonality, and local-event data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model produces the labor forecast; workforce-planning and ' +
          'operations leaders own the forecast assumptions and the ' +
          'labor-standards inputs.',
        'A forecast trained on a history of under-staffed, over-spent ' +
          'operation learns those distortions as normal — the signal must ' +
          'be corrected for them.',
        'New sites, remodels, and demand-pattern breaks carry wide ' +
          'uncertainty and must be presented as ranges, not point ' +
          'forecasts.',
      ],
      metricsMoved: [
        'labor_forecast_accuracy',
        'labor_cost_pct_of_sales',
        'overtime_rate',
        'units_per_labor_hour',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'optimized_schedule_generation',
      name: 'Optimized schedule generation',
      valueMechanism:
        'An optimiser builds the schedule that fits the labor-demand ' +
        'forecast to people — matching hours to the demand curve while ' +
        'respecting labor law, availability, skills, fairness, and the ' +
        'budget, and publishing it with the advance notice ' +
        'predictability law requires. Value comes from lifting schedule ' +
        'effectiveness and cutting overtime on the cost side, and from ' +
        'producing stable, fair, legally-compliant, well-noticed ' +
        'schedules that themselves reduce absence and turnover.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'The labor-demand forecast by site, role, and interval',
        'Associate availability, skills, and contractual hours',
        'Labor-law, predictable-scheduling, and fairness constraints',
        'The labor budget and pay-rate data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The optimiser proposes the schedule; the site manager reviews ' +
          'and owns the published schedule and any override.',
        'Predictable-scheduling and wage-and-hour law — advance notice, ' +
          'minimum hours, rest between shifts — are hard constraints, ' +
          'never cost trade-offs the optimiser can relax.',
        'Optimisation must not produce schedules that are technically ' +
          'legal but unfair or unsustainable — fairness and stability are ' +
          'objectives, not afterthoughts.',
      ],
      metricsMoved: [
        'schedule_effectiveness',
        'overtime_rate',
        'schedule_publish_lead_time',
        'labor_cost_pct_of_sales',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'intraday_flexing_reforecasting',
      name: 'Intraday flexing and reforecasting',
      valueMechanism:
        'An agent monitors actual demand, output, and attendance against ' +
        'plan through the day, reforecasts the remaining shifts, and ' +
        'surfaces proportionate flexing actions — offering voluntary time ' +
        'off when over-covered, open shifts and call-ins when short, ' +
        'redeploying cross-trained labor — for the manager to approve. ' +
        'Value comes from closing the gap between the published plan and ' +
        'the day as it actually unfolds, cutting both idle cost and ' +
        'coverage gaps.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Real-time demand, output, and traffic signal against plan',
        'Live time-and-attendance and clock data',
        'Associate availability, opt-in flexing preferences, and skills',
        'Labor-law and overtime constraints for any flex action',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent reforecasts and proposes flex actions; the site ' +
          'manager owns every call to send people home or call them in.',
        'Flexing must respect labor law, minimum-hours commitments, and ' +
          'predictability-pay rules — a same-day cut or add can itself ' +
          'trigger a penalty.',
        'Flexing must be fair and consensual — voluntary-time-off and ' +
          'extra-shift offers cannot be allowed to fall repeatedly on the ' +
          'same associates.',
      ],
      metricsMoved: [
        'schedule_effectiveness',
        'overtime_rate',
        'schedule_adherence',
        'units_per_labor_hour',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'labor_compliance_monitoring',
      name: 'Labor-compliance and wage-and-hour monitoring',
      valueMechanism:
        'A model checks every schedule and every worked shift against the ' +
        'jurisdiction’s wage-and-hour and predictable-scheduling rules — ' +
        'meal and rest breaks, advance notice, minor-hours limits, ' +
        'rest-between-shift, off-the-clock risk — and flags exceptions ' +
        'preventively at scheduling time and in real time at the clock. ' +
        'Value comes from converting compliance from an after-the-fact ' +
        'audit into a prevention control, cutting penalty pay, ' +
        'litigation exposure, and regulatory risk.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The configured wage-and-hour and scheduling-law rule set by ' +
          'jurisdiction',
        'Schedule and time-and-attendance data',
        'Break, clock-event, and shift-change records',
        'Minor, contractual, and collective-bargaining constraints',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags compliance exceptions and risk; HR, legal, and ' +
          'site managers own the resolution and any pay or policy action.',
        'The rule set must be kept current with a fast-changing patchwork ' +
          'of state and local law — a stale rule set gives false ' +
          'assurance.',
        'A flag is a risk signal to investigate, never an automatic ' +
          'finding — wage-and-hour determinations require human and legal ' +
          'judgement.',
      ],
      metricsMoved: [
        'labor_compliance_exception_rate',
        'schedule_publish_lead_time',
        'overtime_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'attrition_absenteeism_prediction',
      name: 'Attrition and absenteeism prediction',
      valueMechanism:
        'A model scores associates and sites for flight risk and ' +
        'absence risk — from tenure, schedule quality and volatility, ' +
        'hours patterns, engagement signal, and early-tenure experience ' +
        '— and surfaces the at-risk groups early enough for a proactive, ' +
        'proportionate retention or coverage action. Value comes from ' +
        'reducing voluntary turnover and unplanned absence by treating ' +
        'them as predictable and manageable rather than inevitable.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Tenure, role, hours, and schedule-volatility history per ' +
          'associate',
        'Absence and turnover history by site and cohort',
        'Engagement and employee-listening signal',
        'Early-tenure onboarding and experience data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces risk; HR and site managers own the retention ' +
          'action and the conversation — a score prompts support, not a ' +
          'performance judgement.',
        'A flight-risk or absence score must never be used adversely ' +
          'against an associate and must be governed for privacy and ' +
          'employment-law fairness.',
        'The model must be checked for bias so it does not systematically ' +
          'mis-score any protected group, and predictions must respect ' +
          'employee-data consent.',
      ],
      metricsMoved: [
        'voluntary_turnover_rate',
        'absenteeism_rate',
        'engagement_index',
        'time_to_fill',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'workforce_assistant',
      name: 'Conversational workforce assistant',
      valueMechanism:
        'A conversational assistant serves managers and associates on the ' +
        'questions and transactions that consume manager time and ' +
        'frustrate the workforce — explaining schedule and pay, handling ' +
        'shift swaps and open-shift claims, answering policy and ' +
        'time-off questions, and surfacing labor-law guidance — grounded ' +
        'in the retailer’s own workforce data and policy. Value comes ' +
        'from cutting manager scheduling-administration drag and ' +
        'improving the associate experience that drives engagement.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Schedule, time-and-attendance, and pay data per associate',
        'Workforce policy, time-off, and leave rules',
        'Open-shift, swap, and availability data',
        'Labor-law and scheduling-policy guidance content',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The assistant informs and handles bounded transactions; ' +
          'managers own approvals and any decision with pay or compliance ' +
          'consequences.',
        'Answers on pay, schedule, and policy must be grounded in current ' +
          'data — a confidently wrong pay or time-off answer damages ' +
          'trust and can create a compliance exposure.',
        'It must respect employee-data privacy and access controls and ' +
          'escalate anything outside its grounded scope rather than ' +
          'improvise.',
      ],
      metricsMoved: [
        'schedule_adherence',
        'absenteeism_rate',
        'engagement_index',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'demand_driven_labor_planning',
      name: 'Demand-driven labor-planning pattern',
      description:
        'A pattern that drives the labor model from a true interval-level ' +
        'demand forecast translated through labor standards — replacing ' +
        'flat templates and last-year actuals with driven hours by site, ' +
        'role, and interval that the schedule is then built to fit.',
      boundary:
        'It forecasts the labor requirement and the budgeted hours; ' +
        'workforce-planning leaders own the labor standards and ' +
        'assumptions. It does not itself build the schedule or set the ' +
        'budget envelope.',
      humanAccountabilityPoint:
        'The director of workforce planning accountable for the labor ' +
        'model, the standards, and the labor budget.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'constraint_aware_scheduling_engine',
      name: 'Constraint-aware scheduling engine',
      description:
        'A pattern that generates the published schedule from the labor ' +
        'forecast inside a hard frame of wage-and-hour law, ' +
        'predictable-scheduling rules, availability, skills, fairness, ' +
        'and budget — optimising coverage and cost while guaranteeing ' +
        'legality, advance notice, and schedule stability.',
      boundary:
        'It proposes the schedule within the constraint frame; the site ' +
        'manager reviews and owns the published schedule. It cannot relax ' +
        'a labor-law or contractual constraint to chase cost.',
      humanAccountabilityPoint:
        'The site manager accountable for the published schedule, ' +
        'coverage, and the site labor budget.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'intraday_labor_control_loop',
      name: 'Intraday labor-control loop',
      description:
        'A pattern that closes the loop between the published schedule ' +
        'and the day as it unfolds — reforecasting against actual demand, ' +
        'output, and attendance and surfacing proportionate, ' +
        'consent-based flexing actions so labor tracks demand in real ' +
        'time rather than being run as a fixed plan.',
      boundary:
        'It reforecasts and proposes flex actions; the site manager owns ' +
        'every decision to flex labor up or down. It respects ' +
        'predictability-pay and minimum-hours rules and offers flex ' +
        'fairly.',
      humanAccountabilityPoint:
        'The site manager accountable for intraday coverage and the ' +
        'fairness of flexing decisions.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'preventive_compliance_layer',
      name: 'Preventive labor-compliance layer',
      description:
        'A pattern that enforces the jurisdiction’s wage-and-hour and ' +
        'scheduling rules preventively — checking the schedule before ' +
        'publication and the shift in real time at the clock — so ' +
        'breaches are stopped before they happen rather than found in a ' +
        'later audit or a claim.',
      boundary:
        'It detects and flags compliance risk against a maintained rule ' +
        'set; HR, legal, and managers own resolution and any wage-and-' +
        'hour determination. A flag is a risk signal, never a finding.',
      humanAccountabilityPoint:
        'The HR / labor-compliance leader accountable for wage-and-hour ' +
        'and scheduling-law compliance and the currency of the rule set.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'retention_early_warning_pattern',
      name: 'Workforce retention early-warning pattern',
      description:
        'A pattern that scores associates and sites continuously for ' +
        'flight and absence risk, weights the risk by the cost and ' +
        'coverage impact of the loss, and feeds a prioritised, ' +
        'proportionate retention and support queue to HR and site ' +
        'managers — so turnover and absence are managed proactively, not ' +
        'absorbed.',
      boundary:
        'It scores risk and prioritises support; HR and managers own the ' +
        'retention action and the associate conversation. A score is ' +
        'never used adversely against an associate.',
      humanAccountabilityPoint:
        'The HR / people-operations leader accountable for workforce ' +
        'retention, engagement, and the cost of turnover.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Workforce-and-labor value is realised in three connected ways and ' +
      'a forecast must keep them distinct. First, labor-cost efficiency: ' +
      'demand-driven forecasting and optimised scheduling place the same ' +
      'or fewer hours where demand actually needs them and cut the ' +
      'premium overtime that backfills a bad plan — a recurring saving ' +
      'that shows as a labor cost held to its band, not a blunt headcount ' +
      'cut. Second, coverage-protected sales and throughput: matching ' +
      'labor to the demand curve and flexing it intraday closes the ' +
      'coverage gaps that silently lose sales, service, and processing ' +
      'output — recurring revenue and productivity at no added cost. ' +
      'Third, retention and compliance value: stable, fair, well-noticed ' +
      'schedules and proactive retention cut the large hidden cost of ' +
      'turnover and absence, while preventive compliance cuts penalty ' +
      'pay and litigation exposure. The dominant constraint is that the ' +
      'value is realised across thousands of associates and hundreds of ' +
      'sites, each with its own jurisdiction’s labor law and its own ' +
      'managers — so the gain is paced by adoption, by the accuracy of ' +
      'the demand signal, and by how hard labor law bounds the schedule, ' +
      'and a forecast must be read against the retailer’s real planning ' +
      'maturity, not a model-perfect site. All three levers are recurring ' +
      'once realised, but they compound only at the speed the fleet ' +
      'actually changes how it plans and schedules labor.',
    dominantHaircutFactors: [
      {
        factor: 'Demand-signal and forecast accuracy',
        rationale:
          'The entire labor model rests on a demand forecast translated ' +
          'through labor standards. Where the demand signal is coarse, ' +
          'the standards are stale, or demand is volatile, forecast error ' +
          'caps how much of the modelled scheduling and overtime gain is ' +
          'actually reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.4,
          basis:
            'The share of a modelled labor-optimisation gain not ' +
            'reachable because of demand-signal and labor-forecast error; ' +
            'a planning range widening with demand volatility.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Labor-law and contractual constraints',
        rationale:
          'Predictable-scheduling and fair-workweek law, wage-and-hour ' +
          'rules, minimum-hours commitments, and collective-bargaining ' +
          'terms bound how freely the schedule can be optimised. Those ' +
          'constraints are non-negotiable and structurally limit how far ' +
          'the modelled labor gain can move.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'The share of a modelled scheduling-optimisation gain bounded ' +
            'by predictable-scheduling law and contractual constraints; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Manager and associate adoption',
        rationale:
          'Every labor gain depends on managers actually scheduling to ' +
          'the optimised plan, flexing intraday, and acting on the ' +
          'retention and compliance signals — across hundreds of sites ' +
          'with their own habits. Inconsistent adoption is a primary ' +
          'reason the modelled gain is only partly realised.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'The share of a modelled workforce gain not realised because ' +
            'of uneven manager and associate adoption across the fleet; ' +
            'a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Labor-data and systems readiness',
        rationale:
          'Forecasting, scheduling, compliance, and retention models ' +
          'depend on clean labor standards, accurate time-and-attendance ' +
          'data, a current rule set, and integrated workforce systems. ' +
          'Missing standards, dirty clock data, and fragmented systems ' +
          'cap how much of the modelled value can be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from stale labor standards, inaccurate ' +
            'time-and-attendance data, and fragmented workforce systems; ' +
            'a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Labor-cost efficiency improvement',
        range: {
          low: 2,
          high: 8,
          basis:
            'Relative reduction in labor cost as a share of sales from ' +
            'demand-driven forecasting and optimised scheduling; a ' +
            'planning range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in labor cost as a share of net ' +
          'sales at a held service and coverage level.',
      },
      {
        lever: 'Premium-overtime reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in premium-overtime hours from a more ' +
            'accurate forecast, better base staffing, and intraday ' +
            'flexing; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in hours paid at the overtime ' +
          'premium rate.',
      },
      {
        lever: 'Voluntary-turnover reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in voluntary turnover from stable, fair, ' +
            'well-noticed schedules and proactive retention; a planning ' +
            'range — recovered turnover cost, not a headline figure.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in annualised voluntary turnover.',
      },
      {
        lever: 'Compliance-exposure reduction',
        range: {
          low: 20,
          high: 60,
          basis:
            'Relative reduction in wage-and-hour and scheduling-law ' +
            'exceptions and the penalty pay and litigation exposure ' +
            'behind them, from preventive compliance; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in labor-compliance exceptions per ' +
          'worked shifts and the associated penalty exposure.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot site group ' +
      '(forecast accuracy, schedule effectiveness, overtime); 9–18 months ' +
      'to a settled fleet-wide result, because the labor-cost, retention, ' +
      'and compliance gains only prove out once optimised scheduling is ' +
      'adopted consistently across hundreds of sites and a full seasonal ' +
      'demand and turnover cycle has run.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Workforce-management (WFM) system',
        role:
          'The system of record for labor — the demand forecast, the ' +
          'schedule, time and attendance, and labor-budget tracking. The ' +
          'backbone of every forecasting, scheduling, adherence, and ' +
          'labor-cost metric.',
        examples: [
          'UKG / Kronos workforce management',
          'Legion WFM',
          'Blue Yonder workforce management',
          'Reflexis (Zebra) workforce management',
        ],
      },
      {
        name: 'HR information system (HRIS) and core HR',
        role:
          'Holds the employee record — role, status, tenure, pay, and ' +
          'turnover — the source of headcount, turnover, and the ' +
          'workforce data the retention models run on.',
        examples: [
          'Workday HCM',
          'SAP SuccessFactors',
          'Oracle HCM Cloud',
          'UKG Pro',
        ],
      },
      {
        name: 'Time-and-attendance and payroll system',
        role:
          'Captures clock events, worked hours, breaks, and premium pay ' +
          'and runs payroll — the source of adherence, overtime, ' +
          'compliance-exception, and labor-cost data.',
        examples: [
          'UKG time and attendance',
          'ADP payroll',
          'WFM-integrated time clocks',
          'enterprise payroll platforms',
        ],
      },
      {
        name: 'Applicant-tracking and recruiting system',
        role:
          'Runs hourly hiring — requisitions, sourcing, screening, and ' +
          'onboarding — the source of time-to-fill and the hiring-engine ' +
          'data the turnover model depends on.',
        examples: [
          'Workday Recruiting',
          'iCIMS',
          'Phenom / hourly hiring platforms',
          'Paradox conversational hiring',
        ],
      },
      {
        name: 'Operational demand and employee-listening systems',
        role:
          'The POS, traffic, warehouse-management, and fulfilment systems ' +
          'that supply the demand signal, plus the engagement-survey ' +
          'platform that supplies the workforce-sentiment signal.',
        examples: [
          'POS and traffic-counting systems',
          'warehouse- and fulfilment-management systems',
          'employee-engagement and listening platforms',
        ],
      },
    ],
    roles: [
      {
        title: 'EVP Stores / SVP Operations',
        accountability:
          'Owns the total labor outcome across the fleet — the labor ' +
          'budget, coverage, and the productivity and service it ' +
          'delivers.',
      },
      {
        title: 'Director of workforce planning / labor management',
        accountability:
          'Owns the labor model — the labor standards, the demand ' +
          'forecast, the scheduling strategy, and the labor budget across ' +
          'sites.',
      },
      {
        title: 'Workforce-management / scheduling-systems lead',
        accountability:
          'Owns the WFM system, the forecasting and scheduling ' +
          'configuration, and the labor-analytics and reporting layer.',
      },
      {
        title: 'Site / store / DC manager',
        accountability:
          'Owns the site labor outcome — the published schedule, ' +
          'intraday coverage, adherence, and the site labor budget.',
      },
      {
        title: 'HR / people-operations leader',
        accountability:
          'Owns hiring, onboarding, retention, engagement, and the ' +
          'workforce-experience outcome across the fleet.',
      },
      {
        title: 'Labor-compliance / employment-counsel lead',
        accountability:
          'Owns wage-and-hour and predictable-scheduling compliance, the ' +
          'rule set, and the labor-law risk posture.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Wage-and-hour and overtime law',
        relevance:
          'Governs minimum wage, overtime eligibility and rate, ' +
          'meal-and-rest-break entitlement, and worked-hours recording — ' +
          'the core legal frame around the schedule, time and ' +
          'attendance, and premium pay.',
      },
      {
        name: 'Predictable-scheduling and fair-workweek laws',
        relevance:
          'Set advance-notice, predictability-pay, minimum-hours, ' +
          'rest-between-shift, and access-to-hours requirements for ' +
          'hourly retail staff — hard constraints any scheduling ' +
          'optimisation must respect.',
      },
      {
        name: 'Child-labor and minor-employment rules',
        relevance:
          'Restrict the hours, times, and tasks for employees under ' +
          'defined ages — a hard scheduling constraint that varies by ' +
          'jurisdiction and must be enforced at schedule-build time.',
      },
      {
        name: 'Collective-bargaining agreements',
        relevance:
          'Where the workforce is represented, set scheduling, ' +
          'seniority, hours-assignment, and overtime rules — ' +
          'non-negotiable constraints the labor model operates inside.',
      },
      {
        name: 'Workplace health, safety, and employee-data rules',
        relevance:
          'Occupational-safety and rest requirements set a floor on ' +
          'coverage and fatigue, and employee-data-privacy law governs ' +
          'how workforce data is used in the retention and absence ' +
          'models.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Labor standard',
        definition:
          'The defined relationship between a demand driver and the ' +
          'labor hours it requires — the engine that translates a demand ' +
          'forecast into a labor requirement.',
      },
      {
        term: 'Driven hours',
        definition:
          'The labor hours a site needs in an interval as computed from ' +
          'the demand forecast and the labor standards — the demand-side ' +
          'input to the schedule.',
      },
      {
        term: 'Schedule adherence',
        definition:
          'The degree to which actual worked hours match the published ' +
          'schedule — neither lost to absence nor inflated by ' +
          'unscheduled time.',
      },
      {
        term: 'Predictability pay',
        definition:
          'Compensation a predictable-scheduling law requires when an ' +
          'employer changes a schedule without the mandated advance ' +
          'notice.',
      },
      {
        term: 'Intraday management',
        definition:
          'The discipline of reforecasting and flexing labor during the ' +
          'trading day as demand, output, and attendance deviate from the ' +
          'published plan.',
      },
      {
        term: 'Shrinkage (workforce)',
        definition:
          'The share of paid time not available for the core ' +
          'demand-driven work — breaks, training, meetings, and ' +
          'non-productive time — that capacity planning must allow for.',
      },
      {
        term: 'Voluntary time off (VTO)',
        definition:
          'An offer to over-covered associates to leave early or take ' +
          'an unpaid day, used to flex labor down when demand falls below ' +
          'plan.',
      },
      {
        term: 'Span of hours',
        definition:
          'The total elapsed time from an employee’s first to last ' +
          'shift activity in a day — constrained by rest and ' +
          'wage-and-hour rules.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Workforce-and-Labor Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the workforce operation is over-spending labor, ' +
        'leaving coverage gaps, breaching compliance, and losing people — ' +
        'template allocation, overtime backfill, late schedules, turnover ' +
        '— with baseline evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Workforce and operating context',
          guidance:
            'Name the workforce in scope — sites, formats, store / DC / ' +
            'fulfilment mix, hourly and salaried headcount and turnover, ' +
            'the labor operating model, and the jurisdictions and ' +
            'collective-bargaining footprint. State which WFM, HRIS, ' +
            'time-and-attendance, and recruiting systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — labor cost percent, forecast accuracy, ' +
            'schedule effectiveness, overtime, adherence, absenteeism, ' +
            'voluntary turnover, time to fill, compliance exception rate, ' +
            'publish lead time, units per labor hour, engagement index. ' +
            'For any metric not recorded, name it as a precise seed gap ' +
            'with its expected data source.',
        },
        {
          heading: 'Labor-planning and scheduling diagnostic',
          guidance:
            'Analyse how labor is forecast and scheduled, how far the ' +
            'schedule tracks the demand curve, where hours are idle and ' +
            'where sites are short, and how overtime, adherence, and ' +
            'labor cost compare to the bands.',
        },
        {
          heading: 'Compliance and workforce-stability diagnostic',
          guidance:
            'Analyse wage-and-hour and predictable-scheduling exceptions ' +
            'and how they are detected, schedule publish lead time and ' +
            'volatility, and the absenteeism, turnover, and engagement ' +
            'picture across sites and tenure cohorts.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — template allocation, ' +
            'overtime backfill spiral, late and volatile schedules, ' +
            'compliance blind spots, turnover treated as inevitable, ' +
            'reactive intraday management, manager scheduling drag, a ' +
            'rigid inflexible workforce — and state which are present, ' +
            'with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — labor-cost efficiency, overtime ' +
            'reduction, turnover reduction, compliance-exposure ' +
            'reduction — explicitly haircut by demand-signal accuracy, ' +
            'labor-law constraints, manager adoption, and labor-data ' +
            'readiness. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — a ' +
            'measured forecast accuracy, a true compliance-exception rate ' +
            '— is a named ask, not a vague unknown.',
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
      label: 'Workforce-and-Labor Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a workforce-and-' +
        'labor AI Move on this fleet — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring labor-cost efficiency, coverage-protected sales ' +
            'and throughput, and retention and compliance value, the ' +
            'time-to-value band, and the go / hold recommendation in one ' +
            'read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — labor cost percent, overtime rate, forecast ' +
            'accuracy, voluntary turnover, compliance exception rate. ' +
            'Where a baseline is a seed gap (a measured forecast accuracy ' +
            'is a common one), say so and state what closing it requires ' +
            'before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — demand-signal ' +
            'accuracy, labor-law constraints, manager adoption, labor-' +
            'data readiness — explicitly and show the haircut math. Keep ' +
            'recurring cost, coverage, and retention-and-compliance gains ' +
            'distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the WFM, HRIS, time-and-' +
            'attendance, recruiting, and operational-demand systems, the ' +
            'labor-standards and rule-set work, and the operating-model ' +
            'change — manager and associate workflow.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker demand-forecast ' +
            'accuracy, tighter labor-law constraints, and slower manager ' +
            'adoption. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example labor standards too stale to forecast ' +
            'from, or time-and-attendance data too unreliable to model — ' +
            'and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged turnover, engagement, and compliance-exposure ' +
            'metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Workforce-and-Labor Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'workforce-and-labor AI capability, grounded in the function ' +
        'reference patterns, the labor-law frame, and the fairness and ' +
        'employee-data discipline.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — demand-driven labor planning, constraint-aware ' +
            'scheduling engine, intraday labor-control loop, preventive ' +
            'compliance layer, retention early-warning — and state which ' +
            'apply and how they connect.',
        },
        {
          heading: 'Data, standards, and integration architecture',
          guidance:
            'Specify the WFM, HRIS, time-and-attendance, recruiting, and ' +
            'operational-demand integrations, the labor-standards model, ' +
            'the jurisdiction rule set, data freshness, and the ' +
            'time-and-attendance-accuracy discipline the use cases depend ' +
            'on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and how ' +
            'a manager reviews and overrides. Define the labor-law and ' +
            'fairness constraints as hard, non-negotiable boundaries the ' +
            'optimiser cannot relax.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how workforce-planning, manager, HR, and compliance ' +
            'workflows change, how the scheduling and intraday cadence is ' +
            'reshaped, how managers are freed from manual scheduling, and ' +
            'who owns each change.',
        },
        {
          heading: 'Responsible-AI, labor-law, and fairness controls',
          guidance:
            'State the wage-and-hour and predictable-scheduling ' +
            'constraints as hard rules, the fairness controls on ' +
            'scheduling and flexing, the bias and adverse-use guardrails ' +
            'and employee-data privacy governance on the retention and ' +
            'absence models, and the regulatory frames (wage-and-hour ' +
            'law, predictable-scheduling law, minor-employment rules, ' +
            'collective-bargaining terms) that bound the design.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'workforce-systems stack, and the phased rollout by site ' +
            'group, format, and jurisdiction.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Workforce-and-Labor Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the workforce-and-labor AI ' +
        'capability so value reaches labor cost, coverage, retention, and ' +
        'compliance across the fleet, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and labor-standards ' +
            'validation, a pilot site group, manager and associate ' +
            'onboarding, scale across the fleet and jurisdictions — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, labor-standards and rule-set readiness, ' +
            'manager and associate adoption, HR and compliance process, ' +
            'Tower measurement.',
        },
        {
          heading: 'Manager and associate adoption approach',
          guidance:
            'Define the change runway for managers and associates — ' +
            'training, the shift in the scheduling and intraday ' +
            'workflow, the move of manager time off scheduling ' +
            'administration, and the associate self-service experience — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Labor-law and compliance-readiness plan',
          guidance:
            'Define how the jurisdiction rule set is built, validated, ' +
            'and kept current, how preventive compliance is verified ' +
            'before go-live, and how labor-law changes are absorbed — ' +
            'the discipline that keeps the labor model legal.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged turnover, engagement, and ' +
            'compliance-exposure metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — demand-forecast error, labor-law ' +
            'friction and rule-set drift, uneven manager adoption, ' +
            'labor-data quality, fairness and employee-data exposure — ' +
            'with the escalation owner and the trigger for each.',
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
      claim: 'Labor cost and how hours are spent against demand',
      authoritativeSource:
        'The workforce-management and payroll systems for scheduled, ' +
        'worked, and overtime hours, joined to the demand signal and net ' +
        'sales by site and interval.',
      whatGoodEvidenceLooksLike:
        'Labor cost percent and overtime rate measured by site and ' +
        'interval against the demand curve, exposing where hours are ' +
        'idle, where coverage is short, and where premium overtime ' +
        'backfills a planning gap.',
      weakEvidenceToReject:
        'A blended fleet-wide labor-cost percentage with no interval ' +
        'breakdown, or an overtime figure with no link to the forecast ' +
        'error or absence driving it.',
    },
    {
      claim: 'How accurately labor demand is forecast',
      authoritativeSource:
        'The workforce-management system, comparing forecast driven ' +
        'hours against the realised labor requirement by site and ' +
        'interval.',
      whatGoodEvidenceLooksLike:
        'A measured labor-forecast accuracy at interval level, with the ' +
        'error decomposed by site and demand pattern so the structural ' +
        'forecast gaps are visible.',
      weakEvidenceToReject:
        'An assumed forecast accuracy, a fleet-wide average that hides ' +
        'site-level error, or a schedule built from a template with no ' +
        'forecast to measure against.',
    },
    {
      claim: 'Whether the labor model operates inside the law',
      authoritativeSource:
        'The workforce-management and time-and-attendance systems ' +
        'checked against the maintained jurisdiction wage-and-hour and ' +
        'predictable-scheduling rule set.',
      whatGoodEvidenceLooksLike:
        'A labor-compliance exception rate measured against a current, ' +
        'jurisdiction-specific rule set, with break, advance-notice, and ' +
        'minor-hours exceptions detected preventively and traced.',
      weakEvidenceToReject:
        'An assertion of compliance with no exception measurement, or a ' +
        'rule set known to be out of date with the current state and ' +
        'local law.',
    },
    {
      claim: 'Workforce turnover, absence, and the cost behind them',
      authoritativeSource:
        'The HR information and workforce-management systems for ' +
        'turnover, absence, and tenure, joined to the cost of hiring, ' +
        'onboarding, and overtime backfill.',
      whatGoodEvidenceLooksLike:
        'A voluntary-turnover and absenteeism rate by site, role, and ' +
        'tenure cohort, with the fully-loaded cost of replacement and ' +
        'backfill quantified, not just a headcount count.',
      weakEvidenceToReject:
        'A single fleet-wide turnover number with no cost attached, or ' +
        'an absence figure with no view of the overtime and coverage ' +
        'cost it forces.',
    },
    {
      claim: 'The forecast value of a workforce-and-labor AI Move',
      authoritativeSource:
        'The value model — labor-cost-efficiency, coverage-protected, ' +
        'and retention-and-compliance components, each haircut by its ' +
        'dominant factors — read against the fleet’s planning maturity ' +
        'and labor-law footprint.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring cost, coverage, and ' +
        'retention-and-compliance gains kept distinct, and every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor labor-savings claim ' +
        'taken at face value, or a forecast that ignores the demand-' +
        'accuracy and labor-law haircuts.',
    },
  ],
};
