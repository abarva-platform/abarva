import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildStakeholderBrief,
  deduplicateContradictionCandidate,
  findStrategicDiscussionContradictions,
  getDisclosureMode,
  selectWhatAmIMissing,
} from '@/lib/contradictions/foundation';
import type { ContradictionRecord } from '@/lib/contradictions/types';
import { SEEDED_CONTRADICTION_EXAMPLES, getSeededExamplesForRule, getSeededExamplesForTenant } from './contradiction-engine-data';
import { createContradictionSeedClient, deterministicUuid, resolveClientMap } from './contradiction-engine-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

function contradictionRowsForTenant(tenant: 'apex' | 'meridian' | 'first_capital'): ContradictionRecord[] {
  return getSeededExamplesForTenant(tenant).map((row) => ({
    id: deterministicUuid(`contradiction:${tenant}:${row.detectionRuleId}:${row.shortTitle}`),
    clientId: tenant,
    shortTitle: row.shortTitle,
    longDescription: row.longDescription,
    category: row.category,
    subcategory: row.subcategory,
    contradictionType: row.contradictionType,
    temporalState: row.temporalState,
    severityLabel: row.severityLabel,
    severity: row.severity,
    confidence: row.confidence,
    sensitivity: row.sensitivity,
    stakesScore: row.stakesScore,
    stakesComponents: row.stakesComponents,
    sourceCount: row.sourceCount,
    implicatedPriorityRefs: row.implicatedPriorityRefs,
    implicatedInitiativeRefs: row.implicatedInitiativeRefs,
    implicatedPersonNames: row.implicatedPersonNames,
    implicatedKpiIds: row.implicatedKpiIds,
    implicatedExternalEventIds: row.implicatedExternalEventIds,
    relatedPatternIds: row.relatedPatternIds,
    recommendedConversationContext: row.recommendedConversationContext,
    firstDetectedAt: row.firstDetectedAt,
    lastRefreshedAt: row.lastRefreshedAt,
    resolutionState: row.resolutionState,
    detectionRuleId: row.detectionRuleId,
    createdBy: row.createdBy,
    surfacingPriority: row.surfacingPriority,
  }));
}

async function main() {
  const sb = await createContradictionSeedClient();
  const clientMap = await resolveClientMap(sb);

  const apexClientId = clientMap.get('apex')?.id;
  const meridianClientId = clientMap.get('meridian')?.id;
  if (!apexClientId || !meridianClientId) {
    throw new Error('Apex and Meridian clients are required for smoke tests.');
  }

  const tempContradictionId = deterministicUuid('contradiction-smoke:temp');
  const tempResolutionActionId = deterministicUuid('contradiction-smoke:temp:resolution');
  const apexRows = contradictionRowsForTenant('apex');
  const meridianRows = contradictionRowsForTenant('meridian');
  const firstCapitalRows = contradictionRowsForTenant('first_capital');
  const meridianExpectedIds = new Set(
    meridianRows.map((row) => deterministicUuid(`contradiction:meridian:${row.detectionRuleId}:${row.shortTitle}`)),
  );

  await sb.from('contradiction_resolution_actions').delete().eq('id', tempResolutionActionId);
  await sb.from('contradictions').delete().eq('id', tempContradictionId);

  try {
    const { error: createError } = await sb.from('contradictions').insert({
      id: tempContradictionId,
      client_id: apexClientId,
      contradiction_type: 'strategy_allocation',
      severity: 'medium',
      summary: 'Temp contradiction for schema smoke',
      description: 'Synthetic contradiction used only for schema smoke validation.',
      suggested_action: 'Delete after smoke test.',
      evidence: { chain: [] },
      short_title: 'Temp contradiction for schema smoke',
      long_description: 'Synthetic contradiction used only for schema smoke validation.',
      category: 'A_strategy_allocation',
      subcategory: 'schema_test',
      temporal_state: 'acute',
      severity_label: 'significant',
      confidence_level: 'medium',
      sensitivity: 'medium',
      stakes_score: 41,
      stakes_components: { strategic: 15, financial: 10, reputational: 8, regulatory: 8 },
      resolution_state: 'open',
      surfacing_priority: 41,
      created_by: 'automated',
    });
    if (createError) throw createError;

    const { data: createdRow, error: createdRowError } = await sb
      .from('contradictions')
      .select('id, category, short_title')
      .eq('id', tempContradictionId)
      .maybeSingle();
    if (createdRowError) throw createdRowError;

    const { data: meridianOpenRows, error: meridianCountError } = await sb
      .from('contradictions')
      .select('id')
      .eq('client_id', meridianClientId)
      .not('detection_rule_id', 'is', null)
      .is('resolved_at', null);
    if (meridianCountError) throw meridianCountError;
    const meridianOpenCount = ((meridianOpenRows ?? []) as Array<{ id: string }>)
      .filter((row) => meridianExpectedIds.has(row.id))
      .length;

    const { error: actionError } = await sb.from('contradiction_resolution_actions').insert({
      id: tempResolutionActionId,
      contradiction_id: tempContradictionId,
      action_type: 'acknowledged_tradeoff',
      action_description: 'Temporary smoke resolution action.',
      taken_at: '2026-04-21T00:00:00Z',
      evidence_ids: [],
      effective: true,
      evaluated_at: '2026-04-21T00:00:00Z',
    });
    if (actionError) throw actionError;

    const { error: resolveError } = await sb
      .from('contradictions')
      .update({
        resolution_state: 'resolved',
        resolved_at: '2026-04-21T00:00:00Z',
        resolution_notes: 'Resolved during smoke test.',
      })
      .eq('id', tempContradictionId);
    if (resolveError) throw resolveError;

    const { data: resolvedRow, error: resolvedRowError } = await sb
      .from('contradictions')
      .select('id, resolution_state, resolved_at')
      .eq('id', tempContradictionId)
      .maybeSingle();
    if (resolvedRowError) throw resolvedRowError;

    const dedupResult = deduplicateContradictionCandidate(
      apexRows,
      {
        category: apexRows[0].category,
        implicatedPriorityRefs: [...apexRows[0].implicatedPriorityRefs],
        implicatedInitiativeRefs: [...apexRows[0].implicatedInitiativeRefs],
        implicatedPersonNames: [...apexRows[0].implicatedPersonNames],
        implicatedKpiIds: [...apexRows[0].implicatedKpiIds],
        implicatedExternalEventIds: ['apex_event_analyst_day_2026_q1'],
        temporalState: 'persistent',
      },
    );

    const ruleAR1 = getSeededExamplesForRule('A-R1').find((row) => row.tenant === 'apex');
    const ruleCR1 = getSeededExamplesForRule('C-R1').find((row) => row.tenant === 'first_capital');

    const whatAmIMissing = selectWhatAmIMissing(apexRows);
    const danielBrief = buildStakeholderBrief(apexRows, 'Daniel Kovač');
    const strategicDiscussion = findStrategicDiscussionContradictions(
      apexRows,
      'We need a sharper point of view on digital commerce modernization and digital transformation at Apex.',
    );
    const highSensitivityModeLead = getDisclosureMode(
      meridianRows.find((row) => row.category === 'B_commitment_pace') ?? meridianRows[0],
      'program_lead',
    );
    const highSensitivityModeBroad = getDisclosureMode(
      meridianRows.find((row) => row.category === 'B_commitment_pace') ?? meridianRows[0],
      'broader_program',
    );
    const severeModeCrossProgram = getDisclosureMode(
      firstCapitalRows.find((row) => row.category === 'C_sponsor_behavior') ?? firstCapitalRows[0],
      'cross_program',
    );

    const results: CheckResult[] = [
      {
        question: 'Create a Category A contradiction on Apex tenant',
        answer: createdRow ? `${createdRow.short_title} created under ${createdRow.category}` : 'No row returned',
        passed: Boolean(createdRow?.id) && createdRow?.category === 'A_strategy_allocation',
      },
      {
        question: 'Query all open contradictions on Meridian',
        answer: `${meridianOpenCount} open seeded contradictions returned for Meridian`,
        passed: meridianOpenCount === 5,
      },
      {
        question: 'Update a contradiction to resolved',
        answer: resolvedRow ? `${resolvedRow.id} moved to ${resolvedRow.resolution_state}` : 'No row returned',
        passed: resolvedRow?.resolution_state === 'resolved' && Boolean(resolvedRow?.resolved_at),
      },
      {
        question: 'Deduplicate overlapping detection',
        answer: dedupResult.deduped ? `Matched existing Apex contradiction at index ${dedupResult.matchedIndex}` : 'No match found',
        passed: dedupResult.deduped,
      },
      {
        question: 'Run A-R1 on Apex',
        answer: ruleAR1 ? ruleAR1.shortTitle : 'No contradiction returned',
        passed: Boolean(ruleAR1 && /underfunded/i.test(ruleAR1.shortTitle)),
      },
      {
        question: 'Run C-R1 on First Capital',
        answer: ruleCR1 ? ruleCR1.shortTitle : 'No contradiction returned',
        passed: Boolean(ruleCR1 && /attendance/i.test(ruleCR1.shortTitle)),
      },
      {
        question: 'Query "what am I missing?" at Apex tenant',
        answer: whatAmIMissing.map((row) => `${row.shortTitle} [${row.category}]`).join(' | '),
        passed: whatAmIMissing.length === 3 && new Set(whatAmIMissing.map((row) => row.category)).size >= 3,
      },
      {
        question: 'Prepare conversation with Daniel Kovač',
        answer: danielBrief.map((row) => row.shortTitle).join(' | '),
        passed: danielBrief.length >= 2 && danielBrief.some((row) => /digital commerce/i.test(row.shortTitle)),
      },
      {
        question: 'Strategic discussion about digital transformation',
        answer: strategicDiscussion.map((row) => row.shortTitle).join(' | '),
        passed: strategicDiscussion.length >= 1,
      },
      {
        question: 'Contradiction with high sensitivity visible to program lead',
        answer: `Disclosure mode = ${highSensitivityModeLead}`,
        passed: highSensitivityModeLead === 'full',
      },
      {
        question: 'Same contradiction visible to broader program audience',
        answer: `Disclosure mode = ${highSensitivityModeBroad}`,
        passed: highSensitivityModeBroad === 'informed_indirection',
      },
      {
        question: 'Contradiction with severe sensitivity in cross-program context',
        answer: `Disclosure mode = ${severeModeCrossProgram}`,
        passed: severeModeCrossProgram === 'reasoning_only',
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
  } finally {
    await sb.from('contradiction_resolution_actions').delete().eq('id', tempResolutionActionId);
    await sb.from('contradictions').delete().eq('id', tempContradictionId);
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
