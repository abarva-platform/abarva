// Domain Function Pack — Financial services · Regulatory compliance.
//
// Function key: `regulatory_compliance`.
//
// This pack covers the second line of defence's compliance function at a
// regulated depository or diversified financial institution: the discipline
// that translates an ever-changing body of law and regulation into operating
// requirements, proves those requirements are working, and answers to the
// examiners and enforcement bodies that supervise the institution. It runs
// five tightly-coupled disciplines usually managed as one programme:
// regulatory change management (tracking, interpreting, and operationalising
// new and amended rules), compliance monitoring and testing (independently
// proving controls work), exam and regulator management (preparing for,
// hosting, and responding to supervisory examinations), consumer-protection
// compliance (fair-lending, UDAAP, and the Reg DD / Reg E / Reg Z disclosure
// regime), and regulatory reporting (the call reports and supervisory
// filings the institution submits).
//
// The operating reality the pack encodes: compliance failure is rarely a
// single missed rule — it is a regulatory change that was tracked but never
// operationalised, a control that was assumed effective but never tested, an
// issue that was found but allowed to age past its remediation date, or a
// disclosure defect that scaled across millions of accounts before anyone
// caught it. The AI archetypes are the recurring bets against exactly that
// reality.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const regulatoryCompliancePack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'regulatory_compliance',
  functionLabel: 'Regulatory compliance',
  summary:
    'Regulatory compliance is the second-line function that converts a ' +
    'constantly-changing body of law and regulation into operating ' +
    'requirements, independently proves those requirements work, and answers ' +
    'to the examiners who supervise the institution. It runs regulatory ' +
    'change management — tracking, interpreting, and operationalising new and ' +
    'amended rules — compliance monitoring and testing — independently ' +
    'evidencing that first-line controls are designed and operating ' +
    'effectively — exam and regulator management, consumer-protection ' +
    'compliance across the fair-lending, UDAAP, and disclosure regime, and ' +
    'regulatory reporting. Its economics are the cost of running the ' +
    'programme, the consent-order, civil-money-penalty, and customer-' +
    'remediation exposure of getting it wrong, and the franchise cost of a ' +
    'supervisory rating downgrade. Compliance failure is rarely one missed ' +
    'rule — it is a tracked change never operationalised, a control assumed ' +
    'effective but never tested, an issue found but left to age, or a ' +
    'disclosure defect that scaled across millions of accounts — so the ' +
    'function is judged on how reliably the whole chain holds, not on any ' +
    'single rule.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'regulatory_change_cycle_time',
      name: 'Regulatory-change operationalisation cycle time',
      definition:
        'The elapsed time from a new or amended regulation being published ' +
        'or finalised to the institution having interpreted it, mapped it to ' +
        'affected products and controls, and implemented the required policy, ' +
        'process, and disclosure changes by the regulatory effective date.',
      unit: 'days from publication to operationalised change',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 45,
        high: 180,
        basis:
          'Change cycle time varies with rule complexity, the number of ' +
          'products and systems touched, and the maturity of the regulatory-' +
          'change inventory; the band spans a well-instrumented programme to ' +
          'a manual one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The regulatory-change-management module of the GRC platform, time-' +
        'stamped from rule intake to change closure.',
      whyItMatters:
        'A rule that is tracked but not operationalised by its effective ' +
        'date is a live violation; cycle time is the leading indicator of ' +
        'whether the institution is keeping pace with the regulatory agenda.',
    },
    {
      key: 'regulatory_change_implementation_rate',
      name: 'On-time regulatory-change implementation rate',
      definition:
        'The share of applicable regulatory changes fully operationalised — ' +
        'policy, process, control, system, and disclosure updates complete ' +
        'and validated — on or before the regulatory effective date.',
      unit: '% of applicable changes implemented on time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 99,
        basis:
          'On-time implementation depends on intake completeness and the ' +
          'capacity of first-line change owners; the band spans a programme ' +
          'with slippage to a tightly-run one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The regulatory-change-management workflow, comparing implementation ' +
        'completion dates against regulatory effective dates.',
      whyItMatters:
        'Every change missed past its effective date is a self-identified ' +
        'or examiner-identified violation; the on-time rate is the headline ' +
        'measure of change-management reliability.',
    },
    {
      key: 'monitoring_testing_coverage',
      name: 'Compliance monitoring and testing coverage',
      definition:
        'The share of the institution’s in-scope regulatory ' +
        'obligations and key compliance controls covered by an independent ' +
        'monitoring or testing activity within the defined coverage cycle, ' +
        'risk-weighted toward higher-inherent-risk obligations.',
      unit: '% of risk-weighted in-scope obligations tested per cycle',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 98,
        basis:
          'Coverage depends on testing capacity, the size of the obligation ' +
          'inventory, and risk-prioritisation discipline; the band spans a ' +
          'partial programme to near-complete risk-based coverage. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The compliance monitoring-and-testing plan in the GRC platform, ' +
        'reconciled against the regulatory-obligation inventory.',
      whyItMatters:
        'An obligation that is never tested is a control assumed effective ' +
        'on faith; coverage is the measure of how much of the compliance ' +
        'estate the institution can actually evidence as working.',
    },
    {
      key: 'control_testing_pass_rate',
      name: 'Compliance control-testing pass rate',
      definition:
        'The share of compliance controls tested in the period that pass — ' +
        'evidenced as both designed appropriately and operating effectively ' +
        '— without an exception or a control deficiency raised.',
      unit: '% of tested controls passing',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 97,
        basis:
          'Pass rates vary with control maturity and the rigour of the test ' +
          'procedures; the band spans a control environment with material ' +
          'weakness to a strong one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Monitoring-and-testing results in the GRC platform, tracked by ' +
        'control and by regulatory domain.',
      whyItMatters:
        'The pass rate is the truest read on whether first-line controls ' +
        'actually work; a falling rate signals control erosion before it ' +
        'becomes an examiner finding or a consumer-harm event.',
    },
    {
      key: 'open_issue_aging',
      name: 'Open compliance-issue aging',
      definition:
        'The share of open compliance issues — whether self-identified, ' +
        'audit-raised, or examiner-raised — that are past their committed ' +
        'remediation target date, weighted toward higher-severity issues.',
      unit: '% of open issues past target remediation date',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Issue aging depends on remediation capacity and the discipline ' +
          'of validation; the band spans a current issue book to a backlogged ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The issue-and-action-tracking module of the GRC platform, by issue ' +
        'severity and source.',
      whyItMatters:
        'An aged issue is a known weakness the institution committed to fix ' +
        'and did not; examiners read aged-issue inventories as a direct ' +
        'signal of governance and management-attention failure.',
    },
    {
      key: 'repeat_issue_rate',
      name: 'Repeat-issue rate',
      definition:
        'The share of newly raised compliance issues that recur a previously ' +
        'remediated and closed issue — the same root cause resurfacing after ' +
        'a corrective action was validated as complete.',
      unit: '% of new issues that are repeats',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Repeat rates depend on whether remediation addresses root cause ' +
          'or symptom; the band spans durable remediation to recurring ' +
          'cosmetic fixes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Issue-tracking history in the GRC platform, matching new issues ' +
        'against closed-issue root causes.',
      whyItMatters:
        'A repeat issue tells an examiner that remediation is cosmetic, not ' +
        'root-cause; repeat findings escalate supervisory concern faster ' +
        'than any single new issue.',
    },
    {
      key: 'exam_finding_volume',
      name: 'Examination finding volume and severity',
      definition:
        'The count of findings — Matters Requiring Attention (MRAs), ' +
        'Matters Requiring Immediate Attention (MRIAs), and supervisory ' +
        'recommendations — raised by examiners across a supervisory cycle, ' +
        'weighted by severity.',
      unit: 'severity-weighted findings per supervisory cycle',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0,
        high: 12,
        basis:
          'Finding volume varies with institution size, business mix, and ' +
          'supervisory intensity; the band spans a clean cycle to a heavily-' +
          'criticised one. A planning range, never a target.',
        label: 'planning-range',
      },
      dataSource:
        'The supervisory correspondence and exam-finding register, ' +
        'reconciled against examiner reports of examination.',
      whyItMatters:
        'Finding volume and severity drive the institution’s ' +
        'supervisory rating, the intensity of future supervision, and — at ' +
        'the extreme — enforcement actions and growth restrictions.',
    },
    {
      key: 'self_identified_issue_share',
      name: 'Self-identified issue share',
      definition:
        'The share of all compliance issues that the institution’s own ' +
        'monitoring, testing, and first line identified, as opposed to ' +
        'issues first surfaced by internal audit or by an examiner.',
      unit: '% of issues self-identified',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 90,
        basis:
          'Self-identification share depends on monitoring coverage and a ' +
          'culture that surfaces problems; the band spans a reactive ' +
          'programme to a self-aware one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Issue-source classification in the GRC platform, tagged by the ' +
        'function that first raised each issue.',
      whyItMatters:
        'Examiners credit a programme that finds its own problems; a low ' +
        'self-identification share signals the institution is being ' +
        'supervised rather than managing itself.',
    },
    {
      key: 'consumer_complaint_rate',
      name: 'Consumer-complaint rate',
      definition:
        'The volume of consumer complaints — through the institution’s ' +
        'own channels and through the CFPB complaint database — per 100,000 ' +
        'active accounts or customers, with the regulatory-themed subset ' +
        'tracked separately.',
      unit: 'complaints per 100,000 accounts',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 60,
        basis:
          'Complaint rates vary widely by product mix and customer base; the ' +
          'band spans a low-friction portfolio to a complaint-prone one. A ' +
          'planning range — read against the specific product mix.',
        label: 'planning-range',
      },
      dataSource:
        'The complaint-management system reconciled against the CFPB ' +
        'consumer-complaint database.',
      whyItMatters:
        'Complaint patterns are the earliest external signal of a ' +
        'consumer-protection problem; examiners and the CFPB treat a ' +
        'complaint spike as a leading indicator of UDAAP or fair-lending ' +
        'harm.',
    },
    {
      key: 'regulatory_report_accuracy',
      name: 'Regulatory-report accuracy and timeliness',
      definition:
        'The share of regulatory filings — Call Reports, HMDA submissions, ' +
        'and other supervisory reports — submitted on time and free of ' +
        'material errors requiring an amended refiling or examiner ' +
        'correction.',
      unit: '% of filings on time and materially accurate',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 90,
        high: 100,
        basis:
          'Reporting accuracy depends on data lineage and reconciliation ' +
          'discipline; the band spans a programme with recurring refilings ' +
          'to a clean one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The regulatory-reporting system and the refiling/correction log ' +
        'reconciled against submission deadlines.',
      whyItMatters:
        'Inaccurate or late regulatory reporting is itself a violation and ' +
        'erodes examiner trust in every other number the institution ' +
        'submits; it is a direct integrity signal.',
    },
    {
      key: 'fair_lending_disparity_index',
      name: 'Fair-lending statistical-disparity index',
      definition:
        'The size and statistical significance of disparities in lending ' +
        'outcomes — approval rates, pricing, and underwriting exceptions — ' +
        'between prohibited-basis groups and a control group, after ' +
        'controlling for legitimate credit factors.',
      unit: 'standardised disparity (odds ratio or basis-point gap)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0,
        high: 1,
        basis:
          'A normalised index where a value near zero indicates no ' +
          'statistically significant unexplained disparity and a value near ' +
          'one indicates a material one; the in-range goal is no significant ' +
          'unexplained disparity. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Fair-lending regression and matched-pair analysis on loan-' +
        'application register and HMDA data.',
      whyItMatters:
        'An unexplained lending disparity is the core fair-lending exposure ' +
        '— it can trigger a referral to the DOJ, redress to harmed ' +
        'borrowers, and reputational damage that dwarfs the direct penalty.',
    },
    {
      key: 'compliance_cost_ratio',
      name: 'Compliance operating-cost ratio',
      definition:
        'The fully-loaded cost of running the compliance programme — second-' +
        'line staffing, technology, testing, and external advisory — as a ' +
        'share of total operating expense.',
      unit: '% of total operating expense',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 10,
        basis:
          'Compliance cost ratios vary with institution size, business ' +
          'complexity, and any remediation overhang; the band spans an ' +
          'efficient programme to one carrying heavy manual or remediation ' +
          'load. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Compliance-function financials reconciled against the ' +
        'institution’s total operating-expense base.',
      whyItMatters:
        'The cost ratio is the efficiency read on the function; manual ' +
        'change tracking, manual testing, and remediation rework are what ' +
        'drive it up, so it is the metric automation directly attacks.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'change_tracked_not_operationalised',
      name: 'Regulatory change tracked but not operationalised',
      description:
        'A new or amended rule is captured in the regulatory-change ' +
        'inventory, but the chain from interpretation to mapped products, ' +
        'changed processes, updated disclosures, and validated controls ' +
        'breaks down — so the rule is "tracked" while the institution ' +
        'remains non-compliant in practice.',
      detectionSignal:
        'Regulatory-change cycle time is long and variable; the on-time ' +
        'implementation rate trails the volume of intake, and changes sit in ' +
        'an "assessed" status without closure.',
      diagnosticQuestion:
        'For the rules that changed this year, can the institution evidence ' +
        'the operational change — process, disclosure, and control — was ' +
        'live by the effective date, or only that the rule was logged?',
    },
    {
      key: 'untested_control_assumption',
      name: 'Untested control assumed effective',
      description:
        'Large parts of the obligation inventory are never independently ' +
        'monitored or tested, so controls are presumed effective on the ' +
        'first line’s word. The first time a weakness surfaces is when ' +
        'an examiner or a consumer-harm event finds it.',
      detectionSignal:
        'Monitoring-and-testing coverage is well below the obligation ' +
        'inventory; whole regulatory domains have no test in the current ' +
        'cycle and the self-identified issue share is low.',
      diagnosticQuestion:
        'What share of in-scope regulatory obligations has been ' +
        'independently tested in the current cycle, and which high-risk ' +
        'domains are running on unverified first-line assurance?',
    },
    {
      key: 'issue_remediation_drift',
      name: 'Issue-remediation drift and cosmetic fixes',
      description:
        'Issues are raised but remediation slips past target dates, and when ' +
        'actions do close they address the symptom rather than the root ' +
        'cause — so the same weakness recurs and the open-issue book ages.',
      detectionSignal:
        'Open-issue aging is high, the repeat-issue rate is material, and ' +
        'remediation closures are not independently validated before the ' +
        'issue is marked closed.',
      diagnosticQuestion:
        'How much of the open-issue book is past its committed date, and ' +
        'what share of new issues are recurrences of issues already closed ' +
        'as remediated?',
    },
    {
      key: 'reactive_exam_management',
      name: 'Reactive, fire-drill exam management',
      description:
        'Each examination becomes a scramble — assembling document requests ' +
        'from scratch, reconstructing the evidence trail, and discovering ' +
        'control gaps in real time in front of the examiner — rather than a ' +
        'controlled hand-over from a continuously-ready programme.',
      detectionSignal:
        'Exam preparation consumes large bursts of staff effort, examiner ' +
        'document requests are answered late, and findings frequently cover ' +
        'issues the institution had not itself identified.',
      diagnosticQuestion:
        'Could the institution respond to a major examiner document request ' +
        'tomorrow from a maintained evidence library, or would it require a ' +
        'multi-week reconstruction effort?',
    },
    {
      key: 'consumer_harm_scaled_silently',
      name: 'Consumer-protection defect scaled silently',
      description:
        'A disclosure error, a fee-calculation defect, or an unfair practice ' +
        'is embedded in a product or a system and replicates across every ' +
        'account and statement until a complaint pattern, an audit, or an ' +
        'examiner finally surfaces it — by which point the remediation ' +
        'population is enormous.',
      detectionSignal:
        'Consumer complaints cluster around a product, fee, or disclosure; ' +
        'UDAAP and disclosure controls are point-in-time rather than ' +
        'continuous, and large customer-remediation populations appear ' +
        'after the fact.',
      diagnosticQuestion:
        'How quickly would the institution detect a disclosure or fee ' +
        'defect that is replicating across accounts, and how is that risk ' +
        'monitored between examinations?',
    },
    {
      key: 'fair_lending_blind_spot',
      name: 'Fair-lending and UDAAP analytical blind spot',
      description:
        'Fair-lending and UDAAP risk is assessed infrequently and narrowly ' +
        '— a periodic regression rather than continuous monitoring — so ' +
        'disparities in approval, pricing, exceptions, or marketing ' +
        'targeting build for months before they are measured.',
      detectionSignal:
        'Fair-lending analysis is annual or ad hoc, underwriting-exception ' +
        'and pricing-discretion data are not monitored for disparity, and ' +
        'the institution cannot show a current disparity read.',
      diagnosticQuestion:
        'How frequently and how completely are lending outcomes tested for ' +
        'prohibited-basis disparity, and would a developing disparity be ' +
        'caught within a quarter or within a year?',
    },
    {
      key: 'reporting_data_lineage_gap',
      name: 'Regulatory-reporting data-lineage gap',
      description:
        'Regulatory filings are assembled through manual extracts, ' +
        'spreadsheets, and adjustments, with no clear lineage from the ' +
        'source system to the reported figure — so errors are hard to catch ' +
        'before submission and impossible to explain to an examiner after.',
      detectionSignal:
        'Filings require amended refilings or examiner corrections; report ' +
        'preparation is heavily manual and the institution cannot trace a ' +
        'reported number back to its source.',
      diagnosticQuestion:
        'For a given line of a regulatory report, can the institution trace ' +
        'the figure to its source system with a documented, repeatable ' +
        'lineage, or is it reconstructed by hand each cycle?',
    },
    {
      key: 'regulatory_obligation_inventory_drift',
      name: 'Regulatory-obligation inventory drift',
      description:
        'The library that maps every applicable regulation to the products, ' +
        'processes, and controls it governs is incomplete or stale — so ' +
        'change management, testing, and risk assessment all run off a ' +
        'picture of the regulatory estate that no longer matches reality.',
      detectionSignal:
        'New products launch without a mapped obligation set; testing scope ' +
        'and the change inventory disagree, and no single owner maintains ' +
        'the regulatory-obligation library.',
      diagnosticQuestion:
        'Is there a single, maintained, owned inventory mapping every ' +
        'applicable regulation to the products and controls it governs, and ' +
        'when was it last reconciled to the actual business?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'regulatory_change_intelligence',
      name: 'Regulatory-change intelligence and impact triage',
      valueMechanism:
        'An agent ingests regulatory publications, rule amendments, ' +
        'guidance, and enforcement actions, classifies each for ' +
        'applicability to the institution, drafts a plain-language impact ' +
        'summary, and maps the change to the affected products, processes, ' +
        'and controls in the obligation inventory. Value comes from ' +
        'collapsing regulatory-change cycle time and lifting the on-time ' +
        'implementation rate by turning a manual reading-and-routing task ' +
        'into an instrumented triage.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Regulatory-publication and enforcement-action feeds (Federal ' +
          'Register, agency bulletins, CFPB actions)',
        'The institution’s regulatory-obligation inventory mapping ' +
          'rules to products and controls',
        'The product, process, and control catalogue from the GRC platform',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent classifies and drafts; a compliance officer confirms ' +
          'applicability and owns the legal interpretation — the agent does ' +
          'not render a final regulatory determination.',
        'Applicability misses are the core risk — the model must be tuned ' +
          'toward recall, surfacing borderline rules for human review rather ' +
          'than silently filtering them out.',
        'Every impact summary must cite the underlying regulatory text so a ' +
          'reviewer can verify it against the source, not the model.',
      ],
      metricsMoved: [
        'regulatory_change_cycle_time',
        'regulatory_change_implementation_rate',
        'compliance_cost_ratio',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'automated_compliance_testing',
      name: 'Automated compliance monitoring and testing',
      valueMechanism:
        'An agent runs compliance control tests against transaction, ' +
        'account, and disclosure data on a continuous or high-frequency ' +
        'basis — sampling, applying the test procedure, and flagging ' +
        'exceptions — instead of a periodic manual testing cycle. Value ' +
        'comes from extending monitoring-and-testing coverage across the ' +
        'obligation inventory and catching control failures while they are ' +
        'small.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Transaction, account, statement, and disclosure data from the ' +
          'core and product systems',
        'Codified compliance test procedures and pass/fail criteria',
        'The control-and-obligation inventory defining what must be tested',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent executes tests and flags exceptions; a compliance ' +
          'tester reviews exceptions, confirms control deficiencies, and ' +
          'owns the conclusion — the agent does not close a test as passed.',
        'A test procedure encoded incorrectly produces false assurance at ' +
          'scale; codified procedures must be independently reviewed and ' +
          'version-controlled.',
        'Continuous testing must not become a volume of unreviewed alerts — ' +
          'exception thresholds and triage need governance so genuine ' +
          'deficiencies are not lost in noise.',
      ],
      metricsMoved: [
        'monitoring_testing_coverage',
        'control_testing_pass_rate',
        'self_identified_issue_share',
        'compliance_cost_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'exam_readiness_assistant',
      name: 'Exam-readiness and regulator-response assistant',
      valueMechanism:
        'An agent maintains a continuously-current evidence library mapped ' +
        'to the supervisory expectations, assembles draft responses to ' +
        'examiner document and information requests by retrieving the ' +
        'relevant policies, test results, and issue records, and tracks ' +
        'commitment dates. Value comes from converting reactive exam ' +
        'fire-drills into a controlled hand-over and reducing examiner ' +
        'findings that trace to disorganised evidence rather than real ' +
        'control gaps.',
      adoptionProfile: 'early',
      dataDependencies: [
        'The policy, procedure, control, and test-result repository',
        'The issue-and-action register and prior supervisory correspondence',
        'The examiner document-request log and supervisory-expectation map',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent drafts and assembles; the compliance and legal teams ' +
          'review and approve every response before it reaches an examiner — ' +
          'no regulator-facing communication is sent autonomously.',
        'A response must never overstate the maturity of a control or omit a ' +
          'known weakness; completeness and candour with examiners are ' +
          'non-negotiable and a drafting error here is a credibility risk.',
        'Evidence retrieved must be the current version — a superseded ' +
          'policy presented as live is a material misrepresentation.',
      ],
      metricsMoved: [
        'exam_finding_volume',
        'open_issue_aging',
        'compliance_cost_ratio',
      ],
      relatedArchetypePlaybook: 'knowledge_assistant',
    },
    {
      key: 'consumer_complaint_intelligence',
      name: 'Consumer-complaint and UDAAP early-warning intelligence',
      valueMechanism:
        'A model reads complaint narratives from the institution’s ' +
        'channels and the CFPB database, classifies them by product, root ' +
        'cause, and regulatory theme, and detects emerging clusters that ' +
        'signal a disclosure defect, an unfair fee practice, or a UDAAP ' +
        'exposure. Value comes from catching a consumer-protection defect ' +
        'while the affected population is small, before it scales into a ' +
        'large remediation.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Complaint narratives from internal channels and the CFPB ' +
          'complaint database',
        'Product, fee, and disclosure metadata to attribute complaints to ' +
          'a source',
        'Historical complaint resolutions and prior remediation events',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model flags clusters and themes; a consumer-compliance officer ' +
          'investigates and owns the determination of whether a practice is ' +
          'unfair, deceptive, or abusive — that is a legal judgement.',
        'Complaint classification must not under-weight low-volume but ' +
          'severe themes; the model is tuned to surface emerging clusters, ' +
          'not only high-frequency ones.',
        'Complaint narratives contain sensitive customer data; access, ' +
          'retention, and use must respect privacy obligations.',
      ],
      metricsMoved: [
        'consumer_complaint_rate',
        'self_identified_issue_share',
        'repeat_issue_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'fair_lending_monitoring',
      name: 'Continuous fair-lending and pricing-disparity monitoring',
      valueMechanism:
        'A model runs fair-lending statistical analysis continuously rather ' +
        'than annually — testing approval rates, pricing, underwriting ' +
        'exceptions, and marketing reach for prohibited-basis disparity, ' +
        'controlling for legitimate credit factors. Value comes from ' +
        'detecting a developing disparity within a quarter instead of after ' +
        'a year of harm, shrinking both the redress population and the ' +
        'enforcement exposure.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Loan-application register, HMDA data, and underwriting-decision ' +
          'records',
        'Pricing, rate-sheet, and underwriting-exception data',
        'Legitimate credit-factor data needed to control the regression',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model measures and flags statistical disparity; fair-lending ' +
          'counsel and the compliance officer own the determination of ' +
          'whether a disparity reflects a legitimate factor or a violation.',
        'The model itself must be tested for proxy discrimination — a ' +
          'feature that stands in for a prohibited basis turns the monitor ' +
          'into a source of the very risk it is meant to catch.',
        'Statistical findings must be explainable and reproducible — a ' +
          'fair-lending conclusion that cannot be defended methodologically ' +
          'is unusable in a regulatory dialogue.',
      ],
      metricsMoved: [
        'fair_lending_disparity_index',
        'consumer_complaint_rate',
        'self_identified_issue_share',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'regulatory_reporting_automation',
      name: 'Regulatory-reporting assembly and validation automation',
      valueMechanism:
        'An agent assembles regulatory filings — Call Reports, HMDA ' +
        'submissions, and supervisory reports — directly from source ' +
        'systems with documented lineage, runs validation and reconciliation ' +
        'checks against prior filings and edit rules, and flags anomalies ' +
        'before submission. Value comes from lifting reporting accuracy and ' +
        'timeliness, eliminating amended refilings, and removing manual ' +
        'spreadsheet assembly.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Source-system general-ledger, loan, and deposit data with ' +
          'documented lineage',
        'Regulatory edit checks, validation rules, and report ' +
          'specifications',
        'Prior-period filings for trend and reconciliation validation',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent assembles and validates; a regulatory-reporting owner ' +
          'reviews, reconciles, and signs the filing — submission of a ' +
          'regulatory report remains a human-attested act.',
        'Data lineage must be auditable end-to-end — an examiner must be ' +
          'able to trace any reported figure to its source through the ' +
          'agent’s assembly logic.',
        'Validation rules must be kept current with changing report ' +
          'specifications, or the agent will validate against stale ' +
          'criteria and pass a defective filing.',
      ],
      metricsMoved: [
        'regulatory_report_accuracy',
        'compliance_cost_ratio',
        'open_issue_aging',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'instrumented_change_pipeline',
      name: 'Instrumented regulatory-change pipeline',
      description:
        'A pattern that runs regulatory change as an instrumented pipeline ' +
        '— automated intake and applicability triage, AI-drafted impact ' +
        'assessment, mapping to the obligation inventory, and tracked ' +
        'first-line implementation against the regulatory effective date — ' +
        'so a change moves from publication to operationalised control on a ' +
        'measured, owned path rather than in informal email chains.',
      boundary:
        'It ingests, triages, drafts, and tracks; a compliance officer owns ' +
        'the legal interpretation and the first line owns and executes the ' +
        'operational change. It does not itself amend a policy or a system.',
      humanAccountabilityPoint:
        'The Chief Compliance Officer accountable for regulatory-change ' +
        'management and on-time implementation.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'document_intelligence',
    },
    {
      key: 'continuous_control_assurance',
      name: 'Continuous control-assurance layer',
      description:
        'A pattern that shifts compliance monitoring and testing from a ' +
        'periodic manual cycle to continuous, data-driven control assurance ' +
        '— codified test procedures run at high frequency against ' +
        'transaction and disclosure data, with exceptions triaged into the ' +
        'issue register — so control failures are caught early and coverage ' +
        'extends across the obligation inventory.',
      boundary:
        'It executes tests and flags exceptions; a compliance tester ' +
        'confirms deficiencies and owns the testing conclusion, and the ' +
        'first line owns the controls themselves. It does not remediate a ' +
        'control.',
      humanAccountabilityPoint:
        'The Head of Compliance Monitoring and Testing accountable for ' +
        'coverage and the integrity of testing conclusions.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'continuous_exam_readiness',
      name: 'Continuous exam-readiness pattern',
      description:
        'A pattern that maintains a continuously-current, mapped evidence ' +
        'library — policies, control descriptions, test results, issue ' +
        'records — aligned to supervisory expectations, so an examination ' +
        'is a controlled hand-over from a ready state rather than a ' +
        'reconstruction fire-drill, and examiner document requests are ' +
        'answered from a maintained source.',
      boundary:
        'It maintains evidence and drafts responses; the compliance and ' +
        'legal teams review and approve every regulator-facing ' +
        'communication. It does not speak to an examiner autonomously.',
      humanAccountabilityPoint:
        'The Head of Regulatory Affairs / Exam Management accountable for ' +
        'the supervisory relationship and every examiner response.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'consumer_protection_early_warning',
      name: 'Consumer-protection early-warning pattern',
      description:
        'A pattern that fuses complaint intelligence, disclosure and fee ' +
        'monitoring, and continuous fair-lending analysis into a single ' +
        'early-warning layer for consumer harm — detecting a defect or a ' +
        'disparity while the affected population is small, before a ' +
        'complaint pattern or an examiner forces a large remediation.',
      boundary:
        'It detects and flags emerging consumer-harm signals; a consumer-' +
        'compliance officer and fair-lending counsel own the determination ' +
        'of harm and the remediation decision. It does not adjudicate a ' +
        'practice as unlawful.',
      humanAccountabilityPoint:
        'The Consumer-Compliance Officer accountable for fair-lending and ' +
        'UDAAP risk and consumer-harm remediation.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'lineage_governed_reporting',
      name: 'Lineage-governed regulatory-reporting pattern',
      description:
        'A pattern that assembles regulatory filings directly from source ' +
        'systems with documented, auditable lineage, applies regulatory ' +
        'edit and reconciliation checks before submission, and preserves a ' +
        'traceable record from source figure to reported line — replacing ' +
        'manual spreadsheet assembly with a governed, repeatable process.',
      boundary:
        'It assembles, validates, and traces; a regulatory-reporting owner ' +
        'reviews, reconciles, and attests the filing. It does not submit a ' +
        'report without human sign-off.',
      humanAccountabilityPoint:
        'The Regulatory-Reporting Controller accountable for the accuracy, ' +
        'timeliness, and lineage of every supervisory filing.',
      controlPosture: 'human-approval-required',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Regulatory-compliance value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, avoided loss: fewer and less ' +
      'severe examiner findings, fewer consumer-harm events, and faster ' +
      'detection of disparities and defects reduce the expected cost of ' +
      'civil money penalties, consent orders, and customer remediation — a ' +
      'risk-weighted, probabilistic value that must never be presented as a ' +
      'certain saving. Second, lower compliance cost: automating change ' +
      'tracking, control testing, reporting assembly, and exam-evidence ' +
      'preparation removes manual effort and remediation rework, lowering ' +
      'the cost ratio — a recurring, more reliably-modelled gain. Third, ' +
      'franchise and growth value: a strong supervisory standing avoids the ' +
      'rating downgrades, growth restrictions, and M&A constraints that a ' +
      'weak one imposes — the largest value but the hardest to attribute. ' +
      'The dominant constraint is that compliance value is contingent and ' +
      'probabilistic — the institution does not control whether or how hard ' +
      'it is examined — so the forecast must be expressed as expected-value ' +
      'ranges, not asserted savings, and read against the institution’s ' +
      'specific supervisory posture.',
    dominantHaircutFactors: [
      {
        factor: 'Probabilistic, contingent value',
        rationale:
          'The largest component — avoided penalties and remediation — only ' +
          'lands if an event would otherwise have occurred. Examination ' +
          'intensity and enforcement outcomes are outside the ' +
          'institution’s control, so a large share of modelled value is ' +
          'a probability-weighted expectation, not a bankable saving.',
        typicalHaircut: {
          low: 0.3,
          high: 0.6,
          basis:
            'Value erosion from the contingent, probabilistic nature of ' +
            'avoided regulatory loss; a planning range driven by the ' +
            'institution’s supervisory posture.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and obligation-inventory readiness',
        rationale:
          'Automated change mapping, testing, and reporting only work to ' +
          'the extent the regulatory-obligation inventory is complete and ' +
          'source data has clean lineage. A stale inventory or fragmented ' +
          'data caps how much of the modelled value is reachable.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Forecast erosion from an incomplete obligation inventory and ' +
            'weak data lineage; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Examiner and model-governance acceptance',
        rationale:
          'Examiners must be comfortable that AI-assisted testing, ' +
          'monitoring, and reporting are themselves well-governed. Until the ' +
          'model risk-management and validation posture is accepted, the ' +
          'institution must keep parallel manual assurance, capping the ' +
          'realisable cost saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.35,
          basis:
            'Forecast erosion from the need for parallel manual assurance ' +
            'until examiner and model-governance acceptance is established; ' +
            'a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Second-line independence and adoption',
        rationale:
          'Compliance assurance must remain independent and credible. If ' +
          'automation is bolted onto the old manual process rather than ' +
          'replacing it, or if testers do not trust and adopt the tooling, ' +
          'only a fraction of the modelled efficiency is realised.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial adoption and the need to ' +
            'preserve second-line independence; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Regulatory-change cycle-time compression',
        range: {
          low: 25,
          high: 55,
          basis:
            'Relative reduction in regulatory-change operationalisation ' +
            'cycle time from instrumented intake and AI-drafted impact ' +
            'assessment; a planning range spanning early and mature ' +
            'adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in days from rule publication to ' +
          'operationalised change.',
      },
      {
        lever: 'Compliance monitoring-and-testing coverage uplift',
        range: {
          low: 15,
          high: 40,
          basis:
            'Percentage-point uplift in risk-weighted obligation coverage ' +
            'from continuous automated testing; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point increase in risk-weighted in-scope obligation ' +
          'testing coverage.',
      },
      {
        lever: 'Compliance operating-cost reduction',
        range: {
          low: 12,
          high: 30,
          basis:
            'Relative reduction in compliance operating cost from ' +
            'automating change tracking, testing, reporting, and exam ' +
            'preparation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fully-loaded compliance operating ' +
          'cost.',
      },
      {
        lever: 'Expected avoided regulatory loss',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in the probability-weighted expected cost ' +
            'of findings, penalties, and consumer remediation from earlier ' +
            'detection and stronger control assurance; a planning range, a ' +
            'probabilistic expectation rather than a certain saving.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in probability-weighted expected ' +
          'regulatory-loss exposure.',
      },
    ],
    timeToValueBand:
      '3–6 months to first operational signal (change cycle time, testing ' +
      'coverage, complaint-detection lead time); 12–24 months to a settled ' +
      'result, because the avoided-loss and supervisory-standing components ' +
      'only prove out across a full examination and enforcement cycle.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Governance, risk & compliance (GRC) platform',
        role:
          'The system of record for the compliance programme — the ' +
          'regulatory-obligation inventory, the control library, ' +
          'monitoring-and-testing plans and results, and the issue-and-' +
          'action register.',
        examples: ['MetricStream', 'Archer', 'IBM OpenPages', 'Workiva'],
      },
      {
        name: 'Regulatory-change-management tooling',
        role:
          'Tracks regulatory publications and amendments, supports ' +
          'applicability assessment and impact analysis, and routes changes ' +
          'to first-line implementation owners.',
        examples: [
          'Thomson Reuters Regulatory Intelligence',
          'Wolters Kluwer OneSumX',
          'Ascent / RegTech change feeds',
        ],
      },
      {
        name: 'Complaint-management system',
        role:
          'Captures, categorises, routes, and resolves consumer complaints ' +
          'across channels and reconciles against the CFPB complaint ' +
          'database — a primary consumer-harm signal source.',
        examples: [
          'Salesforce-based complaint workflows',
          'Pegasystems complaint case management',
          'dedicated complaint-management modules',
        ],
      },
      {
        name: 'Regulatory-reporting system',
        role:
          'Assembles, validates, and submits supervisory filings — Call ' +
          'Reports, HMDA, and other regulatory reports — from general-' +
          'ledger and product-system data.',
        examples: [
          'Wolters Kluwer regulatory reporting',
          'Moody’s / FIS regulatory reporting suites',
          'Workiva regulatory filing',
        ],
      },
      {
        name: 'Loan-origination and core banking systems',
        role:
          'The first-line systems of record for lending and deposit ' +
          'activity — the source of the application, pricing, disclosure, ' +
          'and transaction data that compliance testing and fair-lending ' +
          'analysis depend on.',
        examples: [
          'nCino',
          'Encompass',
          'FIS / Fiserv / Jack Henry core platforms',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Compliance Officer (CCO)',
        accountability:
          'Owns the enterprise compliance programme — regulatory-change ' +
          'management, monitoring and testing, and the second line’s ' +
          'independent assurance over compliance risk.',
      },
      {
        title: 'Head of Compliance Monitoring and Testing',
        accountability:
          'Owns the independent monitoring-and-testing programme — coverage ' +
          'of the obligation inventory and the integrity of testing ' +
          'conclusions.',
      },
      {
        title: 'Head of Regulatory Affairs / Exam Management',
        accountability:
          'Owns the supervisory relationship — examination preparation and ' +
          'hosting, examiner communication, and finding response and ' +
          'commitment tracking.',
      },
      {
        title: 'Consumer-Compliance Officer / Fair-Lending Officer',
        accountability:
          'Owns consumer-protection compliance — fair lending, UDAAP, and ' +
          'the Reg DD / Reg E / Reg Z disclosure regime — and consumer-harm ' +
          'remediation.',
      },
      {
        title: 'Regulatory-Reporting Controller',
        accountability:
          'Owns the accuracy, timeliness, and data lineage of supervisory ' +
          'filings — Call Reports, HMDA submissions, and other regulatory ' +
          'reports.',
      },
      {
        title: 'First-line business compliance / control owner',
        accountability:
          'Owns the day-to-day execution of compliance controls within the ' +
          'business and the operational implementation of regulatory ' +
          'changes.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'The CFPB and the federal consumer-financial-protection regime',
        relevance:
          'The Consumer Financial Protection Bureau supervises and enforces ' +
          'consumer-protection law; its examinations, complaint database, ' +
          'and enforcement actions set the standard the consumer-compliance ' +
          'programme is judged against.',
      },
      {
        name: 'UDAAP — unfair, deceptive, or abusive acts or practices',
        relevance:
          'The Dodd-Frank UDAAP prohibition is the broad, principles-based ' +
          'consumer-protection standard; it makes complaint and product ' +
          'monitoring a frontline compliance obligation, not a courtesy.',
      },
      {
        name: 'Regulation DD, Regulation E, and Regulation Z',
        relevance:
          'The core deposit and credit disclosure regime — truth in ' +
          'savings, electronic fund transfers, and truth in lending — ' +
          'governs how products, fees, and rates must be disclosed and is a ' +
          'dense, defect-prone area of compliance testing.',
      },
      {
        name: 'Fair-lending law — ECOA, the Fair Housing Act, and HMDA',
        relevance:
          'The Equal Credit Opportunity Act and Fair Housing Act prohibit ' +
          'prohibited-basis discrimination in credit, and HMDA reporting ' +
          'makes lending outcomes transparent — together the frame for all ' +
          'fair-lending monitoring.',
      },
      {
        name: 'Prudential supervision and the examination framework',
        relevance:
          'The OCC, Federal Reserve, FDIC, and state regulators examine the ' +
          'institution and assign supervisory ratings; their findings — ' +
          'MRAs, MRIAs, and enforcement actions — are the direct ' +
          'consequence the exam-management discipline is built around.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Regulatory-obligation inventory',
        definition:
          'The maintained library mapping every applicable law and ' +
          'regulation to the products, processes, and controls it governs ' +
          '— the backbone of change management, testing, and risk ' +
          'assessment.',
      },
      {
        term: 'Matter Requiring Attention (MRA) / MRIA',
        definition:
          'A formal examiner finding requiring corrective action; an MRIA ' +
          '(Matter Requiring Immediate Attention) is the more severe class ' +
          'demanding urgent remediation.',
      },
      {
        term: 'Three lines of defence',
        definition:
          'The governance model — the first line owns and runs controls, ' +
          'the second line (compliance and risk) independently oversees ' +
          'them, and the third line (internal audit) independently assures ' +
          'both.',
      },
      {
        term: 'Monitoring and testing',
        definition:
          'The second line’s independent activities to evidence that ' +
          'compliance controls are designed appropriately and operating ' +
          'effectively — monitoring is ongoing, testing is point-in-time and ' +
          'evidence-based.',
      },
      {
        term: 'UDAAP',
        definition:
          'Unfair, deceptive, or abusive acts or practices — the broad ' +
          'Dodd-Frank consumer-protection standard prohibiting practices ' +
          'that harm consumers even where no specific rule is breached.',
      },
      {
        term: 'Consent order',
        definition:
          'A formal, public enforcement action in which an institution ' +
          'agrees to corrective measures, and often penalties and customer ' +
          'remediation, to resolve a regulator’s findings.',
      },
      {
        term: 'Consumer remediation',
        definition:
          'The process of identifying every customer harmed by a ' +
          'compliance defect and making them whole — typically refunds or ' +
          'credits — often the largest cost of a consumer-protection ' +
          'failure.',
      },
      {
        term: 'Regulatory change management',
        definition:
          'The discipline of tracking new and amended regulation, assessing ' +
          'applicability and impact, and operationalising the required ' +
          'changes before the regulatory effective date.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Regulatory-Compliance Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the compliance programme is exposed — change ' +
        'management, testing coverage, issue remediation, exam readiness, ' +
        'consumer protection, or reporting — with baseline evidence, before ' +
        'a solution is shaped.',
      sections: [
        {
          heading: 'Programme and supervisory context',
          guidance:
            'Name the compliance programme in scope — the institution’s ' +
            'charter, primary regulators, business and product mix, and ' +
            'current supervisory standing. State which GRC, regulatory-' +
            'change, complaint, and reporting systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — regulatory-change cycle time and on-time ' +
            'rate, monitoring-and-testing coverage, control-testing pass ' +
            'rate, open-issue aging, repeat-issue rate, exam-finding volume, ' +
            'self-identified-issue share, complaint rate, reporting ' +
            'accuracy, fair-lending disparity, and the cost ratio. For any ' +
            'metric not recorded, name it as a precise seed gap with its ' +
            'data source.',
        },
        {
          heading: 'Issue and finding analysis',
          guidance:
            'Break down the open-issue book and recent examiner findings by ' +
            'severity, regulatory domain, and source — self-identified, ' +
            'audit, or examiner — and analyse aging, repeat-issue patterns, ' +
            'and where in the programme each weakness originates.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — change tracked but not ' +
            'operationalised, untested control assumptions, remediation ' +
            'drift, reactive exam management, silently-scaled consumer harm, ' +
            'fair-lending blind spots, reporting-lineage gaps, obligation-' +
            'inventory drift — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Risk-and-value-at-stake hypothesis',
          guidance:
            'Frame the opportunity using the value-model benchmark ranges — ' +
            'avoided regulatory loss, lower compliance cost, stronger ' +
            'supervisory standing — explicitly haircut for the contingent ' +
            'nature of avoided loss, data readiness, and adoption. Every ' +
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
            'including the second-line independence the design must keep.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Regulatory-Compliance Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, board-and-CRO-readable case for funding a ' +
        'compliance AI Move — baseline, expected-value forecast, cost, and ' +
        'the honest downside, with the contingent nature of avoided loss ' +
        'made explicit.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'expected avoided loss, compliance-cost reduction, and ' +
            'supervisory-standing benefit, the time-to-value band, and the ' +
            'go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — change cycle time, testing coverage, issue aging, ' +
            'finding volume, complaint rate. Where a baseline is a seed gap, ' +
            'say so and state what closing it requires before funding.',
        },
        {
          heading: 'Expected-value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, then ' +
            'apply each dominant haircut factor — the probabilistic nature ' +
            'of avoided loss, data and inventory readiness, examiner and ' +
            'model-governance acceptance, second-line adoption — explicitly ' +
            'and show the haircut math. Present avoided loss as a ' +
            'probability-weighted expectation, never a certain saving.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the GRC, regulatory-change, ' +
            'complaint, and reporting systems, the model risk-management and ' +
            'validation overhead, and the operating-model change in the ' +
            'second line.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a heavier supervisory posture, ' +
            'weaker data and inventory readiness, and partial adoption. ' +
            'State the downside the board and CRO are underwriting.',
        },
        {
          heading: 'Model governance and second-line independence',
          guidance:
            'State how any AI used in testing, monitoring, or reporting is ' +
            'governed under the model risk-management framework, validated, ' +
            'and explainable to an examiner, and how the second line keeps ' +
            'its independence and challenge function.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence — inventory completeness, data lineage, ' +
            'governance sign-off — that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the measurement cadence, including the ' +
            'lagged finding-volume and avoided-loss measures.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Regulatory-Compliance Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'compliance AI capability, grounded in the function reference ' +
        'patterns, the model-governance frame, and second-line ' +
        'independence.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — instrumented change pipeline, continuous control ' +
            'assurance, continuous exam readiness, consumer-protection early ' +
            'warning, lineage-governed reporting — and state which apply ' +
            'and how they connect across the compliance lifecycle.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the GRC, regulatory-change, complaint, reporting, ' +
            'loan-origination, and core-banking integrations, the ' +
            'regulatory-obligation inventory as the mapping backbone, data ' +
            'lineage requirements, and the regulatory-feed dependencies the ' +
            'use cases rely on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define where a human renders the legal ' +
            'interpretation and where no regulator-facing communication is ' +
            'sent autonomously.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how regulatory-change, testing, exam-management, ' +
            'consumer-compliance, and reporting workflows change, how ' +
            'second-line staff are redeployed from manual work to judgement ' +
            'and challenge, and who owns each change.',
        },
        {
          heading: 'Model governance and responsible-AI controls',
          guidance:
            'State the model risk-management treatment, validation, ' +
            'explainability, and proxy-discrimination testing for any ' +
            'fair-lending model, and the regulatory frames (CFPB, UDAAP, ' +
            'Reg DD/E/Z, ECOA/FHA/HMDA, prudential supervision) that bound ' +
            'the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and the ' +
            'phased rollout across the compliance domains and the business ' +
            'lines.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Regulatory-Compliance Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the compliance AI capability so ' +
        'value reaches the supervisory relationship and the cost ratio, not ' +
        'just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and obligation-inventory ' +
            'validation, a pilot regulatory domain, second-line onboarding, ' +
            'scale across the programme — with milestones tied to the ' +
            'operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, obligation-inventory maintenance, model ' +
            'governance, testing adoption, exam-readiness, regulatory ' +
            'reporting, and Tower measurement.',
        },
        {
          heading: 'Second-line adoption and redeployment approach',
          guidance:
            'Define the change runway for compliance officers, testers, and ' +
            'exam-management staff — training, workflow change, and the ' +
            'redeployment of capacity the automation frees toward judgement ' +
            'and challenge — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Examiner-engagement plan',
          guidance:
            'Plan how the institution proactively walks its regulators ' +
            'through the AI-assisted compliance capability and its ' +
            'governance, so the supervisory relationship is informed rather ' +
            'than surprised.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged finding-volume and avoided-' +
            'loss measures.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — regulatory-feed drift, model-governance ' +
            'gaps, inventory staleness, partial adoption, examiner ' +
            'scepticism — with the escalation owner and the trigger for ' +
            'each.',
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
      claim: 'Regulatory-change operationalisation — tracked versus done',
      authoritativeSource:
        'The regulatory-change-management workflow in the GRC platform, ' +
        'time-stamped from rule intake to validated implementation against ' +
        'the regulatory effective date.',
      whatGoodEvidenceLooksLike:
        'For each applicable change, evidence that the operational change — ' +
        'process, disclosure, and control — was live and validated by the ' +
        'effective date, with the implementation owner named.',
      weakEvidenceToReject:
        'A count of changes "tracked" or "assessed" with no evidence the ' +
        'operational change was implemented, or an on-time rate that cannot ' +
        'be tied to effective dates.',
    },
    {
      claim: 'Compliance control effectiveness and testing coverage',
      authoritativeSource:
        'Independent monitoring-and-testing results in the GRC platform, ' +
        'reconciled against the regulatory-obligation inventory.',
      whatGoodEvidenceLooksLike:
        'Risk-weighted coverage of the obligation inventory with documented ' +
        'test procedures, evidence-based pass/fail conclusions, and ' +
        'exceptions routed into the issue register.',
      weakEvidenceToReject:
        'A first-line self-attestation that controls work, or a coverage ' +
        'figure with no link to the obligation inventory or no documented ' +
        'test procedure.',
    },
    {
      claim: 'Consumer-harm and fair-lending exposure',
      authoritativeSource:
        'Complaint data reconciled against the CFPB database, and fair-' +
        'lending regression and matched-pair analysis on loan-application ' +
        'and HMDA data.',
      whatGoodEvidenceLooksLike:
        'Complaint clusters attributed to a product, fee, or disclosure ' +
        'source, and a statistically valid, reproducible disparity analysis ' +
        'that controls for legitimate credit factors.',
      weakEvidenceToReject:
        'A blended complaint count with no thematic or product breakdown, ' +
        'or a fair-lending claim with no statistical analysis or no control ' +
        'for legitimate factors.',
    },
    {
      claim: 'Regulatory-report accuracy and data lineage',
      authoritativeSource:
        'The regulatory-reporting system, the refiling/correction log, and ' +
        'documented source-to-report data lineage.',
      whatGoodEvidenceLooksLike:
        'On-time, materially-accurate filings with a documented, auditable ' +
        'trace from each reported figure to its source system and no ' +
        'pattern of amended refilings.',
      weakEvidenceToReject:
        'A filing assembled by manual spreadsheet with no lineage, or an ' +
        'accuracy claim that cannot survive an examiner asking how a number ' +
        'was derived.',
    },
    {
      claim: 'The forecast value of a compliance AI Move',
      authoritativeSource:
        'The value model — expected avoided loss, compliance-cost, and ' +
        'supervisory-standing components, each haircut by its dominant ' +
        'factors — read against the institution’s specific supervisory ' +
        'posture.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with avoided loss ' +
        'expressed as a probability-weighted expectation, each haircut ' +
        'applied explicitly, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, an avoided-penalty figure presented ' +
        'as a certain saving, or a vendor ROI claim taken at face value ' +
        'with no haircut for the contingent nature of regulatory loss.',
    },
  ],
};
