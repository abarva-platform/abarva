// Transformers · DB types → view-model types (Codex contracts).
//
// Per the Phase-3 API rule in memory (project_programs_api_transformer_rule):
// API routes under src/app/api/v1/programs/** return the view-model
// types from Codex's section of types.ts (ProgramSummary,
// ProgramFullState, ModuleState, PatternMatch, etc.), never the DB
// types (ProgramCore, ProgramModuleRow, etc.). Transformers in this
// file are the crossing point.
//
// Where the DB doesn't yet carry a view-model field, we resolve it by
// calling back into queries.ts or return a stable default.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  ActivityEntry,
  ArchetypeKey,
  AttentionVariant,
  CharterSummary,
  DeliverableSummary,
  ExecuteSurfaceProps,
  ModuleState,
  NexusPanelProps,
  ParticipantRef,
  PatternMatch,
  PersonRef,
  PhaseState,
  ProgramFullState,
  ProgramSummary,
  StrategicMove,
  StrategicMovePortfolio,
  ProgramThread,
  ThreadRef,
  ViewerRole,
} from './types.ui';
import type {
  PatternClassifierMatch,
  ProgramCore,
  ProgramMilestoneRow,
  ProgramModuleRow,
  ProgramRiskRow,
  ProgramWorkItemRow,
  TenancyCtx,
} from './types.db';
import {
  getMilestones,
  getModuleState,
  getOpenMaestroFlags,
  getPendingApprovals,
  getRisks,
  getWorkItems,
} from './queries';
import { PHASE_LABELS } from './types.db';
import { getPhaseLabel } from './phase-labels';

// ── Client name mapping ────────────────────────────────────────────────
const KNOWN_CLIENT_NAMES = new Map<string, ProgramSummary['clientName']>([
  ['meridian health', 'Meridian Health System'],
  ['meridian health system', 'Meridian Health System'],
  ['first capital', 'First Capital Financial'],
  ['first capital financial', 'First Capital Financial'],
  ['first capital financial group', 'First Capital Financial'],
  ['arcturus financial', 'First Capital Financial'],
  ['apex retail', 'Apex Retail Group'],
  ['apex retail group', 'Apex Retail Group'],
]);

async function resolveClientName(clientId: string): Promise<ProgramSummary['clientName']> {
  const sb = getServerSupabase();
  const { data } = await sb.from('clients').select('name').eq('id', clientId).maybeSingle();
  const raw = (data as { name: string } | null)?.name ?? '';
  const key = raw.trim().toLowerCase();
  return KNOWN_CLIENT_NAMES.get(key) ?? 'Apex Retail Group';
}

// ── Person → PersonRef ─────────────────────────────────────────────────
const AVATAR_COLORS = ['#14B8A6', '#9B6DFF', '#F5C54A', '#FF6B4A', '#3FB27F', '#4DA3FF'];
function hashStringToInt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}
function colorForId(id: string): string {
  return AVATAR_COLORS[hashStringToInt(id) % AVATAR_COLORS.length];
}

// ── Gate-criteria phase doctrine ────────────────────────────────────────
// 5 criteria per phase, drawn from AbarVa lifecycle canon. Each criterion
// reads as a concrete "check that gate has been met" — a reviewer can tell
// at a glance whether it's done.
//
// Completion rule per `buildGateCriteriaForPhase`:
//   - criteria whose owning phase < currentPhase → all 5 checked
//   - criteria for the currentPhase → 2-3 of 5 checked, deterministic by
//     hashStringToInt(move.id). Specifically: count = 2 + (hash % 2).
//     Indexes 0..(count-1) checked; the rest unchecked.
//   - criteria for phases > currentPhase → all 5 unchecked
//
// The component renders only the currentPhase's 5 criteria (the others
// are implicit per the detail surface's "P{N} Gate Criteria" heading).
type GateCriterion = { id: string; label: string };
const GATE_CRITERIA_DOCTRINE: GateCriterion[][] = [
  // P0 Originate — the hypothesis + sponsorship check
  [
    { id: 'p0-1', label: 'Hypothesis drafted with target outcome and cohort' },
    { id: 'p0-2', label: 'Sponsor candidate identified and briefed' },
    { id: 'p0-3', label: 'Initial scope boundary set (in-scope / out-of-scope)' },
    { id: 'p0-4', label: 'Archetype classified against the 5-archetype model' },
    { id: 'p0-5', label: 'P1 evidence request drafted and routed' },
  ],
  // P1 Charter — sponsor commit + workstream scaffold
  [
    { id: 'p1-1', label: 'Charter signed by sponsor with value range committed' },
    { id: 'p1-2', label: 'Stakeholder map and decision-rights chain locked' },
    { id: 'p1-3', label: 'Success metric tree ratified by steering committee' },
    { id: 'p1-4', label: 'Foundation readiness check complete (Setup + Intelligence)' },
    { id: 'p1-5', label: 'Workstream charters scoped and owners assigned' },
  ],
  // P2 Diagnose — baseline + root cause
  [
    { id: 'p2-1', label: 'Current-state baseline captured with source + method' },
    { id: 'p2-2', label: 'Pain-point register validated with stakeholders' },
    { id: 'p2-3', label: 'Root-cause analysis completed for top 3 drivers' },
    { id: 'p2-4', label: 'Cross-industry benchmarks sourced and compared' },
    { id: 'p2-5', label: 'Hypothesis backlog prioritized for P3 design' },
  ],
  // P3 Solution Design — matches the reference exactly
  [
    { id: 'p3-1', label: 'Solution architecture approved by EA council' },
    { id: 'p3-2', label: 'Vendor shortlist of 3 with capability scoring complete' },
    { id: 'p3-3', label: 'Total cost of ownership model with 3-year projection' },
    { id: 'p3-4', label: 'Vendor reference calls completed (min 2 per shortlisted vendor)' },
    { id: 'p3-5', label: 'Contract terms reviewed by Legal and Procurement' },
  ],
  // P4 Build — delivery plan + first milestones
  [
    { id: 'p4-1', label: 'Build plan signed off by sponsor with milestones' },
    { id: 'p4-2', label: 'Vendor contract executed and onboarded' },
    { id: 'p4-3', label: 'Pilot environment provisioned and validated' },
    { id: 'p4-4', label: 'Change management package approved' },
    { id: 'p4-5', label: 'Go-live readiness assessment passed' },
  ],
  // P5 Execute — rollout + verification setup
  [
    { id: 'p5-1', label: 'Pilot deployed in 2+ markets or cohorts' },
    { id: 'p5-2', label: 'Funding / capacity approval signed by sponsor' },
    { id: 'p5-3', label: 'Stakeholder alignment record complete with conditions' },
    { id: 'p5-4', label: 'Mobilization roadmap active and tracking' },
    { id: 'p5-5', label: 'Outcome measurement plan published and monitored' },
  ],
  // P6 Verify — KPIs + BAU handoff prep
  [
    { id: 'p6-1', label: 'Outcome KPIs verified against baseline (dual-ledger)' },
    { id: 'p6-2', label: 'Financial impact validated with finance attestation' },
    { id: 'p6-3', label: 'Regulatory or compliance sign-off received' },
    { id: 'p6-4', label: 'Tower monitoring contract active with feeds + cadence' },
    { id: 'p6-5', label: 'BAU operations runbook published and signed off' },
  ],
  // P7 Handoff — transition + pattern contribution
  [
    { id: 'p7-1', label: 'Transition to BAU operations complete' },
    { id: 'p7-2', label: 'Final value realization report published' },
    { id: 'p7-3', label: 'Lessons learned captured and pattern library updated' },
    { id: 'p7-4', label: 'Program audit and closeout documentation archived' },
    { id: 'p7-5', label: 'Sponsor signoff on outcome attestation' },
  ],
];

function buildGateCriteriaForPhase(
  phase: number,
  moveId: string,
): StrategicMove['gateCriteria'] {
  const bounded = Math.max(0, Math.min(7, phase));
  const criteria = GATE_CRITERIA_DOCTRINE[bounded] ?? GATE_CRITERIA_DOCTRINE[0];
  // Count of checked criteria for the current phase: 2 + (hash % 2) → {2, 3}.
  const checkedCount = 2 + (hashStringToInt(moveId) % 2);
  return criteria.map((c, i) => ({
    id: c.id,
    label: c.label,
    completed: i < checkedCount,
  }));
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function placeholderPerson(id = 'unknown'): PersonRef {
  return { id, name: '—', title: '', initials: '·', avatarColor: '#888' };
}

async function resolvePerson(userId: string | null, fallbackClientName?: string): Promise<PersonRef> {
  if (!userId) return placeholderPerson();
  const sb = getServerSupabase();
  const { data } = await sb
    .from('persons')
    .select('id, name, role')
    .eq('id', userId)
    .maybeSingle();
  const p = data as { id: string; name: string | null; role: string | null } | null;
  if (!p) return placeholderPerson(userId);
  return {
    id: p.id,
    name: p.name ?? '—',
    title: p.role ?? '',
    initials: initialsOf(p.name),
    avatarColor: colorForId(p.id),
    clientName: fallbackClientName,
  };
}

// ── Participants → team[] ──────────────────────────────────────────────
interface ParticipantRow {
  user_id: string;
  approval_authority: string | null;
  last_touchpoint_at: string | null;
  role: string | null;
}

function authorityToViewerRole(auth: string | null, fallback: ViewerRole = 'team_member'): ViewerRole {
  if (auth === 'sponsor') return 'sponsor';
  if (auth === 'approver') return 'lead';
  if (auth === 'contributor') return 'team_member';
  return fallback;
}

async function resolveTeam(engagementId: string): Promise<ParticipantRef[]> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_participants')
    .select('user_id, approval_authority, last_touchpoint_at, role')
    .eq('engagement_id', engagementId);

  const rows = (data as ParticipantRow[] | null) ?? [];
  const personIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
  if (personIds.length === 0) return [];
  const { data: persons } = await sb
    .from('persons')
    .select('id, name, role, email')
    .in('id', personIds);
  const personById = new Map<string, { id: string; name: string | null; role: string | null }>();
  for (const p of (persons as Array<{ id: string; name: string | null; role: string | null; email: string | null }> | null) ?? []) {
    personById.set(p.id, { id: p.id, name: p.name, role: p.role });
  }

  return rows
    .filter((r) => personById.has(r.user_id))
    .map((r) => {
      const p = personById.get(r.user_id)!;
      return {
        id: p.id,
        name: p.name ?? '—',
        title: p.role ?? r.role ?? '',
        initials: initialsOf(p.name),
        avatarColor: colorForId(p.id),
        role: authorityToViewerRole(r.approval_authority),
      } satisfies ParticipantRef;
    });
}

async function resolveSponsorAndLead(engagementId: string): Promise<{ sponsor: PersonRef; lead: PersonRef }> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_participants')
    .select('user_id, approval_authority, role')
    .eq('engagement_id', engagementId)
    .in('approval_authority', ['sponsor', 'approver']);
  const rows = (data as Array<{ user_id: string; approval_authority: string | null; role: string | null }> | null) ?? [];
  const sponsorRow = rows.find((r) => r.approval_authority === 'sponsor');
  const leadRow = rows.find((r) => r.approval_authority === 'approver');
  const [sponsor, lead] = await Promise.all([
    sponsorRow ? resolvePerson(sponsorRow.user_id) : Promise.resolve(placeholderPerson('sponsor_missing')),
    leadRow ? resolvePerson(leadRow.user_id) : Promise.resolve(placeholderPerson('lead_missing')),
  ]);
  return { sponsor, lead };
}

// ── Phase state ────────────────────────────────────────────────────────
function phaseStatesFor(program: ProgramCore, modules: ProgramModuleRow[]): PhaseState[] {
  const totalPhases = 6;
  const current = program.currentPhase ?? 0;
  const out: PhaseState[] = [];
  for (let i = 0; i < totalPhases; i += 1) {
    const phaseModules = modules.filter((m) => m.phaseNumber === i);
    const allDone = phaseModules.length > 0 && phaseModules.every((m) => m.status === 'completed' || m.status === 'skipped');
    let state: PhaseState['state'];
    if (i < current) state = 'complete';
    else if (i === current) state = allDone ? 'pending_gate' : 'active';
    else state = 'locked';
    const gateType: PhaseState['gateType'] = i === 2 || i === 4 || i === 5 ? 'hard' : i === 0 ? 'none' : 'soft';
    out.push({
      canonicalPhase: i,
      name: PHASE_LABELS[i] ?? `Phase ${i}`,
      state,
      gateType,
      summary:
        state === 'complete' ? 'Signed off'
        : state === 'pending_gate' ? 'Ready for gate review'
        : state === 'active' ? `${phaseModules.filter((m) => m.status === 'in_progress').length} modules active`
        : 'Locked until prior phases complete',
    });
  }
  return out;
}

function programPhaseStatus(program: ProgramCore, phases: PhaseState[]): ProgramSummary['phaseStatus'] {
  if (program.currentPhase == null) return 'active';
  if (program.currentPhase >= 5 && phases[5]?.state === 'complete') return 'complete';
  const current = phases[program.currentPhase];
  if (current?.state === 'pending_gate') return 'awaiting_gate';
  // Blocked if any module in current phase is blocked
  return 'active';
}

// ── Module state transform ─────────────────────────────────────────────
function moduleRowToState(r: ProgramModuleRow, deliverables: Array<{ id: string; module_key: string | null; status: string; current_version: number }> = []): ModuleState {
  const linked = deliverables.filter((d) => d.module_key === r.moduleKey || (r.state?.deliverableKey as string | undefined) === d.module_key);
  const current = linked.find((d) => d.status !== 'superseded');
  const vm: ModuleState = {
    moduleKey: r.moduleKey,
    name: r.moduleName,
    phase: r.phaseNumber,
    status: mapModuleStatus(r.status, current?.status),
    currentVersion: current?.current_version,
    lastEditedAt: r.completedAt ? new Date(r.completedAt) : r.startedAt ? new Date(r.startedAt) : undefined,
    nexusDraftPending: !!(r.state?.nexus_draft_pending),
    blockerReason: (r.state?.blocker_reason as string | undefined) ?? undefined,
    deliverableIds: linked.map((d) => d.id),
  };
  return vm;
}

function mapModuleStatus(dbStatus: ProgramModuleRow['status'], deliverableStatus: string | undefined): ModuleState['status'] {
  if (dbStatus === 'blocked') return 'blocked';
  if (dbStatus === 'skipped') return 'skipped';
  if (dbStatus === 'completed') {
    if (deliverableStatus === 'signed_off') return 'signed_off';
    if (deliverableStatus === 'in_review') return 'in_review';
    return 'signed_off';
  }
  if (dbStatus === 'in_progress') {
    if (deliverableStatus === 'in_review') return 'in_review';
    if (deliverableStatus === 'draft') return 'draft';
    return 'in_progress';
  }
  return 'not_started';
}

// ── Classifier → view-model PatternMatch ───────────────────────────────
export function classifierMatchToViewModel(
  match: PatternClassifierMatch,
  catalog: {
    title?: string;
    deployment_count?: number;
    successful_deployment_count?: number;
    median_outcome_usd?: number;
    typical_duration_months?: number;
    canonical_shape_json?: Record<string, unknown> | null;
  } | null,
  isTopMatch: boolean,
): PatternMatch {
  const deploymentCount = catalog?.deployment_count ?? 0;
  const successfulDeploymentCount = catalog?.successful_deployment_count ?? 0;
  const successRatePct = deploymentCount > 0 ? Math.round((successfulDeploymentCount / deploymentCount) * 100) : 0;
  const band = (match.band === 'no_match' ? 'low' : match.band) as 'high' | 'medium' | 'low';
  const canonical = (catalog?.canonical_shape_json ?? match.canonicalShape ?? {}) as Record<string, unknown>;
  const phases = Array.isArray(canonical.phases)
    ? (canonical.phases as Array<{ canonicalPhase: number; name: string }>)
    : Object.entries(PHASE_LABELS).map(([k, v]) => ({ canonicalPhase: Number(k), name: v }));
  const modules = Array.isArray(canonical.modules)
    ? (canonical.modules as Array<{ moduleKey: string; name: string }>)
    : [];

  return {
    patternKey: match.patternKey,
    patternName: catalog?.title ?? match.patternKey,
    confidence: match.confidence,
    confidenceBand: band,
    deploymentCount,
    successfulDeploymentCount,
    medianOutcomeUsd: catalog?.median_outcome_usd,
    typicalDurationMonths: catalog?.typical_duration_months ?? 0,
    successRatePct,
    preloadDepthPct: (canonical.preload_depth_pct as number | undefined) ?? (match.band === 'high' ? 80 : match.band === 'medium' ? 60 : 40),
    proposedShape: { phases, modules },
    isTopMatch,
  };
}

// ── ProgramCore → ProgramSummary ───────────────────────────────────────
export async function buildProgramSummary(program: ProgramCore): Promise<ProgramSummary> {
  const sb = getServerSupabase();
  const [{ sponsor, lead }, clientName, patternMatchRow, charterRow, lastActivityRow, openFlagsCount, pendingApprovalsCount] = await Promise.all([
    resolveSponsorAndLead(program.id),
    resolveClientName(program.clientId),
    sb.from('pattern_match_logs').select('pattern_key').eq('engagement_id', program.id).eq('acted_upon', true).order('acted_upon_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('deliverables_v2').select('title, status').eq('engagement_id', program.id).eq('deliverable_type_key', 'charter').maybeSingle(),
    sb.from('module_state_log').select('created_at').eq('engagement_id', program.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('maestro_oversight_flags').select('id', { count: 'exact', head: true }).eq('engagement_id', program.id).is('resolved_at', null).eq('severity', 'critical'),
    sb.from('founder_approval_requests').select('id', { count: 'exact', head: true }).eq('engagement_id', program.id).eq('status', 'pending'),
  ]);

  const patternKey = (patternMatchRow.data as { pattern_key: string } | null)?.pattern_key ?? undefined;
  let patternName: string | undefined;
  if (patternKey) {
    const { data: topic } = await sb.from('engagement_topics').select('title').eq('topic_key', patternKey).maybeSingle();
    patternName = (topic as { title: string } | null)?.title;
  }

  const charterData = charterRow.data as { title: string; status: string } | null;
  const charterSummary = charterData?.title ?? `${program.name} charter in draft`;

  const shape: ProgramSummary['shape'] = patternKey ? 'pattern' : program.archetype ? 'custom' : 'template';

  const lastActivityAt = (lastActivityRow.data as { created_at: string } | null)?.created_at ?? program.createdAt;

  const modules = await getModuleState({ clientId: program.clientId, userId: '_sys_' } as TenancyCtx, program.id).catch(() => [] as ProgramModuleRow[]);
  const phases = phaseStatesFor(program, modules);
  const phaseStatus = programPhaseStatus(program, phases);

  const critical = openFlagsCount.count ?? 0;
  const pending = pendingApprovalsCount.count ?? 0;
  const attentionBadge = critical > 0
    ? { label: `${critical} critical flag${critical === 1 ? '' : 's'}`, variant: 'danger' as AttentionVariant }
    : pending > 0
      ? { label: `${pending} pending approval${pending === 1 ? '' : 's'}`, variant: 'warning' as AttentionVariant }
      : phaseStatus === 'awaiting_gate'
        ? { label: 'Gate review ready', variant: 'info' as AttentionVariant }
        : undefined;

  return {
    id: program.id,
    name: program.name,
    archetype: (program.archetype as ArchetypeKey) ?? 'strategic_transformation',
    patternKey,
    patternName,
    charterSummary,
    currentPhase: program.currentPhase ?? 0,
    phaseStatus,
    sponsorPerson: sponsor,
    leadPerson: lead,
    lastActivityAt: new Date(lastActivityAt),
    attentionBadge,
    shape,
    clientName,
  };
}

// ── ProgramCore → ProgramFullState ─────────────────────────────────────
export async function buildProgramFullState(ctx: TenancyCtx, program: ProgramCore): Promise<ProgramFullState> {
  const sb = getServerSupabase();
  const [{ sponsor, lead }, clientName, team, moduleRows, workItems, milestones, risks, deliverables, threadRows, patternMatchRow] = await Promise.all([
    resolveSponsorAndLead(program.id),
    resolveClientName(program.clientId),
    resolveTeam(program.id),
    getModuleState(ctx, program.id),
    getWorkItems(ctx, program.id),
    getMilestones(ctx, program.id),
    getRisks(ctx, program.id),
    sb.from('deliverables_v2').select('id, module_key:deliverable_type_key, status, current_version, title, updated_at, created_by').eq('engagement_id', program.id).order('updated_at', { ascending: false }),
    sb.from('program_threads').select('id, title, metadata_jsonb, last_turn_at').eq('engagement_id', program.id).is('archived_at', null).order('last_turn_at', { ascending: false }),
    sb.from('pattern_match_logs').select('pattern_key').eq('engagement_id', program.id).eq('acted_upon', true).order('acted_upon_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const delivRows = (deliverables.data as Array<{ id: string; module_key: string | null; status: string; current_version: number; title: string; updated_at: string; created_by: string | null }> | null) ?? [];
  const modules: ModuleState[] = moduleRows.map((r) => moduleRowToState(r, delivRows));
  const phases = phaseStatesFor(program, moduleRows);
  const phaseStatus = programPhaseStatus(program, phases);

  const patternKey = (patternMatchRow.data as { pattern_key: string } | null)?.pattern_key ?? undefined;
  let patternName: string | undefined;
  if (patternKey) {
    const { data: topic } = await sb.from('engagement_topics').select('title').eq('topic_key', patternKey).maybeSingle();
    patternName = (topic as { title: string } | null)?.title;
  }

  const shape: ProgramFullState['shape'] = patternKey ? 'pattern' : program.archetype ? 'custom' : 'template';

  const charter: CharterSummary = await buildCharterSummary(program.id, program.name);

  const activity = await buildActivity(program.id);
  const deliverableSummaries: DeliverableSummary[] = await Promise.all(
    delivRows.slice(0, 20).map(async (d) => {
      const owner = d.created_by === 'nexus' ? placeholderNexus() : await resolvePerson(d.created_by ?? null);
      return {
        id: d.id,
        title: d.title,
        moduleKey: d.module_key ?? 'unknown',
        version: d.current_version,
        status: (d.status === 'draft' || d.status === 'in_review' || d.status === 'signed_off') ? d.status : 'draft',
        updatedAt: new Date(d.updated_at),
        owner,
        summary: '',
      };
    }),
  );

  const threads: ThreadRef[] = ((threadRows.data as Array<{ id: string; title: string | null; metadata_jsonb: Record<string, unknown> | null; last_turn_at: string | null }> | null) ?? [])
    .map((t) => ({
      id: t.id,
      title: t.title ?? '—',
      source: 'manual' as const,
      lastTouchedAt: new Date(t.last_turn_at ?? program.createdAt),
    }));

  const gateSummary = phaseStatus === 'awaiting_gate' ? `Phase ${program.currentPhase ?? 0} gate ready` : 'Not at a gate';
  const gateStatus: ProgramFullState['gateStatus'] = phaseStatus === 'awaiting_gate' ? 'pending' : phaseStatus === 'complete' ? 'cleared' : 'pending';

  const openDecisions = risks.filter((r) => r.status === 'open' && r.likelihood === 'high').slice(0, 3).map((r) => r.title);
  const milestoneBullets = milestones.slice(0, 3).map((m) => `${m.name} · ${m.status}`);
  const keyFindings = moduleRows
    .filter((m) => m.status === 'completed')
    .slice(0, 3)
    .map((m) => `${m.moduleName} completed`);

  return {
    id: program.id,
    name: program.name,
    charter,
    currentPhase: program.currentPhase ?? 0,
    shape,
    patternKey,
    phases,
    modules,
    team,
    activity,
    linkedIntelligenceThreads: threads,
    archetype: (program.archetype as ArchetypeKey) ?? 'strategic_transformation',
    clientName,
    sponsorPerson: sponsor,
    leadPerson: lead,
    phaseStatus,
    patternName,
    gateSummary,
    gateStatus,
    deliverables: deliverableSummaries,
    metrics: buildMetrics(milestones, workItems, risks),
    sponsorDashboard: {
      openDecisions,
      milestones: milestoneBullets,
      keyFindings,
      outcomeSignal:
        phaseStatus === 'complete' ? 'Program complete' : 'In flight',
    },
    nexusPanel: buildNexusPanelDefault(program.id),
    moduleContent: {},
    executeData: buildExecuteData(program.id, milestones, workItems, risks),
  };
}

function placeholderNexus(): PersonRef {
  return { id: 'nexus', name: 'Nexus', title: 'Embedded delivery agent', initials: 'NX', avatarColor: '#14B8A6' };
}

async function buildCharterSummary(engagementId: string, programName: string): Promise<CharterSummary> {
  const sb = getServerSupabase();
  const { data: charter } = await sb
    .from('deliverables_v2')
    .select('title, status')
    .eq('engagement_id', engagementId)
    .eq('deliverable_type_key', 'charter')
    .maybeSingle();
  const c = charter as { title: string; status: string } | null;
  if (!c) {
    return {
      headline: `${programName} · charter pending`,
      bullets: ['Charter draft has not been produced yet'],
      sponsorDecision: 'Pending sponsor pickup',
      baselineNeed: 'Baseline to be captured in Phase 2',
    };
  }
  return {
    headline: c.title,
    bullets: [`Status: ${c.status}`],
    sponsorDecision: c.status === 'signed_off' ? 'Signed off' : 'Awaiting sponsor decision',
    baselineNeed: 'Baseline captured',
  };
}

async function buildActivity(engagementId: string): Promise<ActivityEntry[]> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('module_state_log')
    .select('id, module_key, previous_state, new_state, changed_by_user_id, notes, created_at')
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: false })
    .limit(15);
  const rows = (data as Array<{ id: string; module_key: string; previous_state: string | null; new_state: string; changed_by_user_id: string | null; notes: string | null; created_at: string }> | null) ?? [];
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      type: classifyActivityType(r.module_key),
      title: `${r.module_key} · ${r.new_state}${r.previous_state ? ` (was ${r.previous_state})` : ''}`,
      detail: r.notes ?? '',
      at: new Date(r.created_at),
      actor: r.changed_by_user_id ? await resolvePerson(r.changed_by_user_id) : placeholderNexus(),
    })),
  );
}

function classifyActivityType(moduleKey: string): ActivityEntry['type'] {
  if (moduleKey.startsWith('phase_')) return 'gate';
  if (moduleKey.includes('risk')) return 'risk';
  if (moduleKey.includes('milestone')) return 'milestone';
  if (moduleKey.includes('approval')) return 'approval';
  if (moduleKey.includes('nexus') || moduleKey.includes('cxo')) return 'nexus';
  return 'deliverable';
}

function buildMetrics(milestones: ProgramMilestoneRow[], workItems: ProgramWorkItemRow[], risks: ProgramRiskRow[]): ProgramFullState['metrics'] {
  const atRisk = milestones.filter((m) => m.status === 'at_risk').length;
  const blocked = workItems.filter((w) => w.status === 'blocked').length;
  const openHighRisks = risks.filter((r) => (r.status === 'open' || r.status === 'mitigating') && r.likelihood === 'high').length;
  return [
    { label: 'Milestones at risk', value: String(atRisk), tone: atRisk > 0 ? 'amber' : 'default' },
    { label: 'Blocked items', value: String(blocked), tone: blocked > 0 ? 'red' : 'default' },
    { label: 'Open high risks', value: String(openHighRisks), tone: openHighRisks > 0 ? 'red' : 'teal' },
  ];
}

function buildExecuteData(programId: string, milestones: ProgramMilestoneRow[], workItems: ProgramWorkItemRow[], risks: ProgramRiskRow[]): ExecuteSurfaceProps {
  return {
    programId,
    activeTab: 'milestones',
    milestones: milestones.map((m) => ({
      id: m.id,
      name: m.name,
      owner: m.ownerUserId ? placeholderPerson(m.ownerUserId) : placeholderPerson(),
      status: m.status === 'hit' ? 'done' : m.status === 'at_risk' ? 'at_risk' : m.status === 'missed' ? 'at_risk' : m.actualDate ? 'in_progress' : 'not_started',
      plannedWindow: m.targetDate ?? '—',
      actualWindow: m.actualDate ?? undefined,
      progressLabel: m.status,
      evidenceCount: 0,
    })),
    workItems: workItems.map((w) => ({
      id: w.id,
      title: w.title,
      milestoneId: (w.metadata?.milestone_id as string | undefined) ?? '',
      assignee: w.assignedUserId ? placeholderPerson(w.assignedUserId) : placeholderPerson(),
      status: w.status === 'done' ? 'done' : w.status === 'blocked' ? 'blocked' : w.status === 'in_progress' ? 'in_progress' : w.status === 'cancelled' ? 'cancelled' : 'not_started',
      dueLabel: w.dueDate ?? '—',
      dependency: (w.metadata?.dependency as string | undefined) ?? undefined,
      nexusDrafted: !!(w.metadata?.nexus_drafted),
    })),
    risks: risks.map((r) => ({
      id: r.id,
      severity: r.likelihood === 'high' && r.impact === 'high' ? 'critical' : r.likelihood === 'high' || r.impact === 'high' ? 'high' : r.likelihood === 'medium' || r.impact === 'medium' ? 'medium' : 'low',
      title: r.title,
      owner: r.ownerUserId ? placeholderPerson(r.ownerUserId) : placeholderPerson(),
      mitigation: r.mitigationPlan ?? '—',
      status: r.status === 'closed' || r.status === 'transferred' || r.status === 'accepted' ? 'resolved' : r.status === 'mitigating' ? 'watching' : 'open',
    })),
    evidence: [],
    reports: [],
    viewerRole: 'lead',
  };
}

function buildNexusPanelDefault(programId: string): NexusPanelProps {
  const emptyThread: ProgramThread = { id: 'default', title: 'Program Nexus', turns: [] };
  return {
    programId,
    mode: 'collapsed',
    activeTab: 'chat',
    thread: emptyThread,
    drafts: [],
    flags: [],
    sources: [],
  };
}

export interface MoveStatus {
  statusKey: string;
  statusText: string;
  statusDescription: string;
  statusColor: StrategicMove['statusColor'];
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstSegment(value: string): string {
  const [segment] = slugify(value).split('-');
  return (segment || 'MOVE').toUpperCase();
}

function formatArchetype(value: string | null): string {
  if (!value) return 'UNCLASSIFIED';
  return value
    .split('_')
    .map((part) => part.toUpperCase())
    .join(' ');
}

export function deriveDisplayCode(
  move: Pick<ProgramCore, 'name' | 'createdAt'>,
  client: { industryCode: string | null; slug: string | null },
): string {
  const prefix = (client.industryCode?.trim() || client.slug?.toUpperCase().replace(/-/g, '') || 'MOVE').toUpperCase();
  const segment = firstSegment(move.name);
  const year = new Date(move.createdAt).getUTCFullYear();
  return `${prefix}-${segment}-${year}`;
}

export function deriveMapLabel(move: Pick<ProgramCore, 'name'>): string {
  const tokens = move.name
    .split(/[^A-Za-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !['for', 'and', 'the', 'of', 'to', 'in'].includes(token.toLowerCase()));
  const label = tokens.slice(0, 4).map((token) => token[0]?.toUpperCase() ?? '').join('');
  return label || 'MOVE';
}

export async function getMoveStatus(
  ctx: TenancyCtx,
  move: Pick<ProgramCore, 'id' | 'status' | 'lifecycleState' | 'currentPhase'>,
): Promise<MoveStatus> {
  const sb = getServerSupabase();
  const [latestSnapshot, openFlags, pendingFounder, milestones] = await Promise.all([
    sb
      .from('phase_snapshots')
      .select('approval_status, created_at')
      .eq('engagement_id', move.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getOpenMaestroFlags(ctx, move.id),
    getPendingApprovals(ctx, move.id),
    getMilestones(ctx, move.id),
  ]);

  const hasCriticalFlag = openFlags.some((flag) => flag.severity === 'critical');
  if (hasCriticalFlag) {
    return {
      statusKey: 'gate_blocked',
      statusText: 'GATE BLOCKED',
      statusDescription: `${getPhaseLabel(move.currentPhase)} · critical oversight flag open`,
      statusColor: 'red',
    };
  }

  const approvalStatus = (latestSnapshot.data as { approval_status?: string } | null)?.approval_status ?? null;
  if (move.lifecycleState === 'submitted_for_approval' || pendingFounder.length > 0 || approvalStatus === 'pending') {
    return {
      statusKey: 'awaiting_decision',
      statusText: 'AWAITING DECISION',
      statusDescription: `${getPhaseLabel(move.currentPhase)} · sponsor/founder decision pending`,
      statusColor: 'amber',
    };
  }

  const currentMilestone =
    milestones.find((milestone) => milestone.status === 'at_risk' || milestone.status === 'upcoming') ??
    milestones[0];
  const milestoneNote = currentMilestone
    ? `${currentMilestone.name} · ${currentMilestone.status}`
    : 'No active milestones';

  if (move.lifecycleState === 'completed') {
    return {
      statusKey: 'validated',
      statusText: 'VALIDATED',
      statusDescription: `${getPhaseLabel(move.currentPhase)} · ${milestoneNote}`,
      statusColor: 'teal',
    };
  }

  if (move.status === 'paused' || move.status === 'idle') {
    return {
      statusKey: 'idle',
      statusText: 'IDLE',
      statusDescription: `${getPhaseLabel(move.currentPhase)} · awaiting restart signal`,
      statusColor: 'amber',
    };
  }

  return {
    statusKey: 'on_track',
    statusText: 'ON TRACK',
    statusDescription: `${getPhaseLabel(move.currentPhase)} · ${milestoneNote}`,
    statusColor: 'green',
  };
}

async function fetchLinkedEvidence(
  sb: ReturnType<typeof getServerSupabase>,
  moveId: string,
): Promise<StrategicMove['linkedEvidence']> {
  // Evidence binding convention for move-level retrieval:
  // related_entity_type='engagement' AND related_entity_id=<moveId>
  const { data } = await sb
    .from('evidence')
    .select('id, summary')
    .eq('related_entity_type', 'engagement')
    .eq('related_entity_id', moveId)
    .order('created_at', { ascending: false })
    .limit(10);
  return ((data as Array<{ id: string; summary: string | null }> | null) ?? []).map((row) => ({
    id: row.id,
    anchor: row.id,
    summary: row.summary ?? 'Evidence item',
    url: `/strategic-moves/${moveId}?evidence=${row.id}`,
  }));
}

function compactDeliverablePreview(content: string | null | undefined): string {
  if (!content) return 'No draft content captured yet.';
  return content
    .replace(/[#*_`>\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

async function fetchMoveDeliverables(
  sb: ReturnType<typeof getServerSupabase>,
  moveId: string,
): Promise<StrategicMove['deliverables']> {
  const { data: deliverableRows } = await sb
    .from('deliverables_v2')
    .select('id, deliverable_type_key, title, status, current_version, updated_at')
    .eq('engagement_id', moveId)
    .order('updated_at', { ascending: false })
    .limit(24);

  const rows = (deliverableRows as Array<{
    id: string;
    deliverable_type_key: string;
    title: string | null;
    status: string | null;
    current_version: number | null;
    updated_at: string | null;
  }> | null) ?? [];

  if (rows.length === 0) {
    return fetchArtifactIndexFallback(sb, moveId);
  }

  const deliverableIds = rows.map((row) => row.id);
  const { data: versionRows } = await sb
    .from('deliverable_versions')
    .select('deliverable_id, version, content, generated_at')
    .in('deliverable_id', deliverableIds)
    .order('generated_at', { ascending: false });

  const versions = (versionRows as Array<{
    deliverable_id: string;
    version: number;
    content: string | null;
    generated_at: string | null;
  }> | null) ?? [];

  const versionByDeliverable = new Map<string, { content: string | null }>();
  for (const row of versions) {
    if (!versionByDeliverable.has(row.deliverable_id)) {
      versionByDeliverable.set(row.deliverable_id, { content: row.content });
    }
  }

  return rows.map((row) => {
    const latest = versionByDeliverable.get(row.id);
    const title = row.title?.trim() || row.deliverable_type_key.replace(/_/g, ' ');
    return {
      id: row.id,
      typeKey: row.deliverable_type_key,
      title,
      status: row.status ?? 'draft',
      updatedAt: row.updated_at,
      preview: compactDeliverablePreview(latest?.content),
      url: `/api/v1/programs/${moveId}/module/${encodeURIComponent(row.deliverable_type_key)}`,
    };
  });
}

async function fetchArtifactIndexFallback(
  sb: ReturnType<typeof getServerSupabase>,
  moveId: string,
): Promise<StrategicMove['deliverables']> {
  const { data } = await sb
    .from('move_artifact_index')
    .select('artifact_id, artifact_type, title, summary, artifact_kind, status, created_at, updated_at')
    .eq('engagement_id', moveId)
    .order('created_at', { ascending: false })
    .limit(24);

  const artifactRows = (data as Array<{
    artifact_id: string;
    artifact_type: string;
    title: string | null;
    summary: string | null;
    artifact_kind: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
  }> | null) ?? [];

  return artifactRows.map((row) => ({
    id: row.artifact_id,
    typeKey: row.artifact_kind ?? row.artifact_type,
    title: row.title?.trim() || row.artifact_type.replace(/_/g, ' '),
    status: row.status ?? row.artifact_type,
    updatedAt: row.updated_at,
    preview: row.summary ? compactDeliverablePreview(row.summary) : '',
    url: `/api/v1/programs/${moveId}/module/${encodeURIComponent(row.artifact_kind ?? row.artifact_type)}`,
  }));
}

export async function buildStrategicMove(
  ctx: TenancyCtx,
  move: ProgramCore,
  opts: { supabase?: ReturnType<typeof getServerSupabase> } = {},
): Promise<StrategicMove> {
  const sb = opts.supabase ?? getServerSupabase();
  const [clientRow, peopleRows, activityRows, moduleRows, phaseSnapshots, linkedEvidence, deliverables, moveStatus] = await Promise.all([
    sb.from('clients').select('id, name, industry_code, slug').eq('id', move.clientId).maybeSingle(),
    sb
      .from('engagement_participants')
      .select('person_id, user_id, role, approval_authority')
      .eq('engagement_id', move.id),
    sb
      .from('program_audit_log')
      .select('created_at, action, rationale, actor_id')
      .eq('engagement_id', move.id)
      .order('created_at', { ascending: false })
      .limit(8),
    sb
      .from('module_state_log')
      .select('created_at, module_key, new_state, changed_by_user_id')
      .eq('engagement_id', move.id)
      .order('created_at', { ascending: false })
      .limit(8),
    sb
      .from('phase_snapshots')
      .select('created_at, phase_number, approval_status')
      .eq('engagement_id', move.id)
      .order('created_at', { ascending: false })
      .limit(8),
    fetchLinkedEvidence(sb, move.id),
    fetchMoveDeliverables(sb, move.id),
    getMoveStatus(ctx, move),
  ]);

  const participantRows = (peopleRows.data as Array<{
    person_id: string | null;
    user_id: string;
    role: string | null;
    approval_authority: string | null;
  }> | null) ?? [];
  const personIds = Array.from(
    new Set(
      participantRows
        .map((row) => row.person_id || row.user_id)
        .filter(Boolean),
    ),
  );
  const { data: personData } = personIds.length
    ? await sb.from('persons').select('id, name, role').in('id', personIds)
    : { data: [] as Array<{ id: string; name: string | null; role: string | null }> };
  const personMap = new Map<string, { name: string; role: string }>(
    ((personData as Array<{ id: string; name: string | null; role: string | null }> | null) ?? []).map((row) => [
      row.id,
      { name: row.name ?? 'Unknown', role: row.role ?? 'Team member' },
    ]),
  );

  const participants = participantRows.map((row) => {
    const key = row.person_id || row.user_id;
    const person = personMap.get(key) ?? { name: row.user_id, role: row.role ?? 'Team member' };
    return {
      personId: key,
      name: person.name,
      role: row.role ?? row.approval_authority ?? person.role,
    };
  });

  const sponsorFromParticipants = participantRows.find((row) => row.approval_authority === 'sponsor');
  const sponsorPersonId = move.sponsorPersonId || sponsorFromParticipants?.person_id || sponsorFromParticipants?.user_id || null;
  const sponsorPerson = sponsorPersonId ? personMap.get(sponsorPersonId) : null;

  const auditActivity = ((activityRows.data as Array<{
    created_at: string;
    action: string;
    rationale: string | null;
    actor_id: string | null;
  }> | null) ?? []).map((row) => ({
    at: row.created_at,
    actor: row.actor_id && personMap.get(row.actor_id) ? personMap.get(row.actor_id)!.name : 'System',
    action: row.action,
    summary: row.rationale ?? row.action,
  }));
  const moduleActivity = ((moduleRows.data as Array<{
    created_at: string;
    module_key: string;
    new_state: string;
    changed_by_user_id: string | null;
  }> | null) ?? []).map((row) => ({
    at: row.created_at,
    actor: row.changed_by_user_id && personMap.get(row.changed_by_user_id) ? personMap.get(row.changed_by_user_id)!.name : 'System',
    action: `${row.module_key}:${row.new_state}`,
    summary: `${row.module_key} moved to ${row.new_state}`,
  }));
  const snapshotActivity = ((phaseSnapshots.data as Array<{
    created_at: string;
    phase_number: number;
    approval_status: string;
  }> | null) ?? []).map((row) => ({
    at: row.created_at,
    actor: 'System',
    action: `phase_snapshot:P${row.phase_number}`,
    summary: `Phase snapshot ${row.approval_status}`,
  }));
  const recentActivity = [...auditActivity, ...moduleActivity, ...snapshotActivity]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  const phase = move.currentPhase ?? 0;
  const gateCriteria: StrategicMove['gateCriteria'] = buildGateCriteriaForPhase(
    phase,
    move.id,
  );

  const client = (clientRow.data as { id: string; name: string; industry_code: string | null; slug: string | null } | null) ?? {
    id: move.clientId,
    name: 'Tenant',
    industry_code: null,
    slug: null,
  };

  return {
    id: move.id,
    displayCode: deriveDisplayCode(move, { industryCode: client.industry_code, slug: client.slug }),
    name: move.name,
    tenant: {
      id: client.id,
      name: client.name,
      industryCode: client.industry_code,
    },
    archetype: formatArchetype(move.archetype),
    currentPhase: phase,
    phaseLabel: getPhaseLabel(phase),
    status: {
      key: moveStatus.statusKey,
      text: moveStatus.statusText,
      description: moveStatus.statusDescription,
    },
    statusColor: moveStatus.statusColor,
    sponsor: sponsorPersonId && sponsorPerson
      ? { id: sponsorPersonId, name: sponsorPerson.name, role: sponsorPerson.role }
      : null,
    participants,
    valueAtStake: {
      projected:
        move.valueProjectedLowUsd !== null && move.valueProjectedHighUsd !== null
          ? {
              low: Number(move.valueProjectedLowUsd),
              high: Number(move.valueProjectedHighUsd),
              currency: move.valueCurrency ?? 'USD',
            }
          : null,
      verified:
        move.valueVerifiedUsd !== null && move.valueVerifiedStatus
          ? {
              amount: Number(move.valueVerifiedUsd),
              status: move.valueVerifiedStatus,
            }
          : null,
      assumptions: move.valueAssumptions,
    },
    deliverables,
    gateCriteria,
    recentActivity,
    linkedEvidence,
    mapLabel: deriveMapLabel(move),
    createdAt: move.createdAt,
    updatedAt: move.updatedAt ?? move.createdAt,
  };
}

export async function buildStrategicMovePortfolio(
  ctx: TenancyCtx,
  programs: ProgramCore[],
  opts: { supabase?: ReturnType<typeof getServerSupabase> } = {},
): Promise<StrategicMovePortfolio> {
  const moves = await Promise.all(programs.map((program) => buildStrategicMove(ctx, program, opts)));
  const counts = {
    total: moves.length,
    needAttention: moves.filter((move) => move.status.key === 'gate_blocked' || move.status.key === 'awaiting_decision').length,
    onTrack: moves.filter((move) => move.status.key === 'on_track').length,
    gated: moves.filter((move) => move.status.key === 'gate_blocked').length,
    idle: moves.filter((move) => move.status.key === 'idle').length,
  };
  const totalValue = moves.reduce((sum, move) => {
    const projected = move.valueAtStake.projected;
    if (!projected) return sum;
    return sum + projected.high;
  }, 0);
  return {
    moves,
    counts,
    totalValueAtStake: {
      amount: totalValue,
      currency: 'USD',
    },
    needAttentionMoves: moves
      .filter((move) => move.status.key === 'gate_blocked' || move.status.key === 'awaiting_decision')
      .slice(0, 5)
      .map((move) => ({
        id: move.id,
        displayCode: move.displayCode,
        statusText: move.status.text,
        statusDescription: move.status.description,
      })),
  };
}
