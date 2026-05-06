import {
  getSourceArtifactSeed,
  getSourceDashboardSeed,
  getSourceEventSeed,
  getSourceValueSeed,
  listSourceEventSeed,
} from './mock-seed';
import type {
  AbarvaSourceDashboardData,
  SourceAlert,
  SourceArtifactDetail,
  SourceArtifactSummary,
  SourceDataReadinessItem,
  SourceStageKey,
  ValueLedgerEntry,
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
  WorkflowStage,
} from './types';
import { getStageOverride } from './stage-overrides';
import {
  normalizeSourceStageKey,
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from './constants';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { requireTenancy } from '@/lib/auth/tenancy';
import { allowedSourceEventIdsForUser, canReadSourceEvent } from '@/lib/auth/source-access-policy';
import { getClientOption, inferClientKeyFromEmail, isClientKey, type ClientKey } from '@/lib/client-config';
import {
  getSourceArtifactRegistryRecord,
  type SourceArtifactApprovalState,
  type SourceArtifactRegistryRecord,
} from './artifact-registry';

// ── DB row type for source_events ─────────────────────────────────────────────

export interface SourceEventRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  event_type: string;
  current_stage_key: string;
  lifecycle_state: string;
  linked_program_id: string | null;
  estimated_value_usd: number | null;
  trigger_description: string | null;
  scope_description: string | null;
  decision_owner: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSourcingEventInput {
  clientKey: string;
  eventName: string;
  eventType: string;
  triggerDescription: string;
  decisionOwner?: string;
  scopeDescription?: string;
  linkedProgramId?: string;
  estimatedValueUsd?: number;
  createdByUserId?: string;
}

function generateEventCode(clientKey: string, eventName: string): string {
  const prefix = clientKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const nameSlug = eventName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ').slice(0, 3).join('-');
  const year = new Date().getFullYear();
  return `${prefix}-${nameSlug}-${year}`;
}

export async function getPendingSourceEvents(clientKey: string): Promise<SourceEventRow[]> {
  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy ? await allowedSourceEventIdsForUser(tenancy, clientKey).catch(() => []) : [];
  if (allowedIds !== null && allowedIds.length === 0) return [];

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_events')
    .select('*')
    .eq('client_key', clientKey)
    .eq('lifecycle_state', 'waiting_on_client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPendingSourceEvents]', error.message);
    return [];
  }
  const rows = (data ?? []) as SourceEventRow[];
  return allowedIds === null ? rows : rows.filter((event) => allowedIds.includes(event.id));
}

export async function createSourcingEvent(input: CreateSourcingEventInput): Promise<SourceEventRow> {
  const supabase = getServerSupabase();
  const eventCode = generateEventCode(input.clientKey, input.eventName);

  const { data, error } = await supabase
    .from('source_events')
    .insert({
      client_key: input.clientKey,
      event_code: eventCode,
      event_name: input.eventName,
      event_type: input.eventType,
      trigger_description: input.triggerDescription || null,
      decision_owner: input.decisionOwner || null,
      scope_description: input.scopeDescription || null,
      linked_program_id: input.linkedProgramId || null,
      estimated_value_usd: input.estimatedValueUsd ?? null,
      created_by_user_id: input.createdByUserId || null,
      current_stage_key: 'strategy',
      lifecycle_state: 'waiting_on_client',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SourceEventRow;
}

// Canonical Source query boundary. Keep all temporary seed reads here so the
// new route family does not inherit legacy /programs mocks or preview pages.

export async function getSourceDashboardData(): Promise<AbarvaSourceDashboardData> {
  return getSourceDashboardSeed();
}

export async function listSourcingEvents(): Promise<SourcingEventSummary[]> {
  const seedEvents = listSourceEventSeed().map(normalizeSourcingEventSummaryStage);
  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) return seedEvents;
  const activeClientSeedEvents = seedEvents.filter((event) =>
    seedEventMatchesClient(event, activeClient.key),
  );

  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy ? await allowedSourceEventIdsForUser(tenancy, activeClient.key).catch(() => []) : null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_events')
    .select('*')
    .eq('client_key', activeClient.key)
    .neq('lifecycle_state', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listSourcingEvents] source_events overlay failed', error.message);
    return activeClientSeedEvents;
  }

  const persistedRows = ((data as SourceEventRow[] | null) ?? []);
  const scopedPersistedRows = allowedIds === null
    ? persistedRows
    : persistedRows.filter((row) => allowedIds.includes(row.id));
  const persisted = scopedPersistedRows.map((row) =>
    sourceEventRowToSummary(row, activeClient.name),
  );
  const persistedIds = new Set(persisted.map((event) => event.id));
  const scopedSeedEvents = allowedIds === null
    ? activeClientSeedEvents
    : activeClientSeedEvents.filter((event) => allowedIds.includes(event.id));
  return [...persisted, ...scopedSeedEvents.filter((event) => !persistedIds.has(event.id))];
}

function normalizeSourcingEventSummaryStage(event: SourcingEventSummary): SourcingEventSummary {
  const stageKey = normalizeSourceStageKey(event.currentStageKey) ?? event.currentStageKey;
  return {
    ...event,
    currentStageKey: stageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[stageKey],
  };
}

function seedEventMatchesClient(event: SourcingEventSummary, clientKey: string): boolean {
  const accountName = event.accountName.trim().toLowerCase();

  if (clientKey === 'apexretail') return accountName.includes('apex');
  if (clientKey === 'meridian') return accountName.includes('meridian');
  if (clientKey === 'arcturus') {
    return accountName.includes('arcturus') || accountName.includes('first capital');
  }
  if (clientKey === 'keystone') return accountName.includes('keystone');

  return false;
}

export function sourceEventRowToSummary(row: SourceEventRow, accountName: string): SourcingEventSummary {
  const stageKey = normalizeSourceStageKey(row.current_stage_key) ?? 'strategy';
  const status = isSourceLifecycleStatus(row.lifecycle_state) ? row.lifecycle_state : 'waiting_on_client';
  const valueAtStakeUsd = row.estimated_value_usd ?? 0;
  const waitingForApproval = status === 'waiting_on_client';
  const approvalCopy =
    'Tenant admin approval required; S0 exit then needs decision-owner and sourcing-lead co-sign.';

  return {
    id: row.id,
    code: row.event_code,
    name: row.event_name,
    accountName,
    leadAgent: 'Sentinel',
    archetype: formatSourceEventType(row.event_type),
    rigor: row.event_type === 'managed_service' || row.event_type === 'consulting' ? 'strategic' : 'standard',
    status,
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS[status],
    priority: waitingForApproval ? 'high' : 'medium',
    currentStageKey: stageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[stageKey],
    openAlerts: waitingForApproval ? 1 : 0,
    owner: row.decision_owner || 'Decision owner pending',
    agingDays: daysSince(row.created_at),
    blocker: waitingForApproval ? approvalCopy : null,
    nextAction: waitingForApproval ? 'Admin reviews intake package' : 'Open event canvas and continue Source workflow',
    isAtRisk: false,
    valueAtStakeUsd,
    projectedValueUsd: valueAtStakeUsd,
    realizedValueUsd: 0,
    nextDecision: waitingForApproval
      ? `Approval authority: ${approvalCopy}`
      : row.scope_description || 'Continue Source workflow from current stage.',
  };
}

async function getPersistedSourceEventRow(eventId: string, clientKey: string): Promise<SourceEventRow | null> {
  const { data, error } = await getServerSupabase()
    .from('source_events')
    .select('*')
    .eq('id', eventId)
    .eq('client_key', clientKey)
    .maybeSingle();

  if (error) {
    console.error('[getPersistedSourceEventRow]', error.message);
    return null;
  }

  return (data as SourceEventRow | null) ?? null;
}

async function getCanonicalAdminClientFallback(): Promise<{ key: ClientKey; name: string } | null> {
  const user = await getCurrentUser().catch(() => null);
  const email = user?.email?.trim().toLowerCase() ?? '';
  if (!CANONICAL_CLIENT_ADMIN_EMAILS.includes(email as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number])) {
    return null;
  }

  const key =
    (isClientKey(user?.metadataClientKey) ? user.metadataClientKey : null) ??
    inferClientKeyFromEmail(user?.email);

  if (!key) return null;
  return { key, name: getClientOption(key).name };
}

function formatSourceEventType(eventType: string): string {
  return eventType
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function daysSince(isoDate: string): number {
  const created = new Date(isoDate).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

function isSourceLifecycleStatus(value: string): value is SourcingEventSummary['status'] {
  return value in SOURCE_LIFECYCLE_STATUS_LABELS;
}

export async function getSourcingEvent(eventId: string): Promise<SourcingEventDetail | null> {
  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  if (activeClient && tenancy && !(await canReadSourceEvent(tenancy, activeClient.key, eventId).catch(() => false))) {
    return null;
  }

  if (activeClient) {
    const persistedEvent = await getPersistedSourceEventRow(eventId, activeClient.key);
    if (persistedEvent) {
      return sourceEventRowToDetail(persistedEvent, activeClient.name);
    }
  } else {
    // Some demo/private-plane tenants do not yet have a matching `clients`
    // table row. Keep this fallback deliberately narrow: canonical client
    // admins can open persisted rows for their own inferred client only.
    const fallbackClient = await getCanonicalAdminClientFallback();
    if (fallbackClient) {
      const persistedEvent = await getPersistedSourceEventRow(eventId, fallbackClient.key);
      if (persistedEvent) {
        return sourceEventRowToDetail(persistedEvent, fallbackClient.name);
      }
    }
  }

  const event = getSourceEventSeed(eventId);
  if (!event) return null;
  const override = getStageOverride(eventId);
  if (override) {
    const normalizedOverride = normalizeSourceStageKey(override) ?? override;
    return {
      ...normalizeSourcingEventDetailStages(event),
      currentStageKey: normalizedOverride,
      currentStageLabel: SOURCE_STAGE_LABELS[normalizedOverride],
    };
  }
  return normalizeSourcingEventDetailStages(event);
}

function normalizeSourcingEventDetailStages(event: SourcingEventDetail): SourcingEventDetail {
  const currentStageKey = normalizeSourceStageKey(event.currentStageKey) ?? event.currentStageKey;
  const currentIndex = Math.max(0, SOURCE_STAGE_ORDER.indexOf(currentStageKey));
  const existingByCanonical = new Map(
    event.stages.map((stage) => [normalizeSourceStageKey(stage.key) ?? stage.key, stage]),
  );

  return {
    ...event,
    currentStageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[currentStageKey],
    stages: SOURCE_STAGE_ORDER.map((stageKey, index) => {
      const existing = existingByCanonical.get(stageKey);
      const inferredStatus = index < currentIndex
        ? 'complete'
        : index === currentIndex
          ? 'active'
          : 'not_started';
      return {
        key: stageKey,
        label: SOURCE_STAGE_LABELS[stageKey],
        status: existing?.status ?? inferredStatus,
        summary: existing?.summary ?? stageSummary(stageKey, {
          id: event.id,
          client_key: '',
          event_code: event.code,
          event_name: event.name,
          event_type: event.archetype,
          current_stage_key: stageKey,
          lifecycle_state: event.status,
          linked_program_id: null,
          estimated_value_usd: event.valueAtStakeUsd,
          trigger_description: event.problemStatement,
          scope_description: event.synopsis,
          decision_owner: event.owner,
          created_by_user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        gate: existing?.gate ?? {
          id: `${event.id}:${stageKey}:gate`,
          label: `${SOURCE_STAGE_LABELS[stageKey]} gate`,
          status: index < currentIndex ? 'approved' : index === currentIndex ? 'ready' : 'not_started',
          ownerRole: stageKey === 'value' ? 'Value owner' : 'Tenant admin',
          requiredArtifacts: requiredArtifactsForStage(stageKey),
          blocker: null,
        },
      };
    }),
  };
}

export function sourceEventRowToDetail(row: SourceEventRow, accountName: string): SourcingEventDetail {
  const summary = sourceEventRowToSummary(row, accountName);
  const trigger = row.trigger_description || 'Trigger not captured yet.';
  const scope = row.scope_description || 'Scope boundary not captured yet.';
  const owner = row.decision_owner || 'Decision owner pending';

  return {
    ...summary,
    synopsis: `${summary.name} is a persisted Source event for ${accountName}. Nexus is tracking intake, evidence, artifacts, approvals, and value from the live source_events row.`,
    problemStatement: trigger,
    stages: buildWorkflowStagesForRow(row),
    alerts: buildAlertsForRow(row),
    artifacts: buildArtifactsForRow(row),
    scorecard: {
      decisionOwner: owner,
      reviewCadence: 'Stage-gate review at each Source transition.',
      approvalState: summary.status === 'waiting_on_client' ? 'in_review' : 'default_generated',
      criteria: [
        {
          id: `${row.id}:scope-boundary`,
          label: 'Scope boundary named',
          ownerRole: 'Sourcing lead',
          required: true,
          status: row.scope_description ? 'ready' : 'draft',
          note: scope,
        },
        {
          id: `${row.id}:decision-owner`,
          label: 'Decision owner identified',
          ownerRole: 'Tenant admin',
          required: true,
          status: row.decision_owner ? 'ready' : 'draft',
          note: owner,
        },
        {
          id: `${row.id}:business-trigger`,
          label: 'Business trigger documented',
          ownerRole: 'Sentinel',
          required: true,
          status: row.trigger_description ? 'ready' : 'draft',
          note: trigger,
        },
      ],
    },
    valueLedger: {
      updatedAt: row.updated_at,
      projected: buildValueLedgerForRow(row, 'projected'),
      realized: buildValueLedgerForRow(row, 'realized'),
    },
    dataReadiness: buildDataReadinessForRow(row),
  };
}

function buildWorkflowStagesForRow(row: SourceEventRow): WorkflowStage[] {
  const currentIndex = Math.max(0, SOURCE_STAGE_ORDER.indexOf(
    normalizeSourceStageKey(row.current_stage_key) ?? 'strategy',
  ));
  const waitingForApproval = row.lifecycle_state === 'waiting_on_client';

  return SOURCE_STAGE_ORDER.map((stageKey, index) => {
    const isCurrent = index === currentIndex;
    const isPast = index < currentIndex;
    return {
      key: stageKey,
      label: SOURCE_STAGE_LABELS[stageKey],
      status: isCurrent && waitingForApproval ? 'needs_approval' : isCurrent ? 'active' : isPast ? 'complete' : 'not_started',
      summary: stageSummary(stageKey, row),
      gate: {
        id: `${row.id}:${stageKey}:gate`,
        label: `${SOURCE_STAGE_LABELS[stageKey]} gate`,
        status: isPast ? 'approved' : isCurrent && waitingForApproval ? 'in_review' : isCurrent ? 'ready' : 'not_started',
        ownerRole: stageKey === 'value' ? 'Value owner' : 'Tenant admin',
        requiredArtifacts: requiredArtifactsForStage(stageKey),
        blocker: isCurrent && waitingForApproval
          ? 'Tenant admin approval required before this Source event can proceed.'
          : null,
      },
    };
  });
}

function stageSummary(stageKey: SourceStageKey, row: SourceEventRow): string {
  const scope = row.scope_description || 'scope boundary pending';
  const trigger = row.trigger_description || 'business trigger pending';
  const owner = row.decision_owner || 'decision owner pending';
  const summaries: Record<SourceStageKey, string> = {
    strategy: `Register the sourcing event, classify the archetype, frame value, and name the approval path. Current trigger: ${trigger}.`,
    scope: `Shape the sourcing boundary and baseline evidence. Current scope: ${scope}.`,
    rfp: `Assemble the RFP package, pricing template, timeline, and evaluation criteria.`,
    responses: `Capture vendor submissions, Q&A, exceptions, and evidence attachments.`,
    evaluation: `Score vendors against the approved framework and document rationale.`,
    pricing: `Normalize vendor pricing, TCO, assumptions, exclusions, and commercial traps.`,
    bafo: `Run BAFO prep, negotiation asks, and assumption-locking.`,
    executive_decision: `Prepare executive decision brief, tradeoffs, recommendation posture, and approval evidence for ${owner}.`,
    selection: `Prepare decision packet and selection recommendation for ${owner}.`,
    transition: `Track contract, onboarding, transition, and Tower handoff setup.`,
    value: `Measure realized value against the committed sourcing case.`,
    intake: `Register the sourcing event, classify the archetype, frame value, and name the approval path. Current trigger: ${trigger}.`,
    sourcing_strategy: `Register the sourcing event, classify the archetype, frame value, and name the approval path. Current trigger: ${trigger}.`,
    rfp_rfi_package: `Assemble the RFP package, pricing template, timeline, and evaluation criteria.`,
    vendor_responses: `Capture vendor submissions, Q&A, exceptions, and evidence attachments.`,
    orals_bafo: `Run BAFO prep, negotiation asks, and assumption-locking.`,
    contract_mobilization: `Track contract, onboarding, transition, and Tower handoff setup.`,
    value_realization: `Measure realized value against the committed sourcing case.`,
  };
  return summaries[stageKey];
}

function requiredArtifactsForStage(stageKey: SourceStageKey): string[] {
  const artifacts: Record<SourceStageKey, string[]> = {
    strategy: ['Strategy record', 'Decision owner', 'Scope boundary', 'Approval route'],
    scope: ['Scope document', 'Baseline evidence', 'Stakeholder map'],
    rfp: ['RFP package', 'Pricing template', 'Evaluation criteria'],
    responses: ['Vendor response register', 'Q&A log', 'Exception tracker'],
    evaluation: ['Scorecard', 'Evaluator rationale', 'Shortlist recommendation'],
    pricing: ['Pricing normalization workbook', 'TCO comparison', 'Commercial risk register'],
    bafo: ['BAFO pack', 'Negotiation prep', 'Commercial risk register'],
    executive_decision: ['Executive decision brief', 'Recommendation rationale', 'Approval record'],
    selection: ['Selection memo', 'Vendor notification plan', 'Contract negotiation tracker'],
    transition: ['Transition checklist', 'Contracting status', 'Tower handoff'],
    value: ['Value ledger', 'KPI feed plan', 'Closeout criteria'],
    intake: ['Strategy record', 'Decision owner', 'Scope boundary', 'Approval route'],
    sourcing_strategy: ['Strategy record', 'Decision owner', 'Scope boundary', 'Approval route'],
    rfp_rfi_package: ['RFP package', 'Pricing template', 'Evaluation criteria'],
    vendor_responses: ['Vendor response register', 'Q&A log', 'Exception tracker'],
    orals_bafo: ['BAFO pack', 'Negotiation prep', 'Commercial risk register'],
    contract_mobilization: ['Transition checklist', 'Contracting status', 'Tower handoff'],
    value_realization: ['Value ledger', 'KPI feed plan', 'Closeout criteria'],
  };
  return artifacts[stageKey];
}

function buildArtifactsForRow(row: SourceEventRow): SourceArtifactSummary[] {
  const stageKey = normalizeSourceStageKey(row.current_stage_key) ?? 'strategy';
  return [
    {
      id: `${row.id}:strategy-record`,
      title: 'Source strategy record',
      kind: 'charter',
      status: row.lifecycle_state === 'waiting_on_client' ? 'needs_review' : 'draft',
      tier: 'outline',
      summary: row.trigger_description || 'Trigger and business context are still being captured.',
      sourceCount: [row.trigger_description, row.scope_description, row.decision_owner].filter(Boolean).length,
      updatedAt: row.updated_at,
    },
    {
      id: `${row.id}:${stageKey}:packet`,
      title: `${SOURCE_STAGE_LABELS[stageKey]} working packet`,
      kind: 'artifact_packet',
      status: 'draft',
      tier: 'stub',
      summary: 'Generated from the persisted Source event spine; richer content appears as evidence and uploads are attached.',
      sourceCount: 1,
      updatedAt: row.updated_at,
    },
  ];
}

function buildAlertsForRow(row: SourceEventRow): SourceAlert[] {
  const alerts: SourceAlert[] = [];
  if (row.lifecycle_state === 'waiting_on_client') {
    alerts.push({
      id: `${row.id}:approval-needed`,
      title: 'Admin approval needed',
      detail: 'Tenant admin approval is required before the event becomes active.',
      severity: 'warning',
      status: 'open',
    });
  }
  if (!row.scope_description) {
    alerts.push({
      id: `${row.id}:scope-gap`,
      title: 'Scope boundary incomplete',
      detail: 'Nexus needs the first application, tower, vendor, or service boundary before market work begins.',
      severity: 'info',
      status: 'open',
    });
  }
  return alerts;
}

function buildValueLedgerForRow(row: SourceEventRow, kind: ValueLedgerEntry['kind']): ValueLedgerEntry[] {
  if (kind === 'realized' || !row.estimated_value_usd) return [];
  return [
    {
      id: `${row.id}:projected-value`,
      eventId: row.id,
      eventName: row.event_name,
      kind,
      label: 'Projected sourcing value',
      stageKey: normalizeSourceStageKey(row.current_stage_key) ?? 'strategy',
      amountUsd: row.estimated_value_usd,
      confidence: 'low',
      evidenceCount: 1,
      note: 'Intake estimate only; exact financial output remains governed by user financial visibility.',
    },
  ];
}

function buildDataReadinessForRow(row: SourceEventRow): SourceDataReadinessItem[] {
  return [
    {
      id: `${row.id}:baseline-evidence`,
      category: 'Baseline evidence',
      requirementLevel: 'required',
      readinessState: row.scope_description ? 'Requested' : 'Missing',
      evidenceUsability: row.scope_description ? 'available_not_validated' : 'not_available',
      owner: row.decision_owner || 'Sourcing lead',
      sourceSystemOrFile: 'Source intake',
      lastUpdated: row.updated_at,
      confidence: row.scope_description ? 'medium' : 'low',
      workflowImpact: 'Baseline evidence determines whether Scope and RFP work can proceed with auditability.',
      agentRecommendation: row.scope_description
        ? 'Attach supporting inventory, contract, or workshop output to validate the stated scope.'
        : 'Capture the first scope boundary and upload baseline evidence before vendor outreach.',
      stewardAdminHandoffLabel: 'Evidence validation',
    },
  ];
}

function sourceArtifactStatusFromApprovalState(
  approvalState: SourceArtifactApprovalState,
): SourceArtifactSummary['status'] {
  switch (approvalState) {
    case 'approved':
      return 'approved';
    case 'locked':
      return 'locked';
    case 'in_review':
      return 'needs_review';
    case 'rejected':
      return 'needs_inputs';
    case 'draft':
    default:
      return 'draft';
  }
}

function sourceArtifactKindFromRegistry(record: SourceArtifactRegistryRecord): SourceArtifactSummary['kind'] {
  if (record.artifactKind === 'scorecard' || record.artifactFamily === 'scorecard') return 'scorecard';
  if (record.artifactFamily === 'decision_brief') return 'decision_memo';
  return 'artifact_packet';
}

function readableSourceArtifactTitle(record: SourceArtifactRegistryRecord): string {
  const withoutExtension = record.originalName.replace(/\.[^.]+$/, '');
  return withoutExtension.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || record.artifactKind;
}

function splitSourceArtifactMarkdownSections(
  content: string | null,
  record: SourceArtifactRegistryRecord,
): SourceArtifactDetail['sections'] {
  if (!content?.trim()) {
    return [
      {
        label: 'Registry receipt',
        body: [
          `Original file: ${record.originalName}`,
          `Blob URI: ${record.blobUri}`,
          `SHA-256: ${record.sha256}`,
        ].join('\n'),
      },
    ];
  }

  const cleaned = content.trim();
  const headingChunks = cleaned
    .split(/\n(?=#{1,3}\s+)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const chunks = headingChunks.length > 1 ? headingChunks : [cleaned];
  return chunks.slice(0, 8).map((chunk, index) => {
    const [firstLine = '', ...rest] = chunk.split('\n');
    const heading = firstLine.replace(/^#{1,6}\s*/, '').trim();
    const hasHeading = /^#{1,6}\s+/.test(firstLine);
    return {
      label: hasHeading ? heading : index === 0 ? 'Artifact content' : `Artifact section ${index + 1}`,
      body: (hasHeading ? rest.join('\n') : chunk).trim() || chunk,
    };
  });
}

async function readSourceArtifactBlobText(record: SourceArtifactRegistryRecord): Promise<string | null> {
  if (!/text\/|markdown|json/i.test(record.mimeType)) return null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase.storage.from('source-artifacts').download(record.blobUri);
  if (error || !data) return null;

  const text = await data.text();
  return text.slice(0, 30_000);
}

async function sourceArtifactRegistryRecordToDetail(
  record: SourceArtifactRegistryRecord,
): Promise<SourceArtifactDetail> {
  const content = await readSourceArtifactBlobText(record);
  const sections = splitSourceArtifactMarkdownSections(content, record);
  return {
    id: record.id,
    eventId: record.sourceEventId,
    title: readableSourceArtifactTitle(record),
    kind: sourceArtifactKindFromRegistry(record),
    status: sourceArtifactStatusFromApprovalState(record.approvalState),
    tier: record.parseStatus === 'parsed' ? 'rich' : 'outline',
    summary:
      content?.trim().slice(0, 600) ??
      `${record.originalName} is registered in the Source artifact registry. Content preview is unavailable for this mime type.`,
    sourceCount: sections.length,
    updatedAt: record.updatedAt,
    sections,
    governanceNotes: [
      `Origin: ${record.sourceOrigin}; format: ${record.sourceFormat}; classification: ${record.dataClassification}.`,
      `Processing state: parse ${record.parseStatus}; embedding ${record.embeddingStatus}; graph ${record.graphStatus}; evidence ${record.evidenceState}.`,
      `Approval state: ${record.approvalState}; version ${record.version}.`,
      'This artifact is persisted, but parser/vector/graph completion is not implied unless the states above say complete.',
    ],
    patternLinks: [],
  };
}

export async function getSourcingEventArtifact(eventId: string, artifactId: string): Promise<SourceArtifactDetail | null> {
  const seededArtifact = getSourceArtifactSeed(eventId, artifactId);
  if (seededArtifact) return seededArtifact;

  const registryRecord = await getSourceArtifactRegistryRecord(artifactId);
  if (!registryRecord || registryRecord.sourceEventId !== eventId || registryRecord.deletedAt) return null;

  return sourceArtifactRegistryRecordToDetail(registryRecord);
}

export async function getSourceValueLedger(): Promise<SourceValueLedgerSnapshot> {
  return getSourceValueSeed();
}
