// Domain Function Pack — Healthcare provider · Health information management,
// data & interoperability.
//
// Function key: `health_information_interoperability`.
//
// This is the function that owns whether the clinical record is complete,
// correctly attributed to the right patient, coded, governed, and able to move
// — into the organisation, out of it, and between the systems inside it. It
// runs health information management (the legal medical record, release of
// information, the coding operation, retention and governance), the master
// patient index and patient-identity integrity, data quality and stewardship,
// and the interoperability estate: the interfaces, the FHIR APIs, the HIE and
// TEFCA connections through which records are exchanged. It is the quiet
// infrastructure function that almost every other function silently depends
// on — care delivery, quality measurement, revenue cycle, and population
// health all consume the record this function curates and the exchange it
// operates. When it fails, the failure is a duplicate patient record that
// fragments a history, an external document that arrives but is never
// reconciled into the chart, a coding backlog that delays the bill, or an API
// that is down when a partner needs it — failures that surface as clinical
// risk, lost revenue, and broken care coordination far from where they began.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const healthInformationInteroperabilityPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'health_information_interoperability',
  functionLabel: 'Health information management, data & interoperability',
  summary:
    'Health information management, data & interoperability is the function ' +
    'that owns whether the clinical record is complete, correctly attributed ' +
    'to the right patient, coded, governed, and able to move. It runs health ' +
    'information management — the legal medical record, release of ' +
    'information, the coding operation, retention and information governance ' +
    '— the master patient index and patient-identity integrity, data quality ' +
    'and stewardship, and the interoperability estate of interfaces, FHIR ' +
    'APIs, and HIE / TEFCA exchange connections. It is the infrastructure ' +
    'function the rest of the provider silently depends on: care delivery, ' +
    'quality measurement, revenue cycle, and population health all consume ' +
    'the record it curates and the exchange it operates. Its failures are ' +
    'quiet but compounding — a duplicate record that fragments a patient ' +
    'history, an external document that arrives but is never reconciled, a ' +
    'coding backlog that holds the bill, an API down when a partner needs it ' +
    '— and they surface as clinical risk, lost revenue, and broken ' +
    'coordination far downstream of where they started.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'record_documentation_completeness',
      name: 'Record / documentation completeness rate',
      definition:
        'The share of encounters whose legal medical record is complete — ' +
        'every required document present, signed, and authenticated within ' +
        'the medical-staff-bylaws timeframe, with no delinquent or missing ' +
        'components.',
      unit: '% of encounters with a complete, timely record',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 98,
        basis:
          'Record-completeness rates sit high in well-run HIM operations ' +
          'but rarely at ceiling; the residual is delinquent signatures and ' +
          'missing components. A planning range — the chart-delinquency ' +
          'rate is the inverse view of the same metric.',
        label: 'planning-range',
      },
      dataSource:
        'The EHR / HIM deficiency-management module tracking record ' +
        'completion and authentication against the bylaws timeframe.',
      whyItMatters:
        'An incomplete record is a clinical-continuity risk, a billing ' +
        'hold, and an accreditation exposure; completeness is the baseline ' +
        'integrity measure of the legal medical record.',
    },
    {
      key: 'interoperability_exchange_rate',
      name: 'Interoperability exchange rate (HIE / TEFCA participation)',
      definition:
        'The share of relevant care episodes for which clinical information ' +
        'is actually exchanged with external organisations through an HIE, ' +
        'a TEFCA QHIN connection, or a national exchange network — both ' +
        'records sent and external records retrieved.',
      unit: '% of relevant episodes with external information exchange',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 80,
        basis:
          'Effective exchange participation varies widely with the local ' +
          'HIE, TEFCA onboarding maturity, and how deeply exchange is wired ' +
          'into the clinical workflow; connection existing is not the same ' +
          'as exchange happening. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The integration engine and HIE / QHIN exchange logs reconciled ' +
        'against encounter volume.',
      whyItMatters:
        'Exchange is the point of the interoperability estate — it is what ' +
        'lets a clinician see care delivered elsewhere; a low exchange rate ' +
        'despite live connections means the investment is not reaching the ' +
        'bedside.',
    },
    {
      key: 'release_of_information_turnaround',
      name: 'Release-of-information turnaround time',
      definition:
        'The median elapsed time from a valid request for a copy of the ' +
        'medical record — from a patient, another provider, a payer, or a ' +
        'legal requester — to the records being released.',
      unit: 'calendar days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 15,
        basis:
          'Release-of-information turnaround spans a few days to well over ' +
          'a week; HIPAA sets an outer bound for patient requests and ' +
          'continuity-of-care needs push for far faster. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The release-of-information / ROI workflow system with request-' +
        'lifecycle timestamps.',
      whyItMatters:
        'Slow release of information delays patient care transitions, ' +
        'frustrates patients exercising their right of access, and risks ' +
        'breaching the HIPAA access timeframe; turnaround is the service ' +
        'metric of the HIM front door.',
    },
    {
      key: 'mpi_duplicate_rate',
      name: 'Master-patient-index duplicate rate',
      definition:
        'The share of patient records in the master patient index that are ' +
        'duplicates — more than one record representing the same real ' +
        'patient — fragmenting that patient\'s history across identities.',
      unit: '% of MPI records that are duplicates',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Master-patient-index duplicate rates vary with registration ' +
          'discipline, the number of contributing source systems, and the ' +
          'maturity of identity matching; rates climb sharply across ' +
          'merged or multi-system estates. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The enterprise master patient index / EMPI platform and its ' +
        'duplicate-detection analytics.',
      whyItMatters:
        'A duplicate record splits a patient\'s history, so a clinician ' +
        'sees an incomplete picture and an allergy or result can be missed; ' +
        'duplicates are a direct patient-safety hazard and the root of ' +
        'much downstream data fragmentation.',
    },
    {
      key: 'data_quality_score',
      name: 'Clinical data-quality score',
      definition:
        'A composite measure of the quality of the clinical data estate — ' +
        'completeness, accuracy, consistency, conformance to standard ' +
        'terminologies, and timeliness — across the core data domains, ' +
        'expressed as a stewardship scorecard.',
      unit: 'composite data-quality score (0–100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 90,
        basis:
          'Composite data-quality scores depend heavily on which domains ' +
          'and dimensions are in scope and how strictly each is scored; ' +
          'mature stewardship programs push the upper end. A planning ' +
          'range — define the scorecard before placing the point.',
        label: 'planning-range',
      },
      dataSource:
        'The data-quality / data-stewardship platform running profiling ' +
        'and conformance rules across the clinical data domains.',
      whyItMatters:
        'Every downstream consumer — quality measurement, analytics, ' +
        'population health, AI models — inherits this data\'s quality; a ' +
        'low score caps how much any data-dependent capability can be ' +
        'trusted.',
    },
    {
      key: 'coding_backlog_days',
      name: 'Coding backlog (discharged-not-final-coded days)',
      definition:
        'The volume of completed encounters waiting to be coded, expressed ' +
        'as days of coding work in the backlog — the discharged-not-final-' +
        'coded (DNFC) or discharged-not-final-billed measure.',
      unit: 'days of coding backlog (DNFC)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 8,
        basis:
          'DNFC / coding-backlog days vary with coder capacity, case-mix ' +
          'complexity, and documentation readiness; well-run operations ' +
          'hold the low single digits. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The coding workflow / HIM operations system tracking unbilled ' +
        'discharged encounters.',
      whyItMatters:
        'A coding backlog delays the bill, inflates accounts-receivable ' +
        'days, and ties up cash; backlog days are the throughput metric of ' +
        'the documented-to-coded-to-billed pathway.',
    },
    {
      key: 'fhir_api_availability',
      name: 'FHIR API availability and uptime',
      definition:
        'The share of time the organisation\'s FHIR APIs and exchange ' +
        'interfaces are available and responding within their service-level ' +
        'targets — the uptime of the interoperability front end.',
      unit: '% uptime against the service-level target',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 99.0,
        high: 99.95,
        basis:
          'API and interface availability targets cluster in the high-nines ' +
          'band; the gap between 99.0% and 99.95% is the difference between ' +
          'days and hours of annual downtime. A planning range — set ' +
          'against the actual service-level commitment.',
        label: 'planning-range',
      },
      dataSource:
        'API gateway and integration-engine monitoring, with the ' +
        'service-level target stated.',
      whyItMatters:
        'FHIR APIs now carry patient access, payer data exchange, and ' +
        'partner integrations; downtime breaks all of them at once and, for ' +
        'patient-access APIs, can implicate the information-blocking rule.',
    },
    {
      key: 'unreconciled_external_record_rate',
      name: 'Unreconciled external-record rate',
      definition:
        'The share of clinical records and documents received from external ' +
        'sources — HIE feeds, exchanged CCDs, faxed and scanned documents — ' +
        'that are not reconciled into the patient\'s chart as usable, ' +
        'structured, clinician-visible information.',
      unit: '% of received external records left unreconciled',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 50,
        basis:
          'A large share of inbound external information lands as ' +
          'unstructured documents or unmatched feeds and is never ' +
          'reconciled into the chart; the rate depends on matching ' +
          'accuracy and reconciliation workflow maturity. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The integration engine, document-management system, and external-' +
        'record reconciliation workflow.',
      whyItMatters:
        'An external record that arrives but is never reconciled is ' +
        'exchange that failed at the last step — the clinician still does ' +
        'not see the outside care, so the interoperability investment did ' +
        'not produce its clinical value.',
    },
    {
      key: 'identity_match_accuracy',
      name: 'Patient-identity match accuracy',
      definition:
        'The accuracy of patient-identity matching when records are ' +
        'linked — across registration, external exchange, and source-system ' +
        'integration — measured as the rate of correct matches against ' +
        'false matches (wrong patient linked) and missed matches (same ' +
        'patient not linked).',
      unit: '% correct matches (with false-match rate stated)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 90,
        high: 99.5,
        basis:
          'Identity-match accuracy varies with the matching algorithm, the ' +
          'demographic data quality, and whether deterministic, ' +
          'probabilistic, or referential matching is used; the false-match ' +
          'rate matters as much as the headline accuracy. A planning ' +
          'range — report both directions of error.',
        label: 'planning-range',
      },
      dataSource:
        'The EMPI / identity-matching platform, validated against a ' +
        'human-reviewed reference set.',
      whyItMatters:
        'A false match merges two patients\' data and is a serious safety ' +
        'event; a missed match fragments one patient\'s history. Identity ' +
        'match accuracy is the integrity foundation the whole record rests ' +
        'on.',
    },
    {
      key: 'interface_error_rate',
      name: 'Integration / interface error rate',
      definition:
        'The share of messages and transactions across the integration ' +
        'estate — HL7 interfaces, FHIR exchanges, batch feeds — that fail, ' +
        'reject, or land in an error queue and require intervention.',
      unit: '% of messages / transactions in error',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 5,
        basis:
          'Interface error rates depend on the number and age of ' +
          'interfaces, mapping discipline, and source-system data quality; ' +
          'a growing error queue is an early integration-debt signal. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The integration-engine / interface-monitoring platform error and ' +
        'message logs.',
      whyItMatters:
        'A failed interface message is clinical or financial data that did ' +
        'not arrive where it was needed; a rising error rate is the leading ' +
        'indicator of an interoperability estate accumulating fragility.',
    },
    {
      key: 'terminology_mapping_coverage',
      name: 'Standard-terminology mapping coverage',
      definition:
        'The share of clinical data elements — diagnoses, procedures, labs, ' +
        'medications, problems — that are mapped to the standard ' +
        'terminologies (SNOMED CT, LOINC, RxNorm, ICD-10) required for ' +
        'semantic exchange and computable interoperability.',
      unit: '% of clinical data elements mapped to standard terminologies',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 95,
        basis:
          'Terminology-mapping coverage varies enormously by domain — labs ' +
          'and medications are typically better mapped than problems and ' +
          'local result codes — and by how many legacy local code sets ' +
          'remain. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The terminology service / mapping repository reconciled against ' +
        'the source-system code sets.',
      whyItMatters:
        'Without standard-terminology mapping, exchanged data is human-' +
        'readable but not computable — it cannot drive decision support, ' +
        'measures, or AI; mapping coverage is what makes exchange ' +
        'semantically useful rather than just transmitted.',
    },
    {
      key: 'data_request_fulfilment_time',
      name: 'Internal data-request fulfilment time',
      definition:
        'The median elapsed time from an internal request for clinical ' +
        'data — for analytics, research, a quality measure, or a new use ' +
        'case — to a governed, quality-assured dataset being delivered.',
      unit: 'business days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Internal data-request fulfilment time depends on how much of ' +
          'the estate is governed and self-service versus bespoke ' +
          'extraction; a long tail signals a data-access bottleneck. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The data-governance / data-request intake and fulfilment ' +
        'workflow.',
      whyItMatters:
        'Slow internal data fulfilment throttles every data-dependent ' +
        'initiative downstream; it is the metric that shows whether the ' +
        'data estate is an enabler or a bottleneck for the rest of the ' +
        'organisation.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'patient_identity_fragmentation',
      name: 'Patient-identity fragmentation and duplicate records',
      description:
        'Registration variation, multiple source systems, and weak ' +
        'identity matching produce duplicate and overlaid patient records. ' +
        'A patient\'s history is split across identities, so a clinician ' +
        'sees a partial chart, and merges and unmerges become a constant ' +
        'corrective workload.',
      detectionSignal:
        'A high MPI duplicate rate, a large manual identity-resolution ' +
        'queue, and clinicians reporting missing history that turns out to ' +
        'live under a second record.',
      diagnosticQuestion:
        'What is the master-patient-index duplicate rate, how is identity ' +
        'matched across source systems, and how much manual resolution is ' +
        'it costing?',
    },
    {
      key: 'exchange_without_reconciliation',
      name: 'Exchange without reconciliation — data arrives but is not used',
      description:
        'The organisation is connected to an HIE or TEFCA and external ' +
        'records do arrive — but they land as unstructured documents or ' +
        'unmatched feeds that are never reconciled into the chart. ' +
        'Connection is reported as interoperability while the clinician ' +
        'still cannot see the outside care.',
      detectionSignal:
        'A high unreconciled-external-record rate despite live exchange ' +
        'connections; external data sitting in document queues; clinicians ' +
        'unaware of available outside records.',
      diagnosticQuestion:
        'Of the external records the organisation receives, what share is ' +
        'actually reconciled into the chart as usable, clinician-visible ' +
        'information?',
    },
    {
      key: 'documentation_completeness_and_delinquency',
      name: 'Record incompleteness and chart delinquency',
      description:
        'Records are completed and authenticated late or incompletely — ' +
        'missing signatures, missing components, delinquent charts past ' +
        'the bylaws timeframe. The legal medical record is not reliably ' +
        'whole when downstream functions need it.',
      detectionSignal:
        'A low record-completeness rate and a persistent delinquent-chart ' +
        'backlog; billing and release-of-information held up waiting on ' +
        'record completion.',
      diagnosticQuestion:
        'What share of records are complete and authenticated within the ' +
        'bylaws timeframe, and how large is the delinquent-chart backlog?',
    },
    {
      key: 'coding_backlog_and_capacity',
      name: 'Coding backlog and capacity constraint',
      description:
        'Discharged encounters wait to be coded because coder capacity ' +
        'cannot keep pace with volume and complexity. The backlog delays ' +
        'billing, inflates accounts-receivable days, and ties up cash, and ' +
        'it grows whenever documentation arrives late or incomplete.',
      detectionSignal:
        'A rising discharged-not-final-coded backlog, growing coder ' +
        'overtime or outsourcing spend, and AR days inflated by the coding ' +
        'queue.',
      diagnosticQuestion:
        'What is the coding backlog in DNFC days, and is it a capacity ' +
        'constraint, a documentation-readiness problem, or both?',
    },
    {
      key: 'terminology_and_semantic_fragmentation',
      name: 'Terminology and semantic fragmentation',
      description:
        'Clinical data is recorded in local code sets and inconsistent ' +
        'terminologies, so the same concept is represented many ways. ' +
        'Exchanged or aggregated data is human-readable but not ' +
        'computable, and every analytics or AI use case has to re-solve ' +
        'the mapping problem.',
      detectionSignal:
        'Low standard-terminology mapping coverage, especially for ' +
        'problems and local result codes; analytics teams repeatedly ' +
        'rebuilding mappings; decision-support rules that fire ' +
        'inconsistently across sites.',
      diagnosticQuestion:
        'What share of clinical data is mapped to SNOMED CT, LOINC, and ' +
        'RxNorm, and where does local-code fragmentation block computable ' +
        'use of the data?',
    },
    {
      key: 'integration_estate_debt',
      name: 'Integration-estate debt and fragility',
      description:
        'A large, aging estate of point-to-point HL7 interfaces and ' +
        'bespoke feeds has accumulated with weak documentation and ' +
        'ownership. Each change is risky, the error queue grows, and the ' +
        'estate cannot be evolved toward modern FHIR-based exchange ' +
        'without untangling it first.',
      detectionSignal:
        'A high or rising interface error rate, a large count of ' +
        'undocumented point-to-point interfaces, and integration changes ' +
        'that routinely cause unplanned breakage.',
      diagnosticQuestion:
        'How large and how well-documented is the interface estate, what ' +
        'is the error rate, and how much does integration debt slow every ' +
        'change?',
    },
    {
      key: 'ungoverned_data_and_slow_access',
      name: 'Ungoverned data and slow internal data access',
      description:
        'There is no clear ownership, stewardship, or governed access ' +
        'model for the clinical data estate. Every internal data request ' +
        'becomes a bespoke extraction, data quality is nobody\'s explicit ' +
        'job, and data-dependent initiatives stall waiting for data they ' +
        'cannot self-serve.',
      detectionSignal:
        'Long internal data-request fulfilment times, no named data ' +
        'stewards, no data-quality scorecard, and analytics teams ' +
        'reconciling the same data repeatedly.',
      diagnosticQuestion:
        'Who owns and stewards each core data domain, and how long does it ' +
        'take to get a governed, quality-assured dataset for a new use ' +
        'case?',
    },
    {
      key: 'roi_bottleneck_and_access_risk',
      name: 'Release-of-information bottleneck and information-blocking risk',
      description:
        'Release of information is slow and largely manual — classifying ' +
        'requests, locating records, applying disclosure rules. Patients ' +
        'wait on their right of access, care transitions are delayed, and ' +
        'slow or obstructed release can implicate the information-blocking ' +
        'rule.',
      detectionSignal:
        'Long release-of-information turnaround, a manual ROI queue, ' +
        'patient-access complaints, and inconsistent application of ' +
        'disclosure and sensitive-information rules.',
      diagnosticQuestion:
        'How fast is release of information, how much of it is manual, and ' +
        'is the organisation confident it is not at information-blocking ' +
        'risk?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'record_matching_mpi_dedup',
      name: 'Record matching and master-patient-index de-duplication',
      valueMechanism:
        'A model applies probabilistic and referential matching across ' +
        'patient records — flagging likely duplicates and overlays, scoring ' +
        'match confidence, and proposing merges — and supports identity ' +
        'resolution at registration and at the point of exchange. Value ' +
        'comes from a cleaner master patient index: fewer fragmented ' +
        'histories, fewer wrong-patient safety hazards, and far less manual ' +
        'identity-resolution work, with a more complete chart at the point ' +
        'of care.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Patient demographic data across all source systems',
        'The master patient index and its existing match / merge history',
        'Referential identity data where licensed (third-party identity ' +
          'reference)',
        'A human-reviewed reference set of true and false matches for ' +
          'calibration',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model proposes and scores matches; an identity-management ' +
          'steward reviews and approves every merge — a false merge ' +
          'combines two patients and is a serious safety event.',
        'High-confidence non-matches and low-confidence cases must route ' +
          'differently; the false-match rate is the dangerous error ' +
          'direction and must be held near zero.',
        'Matching must be tested for bias — degraded accuracy for any ' +
          'demographic subgroup with sparser or less consistent ' +
          'demographic data is a safety and equity failure.',
        'Merges must be reversible and fully audited; an incorrect merge ' +
          'must be cleanly unwindable.',
      ],
      metricsMoved: [
        'mpi_duplicate_rate',
        'identity_match_accuracy',
        'record_documentation_completeness',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'intelligent_roi_document_classification',
      name: 'Intelligent release-of-information and document classification',
      valueMechanism:
        'A model classifies incoming record requests and inbound clinical ' +
        'documents — identifying the request type, locating the responsive ' +
        'records, classifying scanned and faxed documents by type and ' +
        'patient, and flagging sensitive content that needs special ' +
        'disclosure handling. Value comes from faster release of ' +
        'information, a smaller manual document-classification burden, and ' +
        'reduced information-blocking and wrongful-disclosure risk.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inbound record requests and the document-management / fax queue',
        'The legal medical record and its document-type taxonomy',
        'Disclosure rules — HIPAA, state law, and sensitive-information ' +
          '(e.g. 42 CFR Part 2) categories',
        'Patient-identity data to attribute each document to the right ' +
          'chart',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model classifies and routes; an HIM / ROI specialist reviews ' +
          'and authorises every disclosure — wrongful disclosure is a ' +
          'breach and a legal exposure.',
        'Sensitive-information detection (substance-use, behavioral ' +
          'health, HIV, minors) must be conservative; a missed sensitive ' +
          'flag is a serious privacy failure.',
        'Document-to-patient attribution must be verified — a misfiled ' +
          'document is both a privacy breach and a clinical-safety ' +
          'hazard.',
      ],
      metricsMoved: [
        'release_of_information_turnaround',
        'unreconciled_external_record_rate',
        'record_documentation_completeness',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'data_quality_remediation',
      name: 'Data-quality monitoring and remediation',
      valueMechanism:
        'A model continuously profiles the clinical data estate — ' +
        'completeness, accuracy, consistency, conformance, timeliness — ' +
        'detects data-quality defects and anomalies, traces them to their ' +
        'source, and proposes or routes remediations. Value comes from a ' +
        'measurably higher data-quality score, fewer defects propagating ' +
        'into measures and analytics, and stewardship effort focused on ' +
        'the defects that matter rather than spread thin.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The clinical data estate across its core domains',
        'Data-quality rules, profiling definitions, and conformance ' +
          'standards',
        'Source-system lineage so a defect can be traced to its origin',
        'A data-stewardship workflow to route and track remediations',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model detects defects and proposes remediations; a data ' +
          'steward owns the decision to change clinical data — automated ' +
          'correction of clinical content is not appropriate.',
        'Remediation must fix the source where possible, not just the ' +
          'downstream copy, or the defect simply recurs.',
        'Anomaly detection must distinguish a data defect from genuine ' +
          'clinical variation — flagging real but unusual clinical data ' +
          'as an error is its own failure mode.',
      ],
      metricsMoved: [
        'data_quality_score',
        'terminology_mapping_coverage',
        'interface_error_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'semantic_mapping_terminology_normalization',
      name: 'Semantic mapping and terminology normalisation',
      valueMechanism:
        'A model maps local code sets and free-text clinical concepts to ' +
        'the standard terminologies — SNOMED CT, LOINC, RxNorm, ICD-10 — ' +
        'proposing mappings, normalising inconsistent representations, and ' +
        'maintaining the maps as source systems change. Value comes from ' +
        'higher terminology-mapping coverage, which turns exchanged and ' +
        'aggregated data from merely transmitted into computable — usable ' +
        'by decision support, quality measures, and AI.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Source-system local code sets and free-text clinical concepts',
        'The standard reference terminologies and their value sets',
        'An existing curated mapping repository for calibration',
        'A terminologist review and approval workflow',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model proposes mappings; a terminologist or clinical ' +
          'informaticist reviews and approves — a wrong mapping silently ' +
          'corrupts every downstream use of that concept.',
        'Mapping confidence must be surfaced; low-confidence and ' +
          'clinically ambiguous mappings route to careful human review.',
        'Maps must be versioned and the provenance of each mapping ' +
          'retained, so a later correction can be traced and propagated.',
      ],
      metricsMoved: [
        'terminology_mapping_coverage',
        'data_quality_score',
        'interoperability_exchange_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'interoperability_gap_detection',
      name: 'Interoperability-gap and exchange-failure detection',
      valueMechanism:
        'A model monitors the interoperability estate end to end — ' +
        'interface error queues, exchange logs, API health, ' +
        'reconciliation outcomes — and detects where exchange is failing: ' +
        'a degrading interface, a partner connection that has gone quiet, ' +
        'external records arriving but not reconciling, an API breaching ' +
        'its service level. Value comes from finding and closing exchange ' +
        'failures proactively, before they surface as missing clinical ' +
        'data at the bedside or an information-blocking exposure.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Integration-engine and interface error and message logs',
        'HIE / QHIN exchange logs and partner-connection telemetry',
        'API gateway health and service-level monitoring',
        'External-record reconciliation outcomes',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model detects and prioritises exchange failures; the ' +
          'integration and interoperability team owns the fix and the ' +
          'partner communication.',
        'Detection must distinguish a true exchange failure from expected ' +
          'low-volume quiet periods, or the team is buried in false ' +
          'alerts.',
        'A detected gap that implicates patient access or the ' +
          'information-blocking rule must escalate on a compliance path, ' +
          'not only an operational one.',
      ],
      metricsMoved: [
        'interoperability_exchange_rate',
        'interface_error_rate',
        'fhir_api_availability',
        'unreconciled_external_record_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'computer_assisted_coding_handoff',
      name: 'Computer-assisted coding and the coding handoff',
      valueMechanism:
        'A model reads the completed clinical documentation and proposes ' +
        'the diagnosis and procedure codes, pre-populating the coder\'s ' +
        'worklist, prioritising the queue by complexity and revenue ' +
        'impact, and flagging encounters with documentation gaps that ' +
        'block coding. Value comes from higher coder throughput, a shorter ' +
        'discharged-not-final-coded backlog, and coder capacity redirected ' +
        'from routine encounters to complex and audit-sensitive ones.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Structured and unstructured EHR clinical documentation',
        'Code sets and coding references (ICD-10-CM, ICD-10-PCS, CPT)',
        'Historical coded encounters for calibration and audit',
        'The coding workflow and worklist system for the handoff',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model proposes codes and prioritises the worklist; a ' +
          'credentialed coder reviews, validates, and owns the final code ' +
          '— the organisation certifies what it bills.',
        'Coding must stay grounded in the documentation; the model must ' +
          'never code beyond what the record supports, which would create ' +
          'recoupment and compliance exposure.',
        'Coding accuracy must be audited against independent ' +
          're-coding; throughput gains that erode accuracy are a false ' +
          'economy.',
      ],
      metricsMoved: [
        'coding_backlog_days',
        'record_documentation_completeness',
        'data_request_fulfilment_time',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'governed_identity_resolution_layer',
      name: 'Governed patient-identity resolution layer',
      description:
        'An identity layer over the enterprise master patient index that ' +
        'runs probabilistic and referential matching, scores match ' +
        'confidence, routes proposed merges to a steward queue, and keeps ' +
        'every merge auditable and reversible. Registration and every ' +
        'inbound exchange resolve identity through this single layer ' +
        'rather than each solving matching independently.',
      boundary:
        'It proposes and scores identity matches; an identity-management ' +
        'steward owns every merge decision. It never auto-merges and every ' +
        'merge is reversible.',
      humanAccountabilityPoint:
        'The HIM / enterprise-data-integrity director accountable for the ' +
        'master patient index and patient-identity integrity.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'master_data_management',
    },
    {
      key: 'inbound_record_reconciliation_pipeline',
      name: 'Inbound external-record reconciliation pipeline',
      description:
        'A pipeline that takes every inbound external record — HIE feeds, ' +
        'exchanged CCDs, faxed and scanned documents — classifies it, ' +
        'matches it to the right patient and encounter, extracts the ' +
        'structured clinical content, and reconciles it into the chart as ' +
        'clinician-visible information. It is measured on the reconciled ' +
        'rate, not on the received rate.',
      boundary:
        'It classifies, matches, extracts, and reconciles; clinicians own ' +
        'the clinical interpretation and an HIM specialist owns ambiguous ' +
        'attribution. It does not discard or alter source records.',
      humanAccountabilityPoint:
        'The HIM operations leader accountable for inbound-record ' +
        'reconciliation and chart completeness.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'standards_based_interoperability_gateway',
      name: 'Standards-based FHIR interoperability gateway',
      description:
        'A consolidated FHIR-based gateway that fronts the integration ' +
        'estate — exposing standard FHIR APIs for patient access, payer ' +
        'exchange, TEFCA / QHIN connectivity, and partner integration — ' +
        'with managed terminology services, monitoring, and a service-' +
        'level posture. It is the strategic replacement path for the ' +
        'aging point-to-point interface estate.',
      boundary:
        'It exposes and governs standard exchange interfaces; it is not ' +
        'the clinical system of record and does not own clinical content. ' +
        'Source systems remain authoritative.',
      humanAccountabilityPoint:
        'The integration / interoperability architecture lead accountable ' +
        'for the exchange estate and its service levels.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'data_governance_and_stewardship_operating_model',
      name: 'Data-governance and stewardship operating model',
      description:
        'An operating-model pattern that assigns named ownership and ' +
        'stewardship to each core clinical data domain, runs a ' +
        'data-quality scorecard, governs data access through a single ' +
        'intake-and-fulfilment workflow, and maintains the terminology ' +
        'and metadata standards. It makes data quality and access an ' +
        'owned, measured discipline rather than a diffuse responsibility.',
      boundary:
        'It governs ownership, quality, and access; it does not itself ' +
        'create clinical data and does not override clinical authorship. ' +
        'Stewards govern, they do not practise.',
      humanAccountabilityPoint:
        'The Chief Data Officer / data-governance lead accountable for ' +
        'the clinical data estate, with named domain stewards under them.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'terminology_service',
      name: 'Enterprise terminology and semantic-mapping service',
      description:
        'A single terminology service that holds the maps from local code ' +
        'sets and free-text concepts to the standard terminologies, ' +
        'versions them, and serves them to every system and use case that ' +
        'needs semantic normalisation. New mappings are AI-proposed and ' +
        'terminologist-approved; every consumer reads the one service.',
      boundary:
        'It holds and serves the semantic maps; it does not author ' +
        'clinical content and a terminologist owns every approved ' +
        'mapping.',
      humanAccountabilityPoint:
        'The clinical-informatics / terminology lead accountable for the ' +
        'integrity of the semantic maps.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'interoperability_observability_substrate',
      name: 'Interoperability observability substrate',
      description:
        'A monitoring and reconciliation layer that assembles interface ' +
        'errors, exchange logs, API health, and reconciliation outcomes ' +
        'into one end-to-end view of the interoperability estate, so an ' +
        'exchange failure is detected as a connected picture rather than ' +
        'as scattered alerts in separate tools. Every interoperability ' +
        'use case reads this substrate.',
      boundary:
        'It observes and reconciles exchange telemetry; it is a read ' +
        'model, not a system of record, and it makes no exchange or ' +
        'clinical decision itself.',
      humanAccountabilityPoint:
        'The interoperability operations owner accountable for exchange ' +
        'health and its end-to-end monitoring.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Health-information and interoperability value is realised through ' +
      'three channels that must be modelled separately because they ' +
      'convert and prove differently. The first is operating efficiency: ' +
      'recovered labour from identity resolution, release of information, ' +
      'document classification, coding, and data extraction — near-term, ' +
      'measurable, and the easiest channel to monetise on an attested ' +
      'cost-per-hour basis. The second is revenue-cycle acceleration: a ' +
      'shorter coding backlog and cleaner records cut discharged-not-' +
      'final-billed days and accounts-receivable days, which is a one-time ' +
      'cash-flow release plus an ongoing carrying-cost saving — real, but ' +
      'a timing benefit that must not be double-counted as recurring ' +
      'revenue. The third, and largest but softest, is enablement and ' +
      'risk reduction: a clean master patient index, reconciled external ' +
      'records, computable terminology-mapped data, and a reliable ' +
      'exchange estate are the substrate every other function and every ' +
      'AI capability depends on — and the avoided cost of a wrong-patient ' +
      'safety event, a breach, or an information-blocking finding. This ' +
      'enablement value is mostly indirect: it shows up as other ' +
      'functions succeeding, so it must be attributed carefully and not ' +
      'claimed twice. A forecast that blends a one-time AR release with ' +
      'recurring savings, or that books downstream enablement value here ' +
      'and again in the consuming function, is dishonest by ' +
      'construction.',
    dominantHaircutFactors: [
      {
        factor: 'Indirect, downstream value attribution',
        rationale:
          'Most interoperability value is realised in other functions — ' +
          'safer care, faster quality measurement, better population ' +
          'health — not in this one. Attributing that downstream gain ' +
          'specifically to the data-and-interoperability Move, and not ' +
          'double-counting it against the consuming function\'s own ' +
          'business case, forces a heavy discount. This is the largest ' +
          'source of erosion in the function.',
        typicalHaircut: {
          low: 0.3,
          high: 0.6,
          basis:
            'The discount applied to indirect, downstream enablement ' +
            'value that cannot be cleanly attributed to this function ' +
            'without double-counting; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Source-data-quality dependency',
        rationale:
          'Matching, terminology mapping, and data-quality remediation ' +
          'are bounded by the quality of the source data they work from. ' +
          'Sparse or inconsistent demographic data caps match accuracy; ' +
          'heavy local-code fragmentation caps mapping coverage. The ' +
          'realisable value is limited by the substrate the AI inherits.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Forecast erosion from poor source-data quality limiting what ' +
            'matching, mapping, and remediation can achieve; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'One-time versus recurring value confusion',
        rationale:
          'A backlog cleared or AR days released is largely a one-time ' +
          'cash-flow event; the ongoing benefit is the smaller recurring ' +
          'carrying-cost saving. A forecast that treats the one-time ' +
          'release as a recurring annual return overstates the case ' +
          'materially.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'The portion of a modelled return that is a one-time ' +
            'cash-flow timing benefit rather than a recurring saving; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Partner and ecosystem dependency',
        rationale:
          'Exchange value depends on counterparties — the local HIE, ' +
          'TEFCA QHINs, referring and receiving organisations, payers. ' +
          'However well the organisation builds its side, the exchange ' +
          'rate and the reconciliation value are bounded by partner ' +
          'readiness and participation it does not control.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The portion of an exchange-value forecast that is not ' +
            'realisable because it depends on partner readiness and ' +
            'participation; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'HIM and data-operations labour recovered',
        range: {
          low: 20,
          high: 55,
          basis:
            'Reduction in manual effort across identity resolution, ' +
            'release of information, document classification, coding, and ' +
            'data extraction from AI assistance with human review; a ' +
            'planning range, with the residual review-and-attestation ' +
            'work always retained.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in labour hours for the affected HIM and ' +
          'data-operations workflows, net of the review time retained, ' +
          'monetised on an attested cost-per-hour basis.',
      },
      {
        lever: 'Coding-backlog and AR-days reduction',
        range: {
          low: 10,
          high: 40,
          basis:
            'Reduction in discharged-not-final-coded backlog days and the ' +
            'associated accounts-receivable days from computer-assisted ' +
            'coding and cleaner records; a planning range — recognise the ' +
            'one-time cash release separately from the recurring ' +
            'carrying-cost saving.',
          label: 'planning-range',
        },
        measuredAs:
          'Reduction in DNFC and AR days, converted to a one-time ' +
          'cash-flow release plus a recurring carrying-cost saving, ' +
          'reported separately.',
      },
      {
        lever: 'Duplicate-record and identity-defect reduction',
        range: {
          low: 30,
          high: 70,
          basis:
            'Relative reduction in the master-patient-index duplicate ' +
            'rate and identity-resolution workload from AI-assisted ' +
            'matching with steward review; a planning range spanning ' +
            'early cleanup and steady-state.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the MPI duplicate rate and in ' +
          'manual identity-resolution effort, with the wrong-patient ' +
          'safety-risk reduction tracked as a non-monetised outcome.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable efficiency and quality signal ' +
      '(duplicate rate, ROI turnaround, coding backlog, data-quality ' +
      'score) once a capability is live; 6–12 months for the ' +
      'revenue-cycle and exchange-rate effects to settle; the enablement ' +
      'value realised in downstream functions is longer-horizon and reads ' +
      'over 12–24 months as those functions build on the cleaner ' +
      'substrate.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record and the legal medical record — ' +
          'the documentation, problem lists, results, and orders this ' +
          'function curates, codes, governs, and exchanges.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'Meditech'],
      },
      {
        name: 'Enterprise master patient index (EMPI)',
        role:
          'The system that maintains a single, reconciled patient identity ' +
          'across all source systems and is the spine of record matching ' +
          'and identity integrity.',
        examples: [
          'Verato',
          'NextGate',
          'IBM / Initiate-lineage EMPI',
          'EHR-native enterprise patient identity',
        ],
      },
      {
        name: 'Integration engine / interoperability platform',
        role:
          'Runs the HL7 and FHIR interfaces, the message routing, and the ' +
          'exchange transactions across the estate.',
        examples: [
          'InterSystems (Ensemble / IRIS for Health)',
          'Rhapsody',
          'Mirth Connect (NextGen Connect)',
          'Redox',
        ],
      },
      {
        name: 'Health information exchange / TEFCA QHIN connectivity',
        role:
          'Connects the organisation to regional and national exchange ' +
          'networks for sending and retrieving external clinical records.',
        examples: [
          'regional / state HIEs',
          'eHealth Exchange',
          'Carequality',
          'CommonWell',
          'TEFCA-designated QHINs',
        ],
      },
      {
        name: 'Release-of-information / document-management system',
        role:
          'Manages record requests, disclosure tracking, and the inbound ' +
          'document, fax, and scan queue.',
        examples: [
          'MRO',
          'Verisma',
          'Hyland OnBase',
          'Epic Release of Information',
        ],
      },
      {
        name: 'Data-governance, data-quality & terminology platform',
        role:
          'Holds the data catalog, stewardship and data-quality rules, and ' +
          'the terminology / semantic-mapping repository.',
        examples: [
          'data-catalog and stewardship tools',
          'Health Catalyst data platform',
          'Apelon / IMO terminology services',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Health Information Officer / Director of HIM',
        accountability:
          'Owns the legal medical record, release of information, the ' +
          'coding operation, record completeness, and information ' +
          'governance.',
      },
      {
        title: 'Chief Data Officer (CDO)',
        accountability:
          'Owns the clinical data estate — data governance, data quality, ' +
          'stewardship, and the value the data delivers downstream.',
      },
      {
        title: 'Interoperability / integration architecture lead',
        accountability:
          'Owns the integration estate, the FHIR and HL7 interfaces, and ' +
          'the HIE / TEFCA exchange connectivity and service levels.',
      },
      {
        title: 'Enterprise data-integrity / MPI steward',
        accountability:
          'Owns patient-identity integrity — the master patient index, ' +
          'duplicate resolution, and merge governance.',
      },
      {
        title: 'Data steward (per clinical data domain)',
        accountability:
          'Owns the quality, definition, and stewardship of a specific ' +
          'core clinical data domain.',
      },
      {
        title: 'Clinical terminologist / informatics lead',
        accountability:
          'Owns the semantic maps to standard terminologies and the ' +
          'integrity of computable clinical data.',
      },
      {
        title: 'Privacy Officer',
        accountability:
          'Owns HIPAA privacy compliance for disclosure, release of ' +
          'information, exchange, and patient access.',
      },
    ],
    regulatoryFrames: [
      {
        name: '21st Century Cures Act — information-blocking rule',
        relevance:
          'Prohibits practices that unreasonably interfere with the ' +
          'access, exchange, or use of electronic health information; it ' +
          'makes timely release, working APIs, and genuine exchange a ' +
          'regulatory obligation, not just a service goal.',
      },
      {
        name: 'ONC Health IT Certification — USCDI and standardised FHIR ' +
          'APIs',
        relevance:
          'Defines the United States Core Data for Interoperability data ' +
          'set and the standardised FHIR API requirements certified health ' +
          'IT must support; it sets the technical bar the ' +
          'interoperability estate is built to.',
      },
      {
        name: 'TEFCA (Trusted Exchange Framework and Common Agreement)',
        relevance:
          'Establishes the common agreement and the QHIN structure for ' +
          'nationwide exchange; participation shapes how the organisation ' +
          'connects to and exchanges with the national network.',
      },
      {
        name: 'HIPAA Privacy and Security Rules — including the right of ' +
          'access',
        relevance:
          'Govern PHI handling, disclosure, and the patient\'s right of ' +
          'timely access to their record; they bound release of ' +
          'information, exchange, and every data-handling workflow.',
      },
      {
        name: '42 CFR Part 2 and state sensitive-information laws',
        relevance:
          'Impose stricter consent and segmentation rules on substance-' +
          'use-disorder and other sensitive information; they constrain ' +
          'how sensitive content is classified, exchanged, and ' +
          'released.',
      },
      {
        name: 'CMS Interoperability and Patient Access / Prior ' +
          'Authorization rules',
        relevance:
          'Require payer-facing and patient-facing FHIR APIs and data ' +
          'exchange; for provider-payer interactions they raise the ' +
          'expectation on the API estate the function operates.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Master patient index (MPI / EMPI)',
        definition:
          'The index that maintains a single, reconciled identity for ' +
          'each patient across all of an organisation\'s source systems.',
      },
      {
        term: 'Duplicate / overlay record',
        definition:
          'A duplicate is more than one record for the same patient; an ' +
          'overlay is one record wrongly holding two patients\' data — ' +
          'both are identity-integrity defects.',
      },
      {
        term: 'FHIR (Fast Healthcare Interoperability Resources)',
        definition:
          'The HL7 standard for representing and exchanging healthcare ' +
          'data via modern APIs — the basis of current interoperability ' +
          'requirements.',
      },
      {
        term: 'TEFCA / QHIN',
        definition:
          'The Trusted Exchange Framework and Common Agreement, and the ' +
          'Qualified Health Information Networks that operate nationwide ' +
          'exchange under it.',
      },
      {
        term: 'Release of information (ROI)',
        definition:
          'The HIM process of responding to authorised requests for ' +
          'copies of the medical record from patients, providers, payers, ' +
          'and legal requesters.',
      },
      {
        term: 'Information blocking',
        definition:
          'A practice that, except as permitted, unreasonably interferes ' +
          'with the access, exchange, or use of electronic health ' +
          'information — prohibited under the Cures Act.',
      },
      {
        term: 'Discharged-not-final-coded (DNFC)',
        definition:
          'The volume of discharged encounters not yet coded — the core ' +
          'measure of the coding backlog and a driver of unbilled ' +
          'accounts-receivable days.',
      },
      {
        term: 'USCDI',
        definition:
          'The United States Core Data for Interoperability — the ' +
          'standardised set of data classes and elements that certified ' +
          'health IT must be able to exchange.',
      },
      {
        term: 'Standard terminology (SNOMED CT, LOINC, RxNorm, ICD-10)',
        definition:
          'The reference code systems for clinical concepts, lab and ' +
          'observation codes, medications, and diagnoses that make ' +
          'clinical data computable and exchangeable.',
      },
      {
        term: 'Record reconciliation',
        definition:
          'The process of matching an inbound external record to the ' +
          'right patient and chart and incorporating its content as ' +
          'usable, clinician-visible information.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Health-Information & Interoperability Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the health-information, data, and interoperability ' +
        'operation is failing — as identity fragmentation, unreconciled ' +
        'exchange, coding backlog, data-quality and integration debt — ' +
        'with baseline evidence, before any solution is shaped.',
      sections: [
        {
          heading: 'Information & interoperability operating context',
          guidance:
            'Describe the landscape — the EHR, the master patient index, ' +
            'the integration estate, the HIE / TEFCA connectivity, the ' +
            'release-of-information and coding operations, and the data-' +
            'governance model. State which data sources are available, ' +
            'how they reconcile, and how fresh they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — record completeness, interoperability ' +
            'exchange rate, ROI turnaround, MPI duplicate rate, ' +
            'data-quality score, coding backlog, FHIR API availability, ' +
            'unreconciled external-record rate, identity-match accuracy, ' +
            'interface error rate, terminology-mapping coverage, internal ' +
            'data-request fulfilment time. For any metric the tenant does ' +
            'not record, name it as a precise seed gap with its expected ' +
            'data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — identity fragmentation, ' +
            'exchange without reconciliation, record incompleteness, ' +
            'coding backlog, terminology fragmentation, integration-estate ' +
            'debt, ungoverned data and slow access, the ROI bottleneck and ' +
            'information-blocking risk — and state which are present, with ' +
            'the detection signal and evidence for each.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity from the value-model benchmark ranges, ' +
            'keeping the operating-efficiency, revenue-cycle-acceleration, ' +
            'and enablement / risk-reduction channels separate. Be ' +
            'explicit that enablement value is indirect and that AR ' +
            'release is a one-time benefit. Every figure a labelled ' +
            'planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the data the diagnosis still needs, who owns each ' +
            'source, and what each gap blocks — call out the attested ' +
            'cost-per-hour and AR-carrying-cost coefficients explicitly as ' +
            'named asks, and note where partner readiness governs the ' +
            'exchange opportunity.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            '— MPI de-duplication, intelligent ROI, data-quality ' +
            'remediation, semantic mapping, interoperability-gap ' +
            'detection, or computer-assisted coding — and why, and what ' +
            'the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Health-Information & Interoperability Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a health-' +
        'information or interoperability AI Move — baseline, multi-channel ' +
        'forecast, cost, and the honest downside, with the one-time-versus-' +
        'recurring distinction made explicit.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into the ' +
            'operating-efficiency, revenue-cycle-acceleration, and ' +
            'enablement / risk-reduction channels, the time-to-value band, ' +
            'and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric. Where a baseline or a monetisation coefficient ' +
            '(cost-per-hour, AR carrying cost) is a seed gap, say so ' +
            'plainly and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'keeping the three channels separate, then apply each dominant ' +
            'haircut — indirect downstream attribution, source-data-' +
            'quality dependency, one-time-versus-recurring, partner ' +
            'dependency — explicitly with the math shown. Recognise AR ' +
            'release as a one-time cash event distinct from the recurring ' +
            'carrying-cost saving, and do not book enablement value that ' +
            'belongs to a consuming function.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the EHR, EMPI, ' +
            'integration engine, ROI, and governance systems, the data-' +
            'quality and terminology remediation effort, and the ' +
            'operating-model and stewardship change.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under poor source-data quality, ' +
            'weak downstream attribution, slow partner readiness, and an ' +
            'AR release that does not recur. State the downside the CFO ' +
            'is underwriting.',
        },
        {
          heading: 'Privacy, compliance & interoperability posture',
          guidance:
            'State the HIPAA, 42 CFR Part 2, information-blocking, and ' +
            'ONC / TEFCA posture, the patient-identity-integrity controls, ' +
            'and the disclosure and wrongful-merge safeguards that keep ' +
            'the capability safe.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — e.g. source-data quality too poor for matching to ' +
            'be safe, or the value rests entirely on indirect downstream ' +
            'attribution — and the evidence required before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the cadence — and flag which ' +
            'enablement value will only read in downstream functions and ' +
            'must not be claimed twice.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Health-Information & Interoperability Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'health-information or interoperability AI capability, grounded in ' +
        'the function reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — the governed identity-resolution layer, the ' +
            'inbound-record reconciliation pipeline, the standards-based ' +
            'FHIR gateway, the data-governance operating model, the ' +
            'enterprise terminology service, and the interoperability ' +
            'observability substrate — and state which apply and how they ' +
            'connect.',
        },
        {
          heading: 'System integration and the exchange estate',
          guidance:
            'Specify the integration to the EHR, EMPI, integration ' +
            'engine, ROI, document-management, and governance systems, ' +
            'the HIE / TEFCA connectivity, and how the FHIR gateway ' +
            'fronts and modernises the legacy interface estate.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'review / approval path. Merges close on steward approval and ' +
            'are reversible; disclosures close on ROI-specialist ' +
            'authorisation; mappings close on terminologist approval.',
        },
        {
          heading: 'Data governance and stewardship operating model',
          guidance:
            'Define the data-ownership and stewardship model, the data-' +
            'quality scorecard, the governed data-access workflow, and ' +
            'how terminology and metadata standards are maintained.',
        },
        {
          heading: 'Privacy, identity-integrity & responsible-AI controls',
          guidance:
            'State the patient-identity-integrity controls (false-match ' +
            'governance, reversible merges, subgroup-bias testing), the ' +
            'disclosure and sensitive-information safeguards, PHI ' +
            'handling, and the regulatory frames (HIPAA, Part 2, ' +
            'information blocking, ONC / TEFCA) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, the ' +
            'interface-estate modernisation path, and the phased, ' +
            'domain-by-domain rollout.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Health-Information & Interoperability Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the health-information or ' +
        'interoperability AI capability so HIM, data, and integration ' +
        'teams actually adopt it and value is realised — not just ' +
        'deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — system integration and validation, a ' +
            'lead-domain or lead-workflow pilot, team onboarding, scale — ' +
            'with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — system ' +
            'integration, identity-resolution governance, the ' +
            'reconciliation pipeline, data stewardship, terminology ' +
            'governance, Tower measurement.',
        },
        {
          heading: 'HIM, data & integration team adoption approach',
          guidance:
            'Define the change runway — training stewards and HIM ' +
            'specialists on the review-and-approve discipline for merges, ' +
            'disclosures, and mappings, and shifting teams from manual ' +
            'processing to exception handling and oversight. State how ' +
            'adoption is measured, not assumed.',
        },
        {
          heading: 'Identity-integrity and data-quality hypercare',
          guidance:
            'Define the hypercare window with elevated stewardship ' +
            'support, a false-match and merge-accuracy review cadence, a ' +
            'mapping-accuracy and disclosure-accuracy audit, and the exit ' +
            'criteria for leaving hypercare.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence — ' +
            'flagging the enablement metrics that will only read in ' +
            'downstream functions.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — false matches, wrongful disclosure, ' +
            'poor source-data quality, partner-readiness delay, ' +
            'integration-estate fragility — with the escalation owner and ' +
            'the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it, including the identity-integrity ' +
            'and data-quality preconditions.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'The true patient-identity integrity — the MPI duplicate and ' +
        'match-accuracy picture',
      authoritativeSource:
        'The EMPI platform\'s duplicate-detection analytics and a ' +
        'human-reviewed reference set of true and false matches.',
      whatGoodEvidenceLooksLike:
        'A measured duplicate rate from the EMPI plus match accuracy ' +
        'validated against a human-reviewed reference set, reporting both ' +
        'the false-match and the missed-match rate, decomposed by source ' +
        'system and subgroup.',
      weakEvidenceToReject:
        'A headline match-accuracy figure with no false-match rate, a ' +
        'vendor benchmark with no tenant validation, or a duplicate ' +
        'estimate with no detection methodology behind it.',
    },
    {
      claim: 'That interoperability is real — records are exchanged and ' +
        'reconciled, not just connected',
      authoritativeSource:
        'HIE / QHIN exchange logs and the external-record reconciliation ' +
        'workflow, reconciled against encounter volume.',
      whatGoodEvidenceLooksLike:
        'An exchange rate and an unreconciled-external-record rate ' +
        'measured from the actual exchange and reconciliation logs, ' +
        'showing how much inbound data reaches the chart as ' +
        'clinician-visible information.',
      weakEvidenceToReject:
        'A count of live HIE / TEFCA connections presented as ' +
        'interoperability, or an exchange volume with no reconciliation ' +
        'rate behind it.',
    },
    {
      claim: 'The clinical data-quality and terminology-mapping baseline',
      authoritativeSource:
        'The data-quality / stewardship platform\'s profiling and ' +
        'conformance results and the terminology-mapping repository.',
      whatGoodEvidenceLooksLike:
        'A data-quality scorecard with the domains, dimensions, and ' +
        'scoring rules stated, and terminology-mapping coverage measured ' +
        'per domain against the source code sets.',
      weakEvidenceToReject:
        'A single composite data-quality number with no scorecard ' +
        'definition, or a mapping-coverage claim with no per-domain ' +
        'breakdown.',
    },
    {
      claim: 'The release-of-information and coding-backlog operating ' +
        'performance',
      authoritativeSource:
        'The ROI workflow system\'s request-lifecycle timestamps and the ' +
        'coding / HIM operations system\'s discharged-not-final-coded ' +
        'data.',
      whatGoodEvidenceLooksLike:
        'Release-of-information turnaround and DNFC backlog measured ' +
        'directly from the workflow systems over a representative period, ' +
        'with the request and encounter mix stated.',
      weakEvidenceToReject:
        'A staffing-model assumption presented as measured turnaround, or ' +
        'a backlog figure with no lifecycle data behind it.',
    },
    {
      claim: 'The forecast value of a health-information or ' +
        'interoperability AI Move',
      authoritativeSource:
        'The value model — the operating-efficiency, revenue-cycle-' +
        'acceleration, and enablement / risk-reduction channels modelled ' +
        'separately and haircut by their dominant factors — with ' +
        'monetisation coefficients attested by Finance.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, the three channels ' +
        'kept separate, each haircut applied explicitly, AR release ' +
        'recognised as a one-time cash event distinct from recurring ' +
        'savings, and enablement value not double-counted against ' +
        'consuming functions. Every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single blended savings number, a one-time AR release booked ' +
        'as a recurring return, enablement value claimed both here and in ' +
        'the consuming function, or a vendor ROI claim taken at face ' +
        'value.',
    },
  ],
};
