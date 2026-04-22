import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FOUNDATIONAL_CONTRADICTION_RULES } from '@/lib/contradictions/foundation';
import { SEEDED_CONTRADICTION_EXAMPLES } from './contradiction-engine-data';
import {
  contradictionScopeId,
  createContradictionSeedClient,
  deterministicUuid,
  loadPeopleMap,
  resolveClientMap,
  scopeIdsForSensitivity,
  upsertRows,
} from './contradiction-engine-lib';
import { TENANTS, type TenantKey } from './seed-wave-lib';

function buildScopeRows() {
  return (Object.keys(TENANTS) as TenantKey[]).flatMap((tenant) => [
    {
      tenant,
      id: contradictionScopeId(tenant, 'reasoning_broad'),
      summary: `${TENANTS[tenant].canonicalName} contradiction reasoning scope`,
      scope_type: 'broad',
      program_ids: [],
      role_filter: [],
      maestro_filter: ['Atlas', 'Nexus', 'Sentinel'],
      output_mode_filter: 'both',
      regulatory_constraints: [],
      conditions: [{ condition: 'contradiction_reasoning_allowed', audience: 'internal' }],
      audit_required: true,
      scope_payload: { pillar: 'candor', audience: 'internal_reasoning' },
    },
    {
      tenant,
      id: contradictionScopeId(tenant, 'program_leadership'),
      summary: `${TENANTS[tenant].canonicalName} contradiction disclosure scope - program leadership`,
      scope_type: 'role',
      program_ids: [],
      role_filter: ['program_lead', 'sponsor', 'executive_advisory'],
      maestro_filter: ['Atlas', 'Nexus'],
      output_mode_filter: 'both',
      regulatory_constraints: [],
      conditions: [{ condition: 'leadership_only_when_high_sensitivity', audience: 'program_leadership' }],
      audit_required: true,
      scope_payload: { pillar: 'candor', audience: 'program_leadership' },
    },
    {
      tenant,
      id: contradictionScopeId(tenant, 'executive_sponsor'),
      summary: `${TENANTS[tenant].canonicalName} contradiction disclosure scope - executive sponsor only`,
      scope_type: 'role',
      program_ids: [],
      role_filter: ['executive_sponsor', 'ceo', 'cfo', 'program_sponsor'],
      maestro_filter: ['Atlas'],
      output_mode_filter: 'both',
      regulatory_constraints: ['named_individual_sensitivity'],
      conditions: [{ condition: 'severe_sensitivity', audience: 'executive_sponsor' }],
      audit_required: true,
      scope_payload: { pillar: 'candor', audience: 'executive_sponsor_only' },
    },
    {
      tenant,
      id: contradictionScopeId(tenant, 'reasoning_only'),
      summary: `${TENANTS[tenant].canonicalName} contradiction reasoning-only disclosure guard`,
      scope_type: 'regulatory_restricted',
      program_ids: [],
      role_filter: [],
      maestro_filter: ['Atlas', 'Nexus', 'Sentinel'],
      output_mode_filter: 'reasoning_only',
      regulatory_constraints: ['reasoning_only'],
      conditions: [{ condition: 'no_surface_disclosure', audience: 'reasoning_only' }],
      audit_required: true,
      scope_payload: { pillar: 'candor', audience: 'reasoning_only' },
    },
  ]);
}

async function main() {
  const sb = await createContradictionSeedClient();
  const clientMap = await resolveClientMap(sb);
  const peopleByName = await loadPeopleMap(sb);

  const { data: brokenRows, error: brokenRowsError } = await sb
    .from('contradictions')
    .select('id')
    .like('detection_rule_id', 'contradiction_rule_%')
    .or('reasoning_scope_id.is.null,disclosure_scope_id.is.null');
  if (brokenRowsError) throw brokenRowsError;
  const brokenIds = ((brokenRows ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (brokenIds.length > 0) {
    await sb.from('contradiction_resolution_actions').delete().in('contradiction_id', brokenIds);
    await sb.from('contradiction_evidence').delete().in('contradiction_id', brokenIds);
    await sb.from('contradictions').delete().in('id', brokenIds);
  }

  const scopeRows = buildScopeRows().map(({ tenant, ...scope }) => ({
    ...scope,
    client_id: clientMap.get(tenant)?.id ?? null,
  }));

  const ruleRows = FOUNDATIONAL_CONTRADICTION_RULES.map((rule) => ({
    id: `contradiction_rule_${rule.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: rule.name,
    category: rule.category,
    description: rule.description,
    signal_query: `foundation://${rule.id}`,
    threshold_conditions: [{ description: rule.description }],
    evidence_requirements: [{ minimum_sources: 2 }],
    temporal_window: rule.temporalWindow,
    applicable_sectors: rule.applicableSectors,
    applicable_company_scales: rule.applicableCompanyScales,
    confidence_multiplier: rule.confidenceMultiplier,
    false_positive_guard: [
      'transition window',
      'explicit trade-off acknowledged',
      'structural reason documented',
      'data freshness within SLA',
    ],
    suppression_rules: ['skip if evidence below category minimum'],
    run_schedule: rule.runSchedule,
    last_run_at: '2026-04-21T00:00:00Z',
    average_contradictions_per_run: 1.33,
    false_positive_rate: 0.08,
    enabled: true,
    version: '1.0',
    last_modified_at: '2026-04-21T00:00:00Z',
  }));

  const runRows = SEEDED_CONTRADICTION_EXAMPLES.map((entry) => {
    const clientId = clientMap.get(entry.tenant)?.id;
    if (!clientId) throw new Error(`Missing client id for ${entry.tenant}`);
    const ruleId = `contradiction_rule_${entry.detectionRuleId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    return {
      id: deterministicUuid(`contradiction-run:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}`),
      client_id: clientId,
      rule_id: ruleId,
      trigger_type: 'manual_seed',
      run_started_at: entry.firstDetectedAt,
      run_finished_at: entry.lastRefreshedAt,
      contradictions_created: 1,
      contradictions_updated: 0,
      run_payload: {
        seeded_example: true,
        tenant: entry.tenant,
        rule: entry.detectionRuleId,
      },
    };
  });

  const contradictionRows = SEEDED_CONTRADICTION_EXAMPLES.map((entry) => {
    const clientId = clientMap.get(entry.tenant)?.id;
    if (!clientId) throw new Error(`Missing client id for ${entry.tenant}`);
    const personIds = entry.implicatedPersonNames
      .map((name) => peopleByName.get(name)?.id)
      .filter((value): value is string => Boolean(value));
    const ruleId = `contradiction_rule_${entry.detectionRuleId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const runId = deterministicUuid(`contradiction-run:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}`);
    const contradictionId = deterministicUuid(`contradiction:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}`);
    const scopeIds = scopeIdsForSensitivity(entry.tenant, entry.sensitivity);
    return {
      id: contradictionId,
      client_id: clientId,
      use_case_id: null,
      contradiction_type: entry.contradictionType,
      severity: entry.severity,
      summary: entry.shortTitle,
      description: entry.longDescription,
      suggested_action: entry.recommendedConversationContext,
      evidence: {
        chain: entry.evidence.map((evidence, index) => ({
          id: `contradiction_evidence_${entry.tenant}_${entry.detectionRuleId.toLowerCase()}_${index + 1}`,
          title: evidence.title,
          summary: evidence.summary,
          role: evidence.evidenceRole,
          observed_at: evidence.observedAt,
        })),
        source_count: entry.sourceCount,
      },
      impact: {
        stakes_score: entry.stakesScore,
        stakes_components: entry.stakesComponents,
        implied_action: entry.recommendedConversationContext,
        implicated_people: entry.implicatedPersonNames,
      },
      detected_at: entry.firstDetectedAt,
      resolved_at: entry.resolutionState === 'resolved' ? entry.lastRefreshedAt : null,
      resolution_notes: entry.resolutionState === 'acknowledged' ? 'Acknowledged trade-off; kept open for monitoring.' : null,
      triggered_engagement_id: null,
      short_title: entry.shortTitle,
      long_description: entry.longDescription,
      category: entry.category,
      subcategory: entry.subcategory,
      temporal_state: entry.temporalState,
      severity_label: entry.severityLabel,
      confidence_level: entry.confidence,
      sensitivity: entry.sensitivity,
      stakes_score: entry.stakesScore,
      stakes_components: entry.stakesComponents,
      evidence_ids: entry.evidence.map(
        (_evidence, index) => `contradiction_evidence_${entry.tenant}_${entry.detectionRuleId.toLowerCase()}_${index + 1}`,
      ),
      source_count: entry.sourceCount,
      implicated_priority_refs: entry.implicatedPriorityRefs,
      implicated_initiative_refs: entry.implicatedInitiativeRefs,
      implicated_person_ids: personIds,
      implicated_kpi_ids: entry.implicatedKpiIds,
      implicated_external_event_ids: entry.implicatedExternalEventIds,
      related_pattern_ids: entry.relatedPatternIds,
      first_detected_at: entry.firstDetectedAt,
      last_refreshed_at: entry.lastRefreshedAt,
      last_evidence_change_at: entry.lastRefreshedAt,
      resolution_state: entry.resolutionState,
      resolution_evidence_ids: [],
      reasoning_scope_id: scopeIds.reasoningScopeId,
      disclosure_scope_id: scopeIds.disclosureScopeId,
      suppress_until: null,
      surfacing_priority: entry.surfacingPriority,
      recommended_conversation_context: entry.recommendedConversationContext,
      detection_rule_id: ruleId,
      detection_run_id: runId,
      created_by: entry.createdBy,
      reviewer_notes: [],
    };
  });

  const evidenceRows = SEEDED_CONTRADICTION_EXAMPLES.flatMap((entry) => {
    const clientId = clientMap.get(entry.tenant)?.id;
    if (!clientId) throw new Error(`Missing client id for ${entry.tenant}`);
    const scopeIds = scopeIdsForSensitivity(entry.tenant, entry.sensitivity);
    return entry.evidence.map((evidence, index) => ({
      id: `contradiction_evidence_${entry.tenant}_${entry.detectionRuleId.toLowerCase()}_${index + 1}`,
      client_id: clientId,
      source_id: null,
      title: evidence.title,
      summary: evidence.summary,
      evidence_type: evidence.evidenceType,
      related_entity_type: 'contradiction',
      related_entity_id: deterministicUuid(`contradiction:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}`),
      observed_at: evidence.observedAt,
      methodology_notes: evidence.methodologyNotes,
      reasoning_scope_id: scopeIds.reasoningScopeId,
      disclosure_scope_id: scopeIds.disclosureScopeId,
      as_of_date: evidence.observedAt,
      confidence_level: entry.confidence,
      last_verified_at: `${evidence.observedAt}T00:00:00Z`,
      evidence_payload: {
        seeded_example: true,
        tenant: entry.tenant,
        rule: entry.detectionRuleId,
        evidence_role: evidence.evidenceRole,
      },
    }));
  });

  const evidenceLinkRows = SEEDED_CONTRADICTION_EXAMPLES.flatMap((entry) =>
    entry.evidence.map((evidence, index) => ({
      id: deterministicUuid(`contradiction-link:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}:${index}`),
      contradiction_id: deterministicUuid(`contradiction:${entry.tenant}:${entry.detectionRuleId}:${entry.shortTitle}`),
      evidence_id: `contradiction_evidence_${entry.tenant}_${entry.detectionRuleId.toLowerCase()}_${index + 1}`,
      evidence_role: evidence.evidenceRole,
      temporal_relevance: evidence.temporalRelevance,
      source_diversity: evidence.sourceDiversity,
      sort_order: index,
      notes: null,
    })),
  );

  await upsertRows(sb, 'access_scopes', scopeRows);
  await upsertRows(sb, 'contradiction_detection_rules', ruleRows);
  await upsertRows(sb, 'contradiction_detection_runs', runRows);
  await upsertRows(sb, 'contradictions', contradictionRows);
  await upsertRows(sb, 'evidence', evidenceRows);
  await upsertRows(sb, 'contradiction_evidence', evidenceLinkRows);

  console.log('Contradiction engine seeded');
  console.log(`  access scopes       - ${scopeRows.length}`);
  console.log(`  detection rules     - ${ruleRows.length}`);
  console.log(`  detection runs      - ${runRows.length}`);
  console.log(`  contradictions      - ${contradictionRows.length}`);
  console.log(`  evidence rows       - ${evidenceRows.length}`);
  console.log(`  evidence links      - ${evidenceLinkRows.length}`);
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
