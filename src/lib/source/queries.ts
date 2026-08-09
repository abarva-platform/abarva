import {
  getSourceArtifactSeed,
  getSourceDashboardSeed,
  getSourceEventSeed,
  getSourceValueSeed,
  listSourceEventSeed,
} from "./mock-seed";
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
} from "./types";
import { getStageOverride } from "./stage-overrides";
import {
  normalizeSourceStageKey,
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "./constants";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getActiveClientRow } from "@/lib/active-client";
import { classifySourcingEvent } from "./classifier/category-classifier";
import type { SourceCategoryId } from "./taxonomy/category-taxonomy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  allowedSourceEventIdsForUser,
  canReadSourceEvent,
} from "@/lib/auth/source-access-policy";
import {
  getClientOption,
  inferClientKeyFromEmail,
  isClientKey,
  type ClientKey,
} from "@/lib/client-config";
import {
  getSourceArtifactRegistryRecord,
  readSourceArtifactRegistryTextContent,
  type SourceArtifactApprovalState,
  type SourceArtifactRegistryRecord,
} from "./artifact-registry";
import {
  buildEventScaffold,
  buildVirtualEventScaffold,
  listArtifactStatesForEvent,
  loadArtifactTemplate,
  type SourceEventArtifactState,
} from "./canvas-substrate";
import type { SourceSourcingMotion } from "./sourcing-motion-journeys";
import { specByCode } from "./canonical-specs";
import { selectSourceEventsReadAdapter } from "@/lib/data-plane/read-adapters/sourceEventsReadAdapter";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { coerceUsdAmountOrZero } from "./usd-amount";
import { autoDraftOnStageEntry } from "./stage-entry-autodraft";
import { htmlToPlainText, isFullHtmlDocument } from "./html-to-plain-text";

// ── DB row type for source_events ─────────────────────────────────────────────

export interface SourceEventRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  event_type: string;
  sourcing_motion?: SourceSourcingMotion | null;
  classified_category?: string | null;
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
  creationRequestId?: string;
  sourcingMotion?: SourceSourcingMotion;
  categoryId?: SourceCategoryId;
}

function generateEventCode(
  clientKey: string,
  eventName: string,
  creationRequestId?: string,
): string {
  const prefix = clientKey
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const clientOption = isClientKey(clientKey)
    ? getClientOption(clientKey)
    : null;
  const clientPrefixes = buildClientEventNamePrefixes(
    clientKey,
    ...tenantAliasesFor(clientKey),
    clientOption?.name,
    clientOption?.shortName,
  );
  const eventNameWithoutClient = clientPrefixes.reduce((name, clientPrefix) => {
    const pattern = new RegExp(`^${escapeRegExp(clientPrefix)}\\s+`, "i");
    return name.replace(pattern, "");
  }, eventName.trim());
  const nameParts = eventNameWithoutClient
    .replace(/\b(?:sourcing\s+)?event$/i, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3);
  const nameSlug = nameParts.length > 0 ? nameParts.join("-") : "EVENT";
  const year = new Date().getFullYear();
  return `${prefix}-${nameSlug}-${year}${normalizeEventCodeSuffix(creationRequestId)}`;
}

function normalizeEventCodeSuffix(value: string | undefined): string {
  const suffix = value
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return suffix ? `-${suffix}` : "";
}

function buildClientEventNamePrefixes(
  ...values: Array<string | null | undefined>
): string[] {
  const aliases = new Set<string>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    aliases.add(normalized);
    const firstToken = normalized.split(/\s+/).find(Boolean);
    if (firstToken && firstToken.length >= 3) aliases.add(firstToken);
  }
  return [...aliases].sort((a, b) => b.length - a.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Probe events are synthetic permission-check artifacts created by middleware
// health checks (event_code contains "-PROBE-" or event_name starts with
// "Permission Probe" / "Probe"). Exclude them from all client-facing views.
function isProbeOrTestSourceEvent(event: SourceEventRow): boolean {
  const code = event.event_code?.toUpperCase() ?? "";
  const name = event.event_name?.toLowerCase() ?? "";
  return (
    code.includes("-PROBE-") ||
    code.endsWith("-PROBE") ||
    name.startsWith("permission probe") ||
    name === "probe"
  );
}

export async function getPendingSourceEvents(
  clientKey: string,
): Promise<SourceEventRow[]> {
  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy
    ? await allowedSourceEventIdsForUser(tenancy, clientKey).catch(() => [])
    : [];
  if (allowedIds !== null && allowedIds.length === 0) return [];

  // Physical read goes through the data-plane seam (Supabase default,
  // Azure Postgres opt-in via ABARVA_DATA_PLANE). RBAC scoping below is
  // unchanged and stays lib-side.
  const rows = (await selectSourceEventsReadAdapter(
    undefined,
    clientKey,
  ).getPendingEventsForClient(clientKey)) as SourceEventRow[];
  const clientRows = allowedIds === null
    ? rows
    : rows.filter((event) => allowedIds.includes(event.id));
  return clientRows.filter((event) => !isProbeOrTestSourceEvent(event));
}

export async function createSourcingEvent(
  input: CreateSourcingEventInput,
): Promise<SourceEventRow> {
  const supabase = getAzureWriteFluentClient();
  const eventCode = generateEventCode(
    input.clientKey,
    input.eventName,
    input.creationRequestId,
  );
  const nowIso = new Date().toISOString();

  // Idempotent on (client_key, event_code): retries, double-submits, and
  // replayed agent tool calls return the existing row instead of creating a
  // ghost duplicate. The DB unique constraint
  // `source_events_client_event_code_unique` is the authoritative guard;
  // this upsert just bumps updated_at and re-reads the row so the caller
  // sees the same shape whether it was a fresh insert or a returning row.
  const { data, error } = await supabase
    .from("source_events")
    .upsert(
      {
        client_key: input.clientKey,
        event_code: eventCode,
        event_name: input.eventName,
        event_type: input.eventType,
        sourcing_motion: input.sourcingMotion ?? null,
        trigger_description: input.triggerDescription || null,
        decision_owner: input.decisionOwner || null,
        scope_description: input.scopeDescription || null,
        linked_program_id: input.linkedProgramId || null,
        estimated_value_usd: input.estimatedValueUsd ?? null,
        created_by_user_id: input.createdByUserId || null,
        current_stage_key: "strategy",
        current_stage_entered_at: nowIso,
        lifecycle_state: "waiting_on_client",
        updated_at: nowIso,
        ...(input.categoryId ? { classified_category: input.categoryId } : {}),
      },
      {
        onConflict: "client_key,event_code",
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  const row = data as SourceEventRow;

  // Slice 1.1: classify at intake. The classifier is a pure deterministic function
  // (no LLM, no I/O). We store the categoryId so the reasoning spine can read a
  // stable pre-classified archetype instead of re-running classification at every
  // generate call. Non-fatal: a failure here leaves classified_category NULL, and
  // the generate route falls back to the live classifier result.
  if (!row.classified_category) {
    try {
      const classification = classifySourcingEvent(
        {
          name: input.eventName,
          archetype: input.eventType,
          description:
            [input.triggerDescription, input.scopeDescription]
              .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
              .join(" — ") || undefined,
        },
        { loadedSegments: [] },
      );
      await supabase
        .from("source_events")
        .update({ classified_category: classification.categoryId })
        .eq("id", row.id);
      row.classified_category = classification.categoryId;
    } catch (classifyError) {
      console.warn(
        "source classify-at-intake failure:",
        row.id,
        classifyError instanceof Error ? classifyError.message : classifyError,
      );
    }
  }

  // Auto-scaffold the per-event canvas substrate so the universal canvas can
  // render real data from the moment the event is created. Uses canonical
  // specs from src/lib/source/canonical-specs/. Best-effort: a scaffold
  // failure is logged but does not abort event creation — the backfill
  // script can recover any partial state.
  try {
    await scaffoldNewEventSubstrate(row.id, row.client_key);
  } catch (scaffoldError) {
    // Keep this as console.warn (not error) per project log discipline.
    // The event row is already persisted; the substrate scaffold can be
    // recovered by the backfill script, so this is a non-fatal warning,
    // not an error. Logging here surfaces silent scaffold failures (RLS
    // misconfiguration, missing tables, transient DB errors) so they don't
    // hide behind the catch-all and bite us later as "No artifacts
    // scaffolded for <Stage>" empty states in the canvas.
    console.warn(
      "source scaffold failure:",
      row.id,
      scaffoldError instanceof Error ? scaffoldError.message : scaffoldError,
    );
  }

  return row;
}

/**
 * Insert canvas-substrate scaffold rows for a single source event. Idempotent
 * via the unique constraints on (source_event_id, artifact_code/criterion_id/
 * requirement_id) — repeat calls produce no duplicates because conflicts are
 * silently skipped via .upsert(..., { onConflict: ..., ignoreDuplicates: true }).
 */
export async function scaffoldNewEventSubstrate(
  sourceEventId: string,
  tenantKey: string,
): Promise<void> {
  const supabase = getAzureWriteFluentClient();
  const { artifactStates, gateCriterionStates, evidenceStates } =
    buildEventScaffold({
      sourceEventId,
      tenantKey,
    });

  const inserts = await Promise.all([
    supabase.from("source_event_artifact_states").upsert(artifactStates, {
      onConflict: "source_event_id,artifact_code",
      ignoreDuplicates: true,
    }),
    supabase
      .from("source_event_gate_criterion_states")
      .upsert(gateCriterionStates, {
        onConflict: "source_event_id,criterion_id",
        ignoreDuplicates: true,
      }),
    supabase.from("source_event_evidence_states").upsert(evidenceStates, {
      onConflict: "source_event_id,requirement_id",
      ignoreDuplicates: true,
    }),
  ]);

  for (const result of inserts) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }
}

// Canonical Source query boundary. Keep all temporary seed reads here so the
// new route family does not inherit legacy /programs mocks or preview pages.

export async function getSourceDashboardData(): Promise<AbarvaSourceDashboardData> {
  return getSourceDashboardSeed();
}

export async function listSourcingEvents(): Promise<SourcingEventSummary[]> {
  const seedEvents = listSourceEventSeed().map(
    normalizeSourcingEventSummaryStage,
  );
  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) return seedEvents;
  const activeClientSeedEvents = seedEvents.filter((event) =>
    seedEventMatchesClient(event, activeClient.key),
  );

  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy
    ? await allowedSourceEventIdsForUser(tenancy, activeClient.key).catch(
        () => [],
      )
    : null;

  // Physical read goes through the data-plane seam. The adapter logs and
  // returns [] on a read failure; the seed-overlay merge below then yields
  // exactly the pre-seam error fallback (`activeClientSeedEvents`).
  const persistedRows =
    (await selectSourceEventsReadAdapter(
      undefined,
      activeClient.key,
    ).getActiveEventsForClient(activeClient.key)) as SourceEventRow[];
  const scopedPersistedRows = (
    allowedIds === null
      ? persistedRows
      : persistedRows.filter((row) => allowedIds.includes(row.id))
  ).filter((row) => !isProbeOrTestSourceEvent(row));
  const persisted = scopedPersistedRows.map((row) =>
    sourceEventRowToSummary(row, activeClient.name),
  );
  const persistedIds = new Set(persisted.map((event) => event.id));
  const scopedSeedEvents =
    allowedIds === null
      ? activeClientSeedEvents
      : activeClientSeedEvents.filter((event) => allowedIds.includes(event.id));
  return [
    ...persisted,
    ...scopedSeedEvents.filter((event) => !persistedIds.has(event.id)),
  ];
}

function normalizeSourcingEventSummaryStage(
  event: SourcingEventSummary,
): SourcingEventSummary {
  const stageKey =
    normalizeSourceStageKey(event.currentStageKey) ?? event.currentStageKey;
  return {
    ...event,
    currentStageKey: stageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[stageKey],
  };
}

function seedEventMatchesClient(
  event: Pick<SourcingEventSummary, "accountName">,
  clientKey: string,
): boolean {
  const accountName = event.accountName.trim().toLowerCase();

  if (clientKey === "apexretail") return accountName.includes("apex");
  if (clientKey === "meridian") return accountName.includes("meridian");
  if (clientKey === "arcturus") {
    return (
      accountName.includes("arcturus") || accountName.includes("first capital")
    );
  }
  return false;
}

// ── Substrate gaps surfaced by the redesigned /source row ────────────────────
// The redesigned portfolio row needs five things this DB row doesn't carry as
// first-class columns. They're derived at the render layer until substrate
// catches up:
//
//   1. Per-stage lead agent — derived via `leadAgentForStage(stageKey)` in
//      `portfolio-derivations.ts`. The `leadAgent` field below stays pinned to
//      'Sentinel' because the Source surface contract treats Sentinel as the
//      orchestrator (per memory: Sentinel-front orchestrator).
//   2. Value range (low/high band with confidence) — derived ±20% from
//      `estimated_value_usd` and stamped `v2 pending`. Replace when the v2
//      Sentinel+Atlas substrate adds `value_at_stake_low_usd` /
//      `value_at_stake_high_usd`.
//   3. Per-stage entry timestamp — `agingDays` currently measures `daysSince
//      (created_at)`. Stage-band aging needs a `current_stage_entered_at`
//      column on `source_events`.
//   4. `isAtRisk` / risk classification — always false for persisted rows
//      because no risk substrate is wired to this row mapper.
//   5. `openAlerts` count — only synthesized for the `waiting_on_client`
//      approval case. Real alert join is pending.
export function sourceEventRowToSummary(
  row: SourceEventRow,
  accountName: string,
): SourcingEventSummary {
  const stageKey = normalizeSourceStageKey(row.current_stage_key) ?? "strategy";
  const status = isSourceLifecycleStatus(row.lifecycle_state)
    ? row.lifecycle_state
    : "waiting_on_client";
  const valueAtStakeUsd = coerceUsdAmountOrZero(row.estimated_value_usd);
  const waitingForApproval = status === "waiting_on_client";
  const approvalCopy =
    "Tenant admin approval required; S0 exit then needs decision-owner and sourcing-lead co-sign.";

  return {
    id: row.id,
    code: row.event_code,
    name: row.event_name,
    accountName,
    leadAgent: "Sentinel",
    archetype: formatSourceEventType(row.event_type),
    rigor:
      row.event_type === "managed_service" || row.event_type === "consulting"
        ? "strategic"
        : "standard",
    status,
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS[status],
    priority: waitingForApproval ? "high" : "medium",
    currentStageKey: stageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[stageKey],
    openAlerts: waitingForApproval ? 1 : 0,
    owner: row.decision_owner || "Decision owner pending",
    decisionOwner: row.decision_owner,
    createdByUserId: row.created_by_user_id,
    agingDays: daysSince(row.created_at),
    blocker: waitingForApproval ? approvalCopy : null,
    nextAction: waitingForApproval
      ? "Admin reviews intake package"
      : "Open event canvas and continue Source workflow",
    isAtRisk: false,
    valueAtStakeUsd,
    projectedValueUsd: valueAtStakeUsd,
    realizedValueUsd: 0,
    nextDecision: waitingForApproval
      ? `Approval authority: ${approvalCopy}`
      : row.scope_description || "Continue Source workflow from current stage.",
    sourcingMotion: row.sourcing_motion ?? null,
    classifiedCategory: row.classified_category ?? null,
  };
}

// B7 — accept either a UUID or an event_code (e.g. SRC-APX-101) as
// the URL slug. UUID hits the existing primary-key path; anything
// else falls through to event_code lookup. Tenant scope on
// client_key is preserved.
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function formatSourceTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return new Date().toISOString();
  return String(value);
}

function sourceEventBelongsToClientAlias(
  eventClientKey: string | null | undefined,
  activeClientKey: string | null | undefined,
): boolean {
  if (!eventClientKey || !activeClientKey) return false;
  const normalizedEventClientKey = eventClientKey.trim().toLowerCase();
  return tenantAliasesFor(activeClientKey)
    .map((alias) => alias.trim().toLowerCase())
    .includes(normalizedEventClientKey);
}

async function getPersistedSourceEventRow(
  eventId: string,
  clientKey: string,
): Promise<SourceEventRow | null> {
  // Physical reads go through the data-plane seam (Supabase default,
  // Azure Postgres opt-in). The UUID-vs-event_code routing stays here.
  const adapter = selectSourceEventsReadAdapter(undefined, clientKey);
  const clientKeys = tenantAliasesFor(clientKey);
  // Try by primary key first when the slug looks like a UUID — fast
  // path for existing links + most internal navigation.
  if (isUuid(eventId)) {
    for (const key of clientKeys) {
      const byId = (await adapter.getEventByIdForClient(
        eventId,
        key,
      )) as SourceEventRow | null;
      if (byId) return byId;
    }
    // Fall through — UUID didn't match; try event_code in case it's a
    // UUID-shaped code (very rare but cheap to attempt).
  }

  // The substrate has known duplicate event_codes (the portfolio
  // renderer ships a defensive `dedupeByEventCode`). The adapter orders
  // by updated_at + limits to one, so the by-code path is resilient
  // regardless of whether the duplicates ever get cleaned.
  for (const key of clientKeys) {
    const directByCode = (await adapter.getEventByCodeForClient(
      eventId,
      key,
    )) as SourceEventRow | null;
    if (directByCode) return directByCode;
  }

  // Golden-event shell routes use stable slugs (e.g.
  // `apex-retail-ams-outsourcing-2026`) while the persisted Source row may
  // still be keyed by the seeded event_code (e.g. `SRC-004`). If the direct
  // lookup missed, try the seed's display code before falling back to the
  // pure seed event. This keeps the public route stable while binding the
  // canvas and API writes to the real persisted UUID-backed row.
  const seedEvent = getSourceEventSeed(eventId);
  if (!seedEvent) return null;
  if (seedEvent.code.trim().toLowerCase() === eventId.trim().toLowerCase()) {
    return null;
  }

  for (const key of clientKeys) {
    const bySeedCode = (await adapter.getEventByCodeForClient(
      seedEvent.code,
      key,
    )) as SourceEventRow | null;
    if (bySeedCode) return bySeedCode;
  }
  return null;
}

export async function getSourcingEventForResolvedClient(
  eventId: string,
  args: {
    activeClientKey: string;
    activeClientName: string;
    tenancy?: Awaited<ReturnType<typeof requireTenancy>> | null;
    enforceSourcePolicy?: boolean;
  },
): Promise<SourcingEventDetail | null> {
  const persistedEvent = await getPersistedSourceEventRow(
    eventId,
    args.activeClientKey,
  );
  if (!persistedEvent) return null;

  if (
    !sourceEventBelongsToClientAlias(
      persistedEvent.client_key,
      args.activeClientKey,
    )
  ) {
    return null;
  }

  if (args.enforceSourcePolicy !== false && args.tenancy) {
    const canRead = await canReadSourceEvent(
      args.tenancy,
      args.activeClientKey,
      persistedEvent.id,
    ).catch(() => false);
    if (!canRead) return null;
  }

  return sourceEventRowToDetail(persistedEvent, args.activeClientName);
}

export async function resolveSourceEventUuidForClient(
  eventId: string,
  clientKey: string,
): Promise<string | null> {
  const persistedEvent = await getPersistedSourceEventRow(eventId, clientKey);
  return persistedEvent?.id ?? null;
}

function inferSeedEventType(archetype: string | null | undefined): string {
  const normalized = archetype?.trim().toLowerCase() ?? "";
  if (
    normalized.includes("managed services") ||
    normalized.includes("outsourcing")
  ) {
    return "managed_service";
  }
  if (normalized.includes("software")) return "software";
  if (normalized.includes("cloud")) return "cloud_infrastructure";
  if (normalized.includes("data")) return "data_platform";
  return "other";
}

export async function ensurePersistedSourceEventForClient(
  eventId: string,
  clientKey: string,
  createdByUserId?: string | null,
): Promise<SourceEventRow | null> {
  const persisted = await getPersistedSourceEventRow(eventId, clientKey);
  if (persisted) return persisted;

  const seedEvent = getSourceEventSeed(eventId);
  if (!seedEvent) return null;

  const supabase = getAzureWriteFluentClient();
  const nowIso = new Date().toISOString();
  const payload = {
    client_key: clientKey,
    event_code: seedEvent.code,
    event_name: seedEvent.name,
    event_type: inferSeedEventType(seedEvent.archetype),
    current_stage_key:
      normalizeSourceStageKey(seedEvent.currentStageKey) ?? "strategy",
    current_stage_entered_at: nowIso,
    lifecycle_state: isSourceLifecycleStatus(seedEvent.status)
      ? seedEvent.status
      : "active",
    linked_program_id: null,
    estimated_value_usd: seedEvent.valueAtStakeUsd ?? null,
    trigger_description: seedEvent.problemStatement ?? null,
    scope_description: seedEvent.synopsis ?? null,
    decision_owner: seedEvent.owner ?? null,
    created_by_user_id: createdByUserId ?? null,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("source_events")
    .upsert(payload, {
      onConflict: "client_key,event_code",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const row = data as SourceEventRow;

  try {
    await scaffoldNewEventSubstrate(row.id, row.client_key);
  } catch (scaffoldError) {
    console.warn(
      "source scaffold failure:",
      row.id,
      scaffoldError instanceof Error ? scaffoldError.message : scaffoldError,
    );
  }

  // Materializing a seed event can land it on any stage (not just Strategy).
  // Auto-draft whatever that stage's primary deliverable is so the canvas
  // has a real memo the first time this event is actually opened. Not
  // awaited — same durable-queue rationale as createSourcingEvent above.
  void autoDraftOnStageEntry({
    eventId: row.id,
    clientKey: row.client_key,
    enteredStage: (normalizeSourceStageKey(row.current_stage_key) ??
      "strategy") as SourceStageKey,
  }).catch((autoDraftError) => {
    console.warn(
      "source seed-materialize autodraft failure:",
      row.id,
      autoDraftError instanceof Error ? autoDraftError.message : autoDraftError,
    );
  });

  return row;
}

async function getCanonicalAdminClientFallback(): Promise<{
  key: ClientKey;
  name: string;
} | null> {
  const user = await getCurrentUser().catch(() => null);
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (
    !CANONICAL_CLIENT_ADMIN_EMAILS.includes(
      email as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
    )
  ) {
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
    .join(" ");
}

function daysSince(isoDate: string): number {
  const created = new Date(isoDate).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

function isSourceLifecycleStatus(
  value: string,
): value is SourcingEventSummary["status"] {
  return value in SOURCE_LIFECYCLE_STATUS_LABELS;
}

export async function getSourcingEvent(
  eventId: string,
  requestedClientId?: string | null,
): Promise<SourcingEventDetail | null> {
  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow(requestedClientId).catch(() => null),
    requireTenancy().catch(() => null),
  ]);

  // B7 — slug may be a UUID (legacy) or an event_code (e.g. SRC-APX-101).
  // Resolve the row first; the access policy then checks the UUID.
  if (activeClient) {
    const persistedEvent = await getPersistedSourceEventRow(
      eventId,
      activeClient.key,
    );
    if (persistedEvent) {
      if (
        tenancy &&
        !(await canReadSourceEvent(
          tenancy,
          activeClient.key,
          persistedEvent.id,
        ).catch(() => false))
      ) {
        return null;
      }
      // defense-in-depth: access policy MUST scope this, but we re-verify here so a future policy bug doesn't leak data
      if (
        !sourceEventBelongsToClientAlias(
          persistedEvent.client_key,
          activeClient.key,
        )
      ) {
        return null;
      }
      return sourceEventRowToDetail(persistedEvent, activeClient.name);
    }
  } else {
    // Some demo/private-plane tenants do not yet have a matching `clients`
    // table row. Keep this fallback deliberately narrow: canonical client
    // admins can open persisted rows for their own inferred client only.
    const fallbackClient = await getCanonicalAdminClientFallback();
    if (fallbackClient) {
      const persistedEvent = await getPersistedSourceEventRow(
        eventId,
        fallbackClient.key,
      );
      if (persistedEvent) {
        // defense-in-depth: access policy MUST scope this, but we re-verify here so a future policy bug doesn't leak data
        if (
          !sourceEventBelongsToClientAlias(
            persistedEvent.client_key,
            fallbackClient.key,
          )
        ) {
          return null;
        }
        return sourceEventRowToDetail(persistedEvent, fallbackClient.name);
      }
    }
  }

  // Seed events use UUIDs only — code lookup is a no-op there.
  const event = getSourceEventSeed(eventId);
  if (!event) return null;
  if (!activeClient || !tenancy) return null;
  if (!seedEventMatchesClient(event, activeClient.key)) return null;
  if (
    !(await canReadSourceEvent(tenancy, activeClient.key, event.id).catch(
      () => false,
    ))
  ) {
    return null;
  }
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

function normalizeSourcingEventDetailStages(
  event: SourcingEventDetail,
): SourcingEventDetail {
  const currentStageKey =
    normalizeSourceStageKey(event.currentStageKey) ?? event.currentStageKey;
  const currentIndex = Math.max(0, SOURCE_STAGE_ORDER.indexOf(currentStageKey));
  const existingByCanonical = new Map(
    event.stages.map((stage) => [
      normalizeSourceStageKey(stage.key) ?? stage.key,
      stage,
    ]),
  );

  return {
    ...event,
    currentStageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[currentStageKey],
    stages: SOURCE_STAGE_ORDER.map((stageKey, index) => {
      const existing = existingByCanonical.get(stageKey);
      const inferredStatus =
        index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "active"
            : "not_started";
      return {
        key: stageKey,
        label: SOURCE_STAGE_LABELS[stageKey],
        status: existing?.status ?? inferredStatus,
        summary:
          existing?.summary ??
          stageSummary(stageKey, {
            id: event.id,
            client_key: "",
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
          status:
            index < currentIndex
              ? "approved"
              : index === currentIndex
                ? "ready"
                : "not_started",
          ownerRole: stageKey === "value" ? "Value owner" : "Tenant admin",
          requiredArtifacts: requiredArtifactsForStage(stageKey),
          blocker: null,
        },
      };
    }),
  };
}

export function sourceEventRowToDetail(
  row: SourceEventRow,
  accountName: string,
): SourcingEventDetail {
  const summary = sourceEventRowToSummary(row, accountName);
  const trigger = row.trigger_description || "Trigger not captured yet.";
  const scope = row.scope_description || "Scope boundary not captured yet.";
  const owner = row.decision_owner || "Decision owner pending";

  return {
    ...summary,
    synopsis: `${summary.name} is a persisted Source event for ${accountName}. Ava is tracking intake, evidence, artifacts, approvals, and value from the live source_events row.`,
    problemStatement: trigger,
    stages: buildWorkflowStagesForRow(row),
    alerts: buildAlertsForRow(row),
    artifacts: buildArtifactsForRow(row),
    scorecard: {
      decisionOwner: owner,
      reviewCadence: "Stage-gate review at each Source transition.",
      approvalState:
        summary.status === "waiting_on_client"
          ? "in_review"
          : "default_generated",
      criteria: [
        {
          id: `${row.id}:scope-boundary`,
          label: "Scope boundary named",
          ownerRole: "Sourcing lead",
          required: true,
          status: row.scope_description ? "ready" : "draft",
          note: scope,
        },
        {
          id: `${row.id}:decision-owner`,
          label: "Decision owner identified",
          ownerRole: "Tenant admin",
          required: true,
          status: row.decision_owner ? "ready" : "draft",
          note: owner,
        },
        {
          id: `${row.id}:business-trigger`,
          label: "Business trigger documented",
          ownerRole: "Sentinel",
          required: true,
          status: row.trigger_description ? "ready" : "draft",
          note: trigger,
        },
      ],
    },
    valueLedger: {
      updatedAt: formatSourceTimestamp(row.updated_at),
      projected: buildValueLedgerForRow(row, "projected"),
      realized: buildValueLedgerForRow(row, "realized"),
    },
    dataReadiness: buildDataReadinessForRow(row),
  };
}

function buildWorkflowStagesForRow(row: SourceEventRow): WorkflowStage[] {
  const currentIndex = Math.max(
    0,
    SOURCE_STAGE_ORDER.indexOf(
      normalizeSourceStageKey(row.current_stage_key) ?? "strategy",
    ),
  );
  const waitingForApproval = row.lifecycle_state === "waiting_on_client";

  return SOURCE_STAGE_ORDER.map((stageKey, index) => {
    const isCurrent = index === currentIndex;
    const isPast = index < currentIndex;
    return {
      key: stageKey,
      label: SOURCE_STAGE_LABELS[stageKey],
      status:
        isCurrent && waitingForApproval
          ? "needs_approval"
          : isCurrent
            ? "active"
            : isPast
              ? "complete"
              : "not_started",
      summary: stageSummary(stageKey, row),
      gate: {
        id: `${row.id}:${stageKey}:gate`,
        label: `${SOURCE_STAGE_LABELS[stageKey]} gate`,
        status: isPast
          ? "approved"
          : isCurrent && waitingForApproval
            ? "in_review"
            : isCurrent
              ? "ready"
              : "not_started",
        ownerRole: stageKey === "value" ? "Value owner" : "Tenant admin",
        requiredArtifacts: requiredArtifactsForStage(stageKey),
        blocker:
          isCurrent && waitingForApproval
            ? "Tenant admin approval required before this Source event can proceed."
            : null,
      },
    };
  });
}

function stageSummary(stageKey: SourceStageKey, row: SourceEventRow): string {
  const scope = row.scope_description || "scope boundary pending";
  const trigger = row.trigger_description || "business trigger pending";
  const owner = row.decision_owner || "decision owner pending";
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
    strategy: [
      "Strategy record",
      "Decision owner",
      "Scope boundary",
      "Approval route",
    ],
    scope: ["Scope document", "Baseline evidence", "Stakeholder map"],
    rfp: ["RFP package", "Pricing template", "Evaluation criteria"],
    responses: ["Vendor response register", "Q&A log", "Exception tracker"],
    evaluation: [
      "Scorecard",
      "Evaluator rationale",
      "Shortlist recommendation",
    ],
    pricing: [
      "Pricing normalization workbook",
      "TCO comparison",
      "Commercial risk register",
    ],
    bafo: ["BAFO pack", "Negotiation prep", "Commercial risk register"],
    executive_decision: [
      "Executive decision brief",
      "Recommendation rationale",
      "Approval record",
    ],
    selection: [
      "Selection memo",
      "Vendor notification plan",
      "Contract negotiation tracker",
    ],
    transition: ["Transition checklist", "Contracting status", "Tower handoff"],
    value: ["Value ledger", "KPI feed plan", "Closeout criteria"],
    intake: [
      "Strategy record",
      "Decision owner",
      "Scope boundary",
      "Approval route",
    ],
    sourcing_strategy: [
      "Strategy record",
      "Decision owner",
      "Scope boundary",
      "Approval route",
    ],
    rfp_rfi_package: ["RFP package", "Pricing template", "Evaluation criteria"],
    vendor_responses: [
      "Vendor response register",
      "Q&A log",
      "Exception tracker",
    ],
    orals_bafo: ["BAFO pack", "Negotiation prep", "Commercial risk register"],
    contract_mobilization: [
      "Transition checklist",
      "Contracting status",
      "Tower handoff",
    ],
    value_realization: ["Value ledger", "KPI feed plan", "Closeout criteria"],
  };
  return artifacts[stageKey];
}

function buildArtifactsForRow(row: SourceEventRow): SourceArtifactSummary[] {
  const stageKey = normalizeSourceStageKey(row.current_stage_key) ?? "strategy";
  return [
    {
      id: `${row.id}:strategy-record`,
      title: "Source strategy record",
      kind: "charter",
      status:
        row.lifecycle_state === "waiting_on_client" ? "needs_review" : "draft",
      tier: "outline",
      summary:
        row.trigger_description ||
        "Trigger and business context are still being captured.",
      sourceCount: [
        row.trigger_description,
        row.scope_description,
        row.decision_owner,
      ].filter(Boolean).length,
      updatedAt: formatSourceTimestamp(row.updated_at),
    },
    {
      id: `${row.id}:${stageKey}:packet`,
      title: `${SOURCE_STAGE_LABELS[stageKey]} working packet`,
      kind: "artifact_packet",
      status: "draft",
      tier: "stub",
      summary:
        "Generated from the persisted Source event spine; richer content appears as evidence and uploads are attached.",
      sourceCount: 1,
      updatedAt: formatSourceTimestamp(row.updated_at),
    },
  ];
}

function buildAlertsForRow(row: SourceEventRow): SourceAlert[] {
  const alerts: SourceAlert[] = [];
  if (row.lifecycle_state === "waiting_on_client") {
    alerts.push({
      id: `${row.id}:approval-needed`,
      title: "Admin approval needed",
      detail:
        "Tenant admin approval is required before the event becomes active.",
      severity: "warning",
      status: "open",
    });
  }
  if (!row.scope_description) {
    alerts.push({
      id: `${row.id}:scope-gap`,
      title: "Scope boundary incomplete",
      detail:
        "Sentinel needs the first application, tower, vendor, or service boundary before market work begins.",
      severity: "info",
      status: "open",
    });
  }
  return alerts;
}

function buildValueLedgerForRow(
  row: SourceEventRow,
  kind: ValueLedgerEntry["kind"],
): ValueLedgerEntry[] {
  const amountUsd = coerceUsdAmountOrZero(row.estimated_value_usd);
  if (kind === "realized" || amountUsd <= 0) return [];
  return [
    {
      id: `${row.id}:projected-value`,
      eventId: row.id,
      eventName: row.event_name,
      kind,
      label: "Projected sourcing value",
      stageKey: normalizeSourceStageKey(row.current_stage_key) ?? "strategy",
      amountUsd,
      confidence: "low",
      evidenceCount: 1,
      note: "Intake estimate only; exact financial output remains governed by user financial visibility.",
    },
  ];
}

function buildDataReadinessForRow(
  row: SourceEventRow,
): SourceDataReadinessItem[] {
  return [
    {
      id: `${row.id}:baseline-evidence`,
      category: "Baseline evidence",
      requirementLevel: "required",
      readinessState: row.scope_description ? "Requested" : "Missing",
      evidenceUsability: row.scope_description
        ? "available_not_validated"
        : "not_available",
      owner: row.decision_owner || "Sourcing lead",
      sourceSystemOrFile: "Source intake",
      lastUpdated: formatSourceTimestamp(row.updated_at),
      confidence: row.scope_description ? "medium" : "low",
      workflowImpact:
        "Baseline evidence determines whether Scope and RFP work can proceed with auditability.",
      agentRecommendation: row.scope_description
        ? "Attach supporting inventory, contract, or workshop output to validate the stated scope."
        : "Capture the first scope boundary and upload baseline evidence before vendor outreach.",
      stewardAdminHandoffLabel: "Evidence validation",
    },
  ];
}

function sourceArtifactStatusFromApprovalState(
  approvalState: SourceArtifactApprovalState,
): SourceArtifactSummary["status"] {
  switch (approvalState) {
    case "approved":
      return "approved";
    case "locked":
      return "locked";
    case "in_review":
      return "needs_review";
    case "rejected":
      return "needs_inputs";
    case "draft":
    default:
      return "draft";
  }
}

function sourceArtifactKindFromRegistry(
  record: SourceArtifactRegistryRecord,
): SourceArtifactSummary["kind"] {
  if (
    record.artifactKind === "scorecard" ||
    record.artifactFamily === "scorecard"
  )
    return "scorecard";
  if (record.artifactFamily === "decision_brief") return "decision_memo";
  return "artifact_packet";
}

function sourceArtifactKindFromFamily(
  family: string,
): SourceArtifactSummary["kind"] {
  if (family === "scorecard" || family === "evaluation_scorecard") {
    return "scorecard";
  }
  if (
    family === "decision_brief" ||
    family === "selection_decision" ||
    family === "executive_decision"
  ) {
    return "decision_memo";
  }
  if (family === "sourcing_strategy" || family === "charter") {
    return "charter";
  }
  if (family === "value_ledger") {
    return "value_ledger";
  }
  return "artifact_packet";
}

function sourceArtifactStatusFromEventState(
  status: SourceEventArtifactState["status"],
): SourceArtifactSummary["status"] {
  switch (status) {
    case "not_started":
      return "not_started";
    case "needs_review":
      return "needs_review";
    case "approved":
      return "approved";
    case "locked":
      return "locked";
    case "superseded":
      return "superseded";
    case "drafting":
    default:
      return "draft";
  }
}

function readableSourceArtifactTitle(
  record: SourceArtifactRegistryRecord,
): string {
  const withoutExtension = record.originalName.replace(/\.[^.]+$/, "");
  return (
    withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() ||
    record.artifactKind
  );
}

function splitSourceArtifactContentSections(
  content: string,
): SourceArtifactDetail["sections"] {
  const cleaned = content.trim();
  const headingChunks = cleaned
    .split(/\n(?=#{1,3}\s+)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const chunks = headingChunks.length > 1 ? headingChunks : [cleaned];
  return chunks.slice(0, 8).map((chunk, index) => {
    const [firstLine = "", ...rest] = chunk.split("\n");
    const heading = firstLine.replace(/^#{1,6}\s*/, "").trim();
    const hasHeading = /^#{1,6}\s+/.test(firstLine);
    return {
      label: hasHeading
        ? heading
        : index === 0
          ? "Artifact content"
          : `Artifact section ${index + 1}`,
      body: (hasHeading ? rest.join("\n") : chunk).trim() || chunk,
    };
  });
}

function splitSourceArtifactMarkdownSections(
  content: string | null,
  record: SourceArtifactRegistryRecord,
): SourceArtifactDetail["sections"] {
  if (!content?.trim()) {
    return [
      {
        label: "Registry receipt",
        body: [
          `Original file: ${record.originalName}`,
          `Blob URI: ${record.blobUri}`,
          `SHA-256: ${record.sha256}`,
        ].join("\n"),
      },
    ];
  }

  return splitSourceArtifactContentSections(content);
}

async function readSourceArtifactBlobText(
  record: SourceArtifactRegistryRecord,
): Promise<string | null> {
  return readSourceArtifactRegistryTextContent(record);
}

async function sourceArtifactRegistryRecordToDetail(
  record: SourceArtifactRegistryRecord,
): Promise<SourceArtifactDetail> {
  const content = await readSourceArtifactBlobText(record);
  const sections = splitSourceArtifactMarkdownSections(content, record);
  // Strip HTML from the FULL content before truncating to a summary length —
  // truncating first can slice off an unclosed <style>/<script> block's
  // closing tag, leaving raw CSS/JS text exposed in the summary blurb.
  const trimmedContent = content?.trim();
  const summarySource =
    trimmedContent && isFullHtmlDocument(trimmedContent)
      ? htmlToPlainText(trimmedContent)
      : trimmedContent;
  return {
    id: record.id,
    eventId: record.sourceEventId,
    title: readableSourceArtifactTitle(record),
    kind: sourceArtifactKindFromRegistry(record),
    status: sourceArtifactStatusFromApprovalState(record.approvalState),
    tier: record.parseStatus === "parsed" ? "rich" : "outline",
    summary:
      summarySource?.slice(0, 600) ??
      `${record.originalName} is registered in the Source artifact registry. Content preview is unavailable for this mime type.`,
    sourceCount: sections.length,
    updatedAt: formatSourceTimestamp(record.updatedAt),
    sections,
    governanceNotes: [
      `Origin: ${record.sourceOrigin}; format: ${record.sourceFormat}; classification: ${record.dataClassification}.`,
      `Processing state: parse ${record.parseStatus}; embedding ${record.embeddingStatus}; graph ${record.graphStatus}; evidence ${record.evidenceState}.`,
      `Approval state: ${record.approvalState}; version ${record.version}.`,
      "This artifact is persisted, but parser/vector/graph completion is not implied unless the states above say complete.",
    ],
    patternLinks: [],
  };
}

async function sourceArtifactStateToDetail(
  event: SourcingEventDetail,
  state: SourceEventArtifactState,
): Promise<SourceArtifactDetail> {
  const spec = specByCode(state.artifactCode);
  const template = loadArtifactTemplate(state.artifactCode);
  const content =
    state.body?.trim() ||
    template?.body?.trim() ||
    [
      `# ${spec?.name ?? state.artifactCode}`,
      "",
      spec?.description ??
        "This Source artifact has a registered document type but no authored body yet.",
    ].join("\n");
  const sections = splitSourceArtifactContentSections(content);
  const updatedAt = formatSourceTimestamp(
    state.bodyUpdatedAt ?? state.updatedAt ?? new Date().toISOString(),
  );

  return {
    id: state.id,
    eventId: event.id,
    title: spec?.name ?? state.artifactCode,
    kind: sourceArtifactKindFromFamily(state.family),
    status: sourceArtifactStatusFromEventState(state.status),
    tier: state.tier,
    summary:
      state.body?.trim().slice(0, 600) ||
      spec?.description ||
      `${state.artifactCode} is ready for client inputs and review.`,
    sourceCount: sections.length,
    updatedAt,
    sections,
    governanceNotes: [
      `Document type: ${state.artifactCode}; stage: ${SOURCE_STAGE_LABELS[state.stage] ?? state.stage}.`,
      `Workflow state: ${state.status}; requirement: ${state.requirementLevel}; gate-defining: ${state.gateDefining ? "yes" : "no"}.`,
      state.linkedArtifactId
        ? "A persisted uploaded artifact is linked to this document type."
        : "No uploaded file is linked yet; this view is rendering the canonical document workspace/template.",
      "Client review and approval remain required before external use.",
    ],
    patternLinks: [],
  };
}

export async function getSourcingEventArtifact(
  eventId: string,
  artifactIdOrCode: string,
): Promise<SourceArtifactDetail | null> {
  const seededArtifact = getSourceArtifactSeed(eventId, artifactIdOrCode);
  if (seededArtifact) return seededArtifact;

  const event = await getSourcingEvent(eventId);
  const allowedEventIds = new Set(
    [eventId, event?.id, event?.code].filter(Boolean) as string[],
  );

  const registryRecord = isUuid(artifactIdOrCode)
    ? await getSourceArtifactRegistryRecord(artifactIdOrCode)
    : null;
  if (
    registryRecord &&
    allowedEventIds.has(registryRecord.sourceEventId) &&
    !registryRecord.deletedAt
  ) {
    return sourceArtifactRegistryRecordToDetail(registryRecord);
  }

  if (!event) {
    return null;
  }

  const artifactStates = await listArtifactStatesForEvent(event.id);
  const states =
    artifactStates.length > 0
      ? artifactStates
      : buildVirtualEventScaffold({
          sourceEventId: event.id,
          tenantKey: "unknown",
        }).artifactStates;
  const state = states.find(
    (row) =>
      row.id === artifactIdOrCode ||
      row.artifactCode === artifactIdOrCode ||
      row.linkedArtifactId === artifactIdOrCode,
  );

  if (!state) {
    return null;
  }

  if (
    state.linkedArtifactId &&
    state.linkedArtifactId !== artifactIdOrCode
  ) {
    const linkedRecord = isUuid(state.linkedArtifactId)
      ? await getSourceArtifactRegistryRecord(state.linkedArtifactId)
      : null;
    if (
      linkedRecord &&
      allowedEventIds.has(linkedRecord.sourceEventId) &&
      !linkedRecord.deletedAt
    ) {
      return sourceArtifactRegistryRecordToDetail(linkedRecord);
    }
  }

  return sourceArtifactStateToDetail(event, state);
}

export async function getSourceValueLedger(): Promise<SourceValueLedgerSnapshot> {
  return getSourceValueSeed();
}
