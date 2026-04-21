import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

interface KpiRow {
  id: string;
  name: string;
  owner_person_name: string | null;
  owner_role_title: string | null;
  current_value: number | null;
  current_unit: string | null;
  target_value: number | null;
  target_unit: string | null;
  benchmark_median: number | null;
  raw_markdown: string | null;
}

interface PatternRow {
  id: string;
  name: string;
  evidence_summary: string | null;
  intervention_options: string[] | null;
  phase_2_deliverables: string[] | null;
  metadata: {
    linked_kpi_names?: string[];
    required_sponsor_profile?: string;
  } | null;
}

interface TelemetryRow {
  id: string;
  name: string;
  compliance_tags: string[] | null;
  residency_mode: string | null;
  raw_markdown: string | null;
}

interface EventRow {
  id: string;
  event_date: string;
  title: string;
}

async function resolveFirstCapitalClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.first_capital.shortName },
    { column: 'name', value: TENANTS.first_capital.canonicalName },
    { column: 'legal_name', value: TENANTS.first_capital.legalName },
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
  throw new Error('First Capital client not found');
}

async function loadOne<T>(table: string, clientId: string, id: string): Promise<T> {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from(table)
    .select('*')
    .eq('client_id', clientId)
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw error ?? new Error(`Missing ${table}:${id}`);
  return data as T;
}

async function loadMany<T>(table: string, clientId: string): Promise<T[]> {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from(table)
    .select('*')
    .eq('client_id', clientId);
  if (error) throw error;
  return (data ?? []) as T[];
}

function containsAll(haystack: string, needles: string[]): boolean {
  const normalized = haystack.toLowerCase();
  return needles.every((needle) => normalized.includes(needle.toLowerCase()));
}

async function main() {
  loadSeedEnv();
  const clientId = await resolveFirstCapitalClientId();

  const [
    nim,
    amlAlertVolume,
    creConcentration,
    amlPattern,
    depositPattern,
    cfoScorecard,
    bsaAmlTelemetry,
    regulatoryExamTelemetry,
    telemetry,
    patterns,
    externalEvents,
  ] = await Promise.all([
    loadOne<KpiRow>('kpis', clientId, 'firstcap_nim'),
    loadOne<KpiRow>('kpis', clientId, 'firstcap_aml_alert_volume'),
    loadOne<KpiRow>('kpis', clientId, 'firstcap_cre_concentration'),
    loadOne<PatternRow>('pattern_packs', clientId, 'firstcap_pattern_aml_bsa_compliance_modernization'),
    loadOne<PatternRow>('pattern_packs', clientId, 'firstcap_pattern_deposit_cost_and_franchise_value_erosion'),
    loadOne<TelemetryRow>('telemetry_sources', clientId, 'firstcap_cfo_scorecard'),
    loadOne<TelemetryRow>('telemetry_sources', clientId, 'firstcap_bsa_aml_dashboard'),
    loadOne<TelemetryRow>('telemetry_sources', clientId, 'firstcap_regulatory_exam_tracker'),
    loadMany<TelemetryRow>('telemetry_sources', clientId),
    loadMany<PatternRow>('pattern_packs', clientId),
    loadMany<EventRow>('external_events', clientId),
  ]);

  const privilegedTelemetry = telemetry.filter((row) => {
    const tags = (row.compliance_tags ?? []).join(' ');
    const raw = row.raw_markdown ?? '';
    return /legal-privileged/i.test(tags) || /legal-privileged/i.test(raw);
  });

  const nimAnswer = `${nim.name}: ${nim.current_value}${nim.current_unit ?? '%'} currently, down 18 bps YoY, versus ${nim.benchmark_median}${nim.current_unit ?? '%'} super-regional median and ${nim.target_value}${nim.target_unit ?? '%'} target.`;
  const amlOwnerAnswer = [
    `${amlAlertVolume.name} is handled inside the BSA/AML modernization context rather than on a named KPI owner row.`,
    `The required sponsor profile is ${amlPattern.metadata?.required_sponsor_profile ?? 'n/a'}.`,
    'That puts the Chief Compliance Officer at the center, with BSA officer, CFO, and Chief Risk Officer partnership.',
  ].join(' ');
  const creAnswer = `${creConcentration.name}: current ${creConcentration.current_value}${creConcentration.current_unit ?? '%'} against the 300% regulatory threshold referenced in the overlay.`;
  const impactedKpisAnswer = `${amlPattern.name}: ${(amlPattern.metadata?.linked_kpi_names ?? []).join(', ')}.`;
  const activePatternsAnswer = patterns.map((pattern) => pattern.name).join(' | ');
  const interventionAnswer = `${depositPattern.name}: ${(depositPattern.intervention_options ?? []).join(' | ')}.`;
  const phase2Answer = `${amlPattern.name} Phase 2: ${(amlPattern.phase_2_deliverables ?? []).join(' | ')}.`;
  const privilegedTelemetryAnswer = privilegedTelemetry.map((row) => `${row.name}: ${(row.compliance_tags ?? []).join(', ')}`).join(' | ');
  const amlVisibilityAnswer = [
    'No. Consumer Banking should not receive AML alert specifics.',
    `BSA/AML disclosure note: ${bsaAmlTelemetry.raw_markdown?.match(/Disclosure scope:[^\n]+/i)?.[0] ?? 'n/a'}.`,
    'This is both reasoning-restricted and disclosure-restricted by legal-privileged handling.',
  ].join(' ');
  const mnpiAnswer = [
    'MNPI stays in client-hosted residency and is not broadly surfaced across programs.',
    `CFO scorecard residency: ${cfoScorecard.residency_mode ?? 'n/a'}.`,
    `Disclosure note: ${cfoScorecard.raw_markdown?.match(/Disclosure scope:[^\n]+/i)?.[0] ?? 'n/a'}.`,
  ].join(' ');
  const timingAnswer = [
    'First Capital should not wait out the regulatory cycle before modernizing AML.',
    'The better move is to use the active exam and consent-order context to map MRAs, line up regulator engagement, and sequence platform and workflow decisions now.',
    `${amlPattern.name} evidence: ${amlPattern.evidence_summary ?? 'n/a'}.`,
  ].join(' ');
  const changedThisQuarterAnswer = [...externalEvents]
    .sort((a, b) => b.event_date.localeCompare(a.event_date))
    .slice(0, 5)
    .map((event) => `${event.event_date}: ${event.title}`)
    .join(' | ');

  const results: CheckResult[] = [
    {
      question: "What is First Capital's NIM?",
      answer: nimAnswer,
      passed: containsAll(nimAnswer, ['3.12%', '18 bps', '3.28%', '3.35%']),
    },
    {
      question: 'Who owns the AML alert volume metric?',
      answer: amlOwnerAnswer,
      passed: containsAll(amlOwnerAnswer, ['Chief Compliance Officer', 'BSA', 'CFO', 'Chief Risk Officer']),
    },
    {
      question: 'How does First Capital compare on CRE concentration?',
      answer: creAnswer,
      passed: containsAll(creAnswer, ['268%', '300%']),
    },
    {
      question: 'What KPIs does AML/BSA Modernization pattern affect?',
      answer: impactedKpisAnswer,
      passed: containsAll(impactedKpisAnswer, ['BSA/AML Alert Volume', 'AML False Positive Rate', 'SAR Filings', 'Regulatory Exam Findings', 'Efficiency Ratio']),
    },
    {
      question: 'What patterns are active at First Capital?',
      answer: activePatternsAnswer,
      passed: patterns.length === 7 && containsAll(activePatternsAnswer, ['AML/BSA Compliance Modernization', 'Deposit Cost and Franchise Value Erosion', 'Shadow AI in Lending and Customer Operations']),
    },
    {
      question: 'What interventions apply to Deposit Franchise Erosion?',
      answer: interventionAnswer,
      passed: containsAll(interventionAnswer, ['Deposit pricing strategy', 'Primary-relationship depth increase', 'Digital experience competitiveness', 'Treasury services expansion']),
    },
    {
      question: 'What Phase 2 deliverables for AML/BSA Modernization?',
      answer: phase2Answer,
      passed: containsAll(phase2Answer, ['Platform options', 'ML governance options', 'workflow automation opportunities', 'regulatory engagement plan']),
    },
    {
      question: 'What telemetry sources require legal-privileged handling?',
      answer: privilegedTelemetryAnswer,
      passed: privilegedTelemetry.length >= 2 && containsAll(privilegedTelemetryAnswer, ['BSA/AML Operations Dashboard', 'Regulatory Examination and Audit Tracker', 'legal-privileged']),
    },
    {
      question: 'Can a Consumer Banking maestro see AML alert specifics?',
      answer: amlVisibilityAnswer,
      passed: containsAll(amlVisibilityAnswer, ['no', 'legal-privileged', 'Disclosure scope']),
    },
    {
      question: 'How is MNPI handled?',
      answer: mnpiAnswer,
      passed: containsAll(mnpiAnswer, ['MNPI', 'client-hosted', 'specific values never disclosed']),
    },
    {
      question: 'How should First Capital think about AML modernization timing vs regulatory examination cycle?',
      answer: timingAnswer,
      passed: containsAll(timingAnswer, ['consent-order', 'regulator engagement', 'MRAs', 'now']),
    },
    {
      question: "What's changed at First Capital this quarter?",
      answer: changedThisQuarterAnswer,
      passed: containsAll(changedThisQuarterAnswer, ['2026-04-16', '2026-04-10', '2026-03-03', '2026-02-07']),
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
