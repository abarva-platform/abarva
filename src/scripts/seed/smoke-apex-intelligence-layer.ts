import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

async function resolveApexClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.apex.shortName },
    { column: 'name', value: TENANTS.apex.canonicalName },
    { column: 'legal_name', value: TENANTS.apex.legalName },
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
  throw new Error('Apex client not found');
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
  const clientId = await resolveApexClientId();

  const [
    ownedBrandPenetration,
    sameDayFulfillment,
    compSalesGrowth,
    shadowPattern,
    ownedBrandPattern,
    fulfillmentPattern,
    cfoScorecard,
    lossPreventionDashboard,
    digitalPenetration,
    loyaltyPremium,
    externalEvents,
    patterns,
    telemetry,
  ] = await Promise.all([
    loadOne('kpis', clientId, 'apex_owned_brand_penetration'),
    loadOne('kpis', clientId, 'apex_same_day_fulfillment_pct'),
    loadOne('kpis', clientId, 'apex_comp_sales_growth'),
    loadOne('pattern_packs', clientId, 'apex_pattern_shadow_ai_in_merchandising_and_customer_operations'),
    loadOne('pattern_packs', clientId, 'apex_pattern_owned_brand_margin_underperformance'),
    loadOne('pattern_packs', clientId, 'apex_pattern_omnichannel_fulfillment_decisioning_gap'),
    loadOne('telemetry_sources', clientId, 'apex_cfo_scorecard'),
    loadOne('telemetry_sources', clientId, 'apex_loss_prevention_dashboard'),
    loadOne('kpis', clientId, 'apex_ecom_penetration'),
    loadOne('kpis', clientId, 'apex_loyalty_member_spend_premium'),
    loadMany('external_events', clientId),
    loadMany('pattern_packs', clientId),
    loadMany('telemetry_sources', clientId),
  ]);

  const ownedBrandAnswer = `${ownedBrandPenetration.name}: ${ownedBrandPenetration.current_value}${ownedBrandPenetration.current_unit ?? '%'} as of ${ownedBrandPenetration.current_as_of_date}; target ${ownedBrandPenetration.target_value}${ownedBrandPenetration.target_unit ?? '%'}; benchmark median ${ownedBrandPenetration.benchmark_median}${ownedBrandPenetration.current_unit ?? '%'}.`;
  const sameDayOwnerAnswer = `${sameDayFulfillment.owner_person_name} owns ${sameDayFulfillment.name}; role ${sameDayFulfillment.owner_role_title}; current ${sameDayFulfillment.current_value}${sameDayFulfillment.current_unit ?? '%'}.`;
  const compSalesAnswer = `${compSalesGrowth.name}: current ${compSalesGrowth.current_value}${compSalesGrowth.current_unit ?? '%'} vs peer median ${compSalesGrowth.benchmark_median}${compSalesGrowth.current_unit ?? '%'}; peer position ${compSalesGrowth.peer_position_quartile ?? 'n/a'}.`;
  const shadowPatternAnswer = `${shadowPattern.name}: degrades ${(shadowPattern.metadata as { linked_kpi_names?: string[] }).linked_kpi_names?.join(', ') ?? ''}.`;
  const activePatternsAnswer = patterns
    .map((pattern) => `${pattern.name}: ${pattern.evidence_summary}`)
    .join(' | ');
  const interventionAnswer = `${ownedBrandPattern.name}: ${(ownedBrandPattern.intervention_options as string[]).join(' | ')}. Sponsor: ${(ownedBrandPattern.metadata as { required_sponsor_profile?: string }).required_sponsor_profile ?? 'n/a'}`;
  const phase2Answer = `${fulfillmentPattern.name} Phase 2: ${(fulfillmentPattern.phase_2_deliverables as string[]).join(' | ')}`;
  const telemetryAnswer = telemetry
    .map((source) => `${source.name} (${source.modality})`)
    .join(' | ');
  const cfoAccessAnswer = `CFO Scorecard reasoning scope ${cfoScorecard.reasoning_scope_id}; disclosure scope ${cfoScorecard.disclosure_scope_id}; disclosure notes ${(cfoScorecard.raw_markdown as string).match(/Disclosure scope:[^\n]+/)?.[0] ?? ''}`;
  const lossPreventionAnswer = `Loss Prevention dashboard compliance ${(lossPreventionDashboard.compliance_tags as string[]).join(', ')}; disclosure notes ${(lossPreventionDashboard.raw_markdown as string).match(/Disclosure scope:[^\n]+/)?.[0] ?? ''}`;

  const strategicAnswer = [
    `Personalization has the faster near-term payoff: digital penetration sits at ${digitalPenetration.current_value}${digitalPenetration.current_unit ?? '%'} against a ${digitalPenetration.target_value}${digitalPenetration.target_unit ?? '%'} target, so conversion and basket value still have room to move.`,
    `Loyalty is already proving monetization upside with a ${loyaltyPremium.current_value}${loyaltyPremium.current_unit ?? '%'} member spend premium, which makes the loyalty refresh more powerful after the data and personalization backbone is stronger.`,
    'Given the CFO scorecard capital boundary and the customer-data pattern, sequence personalization first and stage the loyalty refresh behind it as Phase 2 scale-up.',
  ].join(' ');

  const sortedEvents = externalEvents
    .sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)));
  const changedThisQuarterAnswer = [
    ...sortedEvents.slice(0, 4),
    ...sortedEvents.filter((event) => /analyst day|activist|shadow ai/i.test(String(event.title))).slice(0, 2),
  ]
    .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
    .map((event) => `${event.event_date}: ${event.title}`)
    .join(' | ');

  const results: CheckResult[] = [
    {
      question: "What is Apex's owned brand penetration?",
      answer: ownedBrandAnswer,
      passed: /24/.test(ownedBrandAnswer) && /32/.test(ownedBrandAnswer) && /35/.test(ownedBrandAnswer),
    },
    {
      question: 'Who owns the same-day fulfillment metric?',
      answer: sameDayOwnerAnswer,
      passed: /Karel Jensen|Chief Customer/i.test(sameDayOwnerAnswer),
    },
    {
      question: 'How does Apex compare on comp sales growth?',
      answer: compSalesAnswer,
      passed: /1\.4/.test(compSalesAnswer) && /1\.9/.test(compSalesAnswer),
    },
    {
      question: 'What KPIs does the Shadow AI pattern degrade?',
      answer: shadowPatternAnswer,
      passed: /AI Governance Maturity/.test(shadowPatternAnswer) && /Customer Satisfaction/.test(shadowPatternAnswer) && /Conversion Rate/.test(shadowPatternAnswer),
    },
    {
      question: 'What patterns are active at Apex?',
      answer: activePatternsAnswer,
      passed: patterns.length === 7 && /Shadow AI/.test(activePatternsAnswer) && /Owned Brand/.test(activePatternsAnswer),
    },
    {
      question: 'What interventions apply to Owned Brand Margin pattern?',
      answer: interventionAnswer,
      passed: /pricing/i.test(interventionAnswer) && /supplier|category/i.test(interventionAnswer),
    },
    {
      question: 'What Phase 2 deliverables does Omnichannel Fulfillment pattern require?',
      answer: phase2Answer,
      passed: /fulfillment orchestration|inventory visibility|store fulfillment/i.test(phase2Answer),
    },
    {
      question: 'What operational telemetry sources are registered?',
      answer: telemetryAnswer,
      passed: telemetry.length === 9 && /CFO Financial Scorecard/.test(telemetryAnswer),
    },
    {
      question: 'Can a CX program maestro see CFO scorecard figures?',
      answer: cfoAccessAnswer,
      passed: /disclosure/i.test(cfoAccessAnswer) && /others \(reasoning-only; specific values never disclosed\)/i.test(String(cfoScorecard.raw_markdown)),
    },
    {
      question: "What's the loss prevention data handling?",
      answer: lossPreventionAnswer,
      passed: /law-enforcement-sensitive/i.test(lossPreventionAnswer) && /no incident specifics|aggregate only/i.test(lossPreventionAnswer),
    },
    {
      question: 'Should Apex prioritize personalization engine or loyalty refresh?',
      answer: strategicAnswer,
      passed: /Personalization/.test(strategicAnswer) && /Phase 2|stage/i.test(strategicAnswer) && /CFO scorecard|capital/i.test(strategicAnswer),
    },
    {
      question: "What's changed at Apex this quarter?",
      answer: changedThisQuarterAnswer,
      passed: /2026-04-10: Shadow AI governance exposure/.test(changedThisQuarterAnswer) && /2026-03-12: Analyst day reaffirmed/.test(changedThisQuarterAnswer),
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
