import 'server-only';

import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  getAdminAuditEvents,
} from '@/lib/admin/data/admin-audit-log-adapter';
import type { AdminAuditEvent } from '@/lib/admin/data/admin-audit-log-adapter-types';
import { getAdminUsers } from '@/lib/admin/data/admin-users-adapter';
import type { AdminUserRow } from '@/lib/admin/data/admin-users-adapter-types';
import { resolveAdminTenant, type AdminTenantContext } from '@/lib/admin/admin-tenant';
import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  mergeInventorySnapshot,
  type InventorySegmentRollup,
} from '@/lib/admin/setup-acts-registry';
import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';
import { requireTenancy } from '@/lib/auth/tenancy';
import {
  loadUserProgramAccessPolicy,
  type UserProgramAccessPolicy,
} from '@/lib/auth/program-access-policy';
import { azureRead } from '@/lib/data-plane/azureRead';
import type { ClientKey } from '@/lib/client-config';

export type CustomerAdminPanelId =
  | 'audit-log'
  | 'users'
  | 'ai-egress'
  | 'cost-usage'
  | 'substrate-inventory';

export interface CustomerAdminSectionPolicy {
  id: CustomerAdminPanelId;
  label: string;
  readOnly: true;
  mutationTargets: readonly [];
}

export const CUSTOMER_ADMIN_SECTIONS: ReadonlyArray<CustomerAdminSectionPolicy> = [
  { id: 'audit-log', label: 'Audit log', readOnly: true, mutationTargets: [] },
  { id: 'users', label: 'Users', readOnly: true, mutationTargets: [] },
  { id: 'ai-egress', label: 'AI egress audit', readOnly: true, mutationTargets: [] },
  { id: 'cost-usage', label: 'Cost and usage', readOnly: true, mutationTargets: [] },
  { id: 'substrate-inventory', label: 'Substrate inventory', readOnly: true, mutationTargets: [] },
] as const;

export interface CustomerAdminAccessDecision {
  allowed: boolean;
  reason: 'customer_admin' | 'no_customer_admin_policy';
}

export function canReadCustomerAdmin(
  policy: Pick<UserProgramAccessPolicy, 'accessLevel' | 'canAdminUsers'>,
): CustomerAdminAccessDecision {
  if (policy.accessLevel === 'client_admin' && policy.canAdminUsers === true) {
    return { allowed: true, reason: 'customer_admin' };
  }
  return { allowed: false, reason: 'no_customer_admin_policy' };
}

export function assertCustomerAdminSectionsReadOnly(
  sections: ReadonlyArray<CustomerAdminSectionPolicy> = CUSTOMER_ADMIN_SECTIONS,
): boolean {
  return sections.every((section) => section.readOnly === true && section.mutationTargets.length === 0);
}

export interface CustomerAdminAuditPanel {
  events: ReadonlyArray<AdminAuditEvent>;
  totalEvents: number;
}

export interface CustomerAdminUsersPanel {
  users: ReadonlyArray<AdminUserRow>;
  activeUsers: number;
  pendingInvites: number;
}

export interface AiEgressAuditRow {
  id: string;
  tenant_id: string;
  workflow: string;
  provider: string;
  model: string | null;
  route: string | null;
  data_class: string | null;
  policy_decision: string;
  decision_reason: string;
  request_metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

export interface CustomerAdminAiEgressPanel {
  rows: ReadonlyArray<AiEgressAuditRow>;
  totalRows: number;
  allowed: number;
  deniedOrBlocked: number;
  providers: ReadonlyArray<{ provider: string; count: number }>;
  lastSeenAt: string | null;
}

export interface CustomerAdminUsagePanel {
  calls: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  costBasis: 'provider_metadata' | 'not_metered';
}

export type CustomerAdminWeeklyUsageReportStatus =
  | 'ready'
  | 'needs_metering'
  | 'needs_cap_configuration'
  | 'cap_alert'
  | 'cap_blocked';

export interface CustomerAdminWeeklyUsageReport {
  period: 'recent_audit_window';
  calls: number;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
  includedMonthlyTokenAllowance: number;
  overageRateUsdPerMillionTokens: number;
  tokenCap: number | null;
  tokenPercentOfCap: number | null;
  capDecision: string | null;
  capReason: string | null;
  alertAtPercent: number | null;
  blockAtPercent: number | null;
  reportReady: boolean;
  status: CustomerAdminWeeklyUsageReportStatus;
  customerNotice: string;
  lastSeenAt: string | null;
  evidenceBasis: 'usage_cap_audit_metadata' | 'provider_metadata_only' | 'not_metered';
}

export interface CustomerAdminDocumentCostRow {
  documentKey: string;
  label: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  parseCostUsd: number | null;
  chatCostUsd: number | null;
  totalCostUsd: number | null;
  cacheEvents: number;
  cacheHits: number;
  cacheHitRate: number | null;
  lastSeenAt: string | null;
  basis: 'provider_metadata' | 'not_metered';
}

export interface CustomerAdminDocumentEconomicsPanel {
  documents: ReadonlyArray<CustomerAdminDocumentCostRow>;
  totalDocuments: number;
  meteredDocuments: number;
  parseCostUsd: number | null;
  chatCostUsd: number | null;
  totalCostUsd: number | null;
  cacheHitRate: number | null;
}

export interface CustomerAdminSubstratePanel {
  segments: ReadonlyArray<InventorySegmentRollup>;
  totalRecords: number;
  totalChunks: number;
  totalNodes: number;
  totalEdges: number;
  lastIngestedAt: string | null;
  source: 'live_snapshot' | 'authored_fallback';
}

export interface CustomerAdminPageView {
  tenant: AdminTenantContext;
  clientId: string | null;
  access: CustomerAdminAccessDecision;
  readOnlySections: ReadonlyArray<CustomerAdminSectionPolicy>;
  audit: CustomerAdminAuditPanel;
  users: CustomerAdminUsersPanel;
  aiEgress: CustomerAdminAiEgressPanel;
  usage: CustomerAdminUsagePanel;
  weeklyUsageReport: CustomerAdminWeeklyUsageReport;
  documentEconomics: CustomerAdminDocumentEconomicsPanel;
  substrate: CustomerAdminSubstratePanel;
  banners: ReadonlyArray<string>;
  generatedAt: string;
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

function numberFromMetadata(
  metadata: Record<string, unknown> | null,
  keys: ReadonlyArray<string>,
): number | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  const nestedUsage = metadata.usage;
  if (nestedUsage && typeof nestedUsage === 'object' && !Array.isArray(nestedUsage)) {
    return numberFromMetadata(nestedUsage as Record<string, unknown>, keys);
  }
  return null;
}

function stringFromMetadata(
  metadata: Record<string, unknown> | null,
  keys: ReadonlyArray<string>,
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  const nestedUsage = metadata.usage;
  if (nestedUsage && typeof nestedUsage === 'object' && !Array.isArray(nestedUsage)) {
    return stringFromMetadata(nestedUsage as Record<string, unknown>, keys);
  }
  return null;
}

function booleanFromMetadata(
  metadata: Record<string, unknown> | null,
  keys: ReadonlyArray<string>,
): boolean | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'hit'].includes(normalized)) return true;
      if (['0', 'false', 'no', 'miss'].includes(normalized)) return false;
    }
  }
  const nestedUsage = metadata.usage;
  if (nestedUsage && typeof nestedUsage === 'object' && !Array.isArray(nestedUsage)) {
    return booleanFromMetadata(nestedUsage as Record<string, unknown>, keys);
  }
  return null;
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}

function nestedRecordFromMetadata(
  metadata: Record<string, unknown> | null,
  keys: ReadonlyArray<string>,
): Record<string, unknown> | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return null;
}

export function scopeAiEgressRowsToClient(
  rows: ReadonlyArray<AiEgressAuditRow>,
  clientId: string | null,
): ReadonlyArray<AiEgressAuditRow> {
  if (!clientId) return [];
  return rows.filter((row) => row.tenant_id === clientId);
}

export function summarizeAiEgressRows(
  rows: ReadonlyArray<AiEgressAuditRow>,
  clientId: string | null,
): CustomerAdminAiEgressPanel {
  const scoped = scopeAiEgressRowsToClient(rows, clientId);
  const providerCounts = new Map<string, number>();
  for (const row of scoped) {
    providerCounts.set(row.provider, (providerCounts.get(row.provider) ?? 0) + 1);
  }
  return {
    rows: scoped,
    totalRows: scoped.length,
    allowed: scoped.filter((row) => row.policy_decision === 'allow').length,
    deniedOrBlocked: scoped.filter((row) => row.policy_decision !== 'allow').length,
    providers: [...providerCounts.entries()]
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([provider, count]) => ({ provider, count })),
    lastSeenAt: scoped[0]?.created_at ?? null,
  };
}

export function summarizeDocumentEconomicsFromAiEgressRows(
  rows: ReadonlyArray<AiEgressAuditRow>,
  clientId: string | null,
): CustomerAdminDocumentEconomicsPanel {
  const scoped = scopeAiEgressRowsToClient(rows, clientId);
  const documents = new Map<string, {
    label: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    parseCostUsd: number;
    chatCostUsd: number;
    totalCostUsd: number;
    hasAnyCost: boolean;
    cacheEvents: number;
    cacheHits: number;
    lastSeenAt: string | null;
  }>();

  for (const row of scoped) {
    const metadata = row.request_metadata;
    const documentKey = stringFromMetadata(metadata, [
      'documentKey',
      'document_key',
      'documentId',
      'document_id',
      'sourceDocumentId',
      'source_document_id',
      'fileManifestId',
      'file_manifest_id',
      'parseCacheKey',
      'parse_cache_key',
      'artifactCode',
      'artifact_code',
      'sha256',
    ]);
    if (!documentKey) continue;

    const label = stringFromMetadata(metadata, [
      'documentLabel',
      'document_label',
      'sourceLabel',
      'source_label',
      'originalFilename',
      'original_filename',
      'filename',
      'artifactCode',
      'artifact_code',
    ]) ?? documentKey;
    const existing = documents.get(documentKey) ?? {
      label,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      parseCostUsd: 0,
      chatCostUsd: 0,
      totalCostUsd: 0,
      hasAnyCost: false,
      cacheEvents: 0,
      cacheHits: 0,
      lastSeenAt: null,
    };

    const input = numberFromMetadata(metadata, [
      'inputTokens',
      'input_tokens',
      'promptTokens',
      'prompt_tokens',
    ]);
    const output = numberFromMetadata(metadata, [
      'outputTokens',
      'output_tokens',
      'completionTokens',
      'completion_tokens',
    ]);
    const parseCost = numberFromMetadata(metadata, [
      'parseCostUsd',
      'parse_cost_usd',
      'documentParseCostUsd',
      'document_parse_cost_usd',
      'extractionCostUsd',
      'extraction_cost_usd',
    ]);
    const totalCost = numberFromMetadata(metadata, [
      'costUsd',
      'cost_usd',
      'estimatedCostUsd',
      'estimated_cost_usd',
    ]);
    const cacheReadTokens = numberFromMetadata(metadata, [
      'cacheReadInputTokens',
      'cache_read_input_tokens',
      'cacheReadTokens',
      'cache_read_tokens',
    ]);
    const cacheCreationTokens = numberFromMetadata(metadata, [
      'cacheCreationInputTokens',
      'cache_creation_input_tokens',
      'cacheWriteTokens',
      'cache_write_tokens',
    ]);
    const explicitCacheHit = booleanFromMetadata(metadata, [
      'cacheHit',
      'cache_hit',
      'promptCacheHit',
      'prompt_cache_hit',
    ]);
    const hasCacheTelemetry =
      explicitCacheHit !== null || cacheReadTokens !== null || cacheCreationTokens !== null;
    const cacheHit = explicitCacheHit === true || (cacheReadTokens ?? 0) > 0;

    existing.calls += 1;
    if (input !== null) existing.inputTokens += Math.round(input);
    if (output !== null) existing.outputTokens += Math.round(output);
    if (parseCost !== null) {
      existing.parseCostUsd += parseCost;
      existing.hasAnyCost = true;
    }
    if (totalCost !== null) {
      existing.totalCostUsd += totalCost;
      existing.chatCostUsd += Math.max(0, totalCost - (parseCost ?? 0));
      existing.hasAnyCost = true;
    }
    if (hasCacheTelemetry) {
      existing.cacheEvents += 1;
      if (cacheHit) existing.cacheHits += 1;
    }
    existing.lastSeenAt = existing.lastSeenAt && existing.lastSeenAt > row.created_at
      ? existing.lastSeenAt
      : row.created_at;
    documents.set(documentKey, existing);
  }

  const documentRows = [...documents.entries()]
    .map(([documentKey, doc]) => ({
      documentKey,
      label: doc.label,
      calls: doc.calls,
      inputTokens: doc.inputTokens,
      outputTokens: doc.outputTokens,
      parseCostUsd: doc.hasAnyCost ? roundCurrency(doc.parseCostUsd) : null,
      chatCostUsd: doc.hasAnyCost ? roundCurrency(doc.chatCostUsd) : null,
      totalCostUsd: doc.hasAnyCost ? roundCurrency(doc.totalCostUsd) : null,
      cacheEvents: doc.cacheEvents,
      cacheHits: doc.cacheHits,
      cacheHitRate: doc.cacheEvents > 0 ? Math.round((doc.cacheHits / doc.cacheEvents) * 100) : null,
      lastSeenAt: doc.lastSeenAt,
      basis: doc.hasAnyCost ? 'provider_metadata' as const : 'not_metered' as const,
    }))
    .sort((a, b) => {
      const costDelta = (b.totalCostUsd ?? -1) - (a.totalCostUsd ?? -1);
      if (costDelta !== 0) return costDelta;
      return (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? '');
    });

  const totals = documentRows.reduce((acc, doc) => {
    acc.parseCostUsd += doc.parseCostUsd ?? 0;
    acc.chatCostUsd += doc.chatCostUsd ?? 0;
    acc.totalCostUsd += doc.totalCostUsd ?? 0;
    acc.cacheEvents += doc.cacheEvents;
    acc.cacheHits += doc.cacheHits;
    if (doc.totalCostUsd !== null) acc.meteredDocuments += 1;
    return acc;
  }, {
    parseCostUsd: 0,
    chatCostUsd: 0,
    totalCostUsd: 0,
    cacheEvents: 0,
    cacheHits: 0,
    meteredDocuments: 0,
  });

  return {
    documents: documentRows,
    totalDocuments: documentRows.length,
    meteredDocuments: totals.meteredDocuments,
    parseCostUsd: totals.meteredDocuments > 0 ? roundCurrency(totals.parseCostUsd) : null,
    chatCostUsd: totals.meteredDocuments > 0 ? roundCurrency(totals.chatCostUsd) : null,
    totalCostUsd: totals.meteredDocuments > 0 ? roundCurrency(totals.totalCostUsd) : null,
    cacheHitRate: totals.cacheEvents > 0 ? Math.round((totals.cacheHits / totals.cacheEvents) * 100) : null,
  };
}

export function summarizeUsageFromAiEgressRows(
  rows: ReadonlyArray<AiEgressAuditRow>,
  clientId: string | null,
): CustomerAdminUsagePanel {
  const scoped = scopeAiEgressRowsToClient(rows, clientId);
  let inputTokens = 0;
  let outputTokens = 0;
  let estimatedCostUsd = 0;
  let hasAnyTokens = false;
  let hasAnyCost = false;

  for (const row of scoped) {
    const metadata = row.request_metadata;
    const input = numberFromMetadata(metadata, [
      'inputTokens',
      'input_tokens',
      'promptTokens',
      'prompt_tokens',
    ]);
    const output = numberFromMetadata(metadata, [
      'outputTokens',
      'output_tokens',
      'completionTokens',
      'completion_tokens',
    ]);
    const cost = numberFromMetadata(metadata, [
      'costUsd',
      'cost_usd',
      'estimatedCostUsd',
      'estimated_cost_usd',
    ]);
    if (input !== null) {
      inputTokens += Math.round(input);
      hasAnyTokens = true;
    }
    if (output !== null) {
      outputTokens += Math.round(output);
      hasAnyTokens = true;
    }
    if (cost !== null) {
      estimatedCostUsd += cost;
      hasAnyCost = true;
    }
  }

  return {
    calls: scoped.length,
    inputTokens: hasAnyTokens ? inputTokens : null,
    outputTokens: hasAnyTokens ? outputTokens : null,
    estimatedCostUsd: hasAnyCost ? Number(estimatedCostUsd.toFixed(6)) : null,
    costBasis: hasAnyCost ? 'provider_metadata' : 'not_metered',
  };
}

export function summarizeWeeklyUsageReportFromAiEgressRows(
  rows: ReadonlyArray<AiEgressAuditRow>,
  clientId: string | null,
): CustomerAdminWeeklyUsageReport {
  const scoped = scopeAiEgressRowsToClient(rows, clientId);
  const usage = summarizeUsageFromAiEgressRows(rows, clientId);
  const totalTokens =
    usage.inputTokens === null && usage.outputTokens === null
      ? null
      : (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
  const latestCapMetadata = scoped
    .map((row) => ({
      row,
      cap: nestedRecordFromMetadata(row.request_metadata, ['usageCap', 'usage_cap']),
    }))
    .find((item) => item.cap);
  const cap = latestCapMetadata?.cap ?? null;
  const tokenCap = numberFromMetadata(cap, ['usage_cap_token_cap', 'tokenCap', 'token_cap']);
  const tokenPercentOfCap =
    numberFromMetadata(cap, ['usage_cap_token_percent_after', 'tokenPercentAfter', 'token_percent_after']) ??
    (tokenCap && totalTokens !== null ? Math.round((totalTokens / tokenCap) * 10000) / 100 : null);
  const capDecision = stringFromMetadata(cap, ['usage_cap_decision', 'decision']);
  const capReason = stringFromMetadata(cap, ['usage_cap_reason', 'reason']);
  const alertAtPercent = numberFromMetadata(cap, ['usage_cap_alert_at_percent', 'alertAtPercent', 'alert_at_percent']);
  const blockAtPercent = numberFromMetadata(cap, ['usage_cap_block_at_percent', 'blockAtPercent', 'block_at_percent']);

  let status: CustomerAdminWeeklyUsageReportStatus = 'ready';
  if (totalTokens === null) {
    status = 'needs_metering';
  } else if (!tokenCap) {
    status = 'needs_cap_configuration';
  } else if (capDecision === 'block') {
    status = 'cap_blocked';
  } else if (capDecision === 'alert') {
    status = 'cap_alert';
  }

  const customerNotice = (() => {
    if (status === 'needs_metering') {
      return 'Usage report is not ready: provider token and cost metadata are not present in this audit window.';
    }
    if (status === 'needs_cap_configuration') {
      return 'Usage report is not ready: usage is metered, but no tenant usage-cap audit metadata is present yet.';
    }
    if (status === 'cap_blocked') {
      return 'Usage cap is blocking new model calls. Review approved overage or rate-limit treatment before notifying the client.';
    }
    if (status === 'cap_alert') {
      return 'Usage is inside the alert band. Notify the client admin before material overage is incurred.';
    }
    return 'Usage report is ready for client review, subject to account-owner approval.';
  })();

  return {
    period: 'recent_audit_window',
    calls: scoped.length,
    totalTokens,
    estimatedCostUsd: usage.estimatedCostUsd,
    includedMonthlyTokenAllowance: 50_000_000,
    overageRateUsdPerMillionTokens: 18,
    tokenCap,
    tokenPercentOfCap,
    capDecision,
    capReason,
    alertAtPercent,
    blockAtPercent,
    reportReady: status === 'ready' || status === 'cap_alert',
    status,
    customerNotice,
    lastSeenAt: scoped[0]?.created_at ?? null,
    evidenceBasis: cap ? 'usage_cap_audit_metadata' : usage.costBasis === 'provider_metadata' ? 'provider_metadata_only' : 'not_metered',
  };
}

async function loadAiEgressRows(clientId: string | null): Promise<{
  rows: ReadonlyArray<AiEgressAuditRow>;
  banner?: string;
}> {
  if (!clientId) {
    return {
      rows: [],
      banner: 'AI egress audit is empty because this tenant has no resolved client row in the read plane.',
    };
  }

  try {
    const rows = await azureRead.select<{
      id: string;
      tenant_id: string;
      workflow: string;
      provider: string;
      model: string | null;
      route: string | null;
      data_class: string | null;
      policy_decision: string;
      decision_reason: string;
      request_metadata: unknown;
      error_message: string | null;
      created_at: string | Date;
    }>({
      table: 'ai_egress_audit',
      columns: [
        'id',
        'tenant_id',
        'workflow',
        'provider',
        'model',
        'route',
        'data_class',
        'policy_decision',
        'decision_reason',
        'request_metadata',
        'error_message',
        'created_at',
      ],
      where: { tenant_id: clientId },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 25,
      missingTable: 'empty',
    });
    return {
      rows: rows.map((row) => ({
        ...row,
        request_metadata: metadataRecord(row.request_metadata),
        created_at: toIsoString(row.created_at),
      })),
    };
  } catch (error) {
    return {
      rows: [],
      banner: `AI egress audit read is unavailable: ${
        error instanceof Error ? error.message : 'unknown read-plane error'
      }.`,
    };
  }
}

async function loadSubstratePanel(
  clientKey: ClientKey,
): Promise<CustomerAdminSubstratePanel> {
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  const baseContent = getSetupActsContent(clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const fallback = buildAuthoredInventoryFallback(content);
  const segments = snapshot?.segments ?? fallback.segments;

  return {
    segments,
    totalRecords: snapshot?.totalRecords ?? segments.reduce((sum, segment) => sum + segment.recordCount, 0),
    totalChunks: snapshot?.totalChunks ?? 0,
    totalNodes: snapshot?.totalNodes ?? 0,
    totalEdges: snapshot?.totalEdges ?? 0,
    lastIngestedAt: snapshot?.lastIngestedAt ?? null,
    source: snapshot ? 'live_snapshot' : 'authored_fallback',
  };
}

function emptyCustomerAdminPageView(args: {
  tenant: AdminTenantContext;
  clientId: string | null;
  access: CustomerAdminAccessDecision;
  banners?: ReadonlyArray<string>;
}): CustomerAdminPageView {
  return {
    tenant: args.tenant,
    clientId: args.clientId,
    access: args.access,
    readOnlySections: CUSTOMER_ADMIN_SECTIONS,
    audit: {
      events: [],
      totalEvents: 0,
    },
    users: {
      users: [],
      activeUsers: 0,
      pendingInvites: 0,
    },
    aiEgress: summarizeAiEgressRows([], args.clientId),
    usage: summarizeUsageFromAiEgressRows([], args.clientId),
    weeklyUsageReport: summarizeWeeklyUsageReportFromAiEgressRows([], args.clientId),
    documentEconomics: summarizeDocumentEconomicsFromAiEgressRows([], args.clientId),
    substrate: {
      segments: [],
      totalRecords: 0,
      totalChunks: 0,
      totalNodes: 0,
      totalEdges: 0,
      lastIngestedAt: null,
      source: 'authored_fallback',
    },
    banners: args.banners ?? [],
    generatedAt: new Date().toISOString(),
  };
}

export async function buildCustomerAdminPageView(): Promise<CustomerAdminPageView> {
  const tenant = await resolveAdminTenant();
  const tenancy = await requireTenancy().catch((error) => ({
    error: error instanceof Error ? error.message : 'unknown tenancy error',
  }));
  if ('error' in tenancy) {
    return emptyCustomerAdminPageView({
      tenant,
      clientId: null,
      access: { allowed: false, reason: 'no_customer_admin_policy' },
      banners: [`Customer admin tenancy could not be verified. No tenant data was loaded. ${tenancy.error}.`],
    });
  }
  if (tenancy.clientId !== tenant.clientId) {
    return emptyCustomerAdminPageView({
      tenant,
      clientId: null,
      access: { allowed: false, reason: 'no_customer_admin_policy' },
      banners: ['Customer admin tenancy does not match the active tenant. No tenant data was loaded.'],
    });
  }

  const policy = await loadUserProgramAccessPolicy(tenancy).catch((error) => ({
    error: error instanceof Error ? error.message : 'unknown policy error',
  }));
  if ('error' in policy) {
    return emptyCustomerAdminPageView({
      tenant,
      clientId: tenancy.clientId,
      access: { allowed: false, reason: 'no_customer_admin_policy' },
      banners: [`Customer admin policy could not be verified. No tenant data was loaded. ${policy.error}.`],
    });
  }
  const access = canReadCustomerAdmin(policy);
  const banners: string[] = [];

  if (!access.allowed) {
    return emptyCustomerAdminPageView({
      tenant,
      clientId: tenancy.clientId,
      access,
      banners: ['Customer admin access was not granted for this session. No tenant admin panels were loaded.'],
    });
  }

  const [auditResult, usersResult, aiEgressResult, substrate] = await Promise.all([
    getAdminAuditEvents(tenant.tenantSlug, { limit: 8 }).catch((error) => {
      banners.push(`Audit log read is unavailable: ${error instanceof Error ? error.message : 'unknown error'}.`);
      return [] as ReadonlyArray<AdminAuditEvent>;
    }),
    getAdminUsers(tenant.tenantSlug).catch((error) => {
      banners.push(`User list read is unavailable: ${error instanceof Error ? error.message : 'unknown error'}.`);
      return [] as ReadonlyArray<AdminUserRow>;
    }),
    loadAiEgressRows(tenancy.clientId),
    loadSubstratePanel(tenant.clientKey),
  ]);

  if (aiEgressResult.banner) banners.push(aiEgressResult.banner);

  const aiEgress = summarizeAiEgressRows(aiEgressResult.rows, tenancy.clientId);
  return {
    tenant,
    clientId: tenancy.clientId,
    access,
    readOnlySections: CUSTOMER_ADMIN_SECTIONS,
    audit: {
      events: auditResult,
      totalEvents: auditResult.length,
    },
    users: {
      users: usersResult,
      activeUsers: usersResult.filter((user) => user.status === 'active').length,
      pendingInvites: usersResult.filter((user) => user.status === 'invited').length,
    },
    aiEgress,
    usage: summarizeUsageFromAiEgressRows(aiEgressResult.rows, tenancy.clientId),
    weeklyUsageReport: summarizeWeeklyUsageReportFromAiEgressRows(aiEgressResult.rows, tenancy.clientId),
    documentEconomics: summarizeDocumentEconomicsFromAiEgressRows(aiEgressResult.rows, tenancy.clientId),
    substrate,
    banners,
    generatedAt: new Date().toISOString(),
  };
}
