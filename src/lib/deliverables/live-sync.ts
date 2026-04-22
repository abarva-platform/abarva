import type { ParsedDecision, ParsedGateApproval } from '@/lib/agent/parse';
import {
  stripActualMetricsBlock,
  stripDecisionBlocks,
  stripGateApprovalBlock,
  stripOutcomeFeeBlock,
} from '@/lib/agent/parse';
import type { TurnRow } from '@/lib/db/turn';
import { getServerSupabase } from '@/lib/supabase-server';

const PHASE1_DELIVERABLE_KEYS = ['charter', 'stakeholder_map', 'risk_register'] as const;

type DeliverableKey = (typeof PHASE1_DELIVERABLE_KEYS)[number];

type DeliverableRow = {
  id: string;
  deliverable_type_key: DeliverableKey;
  current_version: number;
  title: string;
};

type VersionRow = {
  deliverable_id: string;
  version: number;
  content: string;
  structured_data: unknown;
  generated_from_context_hash: string | null;
};

type Phase1LiveSyncArgs = {
  engagementId: string;
  currentPhase: number;
  userTurn: TurnRow;
  agentTurn: TurnRow;
  decisions: ParsedDecision[];
  gateApproval: ParsedGateApproval | null;
};

type SessionSignal = {
  recorded_at: string;
  source: 'user' | 'agent';
  summary: string;
};

type DecisionNote = {
  recorded_at: string;
  summary: string;
  rationale: string;
  decision_maker: string;
  impact: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => isRecord(item)) : [];
}

function sanitizeTurnText(text: string): string {
  return stripOutcomeFeeBlock(
    stripActualMetricsBlock(stripGateApprovalBlock(stripDecisionBlocks(text))),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max = 240): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function dedupeByJson<T>(items: T[], max: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function extractSessionSignals(args: Phase1LiveSyncArgs): SessionSignal[] {
  const userSummary = truncate(sanitizeTurnText(args.userTurn.text), 220);
  const agentSummary = truncate(sanitizeTurnText(args.agentTurn.text), 220);

  const signals: SessionSignal[] = [];
  if (userSummary) {
    signals.push({
      recorded_at: args.userTurn.created_at,
      source: 'user',
      summary: userSummary,
    });
  }
  if (agentSummary) {
    signals.push({
      recorded_at: args.agentTurn.created_at,
      source: 'agent',
      summary: agentSummary,
    });
  }
  return signals;
}

function extractDecisionNotes(args: Phase1LiveSyncArgs): DecisionNote[] {
  return args.decisions.map((decision) => ({
    recorded_at: args.agentTurn.created_at,
    summary: decision.summary,
    rationale: decision.rationale,
    decision_maker: decision.decision_maker,
    impact: decision.impact,
  }));
}

function mergeSessionSignals(content: Record<string, unknown>, args: Phase1LiveSyncArgs): Record<string, unknown> {
  const existing = asObjectArray(content.recent_alignment_signals);
  const merged = dedupeByJson(
    [...extractSessionSignals(args), ...existing] as Array<Record<string, unknown>>,
    8,
  );
  return {
    ...content,
    recent_alignment_signals: merged,
    latest_working_session: {
      phase: args.currentPhase,
      user_turn_id: args.userTurn.id,
      agent_turn_id: args.agentTurn.id,
      updated_at: args.agentTurn.created_at,
      sponsor_signal: truncate(sanitizeTurnText(args.userTurn.text), 300),
      nexus_response: truncate(sanitizeTurnText(args.agentTurn.text), 300),
    },
  };
}

function mergeCharterContent(content: Record<string, unknown>, args: Phase1LiveSyncArgs): Record<string, unknown> {
  const merged = mergeSessionSignals(content, args);
  const scope = asRecord(merged.scope);
  const existingDecisions = asObjectArray(scope.boundary_decisions);
  const newDecisions = args.decisions.map((decision) => ({
    question: decision.summary,
    decision: decision.impact,
    rationale: decision.rationale,
  }));

  return {
    ...merged,
    scope: {
      ...scope,
      boundary_decisions: dedupeByJson(
        [...newDecisions, ...existingDecisions] as Array<Record<string, unknown>>,
        10,
      ),
    },
    working_decisions: dedupeByJson(
      [...extractDecisionNotes(args), ...asObjectArray(merged.working_decisions)] as Array<Record<string, unknown>>,
      8,
    ),
    gate_conditions_passed: args.gateApproval
      ? dedupeByJson(
          [
            {
              condition: `Phase ${args.gateApproval.phase} approved`,
              evidence: args.gateApproval.summary,
              confirmed_by: 'sponsor_or_maestro',
              confirmed_at: args.agentTurn.created_at,
            },
            ...asObjectArray(merged.gate_conditions_passed),
          ],
          8,
        )
      : merged.gate_conditions_passed,
  };
}

function mergeStakeholderContent(content: Record<string, unknown>, args: Phase1LiveSyncArgs): Record<string, unknown> {
  const merged = mergeSessionSignals(content, args);
  const stakeholders = asObjectArray(merged.stakeholders).map((stakeholder) => {
    const relationship = stakeholder.relationship_to_program;
    if (relationship !== 'sponsor' && relationship !== 'co_sponsor') return stakeholder;
    return {
      ...stakeholder,
      commitment_status: args.gateApproval ? 'committed' : 'engaged',
      last_interaction: {
        date: args.userTurn.created_at,
        summary: truncate(sanitizeTurnText(args.userTurn.text), 220),
        outcome: args.gateApproval
          ? `Confirmed Phase ${args.gateApproval.phase} approval`
          : args.decisions.length > 0
            ? `Aligned ${args.decisions.length} decision${args.decisions.length === 1 ? '' : 's'} for the diagnostic`
            : 'Shared additional program context',
      },
    };
  });

  const existingUpdates = asObjectArray(merged.recent_session_updates);
  const newUpdates: Array<Record<string, unknown>> = [
    {
      recorded_at: args.userTurn.created_at,
      update_type: 'sponsor_signal',
      summary: truncate(sanitizeTurnText(args.userTurn.text), 220),
    },
    {
      recorded_at: args.agentTurn.created_at,
      update_type: 'nexus_response',
      summary: truncate(sanitizeTurnText(args.agentTurn.text), 220),
    },
    ...args.decisions.map((decision) => ({
      recorded_at: args.agentTurn.created_at,
      update_type: 'decision_logged',
      summary: decision.summary,
      owner: decision.decision_maker,
      impact: decision.impact,
    })),
  ];

  return {
    ...merged,
    stakeholders,
    recent_session_updates: dedupeByJson(
      [...newUpdates, ...existingUpdates],
      10,
    ),
  };
}

function mergeRiskRegisterContent(content: Record<string, unknown>, args: Phase1LiveSyncArgs): Record<string, unknown> {
  const merged = mergeSessionSignals(content, args);
  const risks = asObjectArray(merged.risks);
  const sessionEvent = args.gateApproval
    ? `Phase ${args.gateApproval.phase} approved: ${args.gateApproval.summary}`
    : args.decisions.length > 0
      ? `Decision checkpoint: ${args.decisions.map((decision) => decision.summary).join(' | ')}`
      : truncate(sanitizeTurnText(args.userTurn.text), 220);

  const updatedRisks = risks.map((risk, index) => {
    if (index > 1) return risk;
    const history = asObjectArray(risk.history);
    return {
      ...risk,
      history: dedupeByJson(
        [
          {
            timestamp: args.agentTurn.created_at,
            event: sessionEvent,
            owner: typeof risk.owner === 'string' ? risk.owner : 'program_team',
          },
          ...history,
        ],
        8,
      ),
    };
  });

  const newSignals: Array<Record<string, unknown>> = [
    {
      recorded_at: args.userTurn.created_at,
      signal: truncate(sanitizeTurnText(args.userTurn.text), 220),
      source: 'user_turn',
    },
    ...args.decisions.map((decision) => ({
      recorded_at: args.agentTurn.created_at,
      signal: decision.impact,
      source: 'decision_logged',
      summary: decision.summary,
    })),
  ];

  return {
    ...merged,
    risks: updatedRisks,
    active_signals: dedupeByJson(
      [...newSignals, ...asObjectArray(merged.active_signals)],
      10,
    ),
  };
}

function buildMarkdown(typeKey: DeliverableKey, content: Record<string, unknown>): string {
  if (typeKey === 'charter') {
    const decisions = asObjectArray(content.working_decisions);
    const signals = asObjectArray(content.recent_alignment_signals);
    return `# Program Charter

## Latest Working Session
${isRecord(content.latest_working_session) ? JSON.stringify(content.latest_working_session, null, 2) : 'No live working-session data yet.'}

## Working Decisions
${decisions.length > 0 ? decisions.map((decision) => `- ${decision.summary}: ${decision.impact}`).join('\n') : '- No decisions logged yet.'}

## Recent Alignment Signals
${signals.length > 0 ? signals.map((signal) => `- ${signal.source}: ${signal.summary}`).join('\n') : '- No recent alignment signals captured.'}`;
  }

  if (typeKey === 'stakeholder_map') {
    const stakeholders = asObjectArray(content.stakeholders);
    const updates = asObjectArray(content.recent_session_updates);
    return `# Stakeholder Map

## Named Stakeholders
${stakeholders.length > 0 ? stakeholders.map((stakeholder) => `- ${stakeholder.name ?? 'Unknown'} · ${stakeholder.relationship_to_program ?? 'participant'}`).join('\n') : '- No stakeholders captured.'}

## Recent Session Updates
${updates.length > 0 ? updates.map((update) => `- ${update.update_type}: ${update.summary}`).join('\n') : '- No new session updates captured.'}`;
  }

  const risks = asObjectArray(content.risks);
  const signals = asObjectArray(content.active_signals);
  return `# Risk Register

## Active Risks
${risks.length > 0 ? risks.map((risk) => `- ${risk.id ?? 'risk'} · ${risk.description ?? 'No description'}`).join('\n') : '- No active risks captured.'}

## Active Signals
${signals.length > 0 ? signals.map((signal) => `- ${signal.source}: ${signal.signal}`).join('\n') : '- No active signals captured.'}`;
}

function mergeContentForType(typeKey: DeliverableKey, content: Record<string, unknown>, args: Phase1LiveSyncArgs): Record<string, unknown> {
  switch (typeKey) {
    case 'charter':
      return mergeCharterContent(content, args);
    case 'stakeholder_map':
      return mergeStakeholderContent(content, args);
    case 'risk_register':
      return mergeRiskRegisterContent(content, args);
  }
}

export async function syncPhaseOneArtifactsFromTurns(args: Phase1LiveSyncArgs): Promise<number> {
  if (args.currentPhase !== 1) return 0;

  const contextHash = `phase1-live-sync:${args.userTurn.id}:${args.agentTurn.id}`;
  const sb = getServerSupabase();
  const { data: deliverables } = await sb
    .from('deliverables_v2')
    .select('id, deliverable_type_key, current_version, title')
    .eq('engagement_id', args.engagementId)
    .in('deliverable_type_key', [...PHASE1_DELIVERABLE_KEYS]);

  const rows = ((deliverables as DeliverableRow[] | null) ?? []).filter((row): row is DeliverableRow =>
    PHASE1_DELIVERABLE_KEYS.includes(row.deliverable_type_key),
  );
  if (rows.length === 0) return 0;

  let updatedCount = 0;

  for (const row of rows) {
    const { data: latest } = await sb
      .from('deliverable_versions')
      .select('deliverable_id, version, content, structured_data, generated_from_context_hash')
      .eq('deliverable_id', row.id)
      .eq('version', row.current_version)
      .maybeSingle();

    const latestVersion = latest as VersionRow | null;
    if (!latestVersion) continue;
    if (latestVersion.generated_from_context_hash === contextHash) continue;

    const structuredData = asRecord(latestVersion.structured_data);
    const currentContent = asRecord(structuredData.content);
    const nextContent = mergeContentForType(row.deliverable_type_key, currentContent, args);
    const nextVersion = row.current_version + 1;

    const { error: updateErr } = await sb
      .from('deliverables_v2')
      .update({ current_version: nextVersion, status: 'draft' })
      .eq('id', row.id);
    if (updateErr) throw updateErr;

    const { error: versionErr } = await sb
      .from('deliverable_versions')
      .insert({
        deliverable_id: row.id,
        version: nextVersion,
        content: buildMarkdown(row.deliverable_type_key, nextContent),
        structured_data: {
          ...structuredData,
          content: nextContent,
          live_synced_from_turns: true,
          latest_sync_turn_ids: {
            user_turn_id: args.userTurn.id,
            agent_turn_id: args.agentTurn.id,
          },
        },
        quality_issues: {
          live_sync: true,
          updated_from_phase: args.currentPhase,
        },
        generated_from_context_hash: contextHash,
      });
    if (versionErr) throw versionErr;
    updatedCount += 1;
  }

  return updatedCount;
}
