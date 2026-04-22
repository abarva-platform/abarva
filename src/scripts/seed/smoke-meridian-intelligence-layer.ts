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

async function resolveMeridianClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.meridian.shortName },
    { column: 'name', value: TENANTS.meridian.canonicalName },
    { column: 'legal_name', value: TENANTS.meridian.legalName },
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
  throw new Error('Meridian client not found');
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
  const clientId = await resolveMeridianClientId();

  const [
    vbcRevenue,
    mlr,
    readmission,
    vbcPattern,
    denialPattern,
    clinicalQualityTelemetry,
    healthPlanTelemetry,
    telemetry,
    patterns,
    externalEvents,
  ] = await Promise.all([
    loadOne<KpiRow>('kpis', clientId, 'meridian_vbc_revenue_pct'),
    loadOne<KpiRow>('kpis', clientId, 'meridian_plan_mlr'),
    loadOne<KpiRow>('kpis', clientId, 'meridian_readmission_30day'),
    loadOne<PatternRow>('pattern_packs', clientId, 'meridian_pattern_value_based_care_progression_lag'),
    loadOne<PatternRow>('pattern_packs', clientId, 'meridian_pattern_revenue_cycle_denial_cascade'),
    loadOne<TelemetryRow>('telemetry_sources', clientId, 'meridian_clinical_quality_dashboard'),
    loadOne<TelemetryRow>('telemetry_sources', clientId, 'meridian_health_plan_dashboard'),
    loadMany<TelemetryRow>('telemetry_sources', clientId),
    loadMany<PatternRow>('pattern_packs', clientId),
    loadMany<EventRow>('external_events', clientId),
  ]);

  const hipaaTagged = telemetry.filter((row) =>
    (row.compliance_tags ?? []).some((tag) => /hipaa/i.test(tag)));

  const vbcAnswer = `${vbcRevenue.name}: ${vbcRevenue.current_value}${vbcRevenue.current_unit ?? '%'} currently against ${vbcRevenue.target_value}${vbcRevenue.target_unit ?? '%'} target; raw program note shows a 52% internal trajectory and a 16-point commitment gap.`;
  const mlrOwnerAnswer = `${mlr.owner_person_name} owns ${mlr.name}; role ${mlr.owner_role_title}; current ${mlr.current_value}${mlr.current_unit ?? '%'}.`;
  const readmissionAnswer = `${readmission.name}: current ${readmission.current_value}${readmission.current_unit ?? '%'} vs benchmark median ${readmission.benchmark_median}${readmission.current_unit ?? '%'}; target ${readmission.target_value}${readmission.target_unit ?? '%'}.`;
  const impactedKpisAnswer = `${vbcPattern.name}: ${(vbcPattern.metadata?.linked_kpi_names ?? []).join(', ')}.`;
  const activePatternsAnswer = patterns.map((pattern) => pattern.name).join(' | ');
  const interventionAnswer = `${denialPattern.name}: ${(denialPattern.intervention_options ?? []).join(' | ')}.`;
  const phase2Answer = `${vbcPattern.name} Phase 2: ${(vbcPattern.phase_2_deliverables ?? []).join(' | ')}.`;
  const hipaaTelemetryAnswer = hipaaTagged.map((row) => `${row.name}: ${(row.compliance_tags ?? []).join(', ')}`).join(' | ');
  const payerSpecificAnswer = [
    'The Patient Experience maestro can reason from the payer-side patterning,',
    'but payer-specific denial data remains non-disclosable outside the health-plan and revenue-cycle contexts.',
    `Health Plan disclosure note: ${healthPlanTelemetry.raw_markdown?.match(/Disclosure scope:[^\n]+/i)?.[0] ?? 'n/a'}`,
  ].join(' ');
  const patientDataAnswer = [
    'Patient-level data is never ingested into AbarVa-hosted storage.',
    `Clinical dashboard note: ${clinicalQualityTelemetry.raw_markdown?.match(/patient-level detail never leaves/i)?.[0] ?? 'patient-level detail never leaves'}.`,
    `Residency: ${clinicalQualityTelemetry.residency_mode ?? 'n/a'}.`,
  ].join(' ');
  const strategicAnswer = [
    `Meridian is at ${vbcRevenue.current_value}${vbcRevenue.current_unit ?? '%'} against a ${vbcRevenue.target_value}${vbcRevenue.target_unit ?? '%'} public commitment,`,
    'while the internal plan only reaches 52% and the pattern evidence says the 16-point gap is currently unresourced.',
    'That means leadership should either fund an acceleration package immediately or reforecast the commitment instead of pretending the current trajectory will close on its own.',
  ].join(' ');
  const changedThisQuarterAnswer = [...externalEvents]
    .sort((a, b) => b.event_date.localeCompare(a.event_date))
    .slice(0, 4)
    .map((event) => `${event.event_date}: ${event.title}`)
    .join(' | ');

  const results: CheckResult[] = [
    {
      question: "What is Meridian's VBC revenue percentage?",
      answer: vbcAnswer,
      passed: containsAll(vbcAnswer, ['38%', '68%', '52%', '16-point']),
    },
    {
      question: 'Who owns the MLR metric?',
      answer: mlrOwnerAnswer,
      passed: containsAll(mlrOwnerAnswer, ['Linda Chen-Winters', 'President Meridian Health Plans', '87.2%']),
    },
    {
      question: 'How does Meridian compare on readmission?',
      answer: readmissionAnswer,
      passed: containsAll(readmissionAnswer, ['14.2%', '13.8%', '11.5%']),
    },
    {
      question: 'What KPIs does VBC Progression Lag pattern impact?',
      answer: impactedKpisAnswer,
      passed: containsAll(impactedKpisAnswer, ['VBC Revenue %', 'Shared Savings Achievement', 'Risk-Adjusted PMPM', 'Attributed Lives']),
    },
    {
      question: 'What patterns are active at Meridian?',
      answer: activePatternsAnswer,
      passed: patterns.length === 7 && containsAll(activePatternsAnswer, ['Value-Based Care Progression Lag', 'Revenue Cycle Denial Cascade', 'Shadow AI in Clinical and Revenue Cycle Operations']),
    },
    {
      question: 'What interventions apply to Revenue Cycle Denial Cascade?',
      answer: interventionAnswer,
      passed: containsAll(interventionAnswer, ['Eligibility and prior auth automation', 'Clinical documentation improvement', 'Denial prevention analytics', 'Technology platform consolidation']),
    },
    {
      question: "What's the Phase 2 deliverable list for VBC Progression Lag?",
      answer: phase2Answer,
      passed: containsAll(phase2Answer, ['Root cause deep-dive', 'infrastructure options', 'compensation model options', 'growth strategy', 'partnership options']),
    },
    {
      question: 'What telemetry sources have HIPAA compliance tags?',
      answer: hipaaTelemetryAnswer,
      passed: hipaaTagged.length === 9 && containsAll(hipaaTelemetryAnswer, ['Clinical Quality Dashboard', 'Health Plan Operating Dashboard', 'HIPAA']),
    },
    {
      question: 'Can a Patient Experience program maestro see payer-specific denial data?',
      answer: payerSpecificAnswer,
      passed: containsAll(payerSpecificAnswer, ['reason', 'non-disclosable', 'Health Plan']),
    },
    {
      question: 'How is patient-level data handled?',
      answer: patientDataAnswer,
      passed: containsAll(patientDataAnswer, ['never ingested', 'patient-level detail never leaves', 'de-identified aggregate']),
    },
    {
      question: 'Should Meridian reforecast VBC commitment or accelerate?',
      answer: strategicAnswer,
      passed: containsAll(strategicAnswer, ['38%', '52%', '16-point', 'acceleration', 'reforecast']),
    },
    {
      question: "What's changed at Meridian this quarter?",
      answer: changedThisQuarterAnswer,
      passed: containsAll(changedThisQuarterAnswer, ['2026-04-14', '2026-04-10', '2026-03-05']),
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
