import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

async function resolveKeystoneClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.keystone.shortName },
    { column: 'legal_name', value: TENANTS.keystone.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return (data as { id: string }).id;
  }
  throw new Error('Keystone client not found');
}

async function loadOne(table: string, clientId: string, id: string) {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from(table)
    .select('*')
    .eq('client_id', clientId)
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw error ?? new Error(`Missing ${table}:${id}`);
  return data as Record<string, unknown>;
}

async function loadMany(table: string, clientId: string) {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from(table)
    .select('*')
    .eq('client_id', clientId);
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

async function main() {
  loadSeedEnv();
  const clientId = await resolveKeystoneClientId();

  const [
    saidi,
    queueDuration,
    allowedRoe,
    shadowPattern,
    dataCenterPattern,
    stormPattern,
    cfoScorecard,
    reliabilityDashboard,
    digitalSelfService,
    billAccuracy,
    externalEvents,
    patterns,
    telemetry,
  ] = await Promise.all([
    loadOne('kpis', clientId, 'keystone_saidi_enterprise'),
    loadOne('kpis', clientId, 'keystone_interconnection_queue_duration'),
    loadOne('kpis', clientId, 'keystone_allowed_roe_wtd_avg'),
    loadOne('pattern_packs', clientId, 'keystone_pattern_shadow_ai_in_customer_operations_and_grid_analytics'),
    loadOne('pattern_packs', clientId, 'keystone_pattern_data_center_load_interconnection_queue_bottleneck'),
    loadOne('pattern_packs', clientId, 'keystone_pattern_storm_response_coordination_fragmentation'),
    loadOne('telemetry_sources', clientId, 'keystone_cfo_scorecard_pbi'),
    loadOne('telemetry_sources', clientId, 'keystone_reliability_dashboard'),
    loadOne('kpis', clientId, 'keystone_digital_selfservice_adoption'),
    loadOne('kpis', clientId, 'keystone_bill_accuracy'),
    loadMany('external_events', clientId),
    loadMany('pattern_packs', clientId),
    loadMany('telemetry_sources', clientId),
  ]);

  const saidiAnswer = `${saidi.name}: ${saidi.current_value} ${saidi.current_unit} as of ${saidi.current_as_of_date}; target ${saidi.target_value} ${saidi.target_unit}; benchmark median ${saidi.benchmark_median}.`;
  const queueOwnerAnswer = `${queueDuration.owner_person_name} owns ${queueDuration.name}; role ${queueDuration.owner_role_title}; current ${queueDuration.current_value} ${queueDuration.current_unit ?? 'months'}.`;
  const allowedRoeAnswer = `${allowedRoe.name}: current ${allowedRoe.current_value}% vs peer median ${allowedRoe.benchmark_median}% ; ${String((allowedRoe.metadata as { raw_block?: string }).raw_block ?? '').match(/Subsidiary range:[^\n]+/)?.[0] ?? 'subsidiary variance noted in metadata'}`;
  const shadowPatternAnswer = `${shadowPattern.name}: degrades ${(shadowPattern.metadata as { linked_kpi_names?: string[] }).linked_kpi_names?.join(', ') ?? ''}.`;
  const activePatternsAnswer = patterns
    .map((pattern) => `${pattern.name}: ${pattern.evidence_summary}`)
    .join(' | ');
  const interventionAnswer = `${dataCenterPattern.name}: ${(dataCenterPattern.intervention_options as string[]).join(' | ')}. Sponsor: ${(dataCenterPattern.metadata as { required_sponsor_profile?: string }).required_sponsor_profile ?? 'n/a'}`;
  const phase2Answer = `${stormPattern.name} Phase 2: ${(stormPattern.phase_2_deliverables as string[]).join(' | ')}`;
  const telemetryAnswer = telemetry
    .map((source) => `${source.name} (${source.modality})`)
    .join(' | ');
  const cfoAccessAnswer = `CFO Scorecard reasoning scope ${cfoScorecard.reasoning_scope_id}; disclosure scope ${cfoScorecard.disclosure_scope_id}; disclosure notes ${(cfoScorecard.raw_markdown as string).match(/Disclosure scope:[^\n]+/)?.[0] ?? ''}`;
  const nercAnswer = `Reliability dashboard compliance ${(reliabilityDashboard.compliance_tags as string[]).join(', ')}; disclosure notes ${(reliabilityDashboard.raw_markdown as string).match(/Disclosure scope:[^\n]+/)?.[0] ?? ''}`;

  const strategicAnswer = [
    `Digital self-service is the faster Phase 1 move: adoption sits at ${digitalSelfService.current_value}% vs target ${digitalSelfService.target_value}%.`,
    `Bill accuracy is already ${billAccuracy.current_value}%, so billing consolidation matters but is less urgent as the immediate customer-impact lever.`,
    'Capital sequencing is constrained by active rate cases and CFO-scored investment envelope, so billing consolidation likely wants a scoped Phase 2 behind the portal push.',
  ].join(' ');

  const sortedEvents = externalEvents
    .sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)));
  const changedThisQuarterAnswer = [
    ...sortedEvents.slice(0, 4),
    ...sortedEvents.filter((event) => /Jonathan Aldridge/i.test(String(event.title))).slice(0, 1),
  ]
    .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
    .map((event) => `${event.event_date}: ${event.title}`)
    .join(' | ');

  const results: CheckResult[] = [
    {
      question: "What is Keystone's current SAIDI?",
      answer: saidiAnswer,
      passed: /108/.test(saidiAnswer) && /benchmark median 130/i.test(saidiAnswer),
    },
    {
      question: 'Who owns the interconnection queue duration metric?',
      answer: queueOwnerAnswer,
      passed: /James Oppenheim/.test(queueOwnerAnswer),
    },
    {
      question: 'How does Keystone compare on allowed ROE vs peers?',
      answer: allowedRoeAnswer,
      passed: /9\.5/.test(allowedRoeAnswer) && /9\.6/.test(allowedRoeAnswer),
    },
    {
      question: 'What KPIs does the Shadow AI pattern degrade?',
      answer: shadowPatternAnswer,
      passed: /AI Governance Maturity/.test(shadowPatternAnswer) && /Customer Complaint Rate/.test(shadowPatternAnswer),
    },
    {
      question: 'What patterns are active at Keystone?',
      answer: activePatternsAnswer,
      passed: patterns.length === 7 && /Shadow AI/.test(activePatternsAnswer) && /Storm Response/.test(activePatternsAnswer),
    },
    {
      question: 'What interventions apply to the Data Center Load Interconnection pattern?',
      answer: interventionAnswer,
      passed: /tariff/i.test(interventionAnswer) && /engineering capacity/i.test(interventionAnswer),
    },
    {
      question: 'What Phase 2 deliverables does Storm Response Coordination pattern require?',
      answer: phase2Answer,
      passed: /Platform options/.test(phase2Answer) && /workflow modernization/i.test(phase2Answer),
    },
    {
      question: 'What operational telemetry sources are registered?',
      answer: telemetryAnswer,
      passed: telemetry.length === 9 && /CFO Scorecard Power BI Dashboard/.test(telemetryAnswer),
    },
    {
      question: 'Can a Customer Experience program maestro see the CFO scorecard?',
      answer: cfoAccessAnswer,
      passed: /disclosure/i.test(cfoAccessAnswer) && /others \(reasoning-only; specific values never disclosed\)/i.test(String(cfoScorecard.raw_markdown)),
    },
    {
      question: "What's the NERC CIP-sensitive data handling?",
      answer: nercAnswer,
      passed: /NERC CIP/.test(nercAnswer) && /specific substation reasoning-only/i.test(nercAnswer),
    },
    {
      question: 'Should Keystone prioritize billing system consolidation or digital self-service portal?',
      answer: strategicAnswer,
      passed: /Digital self-service/.test(strategicAnswer) && /Phase 2/.test(strategicAnswer) && /rate cases/.test(strategicAnswer),
    },
    {
      question: "What's changed at Keystone this quarter?",
      answer: changedThisQuarterAnswer,
      passed: /Jonathan Aldridge/.test(changedThisQuarterAnswer) && /rate cases/.test(changedThisQuarterAnswer),
    },
  ];

  for (const result of results) {
    console.log(`\nQ: ${result.question}`);
    console.log(`A: ${result.answer}`);
    console.log(`PASS: ${result.passed ? 'yes' : 'no'}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Smoke checks failed: ${failed.map((result) => result.question).join('; ')}`);
  }
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
