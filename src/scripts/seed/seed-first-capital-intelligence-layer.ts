import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';
import { getScopeId, loadFirstCapitalOverlay } from './first-capital-intelligence-layer-lib';

interface ClientRow {
  id: string;
  name: string;
  legal_name: string | null;
}

interface PersonRow {
  id: string;
  name: string;
  role: string | null;
}

async function resolveFirstCapitalClient(sb: SupabaseClient): Promise<ClientRow> {
  for (const field of [
    { column: 'name', value: TENANTS.first_capital.shortName },
    { column: 'name', value: TENANTS.first_capital.canonicalName },
    { column: 'legal_name', value: TENANTS.first_capital.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, legal_name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error('First Capital client missing. Run `npm run db:seed:wave -- --tenant first_capital` first.');
}

async function assertBaseSeedPresent(sb: SupabaseClient, clientId: string): Promise<void> {
  const { data, error } = await sb
    .from('org_master_data')
    .select('category')
    .eq('org_id', clientId)
    .in('category', ['people_roster', 'active_initiatives', 'active_patterns', 'benchmark_data', 'vendor_landscape'])
    .limit(10);
  if (error) throw error;
  const categories = new Set(((data ?? []) as Array<{ category: string }>).map((row) => row.category));
  const missing = ['people_roster', 'active_initiatives', 'active_patterns', 'benchmark_data', 'vendor_landscape']
    .filter((category) => !categories.has(category));
  if (missing.length > 0) {
    throw new Error(`First Capital base seed incomplete. Missing categories: ${missing.join(', ')}`);
  }
}

async function loadPeopleByName(sb: SupabaseClient): Promise<Map<string, PersonRow>> {
  const { data, error } = await sb
    .from('persons')
    .select('id, name, role')
    .eq('organization', TENANTS.first_capital.canonicalName);
  if (error) throw error;
  const index = new Map<string, PersonRow>();
  for (const row of (data ?? []) as PersonRow[]) {
    index.set(row.name.toLowerCase(), row);
    if (row.role) index.set(row.role.toLowerCase(), row);
  }
  return index;
}

function resolveOwnerPerson(peopleByName: Map<string, PersonRow>, ownerName: string | null, ownerRoleTitle: string | null): PersonRow | null {
  if (ownerName) {
    const byName = peopleByName.get(ownerName.toLowerCase());
    if (byName) return byName;
  }
  if (ownerRoleTitle) {
    const byRole = peopleByName.get(ownerRoleTitle.toLowerCase());
    if (byRole) return byRole;
  }
  return null;
}

async function upsertRows(
  sb: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 50;
  for (let idx = 0; idx < rows.length; idx += batchSize) {
    const batch = rows.slice(idx, idx + batchSize);
    const { error } = await sb.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function clearExistingOverlayState(sb: SupabaseClient, clientId: string): Promise<void> {
  for (const table of [
    'evidence',
    'kpis',
    'pattern_packs',
    'telemetry_sources',
    'external_events',
    'external_sources',
    'benchmark_cohorts',
    'access_scopes',
    'legal_privileged_contexts',
  ]) {
    const { error } = await sb.from(table).delete().eq('client_id', clientId);
    if (error) throw error;
  }
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();
  const client = await resolveFirstCapitalClient(sb);
  await assertBaseSeedPresent(sb, client.id);
  const peopleByName = await loadPeopleByName(sb);
  const overlay = loadFirstCapitalOverlay();
  await clearExistingOverlayState(sb, client.id);

  const accessScopeRows = overlay.accessScopes.map((scope) => ({
    id: scope.id,
    client_id: client.id,
    summary: scope.summary,
    scope_type: scope.scopeType,
    program_ids: scope.programIds,
    role_filter: scope.roleFilter,
    maestro_filter: scope.maestroFilter,
    output_mode_filter: scope.outputModeFilter,
    regulatory_constraints: scope.regulatoryConstraints,
    conditions: scope.conditions,
    audit_required: scope.auditRequired,
    scope_payload: scope.scopePayload,
  }));

  const benchmarkRows = overlay.benchmarkCohorts.map((cohort) => ({
    id: cohort.id,
    client_id: client.id,
    name: cohort.name,
    sector: cohort.sector,
    subsector: cohort.subsector,
    size_band: cohort.sizeBand,
    geography: cohort.geography,
    business_model: cohort.businessModel,
    maturity: cohort.maturity,
    peer_count: cohort.peerCount,
    is_primary: cohort.isPrimary,
    peer_companies: cohort.peerCompanies,
    methodology_notes: cohort.methodologyNotes,
    confidence_level: cohort.confidenceLevel,
    as_of_date: cohort.asOfDate,
    last_verified_at: `${cohort.asOfDate}T00:00:00Z`,
    metadata: cohort.metadata,
  }));

  const externalSourceRows = overlay.externalSources.map((source) => ({
    id: source.id,
    client_id: client.id,
    name: source.name,
    description: source.description,
    source_tier: source.sourceTier,
    source_type: source.sourceType,
    publisher: source.publisher,
    source_url: source.sourceUrl,
    geography_scope: source.geographyScope,
    topic_scope: source.topicScope,
    confidence_level: source.confidenceLevel,
    as_of_date: source.asOfDate,
    last_verified_at: `${source.asOfDate}T00:00:00Z`,
    metadata: source.metadata,
  }));

  const externalEventRows = overlay.externalEvents.map((event) => ({
    id: event.id,
    client_id: client.id,
    source_id: event.sourceId,
    title: event.title,
    summary: event.summary,
    event_type: event.eventType,
    event_date: event.eventDate,
    entities: event.entities,
    topics: event.topics,
    geography: event.geography,
    significance: event.significance,
    reasoning_scope_id: getScopeId(event.reasoningScopeSummary),
    disclosure_scope_id: getScopeId(event.disclosureScopeSummary),
    as_of_date: event.asOfDate,
    confidence_level: event.confidenceLevel,
    last_verified_at: `${event.asOfDate}T00:00:00Z`,
    event_payload: event.eventPayload,
  }));

  const kpiRows = overlay.kpis.map((kpi) => {
    const owner = resolveOwnerPerson(peopleByName, kpi.ownerName, kpi.ownerRoleTitle);
    return ({
    id: kpi.id,
    client_id: client.id,
    ordinal_ref: kpi.ordinalRef,
    name: kpi.name,
    short_name: kpi.shortName,
    definition: kpi.definition,
    category: kpi.category,
    subcategory: kpi.subcategory,
    sector_applicability: kpi.sectorApplicability,
    owner_role_title: kpi.ownerRoleTitle,
    owner_person_id: owner?.id ?? null,
    owner_person_name: owner?.name ?? kpi.ownerName,
    business_unit_name: kpi.businessUnitName,
    strategic_priority_ref: kpi.strategicPriorityRef,
    target_value: kpi.targetValue,
    target_unit: kpi.targetUnit,
    target_as_of_date: kpi.targetAsOfDate,
    target_period: kpi.targetPeriod,
    current_value: kpi.currentValue,
    current_unit: kpi.currentUnit,
    current_as_of_date: kpi.currentAsOfDate,
    trend_direction: kpi.trendDirection,
    trend_magnitude_pct: kpi.trendMagnitudePct,
    trend_period: kpi.trendPeriod,
    trend_summary: kpi.trendSummary,
    benchmark_median: kpi.benchmarkMedian,
    benchmark_top_quartile: kpi.benchmarkTopQuartile,
    benchmark_bottom_quartile: kpi.benchmarkBottomQuartile,
    benchmark_peer_cohort_id: kpi.benchmarkPeerCohortId,
    benchmark_as_of_date: kpi.benchmarkAsOfDate,
    benchmark_confidence: kpi.benchmarkConfidence,
    gap_to_median_pct: kpi.gapToMedianPct,
    gap_to_top_quartile_pct: kpi.gapToTopQuartilePct,
    peer_position_quartile: kpi.peerPositionQuartile,
    linked_initiative_refs: kpi.linkedInitiativeRefs,
    linked_pattern_ids: kpi.linkedPatternIds,
    data_source: kpi.dataSource,
    data_source_type: kpi.dataSourceType,
    freshness_sla: kpi.freshnessSla,
    confidence_level: kpi.confidenceLevel,
    why_it_matters: kpi.whyItMatters,
    methodology_notes: kpi.methodologyNotes,
    reasoning_scope_id: getScopeId(kpi.reasoningScopeSummary),
    disclosure_scope_id: getScopeId(kpi.disclosureScopeSummary),
    as_of_date: kpi.currentAsOfDate ?? '2026-04-21',
    last_verified_at: `${kpi.currentAsOfDate ?? '2026-04-21'}T00:00:00Z`,
    evidence_ids: [`evidence_${kpi.id}`],
    raw_markdown: kpi.rawMarkdown,
    metadata: kpi.metadata,
  });
  });

  const patternRows = overlay.patternPacks.map((pattern) => ({
    id: pattern.id,
    client_id: client.id,
    ordinal_ref: pattern.ordinalRef,
    name: pattern.name,
    short_description: pattern.shortDescription,
    long_description: pattern.longDescription,
    category: pattern.category,
    sector_applicability: pattern.sectorApplicability,
    cross_industry: pattern.crossIndustry,
    variant_of: pattern.variantOf,
    trigger_symptoms: pattern.triggerSymptoms,
    detection_signals: pattern.detectionSignals,
    likely_root_causes: pattern.likelyRootCauses,
    intervention_options: pattern.interventionOptions,
    phase_1_deliverables: pattern.phaseDeliverables.phase1,
    phase_2_deliverables: pattern.phaseDeliverables.phase2,
    phase_3_deliverables: pattern.phaseDeliverables.phase3,
    phase_4_deliverables: pattern.phaseDeliverables.phase4,
    linked_kpi_ids: pattern.linkedKpiIds,
    evidence_summary: pattern.evidenceSummary,
    confidence_level: pattern.confidenceLevel,
    last_updated: '2026-04-21',
    version: pattern.version,
    author: pattern.author,
    reasoning_scope_id: getScopeId(pattern.reasoningScopeSummary),
    disclosure_scope_id: getScopeId(pattern.disclosureScopeSummary),
    as_of_date: '2026-04-21',
    last_verified_at: '2026-04-21T00:00:00Z',
    raw_markdown: pattern.rawMarkdown,
    metadata: {
      ...pattern.metadata,
      linked_kpi_names: pattern.linkedKpiNames,
      expected_outcomes: pattern.expectedOutcomes,
      required_sponsor_profile: pattern.requiredSponsorProfile,
    },
  }));

  const telemetryRows = overlay.telemetrySources.map((source) => ({
    id: source.id,
    client_id: client.id,
    name: source.name,
    description: source.description,
    modality: source.modality,
    connector_type: source.connectorType,
    source_location: source.sourceLocation,
    credentials_reference: source.credentialsReference,
    refresh_schedule: source.refreshSchedule,
    kpi_ids_populated: source.kpiIdsPopulated,
    scope_description: source.scopeDescription,
    data_format: source.dataFormat,
    residency_mode: source.residencyMode,
    retention_policy: source.retentionPolicy,
    compliance_tags: source.complianceTags,
    regulatory_notes: source.regulatoryNotes,
    reasoning_scope_id: getScopeId(source.reasoningScopeSummary),
    disclosure_scope_id: getScopeId(source.disclosureScopeSummary),
    onboarded_at: '2026-04-21T00:00:00Z',
    program_association: source.programAssociation,
    sunset_policy: 'Re-evaluate at program completion per north star Part 9.8',
    access_log_reference: `audit://${source.id}`,
    last_refreshed_at: '2026-04-21T00:00:00Z',
    as_of_date: source.asOfDate,
    confidence_level: source.confidenceLevel,
    last_verified_at: `${source.asOfDate}T00:00:00Z`,
    raw_markdown: source.rawMarkdown,
    metadata: source.metadata,
  }));

  const evidenceRows = overlay.evidence.map((item) => ({
    id: item.id,
    client_id: client.id,
    source_id: item.sourceId,
    title: item.title,
    summary: item.summary,
    evidence_type: item.evidenceType,
    related_entity_type: item.relatedEntityType,
    related_entity_id: item.relatedEntityId,
    observed_at: item.observedAt,
    methodology_notes: item.methodologyNotes,
    reasoning_scope_id: getScopeId(item.reasoningScopeSummary),
    disclosure_scope_id: getScopeId(item.disclosureScopeSummary),
    as_of_date: item.asOfDate,
    confidence_level: item.confidenceLevel,
    last_verified_at: `${item.asOfDate}T00:00:00Z`,
    evidence_payload: item.evidencePayload,
  }));

  const legalContextRows = [
    {
      id: 'firstcap_legal_ctx_bsa_aml_consent_order',
      client_id: client.id,
      context_description: 'BSA/AML consent-order remediation material, including dashboard metrics and regulator-facing operating context.',
      privilege_type: 'regulatory_examination',
      duration: 'active',
      related_entities: ['firstcap_bsa_aml_dashboard', 'firstcap_pattern_aml_bsa_compliance_modernization', 'firstcap_aml_alert_volume', 'firstcap_aml_false_positive_rate'],
      access_scope_id: getScopeId('program-scoped + legal-privileged'),
      metadata: { source_spec: 'first-capital-intelligence-layer-overlay.md', sensitivity: 'extreme' },
    },
    {
      id: 'firstcap_legal_ctx_regulatory_exam_tracker',
      client_id: client.id,
      context_description: 'Regulatory examination and audit tracker content subject to legal-privileged and regulator-confidential handling.',
      privilege_type: 'regulatory_examination',
      duration: 'active',
      related_entities: ['firstcap_regulatory_exam_tracker', 'firstcap_regulatory_exam_findings_open'],
      access_scope_id: getScopeId('program-scoped + legal-privileged'),
      metadata: { source_spec: 'first-capital-intelligence-layer-overlay.md', sensitivity: 'extreme' },
    },
    {
      id: 'firstcap_legal_ctx_fair_lending_model_risk',
      client_id: client.id,
      context_description: 'Fair-lending and model-risk material associated with AI-enabled decisioning in customer and lending workflows.',
      privilege_type: 'work_product',
      duration: 'active',
      related_entities: ['firstcap_pattern_shadow_ai_in_lending_and_customer_operations', 'firstcap_pattern_digital_customer_acquisition_gap'],
      access_scope_id: getScopeId('program-scoped'),
      metadata: { source_spec: 'first-capital-intelligence-layer-overlay.md', sensitivity: 'high' },
    },
    {
      id: 'firstcap_legal_ctx_historical_exam_archive',
      client_id: client.id,
      context_description: 'Historical exam and remediation archive retained for future comparative reasoning with disclosure constraints still attached.',
      privilege_type: 'regulatory_examination',
      duration: 'historical',
      related_entities: ['firstcap_pattern_operating_model_efficiency_gap', 'firstcap_pattern_portfolio_concentration_risk_management'],
      access_scope_id: getScopeId('program-scoped + legal-privileged'),
      metadata: { source_spec: 'first-capital-intelligence-layer-overlay.md', sensitivity: 'high' },
    },
  ];

  await upsertRows(sb, 'access_scopes', accessScopeRows);
  await upsertRows(sb, 'benchmark_cohorts', benchmarkRows);
  await upsertRows(sb, 'external_sources', externalSourceRows);
  await upsertRows(sb, 'external_events', externalEventRows);
  await upsertRows(sb, 'kpis', kpiRows);
  await upsertRows(sb, 'pattern_packs', patternRows);
  await upsertRows(sb, 'telemetry_sources', telemetryRows);
  await upsertRows(sb, 'evidence', evidenceRows);
  await upsertRows(sb, 'legal_privileged_contexts', legalContextRows);

  console.log('\nFirst Capital intelligence layer seeded');
  console.log(`  access scopes      · ${accessScopeRows.length}`);
  console.log(`  benchmark cohorts  · ${benchmarkRows.length}`);
  console.log(`  external sources   · ${externalSourceRows.length}`);
  console.log(`  external events    · ${externalEventRows.length}`);
  console.log(`  kpis               · ${kpiRows.length}`);
  console.log(`  pattern packs      · ${patternRows.length}`);
  console.log(`  telemetry sources  · ${telemetryRows.length}`);
  console.log(`  evidence           · ${evidenceRows.length}`);
  console.log(`  legal contexts     · ${legalContextRows.length}`);
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
